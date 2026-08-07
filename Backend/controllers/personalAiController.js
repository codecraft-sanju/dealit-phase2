const Groq = require('groq-sdk');
const rateLimit = require('express-rate-limit');
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

    // CHANGED: Using process.env.FRONTEND_URL so it works on localhost and production dynamically
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

// 3. Get Public Profile: Visitor jab link open karega
const getAIProfile = async (req, res) => {
  try {
    const { username } = req.params;
    
    const personalAI = await PersonalAI.findOne({ username, isActive: true, setupStatus: 'completed' })
      .populate('user', 'full_name profilePic'); // Fetch creator's basic info for the UI

    if (!personalAI) {
      return res.status(404).json({ success: false, message: 'AI Profile not found or inactive.' });
    }

    res.status(200).json({
      success: true,
      data: {
        username: personalAI.username,
        creatorName: personalAI.user.full_name,
        creatorPic: personalAI.user.profilePic,
        aiId: personalAI._id
      }
    });
  } catch (error) {
    console.error("getAIProfile Error:", error);
    res.status(500).json({ success: false, message: 'Server error fetching profile.' });
  }
};

// 4. Process Visitor Chat: Handle the actual chat with streaming (SSE)
const processVisitorChat = async (req, res) => {
  let isClientDisconnected = false;
  const abortController = new AbortController();

  req.on('close', () => {
    isClientDisconnected = true;
    abortController.abort();
  });

  try {
    const { message, aiId, visitorId } = req.body; // visitorId frontend se aayega (e.g. UUID)
    
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

    const systemPrompt = prompts.getVisitorChatPrompt(personalAI.finalSystemPrompt);

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

module.exports = {
  initPersonalAI,
  submitContextAnswers,
  getAIProfile,
  processVisitorChat,
  visitorChatLimiter
};