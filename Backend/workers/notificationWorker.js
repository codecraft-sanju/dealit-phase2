// workers/notificationWorker.js
const { Worker } = require('bullmq');
const { connection } = require('../services/queue');
const Notification = require('../models/Notification');
const User = require('../models/User');

const worker = new Worker('notifications', async (job) => {
  const { user, type, title, message, metadata } = job.data;

  try {
    // 1. Create the notification in the database
    // (Your post-save hook in Notification.js will still automatically handle the Push Notification)
    const notification = await Notification.create({
      user, type, title, message, metadata
    });

    // 2. Efficiently increment the user's unread counter
    await User.findByIdAndUpdate(user, {
      $inc: { unreadNotificationsCount: 1 }
    });

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