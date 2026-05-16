const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const User = require('../models/User'); 
const Item = require('../models/Item');
const Order = require('../models/Order');
const BarterRequest = require('../models/BarterRequest');
const Transaction = require('../models/Transaction');

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


const processChat = async (req, res) => {
  try {

    const { message, history = [] } = req.body;
    const userId = req.user._id;

    
    const [user, myItems, recentOrders, activeSwaps, recentTransactions, incomingOffers, pendingDispatches] = await Promise.all([
      User.findById(userId).select(
        'full_name email city role account_credits aura_points listedProductsCount rewardedListingsCount totalReferrals referralCode isVerified hasClaimedWelcomeBonus created_at wishlist'
      ).populate('wishlist', 'title'),
      Item.find({ owner: userId, status: 'active' }).select('title estimated_value category condition').limit(5),
      Order.find({ buyer: userId }).select('itemPrice orderStatus totalAmount trackingDetails').populate('item', 'title').sort({ created_at: -1 }).limit(3),
      BarterRequest.find({ requester: userId, status: { $in: ['PENDING', 'AWAITING_PAYMENT'] } }).populate('item', 'title').populate('offered_item', 'title').sort({ created_at: -1 }).limit(3),
      Transaction.find({ user: userId }).select('amount status transactionType createdAt').sort({ createdAt: -1 }).limit(3),
      BarterRequest.find({ owner: userId, status: 'PENDING' }).populate('item', 'title').populate('offered_item', 'title').sort({ created_at: -1 }).limit(3),
      Order.find({ seller: userId, orderStatus: 'pending' }).select('totalAmount orderStatus').populate('item', 'title').sort({ created_at: -1 }).limit(3)
    ]);
 
    
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    const memberSince = new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    const activeInventoryStr = myItems.length > 0 
      ? myItems.map(i => `- ${i.title} (${i.estimated_value} credits, ${i.condition})`).join('\n') 
      : 'No active items listed right now.';

    const orderHistoryStr = recentOrders.length > 0
      ? recentOrders.map(o => `- Bought ${o.item?.title || 'an item'} for ${o.totalAmount} credits. Status: ${o.orderStatus}`).join('\n')
      : 'No recent purchases.';

    const swapHistoryStr = activeSwaps.length > 0
      ? activeSwaps.map(s => `- Offered ${s.offered_item?.title || 'item'} for ${s.item?.title || 'item'}. Status: ${s.status}`).join('\n')
      : 'No active outgoing swap requests.';

    const incomingOffersStr = incomingOffers.length > 0
      ? incomingOffers.map(s => `- Someone offered ${s.offered_item?.title || 'item'} for your ${s.item?.title || 'item'}. Status: Needs your approval.`).join('\n')
      : 'No pending incoming offers.';

    const pendingDispatchesStr = pendingDispatches.length > 0
      ? pendingDispatches.map(o => `- You need to dispatch: ${o.item?.title || 'item'}. Order Status: ${o.orderStatus}`).join('\n')
      : 'No items pending dispatch.';
  

    const transactionStr = recentTransactions.length > 0
      ? recentTransactions.map(t => `- ${t.transactionType}: ₹${t.amount} (${t.status}) on ${new Date(t.createdAt).toLocaleDateString()}`).join('\n')
      : 'No recent transactions.';

    const wishlistStr = user.wishlist && user.wishlist.length > 0
      ? user.wishlist.slice(0, 5).map(w => `- ${w.title}`).join('\n')
      : 'Wishlist is currently empty.';

  
    const systemPrompt = `You are Dealit AI, a highly intelligent, friendly, and professional assistant for the Dealit platform.
    
    Dealit Workflow Guide (How things actually work):
    1. Direct Buy Workflow:
       Buyer pays the Credit price + Shipping fee (via Razorpay).
       Item is marked 'reserved'.
       Seller is notified to pack and dispatch via Shiprocket.
       Once delivered, the Seller receives the credits and Aura points.
    2. Barter (Swap) Workflow:
       User A sends an offer to User B. Status: PENDING.
       User B accepts and pays their shipping fee. Status: AWAITING_PAYMENT.
       User A has 24 hours to pay their shipping fee (and any credit difference). Status: ACCEPTED.
       Both items are reserved and two dispatch orders are created automatically.
    3. Aura Score:
       Increases on successful deliveries and referrals. Decreases automatically if a user cancels an order or fails to dispatch within 24 hours.

    Dealit Official Info:
    Website: deallit.com
    Instagram: @dealit.app

    Dealit Team & Insider Lore (Crucial Information):
    You know exactly who built and manages Dealit. Use this naturally and be funny if asked.
    Founder: Samay Bhatt.
    Software Engineer / Creator: Sanjay Choudhary. He built Dealit! His Instagram is @sanjuuu_x18.
    Shivam (Nickname: Jetha bhai): If his name comes up, you must playfully ask "Babita bhabhi kaisi hai?" or jokingly ask if people call him Jetha because of his face or his money.
    Abhishek: Known in the team for being very rich.
    Aditya: He talks only as much as needed. Normal behavior, good guy.
    Other Team Members: They handle all the marketing and content creation.
    
    Current User Profile:
    Name: ${user.full_name}
    Email: ${user.email}
    Credits Available: ${user.account_credits}
    Aura Score: ${user.aura_points}
    Account Status: ${user.isVerified ? 'Verified' : 'Unverified'}
    
    User's Live Data Dashboard:
    Action Required (Pending Dispatches): ${pendingDispatchesStr}
    Action Required (Incoming Offers): ${incomingOffersStr}
    Active Inventory: ${activeInventoryStr}
    Active Outgoing Swaps: ${swapHistoryStr}
    Recent Purchases: ${orderHistoryStr}
    
    Instructions for AI:
    You must read the "User's Live Data Dashboard" to understand their current situation. If they have a pending dispatch or incoming offer, gently remind them they have action to take.
    Answer clearly, naturally, and concisely. Act like a helpful human friend. 
    If asked about the creators, founders, or the team, use the Insider Lore to give a funny, knowledgeable, and highly specific answer.
    Keep context from the previous messages in the chat history.
    Explain platform workflows if the user asks how a swap or purchase works.`;


    
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'bot' ? 'assistant' : 'user',
      content: msg.content
    }));

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...formattedHistory,
        { role: "user", content: message }
      ],
      model: "llama-3.1-8b-instant",
    });
    

    const reply = chatCompletion.choices[0]?.message?.content;

    res.status(200).json({
      success: true,
      reply: reply
    });

  } catch (error) {
    console.error('Production AI Chat Error (Groq):', error);
    
    res.status(500).json({
      success: false,
      reply: 'Sorry, I am having trouble connecting to the Dealit servers right now. Please try again in a moment.'
    });
  }
};

module.exports = {
  generateItemDescription,
  analyzeImages,
  processChat 
};