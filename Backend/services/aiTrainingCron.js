const cron = require('node-cron');
const AITrainingLog = require('../models/AITrainingLog');
const AISetting = require('../models/AISetting');

const { triggerLoRATraining } = require('./aiTrainingService');

const toxicWords = ['badword1', 'badword2', 'stupid', 'idiot', 'fake'];
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const phoneRegex = /(\+91[\-\s]?)?[0]?(91)?[789]\d{9}/; 

const cleanAndBatchData = async () => {
  try {
    const aiConfig = await AISetting.findOne();
    if (!aiConfig || !aiConfig.isAutoTrainingEnabled) {
      console.log('[AI Cron] Auto-training is paused. Skipping data cleanup.');
      return;
    }

    console.log('[AI Cron] Running Data Cleaner...');

    const pendingLogs = await AITrainingLog.find({ status: 'pending' }).limit(100); 
    
    if (pendingLogs.length === 0) {
      console.log('[AI Cron] No pending logs to clean.');
      return; 
    }

    let cleanedCount = 0;
    let rejectedCount = 0;

    for (const log of pendingLogs) {
      const msg = log.user_message.toLowerCase();
      let isClean = true;
      let reason = '';

      if (msg.trim().length < 5) {
        isClean = false;
        reason = 'Message too short';
      } else if (emailRegex.test(msg)) {
        isClean = false;
        reason = 'Contains Email ID';
      } else if (phoneRegex.test(msg)) {
        isClean = false;
        reason = 'Contains Phone Number';
      } else if (toxicWords.some(word => msg.includes(word))) {
        isClean = false;
        reason = 'Contains toxic or inappropriate words';
      }

      if (isClean) {
        log.status = 'cleaned';
        cleanedCount++;
      } else {
        log.status = 'rejected';
        log.rejection_reason = reason;
        rejectedCount++;
      }

      await log.save();
    }

    console.log(`[AI Cron] Cleanup Done: ${cleanedCount} Cleaned, ${rejectedCount} Rejected.`);

    const totalCleanedLogs = await AITrainingLog.countDocuments({ status: 'cleaned' });
    
    if (totalCleanedLogs >= aiConfig.batchSize) {
      console.log(`[AI Cron] Target batch size (${aiConfig.batchSize}) reached! Triggering LoRA Fine-Tuning...`);
      await triggerLoRATraining(); 
    }

  } catch (error) {
    console.error('[AI Cron] Error in data cleaning job:', error);
  }
};


const startAITrainingCron = async () => {
  try {
    const aiConfig = await AISetting.findOne();
    const intervalMins = (aiConfig && aiConfig.cleanerInterval) ? aiConfig.cleanerInterval : 15;
    
    console.log(`[AI Cron] Background Data Cleaner scheduled to run in ${intervalMins} minutes.`);
    
    setTimeout(async () => {
      await cleanAndBatchData();
      startAITrainingCron(); // Recursively calls itself to fetch updated timers for the next run
    }, intervalMins * 60 * 1000);
    
  } catch (error) {

    setTimeout(async () => {
      await cleanAndBatchData();
      startAITrainingCron();
    }, 15 * 60 * 1000);
  }
};

module.exports = { startAITrainingCron };