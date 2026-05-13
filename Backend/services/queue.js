// services/queue.js
const { Queue } = require('bullmq');


const connection = {
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
};

const notificationQueue = new Queue('notifications', { connection });

const queueNotification = async (data) => {
  await notificationQueue.add('send_notification', data, {
    removeOnComplete: true, // Keep Redis clean
    removeOnFail: false
  });
};

module.exports = { queueNotification, connection };