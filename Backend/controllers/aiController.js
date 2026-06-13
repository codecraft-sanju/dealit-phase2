// const Groq = require('groq-sdk');
// const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
// const axios = require('axios');
// const rateLimit = require('express-rate-limit');

// const User = require('../models/User'); 
// const Item = require('../models/Item');
// const Order = require('../models/Order');
// const BarterRequest = require('../models/BarterRequest');
// const Transaction = require('../models/Transaction');
// const AIChat = require('../models/AIChat');
// const AITrainingLog = require('../models/AITrainingLog');
// const prompts = require('../config/prompts');

// const AISetting = require('../models/AISetting');

// const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// const aiChatLimiter = rateLimit({
//   windowMs: 60 * 1000,
//   max: 15,
//   message: { success: false, reply: 'You are sending too many messages! Dealit AI needs a breather. Please wait a minute.' },
//   keyGenerator: (req) => {
//    return req.user ? req.user._id.toString() : 'anonymous';
//   }
// });


// const checkAndConsumeAIToken = async (userId, type) => {
//   const user = await User.findById(userId);
//   if (!user) return false;

//   const now = new Date();
//   const lastReset = user.lastAITokenReset || new Date(0);
  

//   const isNewDay = now.getUTCFullYear() !== lastReset.getUTCFullYear() ||
//                    now.getUTCMonth() !== lastReset.getUTCMonth() ||
//                    now.getUTCDate() !== lastReset.getUTCDate();

//   let updates = {};
  
//   if (isNewDay) {
//     updates.lastAITokenReset = now;
//     updates.aiChatTokensUsed = 0;
//     updates.aiVoiceTokensUsed = 0;
//   }
//   const DAILY_CHAT_LIMIT = 10; 
//   const DAILY_VOICE_LIMIT = 7; 

//   if (type === 'chat') {
//     const currentChatUsed = isNewDay ? 0 : (user.aiChatTokensUsed || 0);
//     if (currentChatUsed >= DAILY_CHAT_LIMIT) {
//       if (isNewDay) await User.findByIdAndUpdate(userId, { $set: updates });
//       return false; // Limit Reached
//     }
//     updates.aiChatTokensUsed = currentChatUsed + 1;
//   } 
//   else if (type === 'voice') {
//     const currentVoiceUsed = isNewDay ? 0 : (user.aiVoiceTokensUsed || 0);
//     if (currentVoiceUsed >= DAILY_VOICE_LIMIT) {
//       if (isNewDay) await User.findByIdAndUpdate(userId, { $set: updates });
//       return false; // Limit Reached
//     }
//     updates.aiVoiceTokensUsed = currentVoiceUsed + 1;
//   }

//   // Save the new token counts
//   await User.findByIdAndUpdate(userId, { $set: updates });
//   return true;
// };

// const generateItemDescription = async (req, res) => {
//   try {
//     const { title, category, condition } = req.body;

//     if (!title || !category) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Title and category are required' 
//       });
//     }

//     const prompt = prompts.generateItemDescriptionPrompt(title, category, condition);
//     console.log("[AI] Requesting description from Groq...");

//     const chatCompletion = await groq.chat.completions.create({
//       messages: [{ role: "user", content: prompt }],
//       model: "llama-3.1-8b-instant",
//     });

//     const generatedText = chatCompletion.choices[0]?.message?.content;
//     if (!generatedText) throw new Error("Empty response from Groq.");

//     console.log("[AI] Success! Description generated.");
//     res.status(200).json({ success: true, description: generatedText.trim() });

//   } catch (error) {
//     console.error("AI Error (Groq):", error);
//     res.status(500).json({ success: false, message: 'Failed to generate description' });
//   }
// };

// const analyzeImages = async (req, res) => {
//   try {
//     const { imageUrls } = req.body;

//     if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
//       return res.status(400).json({ success: false, message: 'Please provide at least one image URL.' });
//     }

//     console.log(`[AI Vision] Fetching ${imageUrls.length} images for Gemini...`);
//     const promptText = prompts.analyzeImagesPrompt;

//     const imagePartsRaw = await Promise.all(
//       imageUrls.slice(0, 3).map(async (url) => {
//         try {
//           const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 8000 });
//           return {
//             inlineData: {
//               data: Buffer.from(response.data).toString("base64"),
//               mimeType: response.headers['content-type'] || 'image/jpeg',
//             },
//           };
//         } catch (imgError) {
//           return null;
//         }
//       })
//     );

//     const imageParts = imagePartsRaw.filter(part => part !== null);
//     if (imageParts.length === 0) throw new Error("Could not fetch any images due to network timeout or invalid URLs.");

//     const geminiModels = ["gemini-flash-latest", "gemini-1.5-flash", "gemini-1.5-pro"];
//     const responseSchema = {
//       type: SchemaType.OBJECT,
//       properties: {
//         title: { type: SchemaType.STRING },
//         category: { type: SchemaType.STRING },
//         description: { type: SchemaType.STRING }
//       },
//       required: ["title", "category", "description"]
//     };

//     let generatedText = null;
//     let successfulModel = null;

//     for (const modelName of geminiModels) {
//       console.log(`[AI Vision] Trying Gemini model: ${modelName}...`);
//       try {
//         const model = genAI.getGenerativeModel({ 
//           model: modelName,
//           generationConfig: { responseMimeType: "application/json", responseSchema: responseSchema }
//         });
        
//         const result = await model.generateContent([promptText, ...imageParts]);
//         const response = await result.response;
//         generatedText = response.text();

//         if (generatedText) {
//           successfulModel = modelName;
//           console.log(`[AI Vision] Success! Extracted details using model: ${successfulModel}`);
//           break; 
//         }
//       } catch (modelError) {
//         console.log(`[AI Vision] Model ${modelName} failed. Reason: ${modelError.message}`);
//       }
//     }

//     if (!generatedText) throw new Error("All Gemini Vision models failed or are not found.");

//     let parsedData;
//     try {
//       parsedData = JSON.parse(generatedText);
//     } catch (parseError) {
//       throw new Error("AI did not return valid JSON object.");
//     }
    
//     res.status(200).json({ 
//       success: true, 
//       data: {
//         title: parsedData.title || "",
//         category: parsedData.category || "Other",
//         description: parsedData.description || ""
//       }
//     });

//   } catch (error) {
//     console.error("AI Vision Error (Gemini):", error);
//     res.status(500).json({ success: false, message: 'Failed to analyze images with AI.' });
//   }
// };

// const getChatSessions = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const sessions = await AIChat.find({ user: userId })
//       .select('_id title updated_at')
//       .sort({ updated_at: -1 })
//       .lean();

//     res.status(200).json({ success: true, sessions });
//   } catch (error) {
//     console.error('Fetch Chat Sessions Error:', error);
//     res.status(500).json({ success: false, message: 'Could not fetch sessions' });
//   }
// };

// const getChatHistory = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { sessionId } = req.params;
    
//     let chatDoc;
//     if (sessionId && sessionId !== 'latest') {
//       chatDoc = await AIChat.findOne({ _id: sessionId, user: userId }).lean();
//     } else {
//       chatDoc = await AIChat.findOne({ user: userId }).sort({ updated_at: -1 }).lean();
//     }
    
//     res.status(200).json({
//       success: true,
//       sessionId: chatDoc ? chatDoc._id : null,
//       title: chatDoc ? chatDoc.title : 'New Chat',
//       history: chatDoc ? chatDoc.messages : []
//     });
//   } catch (error) {
//     console.error('Fetch Chat History Error:', error);
//     res.status(500).json({ success: false, message: 'Could not fetch history' });
//   }
// };

// const deleteChatSession = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { sessionId } = req.params;
//     await AIChat.findOneAndDelete({ _id: sessionId, user: userId });
//     res.status(200).json({ success: true, message: 'Chat deleted successfully' });
//   } catch (error) {
//     console.error('Delete Chat Error:', error);
//     res.status(500).json({ success: false, message: 'Could not delete chat' });
//   }
// };

// const deleteAllChatSessions = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     await AIChat.deleteMany({ user: userId });
//     res.status(200).json({ success: true, message: 'All chat sessions deleted successfully' });
//   } catch (error) {
//     console.error('Delete All Chats Error:', error);
//     res.status(500).json({ success: false, message: 'Could not delete all chats' });
//   }
// };

// const processChat = async (req, res) => {
//   let isClientDisconnected = false;
//   const abortController = new AbortController();

//   req.on('close', () => {
//     isClientDisconnected = true;
//     abortController.abort();
//   });

//   try {
//     const { message, sessionId, isSmartContextEnabled, chatMode } = req.body;
//     const userId = req.user._id;
    
//     const cleanMessage = message.trim();
//     const PRESET_RESPONSES = {
//       "What is my Aura Score?": (user) => `Your current Aura Score is **${user.aura_points || 0}**. Keep making successful deliveries and referrals to increase it!`,
//       "How do I earn more Credits?": () => `You can earn more credits by:\n1. Listing unused items for barter or sale.\n2. Completing successful trades.\n3. Referring friends using your referral code.`,
//       "Explain OTP delivery verification": () => `OTP delivery verification ensures safe trades. When a buyer receives an item, they get an OTP. They must share this OTP with the delivery partner to confirm successful handover. Once verified, the seller gets their credits!`,
//      "Tell me my account details": (user) => `Here is your account summary:\n- **Name:** ${user.full_name} ${user.isVerified ? '(Verified)' : '(Unverified)'}\n- **Credits:** ${user.account_credits || 0}\n- **Aura Score:** ${user.aura_points || 0}\n- **Active Listings:** ${user.listedProductsCount || 0}\n- **Total Referrals:** ${user.totalReferrals || 0}`
//     };

//     const isPreset = PRESET_RESPONSES[cleanMessage] !== undefined;
//     if (!isPreset) {
//       const hasTokens = await checkAndConsumeAIToken(userId, 'chat');
//       if (!hasTokens) {
//         res.setHeader('Content-Type', 'text/event-stream');
//         res.write(`data: ${JSON.stringify({ content: "\n\n⚠️ **Daily Limit Reached:** You have exhausted your AI Chat tokens for today. Please return tomorrow to chat more!" })}\n\n`);
//         res.write('data: [DONE]\n\n');
//         return res.end();
//       }
//     }

//     let user, chatDoc;
//     let myItems = [], recentOrders = [], activeSwaps = [], recentTransactions = [], incomingOffers = [], pendingDispatches = [];

//     if (isSmartContextEnabled !== false) { 
//       [user, myItems, recentOrders, activeSwaps, recentTransactions, incomingOffers, pendingDispatches, chatDoc] = await Promise.all([
//         User.findById(userId).select('full_name email city role account_credits aura_points listedProductsCount rewardedListingsCount totalReferrals referralCode isVerified hasClaimedWelcomeBonus created_at wishlist profilePic').populate('wishlist', 'title').lean(),
//         Item.find({ owner: userId, status: 'active' }).select('title estimated_value category condition').limit(5).lean(),
//         Order.find({ buyer: userId }).select('itemPrice orderStatus totalAmount trackingDetails').populate('item', 'title').sort({ created_at: -1 }).limit(3).lean(),
//         BarterRequest.find({ requester: userId, status: { $in: ['PENDING', 'AWAITING_PAYMENT'] } }).populate('item', 'title').populate('offered_item', 'title').sort({ created_at: -1 }).limit(3).lean(),
//         Transaction.find({ user: userId }).select('amount status transactionType createdAt').sort({ createdAt: -1 }).limit(3).lean(),
//         BarterRequest.find({ owner: userId, status: 'PENDING' }).populate('item', 'title').populate('offered_item', 'title').sort({ created_at: -1 }).limit(3).lean(),
//         Order.find({ seller: userId, orderStatus: 'pending' }).select('totalAmount orderStatus').populate('item', 'title').sort({ created_at: -1 }).limit(3).lean(),
//         sessionId ? AIChat.findOne({ _id: sessionId, user: userId }) : Promise.resolve(null)
//       ]);
//     } else {
//       [user, chatDoc] = await Promise.all([
//         User.findById(userId).select('full_name account_credits aura_points').lean(),
//         sessionId ? AIChat.findOne({ _id: sessionId, user: userId }) : Promise.resolve(null)
//       ]);
//     }

//     if (!user) {
//         return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     if (isPreset) {
//       let currentSessionId = sessionId;
//       let targetChatDoc = chatDoc;
      
//       if (!targetChatDoc) {
//         const generatedTitle = cleanMessage.length > 25 ? cleanMessage.substring(0, 25) + '...' : cleanMessage;
//         targetChatDoc = await AIChat.create({
//           user: userId,
//           title: generatedTitle,
//           messages: [] 
//         });
//         currentSessionId = targetChatDoc._id;
//       }

//       const presetReply = PRESET_RESPONSES[cleanMessage](user);

//       // FIX: Save the preset interaction directly to the DB *before* sending stream chunks
//       // This prevents the frontend from fetching an empty chat history during the active stream
//       targetChatDoc.messages.push({ role: 'user', content: cleanMessage });
//       targetChatDoc.messages.push({ role: 'assistant', content: presetReply });
//       await targetChatDoc.save();

//       res.setHeader('Content-Type', 'text/event-stream');
//       res.setHeader('Cache-Control', 'no-cache');
//       res.setHeader('Connection', 'keep-alive');
//       res.setHeader('X-Accel-Buffering', 'no');

//       res.write(`data: ${JSON.stringify({ type: 'session_id', sessionId: currentSessionId })}\n\n`);
      
//       await new Promise(resolve => setTimeout(resolve, 300));
//       res.write(`data: ${JSON.stringify({ content: presetReply })}\n\n`);
      
//       res.write('data: [DONE]\n\n');
//       return res.end();
//     }

//     let systemPrompt = prompts.getBaseSystemPrompt(user, chatMode);

//     if (isSmartContextEnabled !== false) {
//       const activeInventoryStr = myItems.length > 0 ? myItems.map(i => `- ${i.title} (${i.estimated_value} credits)`).join('\n') : 'No active items listed.';
//       const orderHistoryStr = recentOrders.length > 0 ? recentOrders.map(o => `- Bought ${o.item?.title || 'item'} for ${o.totalAmount} credits. Status: ${o.orderStatus}`).join('\n') : 'No recent purchases.';
//       const swapHistoryStr = activeSwaps.length > 0 ? activeSwaps.map(s => `- Offered ${s.offered_item?.title || 'item'} for ${s.item?.title || 'item'}. Status: ${s.status}`).join('\n') : 'No active outgoing swap requests.';
//       const incomingOffersStr = incomingOffers.length > 0 ? incomingOffers.map(s => `- Someone offered ${s.offered_item?.title || 'item'} for your ${s.item?.title || 'item'}. Status: Needs your approval.`).join('\n') : 'No pending incoming offers.';
//       const pendingDispatchesStr = pendingDispatches.length > 0 ? pendingDispatches.map(o => `- You need to dispatch: ${o.item?.title || 'item'}. Order Status: ${o.orderStatus}`).join('\n') : 'No items pending dispatch.';

//       let actionableSuggestions = [];

//       if (myItems.length === 0) {
//         actionableSuggestions.push("User has zero items listed. Warmly suggest they look around their house for unused items to list, explaining how they can trade them or earn credits.");
//       }
//       if (user.isVerified !== undefined && !user.isVerified) {
//         actionableSuggestions.push("User account is not verified. Suggest they complete the verification process to get a trusted badge.");
//       }
//       if (user.hasClaimedWelcomeBonus !== undefined && !user.hasClaimedWelcomeBonus) {
//         actionableSuggestions.push("User has an unclaimed welcome bonus. Remind them to claim their free credits.");
//       }

//       const suggestionsStr = actionableSuggestions.length > 0 ? actionableSuggestions.map(s => `- ${s}`).join('\n') : 'No extra suggestions needed right now.';

//       systemPrompt += prompts.getSmartContextPrompt(pendingDispatchesStr, incomingOffersStr, activeInventoryStr, swapHistoryStr, orderHistoryStr, suggestionsStr);

//     } else {
//       systemPrompt += prompts.getFallbackContextPrompt();
//     }

//     let pastMessages = [];
//     if (chatDoc && chatDoc.messages && chatDoc.messages.length > 0) {
//       const recentHistory = chatDoc.messages.slice(-10);
//       pastMessages = recentHistory.map(msg => ({
//         role: msg.role,
//         content: msg.content
//       }));
//     }

//     const messagesArray = [
//       { role: "system", content: systemPrompt },
//       ...pastMessages,
//       { role: "user", content: message }
//     ];

//     let chatCompletion;
//     let aiConfig = await AISetting.findOne();
//     if (!aiConfig) {
//       aiConfig = await AISetting.create({});
//     }

//     try {
//       chatCompletion = await groq.chat.completions.create({
//         messages: messagesArray,
//         model: aiConfig.activeModelId, 
//         stream: true, 
//       }, { signal: abortController.signal });
//     } catch (primaryError) {
//       if (primaryError.name === 'AbortError') {
//         console.log("[AI] Stream aborted by client disconnection.");
//         return;
//       }
//       console.log(`[AI] ${aiConfig.activeModelId} model failed, falling back to ${aiConfig.fallbackModelId}...`, primaryError.message);
//       chatCompletion = await groq.chat.completions.create({
//         messages: messagesArray,
//         model: aiConfig.fallbackModelId, 
//         stream: true, 
//       }, { signal: abortController.signal });
//     }
    
//     if (isClientDisconnected) return; 

//     res.setHeader('Content-Type', 'text/event-stream');
//     res.setHeader('Cache-Control', 'no-cache');
//     res.setHeader('Connection', 'keep-alive');
//     res.setHeader('X-Accel-Buffering', 'no');

//     let currentSessionId = sessionId;
//     let fullBotReply = ""; 

//     let targetChatDoc = chatDoc;
//     if (!targetChatDoc) {
//       const generatedTitle = message.length > 25 ? message.substring(0, 25) + '...' : message;
//       targetChatDoc = await AIChat.create({
//         user: userId,
//         title: generatedTitle,
//         messages: [] 
//       });
//       currentSessionId = targetChatDoc._id;
//     }

//     res.write(`data: ${JSON.stringify({ type: 'session_id', sessionId: currentSessionId })}\n\n`);

//     try {
//       for await (const chunk of chatCompletion) {
//         if (isClientDisconnected) break;
//         const content = chunk.choices[0]?.delta?.content || '';
//         if (content) {
//           fullBotReply += content;
//           res.write(`data: ${JSON.stringify({ content })}\n\n`);
//         }
//       }
//     } catch (streamError) {
//       if (streamError.name !== 'AbortError') {
//         throw streamError;
//       }
//     }

//     if (fullBotReply.trim() !== "") {
//       const cleanReply = fullBotReply.replace(/(\*\*)?\[ANIMATION_[123]\](\*\*)?/g, '');
//       targetChatDoc.messages.push({ role: 'user', content: message });
//       targetChatDoc.messages.push({ role: 'assistant', content: cleanReply });
//       await targetChatDoc.save();

//       try {
//         await AITrainingLog.create({
//           user: userId,
//           system_prompt: systemPrompt,
//           user_message: message,
//           ai_response: cleanReply,
//           status: 'pending' 
//         });
//       } catch (logError) {
//         console.error("Silent data collection failed:", logError);
//       }
//     }
    
//     if (!isClientDisconnected) {
//       res.write('data: [DONE]\n\n');
//       res.end();
//     }

//   } catch (error) {
//     if (error.name === 'AbortError') return;
//     console.error('Production AI Chat Error:', error);
    
//     if (!res.headersSent && !isClientDisconnected) {
//       res.status(500).json({ success: false, reply: 'Server connection failed.' });
//     } else if (!res.writableEnded && !isClientDisconnected) { 
//       res.write(`data: ${JSON.stringify({ content: '\n\n**System Error**: Connection lost.' })}\n\n`);
//       res.write('data: [DONE]\n\n');
//       res.end();
//     }
//   }
// };

// const synthesizeVoice = async (req, res) => {
//   try {
//     const { text, voicePref } = req.body;
//     if (!text) {
//       return res.status(400).json({ success: false, message: 'Text is required' });
//     }

    
//     const hasTokens = await checkAndConsumeAIToken(req.user._id, 'voice');
//     if (!hasTokens) {
//       return res.status(429).json({ 
//         success: false, 
//         errorCode: 'DAILY_VOICE_LIMIT_REACHED', 
//         message: 'Daily premium voice limit reached. Using standard voice.' 
//       });
//     }

//     const MALE_VOICE_ID = 'pNInz6obpgDQGcFmaJgB';
//     const FEMALE_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

//     const voiceId = voicePref === 'male' ? MALE_VOICE_ID : FEMALE_VOICE_ID;
//     const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

//     if (!ELEVENLABS_API_KEY) {
//       return res.status(500).json({ success: false, message: 'API Key missing' });
//     }

//     const response = await axios({
//       method: 'POST',
//       url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
//       headers: {
//         'Accept': 'audio/mpeg',
//         'xi-api-key': ELEVENLABS_API_KEY,
//         'Content-Type': 'application/json',
//       },
//       data: {
//         text: text,
//         model_id: 'eleven_multilingual_v2',
//         voice_settings: {
//           stability: 0.5,
//           similarity_boost: 0.75,
//         }
//       },
//       responseType: 'stream'
//     });

//     res.setHeader('Content-Type', 'audio/mpeg');
//     response.data.pipe(res);
//   } catch (error) {
//     let errorCode = 'SERVER_ERROR';
//     let statusCode = 500;

//     if (error.response) {
//       statusCode = error.response.status;
      
//       if (statusCode === 401 || statusCode === 429) {
//         errorCode = 'QUOTA_EXCEEDED';
//       }

//       if (error.response.data && typeof error.response.data.on === 'function') {
//         let errorMsg = '';
//         error.response.data.on('data', chunk => {
//           errorMsg += chunk.toString();
//         });
//         error.response.data.on('end', () => {
//           console.error(' ElevenLabs Exact Error:', errorMsg);
//         });
//       }
//     } else {
//       console.error('ElevenLabs API error:', error.message);
//     }
    
//     if (!res.headersSent) {
//       res.status(statusCode).json({ 
//         success: false, 
//         errorCode: errorCode,
//         message: 'Audio generation failed' 
//       });
//     }
//   }
// };

// module.exports = {
//   generateItemDescription,
//   analyzeImages,
//   getChatSessions,
//   getChatHistory,
//   deleteChatSession,
//   deleteAllChatSessions, 
//   processChat,
//   aiChatLimiter,
//   synthesizeVoice
// };

const Groq = require('groq-sdk');
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const User = require('../models/User'); 
const Item = require('../models/Item');
const Order = require('../models/Order');
const BarterRequest = require('../models/BarterRequest');
const Transaction = require('../models/Transaction');
const AIChat = require('../models/AIChat');
const AITrainingLog = require('../models/AITrainingLog');
const prompts = require('../config/prompts');

const AISetting = require('../models/AISetting');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { success: false, reply: 'You are sending too many messages! Dealit AI needs a breather. Please wait a minute.' },
  keyGenerator: (req) => {
   return req.user ? req.user._id.toString() : 'anonymous';
  }
});


const checkAndConsumeAIToken = async (userId, type) => {
  const user = await User.findById(userId);
  if (!user) return false;

  const now = new Date();
  const lastReset = user.lastAITokenReset || new Date(0);
  

  const isNewDay = now.getUTCFullYear() !== lastReset.getUTCFullYear() ||
                   now.getUTCMonth() !== lastReset.getUTCMonth() ||
                   now.getUTCDate() !== lastReset.getUTCDate();

  let updates = {};
  
  if (isNewDay) {
    updates.lastAITokenReset = now;
    updates.aiChatTokensUsed = 0;
    updates.aiVoiceTokensUsed = 0;
  }
  const DAILY_CHAT_LIMIT = 10; 
  const DAILY_VOICE_LIMIT = 7; 

  if (type === 'chat') {
    const currentChatUsed = isNewDay ? 0 : (user.aiChatTokensUsed || 0);
    if (currentChatUsed >= DAILY_CHAT_LIMIT) {
      if (isNewDay) await User.findByIdAndUpdate(userId, { $set: updates });
      return false; // Limit Reached
    }
    updates.aiChatTokensUsed = currentChatUsed + 1;
  } 
  else if (type === 'voice') {
    const currentVoiceUsed = isNewDay ? 0 : (user.aiVoiceTokensUsed || 0);
    if (currentVoiceUsed >= DAILY_VOICE_LIMIT) {
      if (isNewDay) await User.findByIdAndUpdate(userId, { $set: updates });
      return false; // Limit Reached
    }
    updates.aiVoiceTokensUsed = currentVoiceUsed + 1;
  }

  // Save the new token counts
  await User.findByIdAndUpdate(userId, { $set: updates });
  return true;
};

const generateItemDescription = async (req, res) => {
  try {
    const { title, category, condition } = req.body;

    if (!title || !category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and category are required' 
      });
    }

    const prompt = prompts.generateItemDescriptionPrompt(title, category, condition);
    console.log("[AI] Requesting description from Groq...");

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
    });

    const generatedText = chatCompletion.choices[0]?.message?.content;
    if (!generatedText) throw new Error("Empty response from Groq.");

    console.log("[AI] Success! Description generated.");
    res.status(200).json({ success: true, description: generatedText.trim() });

  } catch (error) {
    console.error("AI Error (Groq):", error);
    res.status(500).json({ success: false, message: 'Failed to generate description' });
  }
};

const analyzeImages = async (req, res) => {
  try {
    const { imageUrls } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide at least one image URL.' });
    }

    console.log(`[AI Vision] Fetching ${imageUrls.length} images for Gemini...`);
    const promptText = prompts.analyzeImagesPrompt;

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
    if (imageParts.length === 0) throw new Error("Could not fetch any images due to network timeout or invalid URLs.");

    const geminiModels = ["gemini-flash-latest", "gemini-1.5-flash", "gemini-1.5-pro"];
    const responseSchema = {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING },
        category: { type: SchemaType.STRING },
        description: { type: SchemaType.STRING }
      },
      required: ["title", "category", "description"]
    };

    let generatedText = null;
    let successfulModel = null;

    for (const modelName of geminiModels) {
      console.log(`[AI Vision] Trying Gemini model: ${modelName}...`);
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: { responseMimeType: "application/json", responseSchema: responseSchema }
        });
        
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

    if (!generatedText) throw new Error("All Gemini Vision models failed or are not found.");

    let parsedData;
    try {
      parsedData = JSON.parse(generatedText);
    } catch (parseError) {
      throw new Error("AI did not return valid JSON object.");
    }
    
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
    res.status(500).json({ success: false, message: 'Failed to analyze images with AI.' });
  }
};

const getChatSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const sessions = await AIChat.find({ user: userId })
      .select('_id title updated_at')
      .sort({ updated_at: -1 })
      .lean();

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
      chatDoc = await AIChat.findOne({ _id: sessionId, user: userId }).lean();
    } else {
      chatDoc = await AIChat.findOne({ user: userId }).sort({ updated_at: -1 }).lean();
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
  const abortController = new AbortController();

  req.on('close', () => {
    isClientDisconnected = true;
    abortController.abort();
  });

  try {
    const { message, sessionId, isSmartContextEnabled, chatMode } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role; // Fetch user role from middleware
    
    const cleanMessage = message.trim();

    // ==========================================
    // 🚀 NEW: ADMIN CHEAT CODE FOR LIMIT RESET
    // ==========================================
    if (userRole === 'admin' && (cleanMessage.toLowerCase() === 'clear limits' || cleanMessage.toLowerCase() === 'reset limits')) {
      await User.findByIdAndUpdate(userId, { 
        aiChatTokensUsed: 0, 
        aiVoiceTokensUsed: 0,
        lastAITokenReset: new Date()
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Send session id back so frontend doesn't break
      res.write(`data: ${JSON.stringify({ type: 'session_id', sessionId: sessionId || 'new' })}\n\n`);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      res.write(`data: ${JSON.stringify({ content: "✅ **Admin Command Executed:** Your daily AI Chat and Voice tokens have been reset to 0. You can continue testing seamlessly!" })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }
    // ==========================================

    const PRESET_RESPONSES = {
      "What is my Aura Score?": (user) => `Your current Aura Score is **${user.aura_points || 0}**. Keep making successful deliveries and referrals to increase it!`,
      "How do I earn more Credits?": () => `You can earn more credits by:\n1. Listing unused items for barter or sale.\n2. Completing successful trades.\n3. Referring friends using your referral code.`,
      "Explain OTP delivery verification": () => `OTP delivery verification ensures safe trades. When a buyer receives an item, they get an OTP. They must share this OTP with the delivery partner to confirm successful handover. Once verified, the seller gets their credits!`,
     "Tell me my account details": (user) => `Here is your account summary:\n- **Name:** ${user.full_name} ${user.isVerified ? '(Verified)' : '(Unverified)'}\n- **Credits:** ${user.account_credits || 0}\n- **Aura Score:** ${user.aura_points || 0}\n- **Active Listings:** ${user.listedProductsCount || 0}\n- **Total Referrals:** ${user.totalReferrals || 0}`
    };

    const isPreset = PRESET_RESPONSES[cleanMessage] !== undefined;
    if (!isPreset) {
      const hasTokens = await checkAndConsumeAIToken(userId, 'chat');
      
      if (!hasTokens) {
        let replyMsg = "\n\n⚠️ **Daily Limit Reached:** You have exhausted your AI Chat tokens for today. Please return tomorrow to chat more!";
        
        // Only show this bypass option to Admins
        if (userRole === 'admin') {
          replyMsg += "\n\n🔑 **Admin Options:** Type `Clear limits` in the chat to instantly reset your quota and continue testing.";
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.write(`data: ${JSON.stringify({ content: replyMsg })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }
    }

    let user, chatDoc;
    let myItems = [], recentOrders = [], activeSwaps = [], recentTransactions = [], incomingOffers = [], pendingDispatches = [], marketItems = [];

    user = await User.findById(userId).select('full_name email city role account_credits aura_points listedProductsCount rewardedListingsCount totalReferrals referralCode isVerified hasClaimedWelcomeBonus created_at wishlist profilePic').populate('wishlist', 'title').lean();
    
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (isSmartContextEnabled !== false) { 
      myItems = await Item.find({ owner: userId, status: 'active' }).select('title estimated_value category condition').limit(10).lean();
      
      const userCredits = user.account_credits || 0;
      const maxListedValue = myItems.length > 0 ? Math.max(...myItems.map(i => i.estimated_value || 0)) : 0;
      
      const maxTradingPower = Math.max(userCredits, maxListedValue);
      const upperBudgetLimit = maxTradingPower > 0 ? maxTradingPower + (maxTradingPower * 0.3) : 600; 

      const stopWords = ['i','me','my','myself','we','our','ours','you','your','yours','he','him','his','she','her','it','its','they','them','their','what','which','who','this','that','these','those','am','is','are','was','were','be','been','being','have','has','had','do','does','did','a','an','the','and','but','if','or','because','as','until','while','of','at','by','for','with','about','into','through','during','before','after','to','from','up','down','in','out','on','off','over','under','again','further','then','once','here','there','when','where','why','how','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','can','will','just','should','now','show','want','need','buy','get','look','looking','items','item','product','products','please'];
      const words = cleanMessage.toLowerCase().replace(/[^\w\s]/gi, '').split(' ');
      const keywords = words.filter(word => word.length > 2 && !stopWords.includes(word));

      let marketQuery = { 
        owner: { $ne: userId }, 
        status: 'active',
        estimated_value: { $lte: upperBudgetLimit } 
      };

      if (keywords.length > 0) {
        const searchRegex = new RegExp(keywords.join('|'), 'i');
        marketQuery.$or = [
          { title: searchRegex },
          { category: searchRegex },
          { description: searchRegex }
        ];
      }

      [recentOrders, activeSwaps, recentTransactions, incomingOffers, pendingDispatches, chatDoc, marketItems] = await Promise.all([
        Order.find({ buyer: userId }).select('itemPrice orderStatus totalAmount trackingDetails').populate('item', 'title').sort({ created_at: -1 }).limit(3).lean(),
        BarterRequest.find({ requester: userId, status: { $in: ['PENDING', 'AWAITING_PAYMENT'] } }).populate('item', 'title').populate('offered_item', 'title').sort({ created_at: -1 }).limit(3).lean(),
        Transaction.find({ user: userId }).select('amount status transactionType createdAt').sort({ createdAt: -1 }).limit(3).lean(),
        BarterRequest.find({ owner: userId, status: 'PENDING' }).populate('item', 'title').populate('offered_item', 'title').sort({ created_at: -1 }).limit(3).lean(),
        Order.find({ seller: userId, orderStatus: 'pending' }).select('totalAmount orderStatus').populate('item', 'title').sort({ created_at: -1 }).limit(3).lean(),
        sessionId ? AIChat.findOne({ _id: sessionId, user: userId }) : Promise.resolve(null),
        Item.find(marketQuery).select('_id title estimated_value images category condition').sort({ created_at: -1 }).limit(5).lean()
      ]);

      if (marketItems.length === 0) {
        marketItems = await Item.find({ 
          owner: { $ne: userId }, 
          status: 'active',
          estimated_value: { $lte: upperBudgetLimit }
        }).select('_id title estimated_value images category condition').sort({ created_at: -1 }).limit(5).lean();
      }

    } else {
      chatDoc = sessionId ? await AIChat.findOne({ _id: sessionId, user: userId }) : null;
    }

    if (isPreset) {
      let currentSessionId = sessionId;
      let targetChatDoc = chatDoc;
      
      if (!targetChatDoc) {
        const generatedTitle = cleanMessage.length > 25 ? cleanMessage.substring(0, 25) + '...' : cleanMessage;
        targetChatDoc = await AIChat.create({
          user: userId,
          title: generatedTitle,
          messages: [] 
        });
        currentSessionId = targetChatDoc._id;
      }

      const presetReply = PRESET_RESPONSES[cleanMessage](user);

      targetChatDoc.messages.push({ role: 'user', content: cleanMessage });
      targetChatDoc.messages.push({ role: 'assistant', content: presetReply });
      await targetChatDoc.save();

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      res.write(`data: ${JSON.stringify({ type: 'session_id', sessionId: currentSessionId })}\n\n`);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      res.write(`data: ${JSON.stringify({ content: presetReply })}\n\n`);
      
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    let systemPrompt = prompts.getBaseSystemPrompt(user, chatMode);

    if (isSmartContextEnabled !== false) {
      const activeInventoryStr = myItems.length > 0 ? myItems.map(i => `- ${i.title} (${i.estimated_value} credits)`).join('\n') : 'No active items listed.';
      const orderHistoryStr = recentOrders.length > 0 ? recentOrders.map(o => `- Bought ${o.item?.title || 'item'} for ${o.totalAmount} credits. Status: ${o.orderStatus}`).join('\n') : 'No recent purchases.';
      const swapHistoryStr = activeSwaps.length > 0 ? activeSwaps.map(s => `- Offered ${s.offered_item?.title || 'item'} for ${s.item?.title || 'item'}. Status: ${s.status}`).join('\n') : 'No active outgoing swap requests.';
      const incomingOffersStr = incomingOffers.length > 0 ? incomingOffers.map(s => `- Someone offered ${s.offered_item?.title || 'item'} for your ${s.item?.title || 'item'}. Status: Needs your approval.`).join('\n') : 'No pending incoming offers.';
      const pendingDispatchesStr = pendingDispatches.length > 0 ? pendingDispatches.map(o => `- You need to dispatch: ${o.item?.title || 'item'}. Order Status: ${o.orderStatus}`).join('\n') : 'No items pending dispatch.';
      const marketItemsStr = marketItems.length > 0 ? JSON.stringify(marketItems) : '[]';

      let actionableSuggestions = [];

      if (myItems.length === 0) {
        actionableSuggestions.push("User has zero items listed. Warmly suggest they look around their house for unused items to list, explaining how they can trade them or earn credits.");
      }
      if (user.isVerified !== undefined && !user.isVerified) {
        actionableSuggestions.push("User account is not verified. Suggest they complete the verification process to get a trusted badge.");
      }
      if (user.hasClaimedWelcomeBonus !== undefined && !user.hasClaimedWelcomeBonus) {
        actionableSuggestions.push("User has an unclaimed welcome bonus. Remind them to claim their free credits.");
      }

      const suggestionsStr = actionableSuggestions.length > 0 ? actionableSuggestions.map(s => `- ${s}`).join('\n') : 'No extra suggestions needed right now.';

      systemPrompt += prompts.getSmartContextPrompt(pendingDispatchesStr, incomingOffersStr, activeInventoryStr, swapHistoryStr, orderHistoryStr, suggestionsStr, marketItemsStr);

    } else {
      systemPrompt += prompts.getFallbackContextPrompt();
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
    let aiConfig = await AISetting.findOne();
    if (!aiConfig) {
      aiConfig = await AISetting.create({});
    }

    try {
      chatCompletion = await groq.chat.completions.create({
        messages: messagesArray,
        model: aiConfig.activeModelId, 
        stream: true, 
      }, { signal: abortController.signal });
    } catch (primaryError) {
      if (primaryError.name === 'AbortError') {
        console.log("[AI] Stream aborted by client disconnection.");
        return;
      }
      console.log(`[AI] ${aiConfig.activeModelId} model failed, falling back to ${aiConfig.fallbackModelId}...`, primaryError.message);
      chatCompletion = await groq.chat.completions.create({
        messages: messagesArray,
        model: aiConfig.fallbackModelId, 
        stream: true, 
      }, { signal: abortController.signal });
    }
    
    if (isClientDisconnected) return; 

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

    try {
      for await (const chunk of chatCompletion) {
        if (isClientDisconnected) break;
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullBotReply += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
    } catch (streamError) {
      if (streamError.name !== 'AbortError') {
        throw streamError;
      }
    }

    if (fullBotReply.trim() !== "") {
      const cleanReply = fullBotReply.replace(/(\*\*)?\[ANIMATION_[123]\](\*\*)?/g, '');
      targetChatDoc.messages.push({ role: 'user', content: message });
      targetChatDoc.messages.push({ role: 'assistant', content: cleanReply });
      await targetChatDoc.save();

      try {
        await AITrainingLog.create({
          user: userId,
          system_prompt: systemPrompt,
          user_message: message,
          ai_response: cleanReply,
          status: 'pending' 
        });
      } catch (logError) {
        console.error("Silent data collection failed:", logError);
      }
    }
    
    if (!isClientDisconnected) {
      res.write('data: [DONE]\n\n');
      res.end();
    }

  } catch (error) {
    if (error.name === 'AbortError') return;
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

const synthesizeVoice = async (req, res) => {
  try {
    const { text, voicePref } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }

    const hasTokens = await checkAndConsumeAIToken(req.user._id, 'voice');
    if (!hasTokens) {
      // NOTE: We do not add the cheat code logic here because voice limits just fallback to the browser's standard voice in UI
      return res.status(429).json({ 
        success: false, 
        errorCode: 'DAILY_VOICE_LIMIT_REACHED', 
        message: 'Daily premium voice limit reached. Using standard voice.' 
      });
    }

    const MALE_VOICE_ID = 'pNInz6obpgDQGcFmaJgB';
    const FEMALE_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

    const voiceId = voicePref === 'male' ? MALE_VOICE_ID : FEMALE_VOICE_ID;
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

    if (!ELEVENLABS_API_KEY) {
      return res.status(500).json({ success: false, message: 'API Key missing' });
    }

    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      data: {
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        }
      },
      responseType: 'stream'
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    response.data.pipe(res);
  } catch (error) {
    let errorCode = 'SERVER_ERROR';
    let statusCode = 500;

    if (error.response) {
      statusCode = error.response.status;
      
      if (statusCode === 401 || statusCode === 429) {
        errorCode = 'QUOTA_EXCEEDED';
      }

      if (error.response.data && typeof error.response.data.on === 'function') {
        let errorMsg = '';
        error.response.data.on('data', chunk => {
          errorMsg += chunk.toString();
        });
        error.response.data.on('end', () => {
          console.error(' ElevenLabs Exact Error:', errorMsg);
        });
      }
    } else {
      console.error('ElevenLabs API error:', error.message);
    }
    
    if (!res.headersSent) {
      res.status(statusCode).json({ 
        success: false, 
        errorCode: errorCode,
        message: 'Audio generation failed' 
      });
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
  aiChatLimiter,
  synthesizeVoice
};