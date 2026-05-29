// workers/notificationWorker.js
const { Worker } = require('bullmq');
const { connection } = require('../services/queue');
const Notification = require('../models/Notification');
const User = require('../models/User');
// NAYA: Push service ko directly yahan import kiya hai
const { sendPushToUser } = require('../utils/pushService'); 

const worker = new Worker('notifications', async (job) => {
  const { user, type, title, message, metadata } = job.data;

  try {
    // 1. Create the notification in the database
    const notification = await Notification.create({
      user, type, title, message, metadata
    });

    // 2. Efficiently increment the user's unread counter
    await User.findByIdAndUpdate(user, {
      $inc: { unreadNotificationsCount: 1 }
    });

    // 3. NAYA LOGIC: URL banayein aur Push Notification seedha Worker se bhejein
    let url = '/';
    const refId = metadata?.referenceId;

    switch (type) {
      case 'CREDIT_ADDED':
      case 'CREDIT_DEDUCTED':
        url = '/wallet';
        break;
      case 'TRADE_ALERT':
        url = refId ? `/deal/${refId}` : '/swaps';
        break;
      case 'ORDER_UPDATE':
      case 'SYSTEM_ALERT':
        url = refId ? `/order/${refId}` : '/orders';
        break;
      case 'AURA_UPDATE':
        url = '/aura';
        break;
      case 'SYSTEM':
        url = '/dashboard';
        break;
    }

    const payload = {
      title: title,
      message: message,
      url: url 
    };

    // 4. Bhej do Push Notification! (Dono App aur Web dono ke liye chalega)
    await sendPushToUser(user, payload);

    return notification._id;
  } catch (error) {
    console.error('Worker Error processing notification:', error);
    throw error;
  }
}, { connection });

worker.on('failed', (job, err) => {
  console.error(`Notification Job ${job.id} failed: ${err.message}`);
});

module.exports = worker;