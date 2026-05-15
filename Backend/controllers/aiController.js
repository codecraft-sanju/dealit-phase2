const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const User = require('../models/User'); 

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

// --- PRODUCTION READY CHAT USING GROQ ---
const processChat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;

    // 1. Fetch maximum possible user data from MongoDB
    const user = await User.findById(userId).select(
      'full_name email city role account_credits aura_points listedProductsCount rewardedListingsCount totalReferrals referralCode isVerified hasClaimedWelcomeBonus created_at'
    );
    
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    const memberSince = new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    // 2. Build the Ultra-Detailed System Context
    const systemPrompt = `You are Dealit AI, a helpful, friendly, and professional assistant for the Dealit platform.
    
    Dealit Platform Rules:
    - Dealit is a hybrid marketplace where users can exchange items (barter) or buy items using Credits.
    - OTP-based delivery verification is required for safe trades via Shiprocket.
    - The 'Aura Score' represents a user's trust level. It increases with successful trades and referrals, and decreases on order cancellations.
    - Flat shipping fee is standard unless dynamic shipping is active based on pincodes.
    - Users can list a maximum of 5 items.
    
    Current User Details (Always use these exact numbers and facts if the user asks about themselves):
    - Full Name: ${user.full_name}
    - Email: ${user.email}
    - City: ${user.city || 'Not provided'}
    - Account Status: ${user.isVerified ? 'Verified ✅' : 'Unverified ❌'}
    - Member Since: ${memberSince}
    - Credits Available: ${user.account_credits}
    - Aura Score: ${user.aura_points}
    - Total Items Listed: ${user.listedProductsCount || 0} (Maximum allowed is 5).
    - Rewarded Listings: ${user.rewardedListingsCount || 0} (Items that earned credit rewards).
    - Total Referrals Made: ${user.totalReferrals || 0}
    - Referral Code: ${user.referralCode || 'Not generated yet'}
    - Welcome Bonus Claimed: ${user.hasClaimedWelcomeBonus ? 'Yes' : 'No'}
    
    Instructions for AI:
    - Answer the user's question clearly, naturally, and concisely.
    - If they ask about their profile, stats, or items, strictly use the details provided above. Do not ask them to check their dashboard.
    - Act like a human-like assistant built natively into Dealit.
    - Be polite, professional, and directly address the user's query.`;

    // 3. Call Groq API for lightning-fast response
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      model: "llama-3.1-8b-instant",
    });

    const reply = chatCompletion.choices[0]?.message?.content;

    // 4. Send the text reply back to the frontend
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