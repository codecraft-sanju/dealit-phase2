const Groq = require('groq-sdk');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pdfParse = require('pdf-parse'); 
const PersonalAI = require('../models/PersonalAI');
const VisitorAIChat = require('../models/VisitorAIChat');
const User = require('../models/User');
const prompts = require('../config/prompts');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Middleware: Public chat ko spam se bachane ke liye (20 msgs per hour per IP)
const visitorChatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { success: false, message: 'Rate limit exceeded. Please try again later.' },
  keyGenerator: (req) => {
    // Fallback to visitorId if IP is behind proxy
    return req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.body.visitorId || 'anonymous';
  }
});

// Helper: Groq kabhi-kabhi markdown me JSON deta hai, usko clean karne ke liye
const parseAIJson = (text) => {
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error("AI did not return valid JSON.");
  }
};

// 1. Initial Setup: Base idea receive karke 4-5 questions generate karna
const initPersonalAI = async (req, res) => {
  try {
    const { baseIdea, username } = req.body;
    const userId = req.user._id;

    if (!baseIdea || !username) {
      return res.status(400).json({ success: false, message: 'Base idea and username are required.' });
    }

    // Check if username format is valid (alphanumeric and underscores)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ success: false, message: 'Username can only contain letters, numbers, and underscores.' });
    }

    // Check if username is already taken by someone else
    const existingUsername = await PersonalAI.findOne({ username });
    if (existingUsername && existingUsername.user.toString() !== userId.toString()) {
      return res.status(400).json({ success: false, message: 'This username is already taken.' });
    }

    console.log(`[Personal AI] Generating questions for idea: ${baseIdea}`);
    const prompt = prompts.getContextQuestionsPrompt(baseIdea);

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.5, // Keep it focused
    });

    const generatedText = chatCompletion.choices[0]?.message?.content;
    const questions = parseAIJson(generatedText);

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Invalid questions array generated.");
    }

    // Save or Update PersonalAI config
    let personalAI = await PersonalAI.findOne({ user: userId });
    if (personalAI) {
      personalAI.baseIdea = baseIdea;
      personalAI.username = username;
      personalAI.contextQuestions = questions;
      personalAI.setupStatus = 'asking_questions';
      await personalAI.save();
    } else {
      personalAI = await PersonalAI.create({
        user: userId,
        username,
        baseIdea,
        contextQuestions: questions,
        setupStatus: 'asking_questions'
      });
    }

    res.status(200).json({ success: true, questions, personalAiId: personalAI._id });
  } catch (error) {
    console.error("initPersonalAI Error:", error);
    res.status(500).json({ success: false, message: 'Failed to initialize AI setup. Please try again.' });
  }
};

// 2. Submit Answers: User ke answers le kar master System Prompt banana
const submitContextAnswers = async (req, res) => {
  try {
    const { answers } = req.body;
    const userId = req.user._id;

    const personalAI = await PersonalAI.findOne({ user: userId });
    if (!personalAI || personalAI.setupStatus !== 'asking_questions') {
      return res.status(400).json({ success: false, message: 'Invalid AI setup state.' });
    }

    if (!Array.isArray(answers) || answers.length !== personalAI.contextQuestions.length) {
      return res.status(400).json({ success: false, message: 'Please provide answers for all questions.' });
    }

    console.log(`[Personal AI] Compiling System Prompt for ${personalAI.username}`);
    const prompt = prompts.compileSystemPrompt(personalAI.baseIdea, personalAI.contextQuestions, answers);

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
    });

    const finalSystemPrompt = chatCompletion.choices[0]?.message?.content;
    
    personalAI.userAnswers = answers;
    personalAI.finalSystemPrompt = finalSystemPrompt;
    personalAI.setupStatus = 'completed';
    await personalAI.save();

    const baseUrl = process.env.FRONTEND_URL || 'https://dealiit.com';

    res.status(200).json({ 
      success: true, 
      message: 'Your Personal AI is ready!',
      link: `${baseUrl}/ai/${personalAI.username}`
    });
  } catch (error) {
    console.error("submitContextAnswers Error:", error);
    res.status(500).json({ success: false, message: 'Failed to compile AI profile.' });
  }
};

// 3. Upload Knowledge Base (PDF)
const uploadKnowledgeBase = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded. Please upload a PDF." });

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ success: false, message: "Only PDF files are supported." });
    }

    const data = await pdfParse(req.file.buffer);
    const extractedText = data.text.trim();

    if (!extractedText) return res.status(400).json({ success: false, message: "Could not extract text. The PDF might be an image." });

    const personalAI = await PersonalAI.findOne({ user: userId });
    if (!personalAI) return res.status(404).json({ success: false, message: "AI Profile not found." });

    // Limit to ~20,000 characters to stay safely within AI token limits
    personalAI.knowledgeBaseText = extractedText.substring(0, 20000);
    await personalAI.save();

    res.status(200).json({ success: true, message: "Knowledge Base updated successfully!" });
  } catch (error) {
    console.error("PDF Upload Error:", error);
    res.status(500).json({ success: false, message: "Failed to process PDF." });
  }
};

// 4. Fetch Analytics & Chat Logs
const getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const personalAI = await PersonalAI.findOne({ user: userId });
    
    if (!personalAI) return res.status(404).json({ success: false, message: "AI Profile not found." });

    const visitors = await VisitorAIChat.find({ personalAI: personalAI._id }).sort({ updatedAt: -1 });

    let totalMessages = 0;
    visitors.forEach(v => {
      // Count only user messages
      totalMessages += v.messages.filter(m => m.role === 'user').length;
    });

    res.status(200).json({
      success: true,
      stats: {
        totalVisitors: visitors.length,
        totalMessagesReceived: totalMessages,
        totalInteractions: personalAI.totalChats
      },
      // Sending top 15 recent chat sessions for the creator to review
      recentChats: visitors.slice(0, 15)
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ success: false, message: "Failed to load analytics." });
  }
};

// 5. Update Theme
const updateTheme = async (req, res) => {
  try {
    const { theme } = req.body;
    const personalAI = await PersonalAI.findOneAndUpdate(
      { user: req.user._id }, 
      { theme }, 
      { new: true }
    );
    res.status(200).json({ success: true, theme: personalAI.theme, message: "Theme updated!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update theme." });
  }
};

// 6. Get Public Profile (Includes Theme)
// 6. Get Public Profile (Includes Theme & securely attaches Prompt for Owner)
const getAIProfile = async (req, res) => {
  try {
    const { username } = req.params;
    
    const personalAI = await PersonalAI.findOne({ username, isActive: true, setupStatus: 'completed' })
      .populate('user', 'full_name profilePic');

    if (!personalAI) {
      return res.status(404).json({ success: false, message: 'AI Profile not found or inactive.' });
    }

    // Default Public Data (Visitor ko yahi dikhega)
    let responseData = {
      username: personalAI.username,
      creatorName: personalAI.user.full_name,
      creatorPic: personalAI.user.profilePic,
      creatorId: personalAI.user._id, // Frontend isOwner check ke liye
      aiId: personalAI._id,
      theme: personalAI.theme 
    };

    // 🔒 SECURITY CHECK: Read Token to identify if the requester is the Owner
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        // Ensure your JWT_SECRET matches the one used during user login
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        
        // Agar logged-in user hi is AI ka creator hai
        if (decoded.id === personalAI.user._id.toString()) {
          // Sirf tabhi finalSystemPrompt attach karo
          responseData.finalSystemPrompt = personalAI.finalSystemPrompt;
        }
      } catch (err) {
        // Token invalid ya expire ho gaya hai, just ignore it and treat as visitor.
        console.log("Visitor profile fetch - No valid token found.");
      }
    }

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error("getAIProfile Error:", error);
    res.status(500).json({ success: false, message: 'Server error fetching profile.' });
  }
};

// 7. Process Visitor Chat (Includes Knowledge Base & Streaming)
const processVisitorChat = async (req, res) => {
  let isClientDisconnected = false;
  const abortController = new AbortController();

  req.on('close', () => {
    isClientDisconnected = true;
    abortController.abort();
  });

  try {
    const { message, aiId, visitorId } = req.body; 
    
    if (!message || !aiId || !visitorId) {
      return res.status(400).json({ success: false, message: 'Missing required parameters.' });
    }

    const personalAI = await PersonalAI.findById(aiId);
    if (!personalAI || !personalAI.isActive) {
      return res.status(404).json({ success: false, message: 'AI is unavailable.' });
    }

    // Fetch or create visitor chat history
    let chatSession = await VisitorAIChat.findOne({ personalAI: aiId, visitorId });
    if (!chatSession) {
      chatSession = await VisitorAIChat.create({ personalAI: aiId, visitorId, messages: [] });
    }

    // Build Messages Array
    let pastMessages = [];
    if (chatSession.messages.length > 0) {
      const recentHistory = chatSession.messages.slice(-8); // Get last 8 messages for context
      pastMessages = recentHistory.map(msg => ({ role: msg.role, content: msg.content }));
    }

    // Injecting knowledgeBaseText dynamically
    const systemPrompt = prompts.getVisitorChatPrompt(personalAI.finalSystemPrompt, personalAI.knowledgeBaseText);

    const messagesArray = [
      { role: "system", content: systemPrompt },
      ...pastMessages,
      { role: "user", content: message }
    ];

    // Setup Streaming via Groq
    const chatCompletion = await groq.chat.completions.create({
      messages: messagesArray,
      model: "llama-3.1-8b-instant",
      stream: true,
    }, { signal: abortController.signal });

    if (isClientDisconnected) return;

    // Setting headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    let fullBotReply = "";

    try {
      for await (const chunk of chatCompletion) {
        if (isClientDisconnected || req.socket.destroyed) {
          abortController.abort();
          break;
        }
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullBotReply += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
    } catch (streamError) {
      if (streamError.name !== 'AbortError') throw streamError;
    }

    // Save history to DB after streaming completes
    if (fullBotReply.trim() !== "") {
      chatSession.messages.push({ role: 'user', content: message });
      chatSession.messages.push({ role: 'assistant', content: fullBotReply });
      await chatSession.save();

      // Update Analytics
      personalAI.totalChats += 1;
      await personalAI.save();
    }

    if (!isClientDisconnected) {
      res.write('data: [DONE]\n\n');
      res.end();
    }

  } catch (error) {
    if (error.name === 'AbortError') return;
    console.error('Visitor Chat Error:', error);
    
    if (!res.headersSent && !isClientDisconnected) {
      res.status(500).json({ success: false, message: 'Server connection failed.' });
    } else if (!res.writableEnded && !isClientDisconnected) { 
      res.write(`data: ${JSON.stringify({ content: '\n\n**System Error**: Connection lost.' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
};
const updateSystemPrompt = async (req, res) => {
  try {
    const { newPrompt } = req.body;
    
    // Strict Backend Auth: Find by user._id directly ensures ownership
    const personalAI = await PersonalAI.findOneAndUpdate(
      { user: req.user._id }, 
      { finalSystemPrompt: newPrompt }, 
      { new: true }
    );

    if (!personalAI) {
      return res.status(403).json({ success: false, message: "Unauthorized or AI not found." });
    }

    res.status(200).json({ success: true, message: "System prompt updated instantly!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update prompt." });
  }
};

module.exports = {
  initPersonalAI,
  submitContextAnswers,
  getAIProfile,
  processVisitorChat,
  visitorChatLimiter,
  uploadKnowledgeBase,
  getAnalytics,
  updateTheme,
  updateSystemPrompt
};