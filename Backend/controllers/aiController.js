const Groq = require('groq-sdk');
// NAYA CHANGE: Imported Gemini SDK and axios for fetching images
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// Initialize Groq with the key from your .env file
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
// NAYA CHANGE: Initialize Gemini with the key from your .env file
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

    // Using Llama-3 8B model (Super fast and great for short text)
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

// NAYA CHANGE: Function to analyze images using Gemini with Fallback Models
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

    // Fetch images from Cloudinary URLs and convert them to base64 format for Gemini
    const imageParts = await Promise.all(
      imageUrls.slice(0, 3).map(async (url) => {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return {
          inlineData: {
            data: Buffer.from(response.data).toString("base64"),
            mimeType: response.headers['content-type'] || 'image/jpeg',
          },
        };
      })
    );

    // NAYA CHANGE: Sirf wahi model rakha hai jo kaam kar raha hai
    const geminiModels = [
      "gemini-flash-latest" // Dynamic alias that always points to the latest working flash model
    ];

    let generatedText = null;
    let successfulModel = null;

    // Loop through Gemini models until one works
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
          break; // Exit the loop because we got a successful response
        }
      } catch (modelError) {
        console.log(`[AI Vision] Model ${modelName} failed. Reason: ${modelError.message}`);
        // Loop will continue to the next model automatically
      }
    }

    if (!generatedText) {
      throw new Error("All Gemini Vision models failed or are not found.");
    }

    // NAYA CHANGE: Super strict JSON extraction (Ignores extra text from AI)
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error("AI Response was:", generatedText);
      throw new Error("AI did not return valid JSON object.");
    }

    generatedText = jsonMatch[0]; // Sirf { se lekar } tak ka hissa uthao
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

module.exports = {
  generateItemDescription,
  analyzeImages 
};