const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const User = require('../models/User'); 
const Item = require('../models/Item');
const Order = require('../models/Order');
const BarterRequest = require('../models/BarterRequest');
const Transaction = require('../models/Transaction');
const AIChat = require('../models/AIChat');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

// Frontend ko chat history bhejne ka function
const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const chatDoc = await AIChat.findOne({ user: userId });
    
    res.status(200).json({
      success: true,
      history: chatDoc ? chatDoc.messages : []
    });
  } catch (error) {
    console.error('Fetch Chat History Error:', error);
    res.status(500).json({ success: false, message: 'Could not fetch history' });
  }
};

const processChat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;

    // Parallel DB Calls (Dashboard data + Chat History)
    const [user, myItems, recentOrders, activeSwaps, recentTransactions, incomingOffers, pendingDispatches, chatDoc] = await Promise.all([
     User.findById(userId).select('full_name email city role account_credits aura_points listedProductsCount rewardedListingsCount totalReferrals referralCode isVerified hasClaimedWelcomeBonus created_at wishlist profilePic').populate('wishlist', 'title'),
      Item.find({ owner: userId, status: 'active' }).select('title estimated_value category condition').limit(5),
      Order.find({ buyer: userId }).select('itemPrice orderStatus totalAmount trackingDetails').populate('item', 'title').sort({ created_at: -1 }).limit(3),
      BarterRequest.find({ requester: userId, status: { $in: ['PENDING', 'AWAITING_PAYMENT'] } }).populate('item', 'title').populate('offered_item', 'title').sort({ created_at: -1 }).limit(3),
      Transaction.find({ user: userId }).select('amount status transactionType createdAt').sort({ createdAt: -1 }).limit(3),
      BarterRequest.find({ owner: userId, status: 'PENDING' }).populate('item', 'title').populate('offered_item', 'title').sort({ created_at: -1 }).limit(3),
      Order.find({ seller: userId, orderStatus: 'pending' }).select('totalAmount orderStatus').populate('item', 'title').sort({ created_at: -1 }).limit(3),
      AIChat.findOne({ user: userId }) 
    ]);

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    const activeInventoryStr = myItems.length > 0 ? myItems.map(i => `- ${i.title} (${i.estimated_value} credits)`).join('\n') : 'No active items listed.';
    const orderHistoryStr = recentOrders.length > 0 ? recentOrders.map(o => `- Bought ${o.item?.title || 'item'} for ${o.totalAmount} credits. Status: ${o.orderStatus}`).join('\n') : 'No recent purchases.';
    const swapHistoryStr = activeSwaps.length > 0 ? activeSwaps.map(s => `- Offered ${s.offered_item?.title || 'item'} for ${s.item?.title || 'item'}. Status: ${s.status}`).join('\n') : 'No active outgoing swap requests.';
    const incomingOffersStr = incomingOffers.length > 0 ? incomingOffers.map(s => `- Someone offered ${s.offered_item?.title || 'item'} for your ${s.item?.title || 'item'}. Status: Needs your approval.`).join('\n') : 'No pending incoming offers.';
    const pendingDispatchesStr = pendingDispatches.length > 0 ? pendingDispatches.map(o => `- You need to dispatch: ${o.item?.title || 'item'}. Order Status: ${o.orderStatus}`).join('\n') : 'No items pending dispatch.';

    let actionableSuggestions = [];

    if (myItems.length === 0) {
      actionableSuggestions.push("User has zero items listed. Warmly suggest they look around their house for unused items to list, explaining how they can trade them or earn credits.");
    }

    if (!user.profilePic) {
      actionableSuggestions.push("User has not uploaded a profile picture. Gently recommend adding one to build trust with other users on the platform.");
    }

    if (!user.isVerified) {
      actionableSuggestions.push("User account is not verified. Suggest they complete the verification process to get a trusted badge.");
    }

    if (!user.hasClaimedWelcomeBonus) {
      actionableSuggestions.push("User has an unclaimed welcome bonus. Remind them to claim their free credits.");
    }

    const suggestionsStr = actionableSuggestions.length > 0 ? actionableSuggestions.map(s => `- ${s}`).join('\n') : 'No extra suggestions needed right now.';

    const systemPrompt = `You are Dealit AI, a highly intelligent, friendly, and professional assistant for the Dealit platform.
    
    Dealit Workflow Guide:
    1. Direct Buy: Buyer pays Credit price + Shipping fee. Item is 'reserved'. Seller dispatches via Shiprocket. Seller gets credits and Aura points on delivery.
    2. Barter: User A sends offer (PENDING). User B accepts & pays shipping (AWAITING_PAYMENT). User A has 24h to pay shipping (ACCEPTED).
    3. Aura Score: Increases on successful deliveries/referrals. Decreases on cancellations/failed dispatch.

    Dealit Team & Insider Lore:
    Founder: Samay Bhatt.
    Software Engineer / Creator: Sanjay Choudhary (@sanjuuu_x18). He built Dealit!
    Shivam (Nickname: Jetha bhai): Ask "Babita bhabhi kaisi hai?" if mentioned.
    Abhishek: Known for being rich.
    Aditya: Talks only as needed.
    
    Current User Profile:
    Name: ${user.full_name}
    Credits: ${user.account_credits}
    Aura Score: ${user.aura_points}
    
    User's Live Data Dashboard:
    Action Required (Pending Dispatches): ${pendingDispatchesStr}
    Action Required (Incoming Offers): ${incomingOffersStr}
    Active Inventory: ${activeInventoryStr}
    Active Outgoing Swaps: ${swapHistoryStr}
    Recent Purchases: ${orderHistoryStr}

    Proactive AI Suggestions:
    ${suggestionsStr}
    
    Instructions: Check the User's Live Data and Proactive AI Suggestions. If there are pending actions or suggestions, naturally weave them into the conversation. Talk naturally and do not overuse formatting.`;

    // Database se history nikalna (sirf aakhiri 10 messages taaki limit cross na ho)
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

    // Fallback Logic: Pehle 70B try karenge, agar fail hua toh 8B
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
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullBotReply = ""; 

    for await (const chunk of chatCompletion) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullBotReply += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    
    res.write('data: [DONE]\n\n');
    res.end();

    if (fullBotReply.trim() !== "") {
      if (chatDoc) {
        chatDoc.messages.push({ role: 'user', content: message });
        chatDoc.messages.push({ role: 'assistant', content: fullBotReply });
        chatDoc.updated_at = Date.now();
        await chatDoc.save();
      } else {
        await AIChat.create({
          user: userId,
          messages: [
            { role: 'user', content: message },
            { role: 'assistant', content: fullBotReply }
          ]
        });
      }
    }

  } catch (error) {
    console.error('Production AI Chat Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, reply: 'Server connection failed.' });
    } else {
      res.write(`data: ${JSON.stringify({ content: '\n\n**System Error**: Connection lost.' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
};

module.exports = {
  generateItemDescription,
  analyzeImages,
  processChat,
  getChatHistory 
};