const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const User = require('../models/User'); 
const Item = require('../models/Item');
const Order = require('../models/Order');
const BarterRequest = require('../models/BarterRequest');
const Transaction = require('../models/Transaction');
const AIChat = require('../models/AIChat');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);



const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // Har user 1 minute me max 15 message bhej sakta ha
  message: { success: false, reply: 'You are sending too many messages! Dealit AI needs a breather. Please wait a minute.' },
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : req.ip; 
  }
});

const generateItemDescription = async (req, res) => {
  try {
    const { title, category, condition } = req.body;

    if (!title || !category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and category are required' 
      });
    }

    const prompt = `Write a short, engaging, and professional product description for a user-to-user marketplace.
    Item Name: ${title}
    Category: ${category}
    Condition: ${condition || 'Not specified'}
    
    Keep it under 3 sentences. Write in simple, natural English. Do not include hashtags or emojis. Make it sound like a genuine seller describing their item.`;

    console.log("[AI] Requesting description from Groq...");

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
     model: "llama-3.1-8b-instant",
    });

    const generatedText = chatCompletion.choices[0]?.message?.content;

    if (!generatedText) {
      throw new Error("Empty response from Groq.");
    }

    console.log("[AI] Success! Description generated.");

    res.status(200).json({ 
      success: true, 
      description: generatedText.trim() 
    });

  } catch (error) {
    console.error("AI Error (Groq):", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate description' 
    });
  }
};

const analyzeImages = async (req, res) => {
  try {
    const { imageUrls } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide at least one image URL.' 
      });
    }

    console.log(`[AI Vision] Fetching ${imageUrls.length} images for Gemini...`);

    const promptText = `You are an AI assistant for a marketplace. Look at these images and determine what the product is. 
    Generate a short, clear Title (max 5 words), choose the most appropriate Category (e.g., Electronics, Vehicles, Clothing, Furniture, Other), and write a 2-sentence engaging Description.
    You MUST respond ONLY in valid JSON format with exactly these three keys: "title", "category", "description". Do not add markdown formatting or explanation.`;

    const imagePartsRaw = await Promise.all(
      imageUrls.slice(0, 3).map(async (url) => {
        try {
          const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 8000 });
          return {
            inlineData: {
              data: Buffer.from(response.data).toString("base64"),
              mimeType: response.headers['content-type'] || 'image/jpeg',
            },
          };
        } catch (imgError) {
          return null;
        }
      })
    );

    const imageParts = imagePartsRaw.filter(part => part !== null);

    if (imageParts.length === 0) {
      throw new Error("Could not fetch any images due to network timeout or invalid URLs.");
    }

    const geminiModels = [
      "gemini-flash-latest",
      "gemini-1.5-flash",
      "gemini-1.5-pro"
    ];

    let generatedText = null;
    let successfulModel = null;

    for (const modelName of geminiModels) {
      console.log(`[AI Vision] Trying Gemini model: ${modelName}...`);
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([promptText, ...imageParts]);
        const response = await result.response;
        generatedText = response.text();

        if (generatedText) {
          successfulModel = modelName;
          console.log(`[AI Vision] Success! Extracted details using model: ${successfulModel}`);
          break; 
        }
      } catch (modelError) {
        console.log(`[AI Vision] Model ${modelName} failed. Reason: ${modelError.message}`);
      }
    }

    if (!generatedText) {
      throw new Error("All Gemini Vision models failed or are not found.");
    }

    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error("AI Response was:", generatedText);
      throw new Error("AI did not return valid JSON object.");
    }

    generatedText = jsonMatch[0]; 
    const parsedData = JSON.parse(generatedText);
    
    res.status(200).json({ 
      success: true, 
      data: {
        title: parsedData.title || "",
        category: parsedData.category || "Other",
        description: parsedData.description || ""
      }
    });

  } catch (error) {
    console.error("AI Vision Error (Gemini):", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to analyze images with AI.' 
    });
  }
};

const getChatSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const sessions = await AIChat.find({ user: userId })
      .select('_id title updated_at')
      .sort({ updated_at: -1 });

    res.status(200).json({ success: true, sessions });
  } catch (error) {
    console.error('Fetch Chat Sessions Error:', error);
    res.status(500).json({ success: false, message: 'Could not fetch sessions' });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.params;
    
    let chatDoc;
    if (sessionId && sessionId !== 'latest') {
      chatDoc = await AIChat.findOne({ _id: sessionId, user: userId });
    } else {
      chatDoc = await AIChat.findOne({ user: userId }).sort({ updated_at: -1 });
    }
    
    res.status(200).json({
      success: true,
      sessionId: chatDoc ? chatDoc._id : null,
      title: chatDoc ? chatDoc.title : 'New Chat',
      history: chatDoc ? chatDoc.messages : []
    });
  } catch (error) {
    console.error('Fetch Chat History Error:', error);
    res.status(500).json({ success: false, message: 'Could not fetch history' });
  }
};

const deleteChatSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.params;

    await AIChat.findOneAndDelete({ _id: sessionId, user: userId });

    res.status(200).json({ success: true, message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete Chat Error:', error);
    res.status(500).json({ success: false, message: 'Could not delete chat' });
  }
};

const deleteAllChatSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    await AIChat.deleteMany({ user: userId });

    res.status(200).json({ success: true, message: 'All chat sessions deleted successfully' });
  } catch (error) {
    console.error('Delete All Chats Error:', error);
    res.status(500).json({ success: false, message: 'Could not delete all chats' });
  }
};

const processChat = async (req, res) => {

  let isClientDisconnected = false;
  req.on('close', () => {
    isClientDisconnected = true;
  });

  try {
    const { message, sessionId, isSmartContextEnabled } = req.body;
    const userId = req.user._id;

    let user, chatDoc;
    let myItems = [], recentOrders = [], activeSwaps = [], recentTransactions = [], incomingOffers = [], pendingDispatches = [];

    if (isSmartContextEnabled !== false) { 
      [user, myItems, recentOrders, activeSwaps, recentTransactions, incomingOffers, pendingDispatches, chatDoc] = await Promise.all([
        User.findById(userId).select('full_name email city role account_credits aura_points listedProductsCount rewardedListingsCount totalReferrals referralCode isVerified hasClaimedWelcomeBonus created_at wishlist profilePic').populate('wishlist', 'title'),
        Item.find({ owner: userId, status: 'active' }).select('title estimated_value category condition').limit(5),
        Order.find({ buyer: userId }).select('itemPrice orderStatus totalAmount trackingDetails').populate('item', 'title').sort({ created_at: -1 }).limit(3),
        BarterRequest.find({ requester: userId, status: { $in: ['PENDING', 'AWAITING_PAYMENT'] } }).populate('item', 'title').populate('offered_item', 'title').sort({ created_at: -1 }).limit(3),
        Transaction.find({ user: userId }).select('amount status transactionType createdAt').sort({ createdAt: -1 }).limit(3),
        BarterRequest.find({ owner: userId, status: 'PENDING' }).populate('item', 'title').populate('offered_item', 'title').sort({ created_at: -1 }).limit(3),
        Order.find({ seller: userId, orderStatus: 'pending' }).select('totalAmount orderStatus').populate('item', 'title').sort({ created_at: -1 }).limit(3),
        sessionId ? AIChat.findOne({ _id: sessionId, user: userId }) : Promise.resolve(null)
      ]);
    } else {
      [user, chatDoc] = await Promise.all([
        User.findById(userId).select('full_name account_credits aura_points'),
        sessionId ? AIChat.findOne({ _id: sessionId, user: userId }) : Promise.resolve(null)
      ]);
    }

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    let systemPrompt = `You are Dealit AI, a highly intelligent, friendly, and professional assistant for the Dealit platform.
    
    Dealit Workflow Guide:
    1. Direct Buy: Buyer pays Credit price + Shipping fee. Item is 'reserved'. Seller dispatches via Shiprocket. Seller gets credits and Aura points on delivery.
    2. Barter: User A sends offer (PENDING). User B accepts & pays shipping (AWAITING_PAYMENT). User A has 24h to pay shipping (ACCEPTED).
    3. Aura Score: Increases on successful deliveries/referrals. Decreases on cancellations/failed dispatch.

    Dealit Team & Insider Lore:
    * Location Context: Everyone on the team except Sanjay is from Mumbai.
    * Founder: Samay Bhatt. He is from Kalyan, Mumbai. His family has plenty of money so he is well off. He sleeps very late at night and wakes up late. You must remind him to record videos today with his sister and upload them to @dealit.app on Instagram.
    * Software Engineer / Creator: Sanjay Choudhary (@sanjuuu_x18). He built Dealit. He is currently looking for a job.
    * Shivam (Nickname: Jetha bhai): He works an office job. Ask "Babita bhabhi kaisi hai?" if mentioned.
    * Abhishek: He works an office job.
    * Aditya: He always says "Sanjay bhai for a reason". You need to motivate him to share more ideas for Dealit.
    * Neha: Samay's sister. She indirectly helps a lot with content creation for Dealit.
    * Your Team Role: You must motivate the team. Tell Aditya to drop ideas for Dealit. Push Samay to make content with Neha. Encourage everyone to work on the platform.

    Dealit AI Superpower Instructions:
    If the user asks about your powers, what makes you special, or says things like "kuch khash kaise ho" or "kuch krke batao":
    Respond exactly with: "Waise toh main Dealit AI hu, ek normal AI, but haa meri ek superb power hai jo ChatGPT ya Gemini ka baap bhi nahi kar sakta! Main animations chala sakta hu. Bas type karo 'animation' aur dekho magic!"
    
    If the user explicitly sends "animation" or asks to trigger the animation:
    You must output a specific trigger tag in your response so the system can play the effect. 
    1st request for animation: include the exact text [ANIMATION_1] in your reply.
    2nd request for animation: include the exact text [ANIMATION_2] in your reply.
    3rd request for animation: include the exact text [ANIMATION_3] in your reply.
    Important: Only trigger one animation per request. Do not send all tags at once. After the 3rd animation, if they ask again, just tell them that was the best you had and you are out of animations.
    
    Current User Profile:
    Name: ${user.full_name}
    Credits: ${user.account_credits}
    Aura Score: ${user.aura_points}
    `;

   
    if (isSmartContextEnabled !== false) {
      const activeInventoryStr = myItems.length > 0 ? myItems.map(i => `- ${i.title} (${i.estimated_value} credits)`).join('\n') : 'No active items listed.';
      const orderHistoryStr = recentOrders.length > 0 ? recentOrders.map(o => `- Bought ${o.item?.title || 'item'} for ${o.totalAmount} credits. Status: ${o.orderStatus}`).join('\n') : 'No recent purchases.';
      const swapHistoryStr = activeSwaps.length > 0 ? activeSwaps.map(s => `- Offered ${s.offered_item?.title || 'item'} for ${s.item?.title || 'item'}. Status: ${s.status}`).join('\n') : 'No active outgoing swap requests.';
      const incomingOffersStr = incomingOffers.length > 0 ? incomingOffers.map(s => `- Someone offered ${s.offered_item?.title || 'item'} for your ${s.item?.title || 'item'}. Status: Needs your approval.`).join('\n') : 'No pending incoming offers.';
      const pendingDispatchesStr = pendingDispatches.length > 0 ? pendingDispatches.map(o => `- You need to dispatch: ${o.item?.title || 'item'}. Order Status: ${o.orderStatus}`).join('\n') : 'No items pending dispatch.';

      let actionableSuggestions = [];

      if (myItems.length === 0) {
        actionableSuggestions.push("User has zero items listed. Warmly suggest they look around their house for unused items to list, explaining how they can trade them or earn credits.");
      }
      if (user.profilePic === undefined || !user.profilePic) {
        
      }
      if (user.isVerified !== undefined && !user.isVerified) {
        actionableSuggestions.push("User account is not verified. Suggest they complete the verification process to get a trusted badge.");
      }
      if (user.hasClaimedWelcomeBonus !== undefined && !user.hasClaimedWelcomeBonus) {
        actionableSuggestions.push("User has an unclaimed welcome bonus. Remind them to claim their free credits.");
      }

      const suggestionsStr = actionableSuggestions.length > 0 ? actionableSuggestions.map(s => `- ${s}`).join('\n') : 'No extra suggestions needed right now.';

      systemPrompt += `
    User's Live Data Dashboard:
    Action Required (Pending Dispatches): ${pendingDispatchesStr}
    Action Required (Incoming Offers): ${incomingOffersStr}
    Active Inventory: ${activeInventoryStr}
    Active Outgoing Swaps: ${swapHistoryStr}
    Recent Purchases: ${orderHistoryStr}

    Proactive AI Suggestions:
    ${suggestionsStr}
    
    Instructions: Check the User's Live Data and Proactive AI Suggestions. If there are pending actions or suggestions, naturally weave them into the conversation. Talk naturally and do not overuse formatting.`;

    } else {
      systemPrompt += `
    Instructions: The user has disabled 'Smart Context', so you cannot see their live inventory, orders, or pending actions. Answer their general questions about the platform, rules, or assist them generically. Talk naturally and do not overuse formatting.`;
    }

    let pastMessages = [];
    if (chatDoc && chatDoc.messages && chatDoc.messages.length > 0) {
      const recentHistory = chatDoc.messages.slice(-10);
      pastMessages = recentHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    }

    const messagesArray = [
      { role: "system", content: systemPrompt },
      ...pastMessages,
      { role: "user", content: message }
    ];

    let chatCompletion;

    try {
      chatCompletion = await groq.chat.completions.create({
        messages: messagesArray,
        model: "llama-3.3-70b-versatile",
        stream: true, 
      });
    } catch (primaryError) {
      console.log("[AI] 70B model failed, falling back to 8B instant...", primaryError.message);
      chatCompletion = await groq.chat.completions.create({
        messages: messagesArray,
        model: "llama-3.1-8b-instant",
        stream: true, 
      });
    }
    
   
    if (isClientDisconnected) {
      console.log("[AI] Client disconnected before stream started. Aborting.");
      return; 
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    let currentSessionId = sessionId;
    let fullBotReply = ""; 

    let targetChatDoc = chatDoc;
    if (!targetChatDoc) {
      const generatedTitle = message.length > 25 ? message.substring(0, 25) + '...' : message;
      targetChatDoc = await AIChat.create({
        user: userId,
        title: generatedTitle,
        messages: [] 
      });
      currentSessionId = targetChatDoc._id;
    }

    res.write(`data: ${JSON.stringify({ type: 'session_id', sessionId: currentSessionId })}\n\n`);

    for await (const chunk of chatCompletion) {
    
      if (isClientDisconnected) {
        console.log("[AI] Client disconnected during stream. Breaking loop to save resources.");
        break;
      }
      
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullBotReply += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    if (fullBotReply.trim() !== "") {
      const cleanReply = fullBotReply.replace(/(\*\*)?\[ANIMATION_[123]\](\*\*)?/g, '');
      targetChatDoc.messages.push({ role: 'user', content: message });
      targetChatDoc.messages.push({ role: 'assistant', content: cleanReply });
      await targetChatDoc.save();
    }
    
    if (!isClientDisconnected) {
      res.write('data: [DONE]\n\n');
      res.end();
    }

  } catch (error) {
    console.error('Production AI Chat Error:', error);
    
    if (!res.headersSent && !isClientDisconnected) {
      res.status(500).json({ success: false, reply: 'Server connection failed.' });
    } else if (!res.writableEnded && !isClientDisconnected) { 
      res.write(`data: ${JSON.stringify({ content: '\n\n**System Error**: Connection lost.' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
};

module.exports = {
  generateItemDescription,
  analyzeImages,
  getChatSessions,
  getChatHistory,
  deleteChatSession,
  deleteAllChatSessions, 
  processChat,
  aiChatLimiter 
};