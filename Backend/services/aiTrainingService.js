const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const AITrainingLog = require('../models/AITrainingLog');
const AISetting = require('../models/AISetting');


const AI_PROVIDER_API_KEY = process.env.FINE_TUNING_API_KEY; 

const checkTrainingStatusAndSwap = async (jobId) => {
  console.log(`[AI Training] Checking status for Job ID: ${jobId}...`);
  
  try {
   
    const response = await axios.get(`https://api.together.xyz/v1/fine-tunes/${jobId}`, {
      headers: { 'Authorization': `Bearer ${AI_PROVIDER_API_KEY}` }
    });

    const status = response.data.status; // 'pending', 'running', 'succeeded', 'failed'
    
    if (status === 'succeeded') {
      const newModelId = response.data.model; 
      console.log(`[AI Training] SUCCESS! New Model Ready: ${newModelId}`);

    
      let aiConfig = await AISetting.findOne();
      if (aiConfig) {
        aiConfig.activeModelId = newModelId; 
        await aiConfig.save();
        console.log(`[AI Training] Auto-Swap Complete. Platform is now running on the new brain!`);
      }
    } else if (status === 'failed') {
      console.log(`[AI Training] Training Job Failed. Please check AI provider dashboard.`);
    } else {
      console.log(`[AI Training] Job still ${status}... checking again in 5 minutes.`);
      // Check again after 5 minutes
      setTimeout(() => checkTrainingStatusAndSwap(jobId), 5 * 60 * 1000);
    }
  } catch (error) {
    console.error("[AI Training] Error checking status:", error.message);
  }
};

const uploadAndTrainModel = async (filePath) => {
  console.log("[AI Training] Uploading dataset to AI Provider...");
  
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('purpose', 'fine-tune');

    // 1. Upload File
    const uploadRes = await axios.post('https://api.together.xyz/v1/files', formData, {
      headers: { 
        ...formData.getHeaders(),
        'Authorization': `Bearer ${AI_PROVIDER_API_KEY}` 
      }
    });

    const fileId = uploadRes.data.id;
    console.log(`[AI Training] File uploaded successfully. File ID: ${fileId}`);

  
    console.log("[AI Training] Triggering LoRA Fine-Tuning Job...");
    const trainRes = await axios.post('https://api.together.xyz/v1/fine-tunes', {
      training_file: fileId,
      model: 'meta-llama/Llama-3-8b-chat-hf',
      n_epochs: 3,
      batch_size: 4
    }, {
      headers: { 
        'Authorization': `Bearer ${AI_PROVIDER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const jobId = trainRes.data.id;
    console.log(`[AI Training] Training Job Started! Job ID: ${jobId}`);

    // 3. Delete the local JSONL file to save server space
    fs.unlinkSync(filePath);

    // 4. Start polling for status
    setTimeout(() => checkTrainingStatusAndSwap(jobId), 5 * 60 * 1000);

  } catch (error) {
    console.error("[AI Training] Failed to upload/train:", error.response ? error.response.data : error.message);
  }
};

const triggerLoRATraining = async () => {
  try {
    console.log("[AI Training] Starting LoRA fine-tuning preparation...");
    const aiConfig = await AISetting.findOne();
    const batchLimit = aiConfig ? aiConfig.batchSize : 500;

    // 1. Fetch the exact batch of cleaned data
    const cleanedLogs = await AITrainingLog.find({ status: 'cleaned' }).limit(batchLimit);
    
    if (cleanedLogs.length < batchLimit) {
      console.log(`[AI Training] Not enough data yet. Have ${cleanedLogs.length}, need ${batchLimit}.`);
      return;
    }

    // 2. Convert to JSONL Format
    let jsonlData = '';
    cleanedLogs.forEach(log => {
      const trainingRow = {
        messages: [
          { role: "system", content: log.system_prompt },
          { role: "user", content: log.user_message },
          { role: "assistant", content: log.ai_response }
        ]
      };
      jsonlData += JSON.stringify(trainingRow) + '\n';
    });

    // 3. Save JSONL to a temporary file
    const fileName = `training_batch_${Date.now()}.jsonl`;
    const filePath = path.join(__dirname, '..', fileName);
    fs.writeFileSync(filePath, jsonlData);
    console.log(`[AI Training] JSONL file created successfully: ${fileName}`);

    // 4. Update logs status to 'trained' so they aren't processed again
    const logIds = cleanedLogs.map(log => log._id);
    await AITrainingLog.updateMany(
      { _id: { $in: logIds } },
      { $set: { status: 'trained' } }
    );
    console.log(`[AI Training] ${logIds.length} logs marked as 'trained'.`);

    // 5. Fire the API Upload and Training process (runs in background)
    uploadAndTrainModel(filePath);

  } catch (error) {
    console.error("[AI Training] Error in training trigger:", error);
  }
};

module.exports = { triggerLoRATraining };