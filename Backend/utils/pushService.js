const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');


webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const sendPushToUser = async (userId, payload) => {
  try {
    const subscriptions = await PushSubscription.find({ user: userId });
    
    if (subscriptions.length === 0) return;


    const validSubscriptions = subscriptions.filter(sub => sub.endpoint && sub.keys);

    if (validSubscriptions.length > 0) {
      const pushPromises = validSubscriptions.map(async (subscription) => {
        try {
        
          await webpush.sendNotification(subscription, JSON.stringify(payload));
        } catch (err) {
         
          if (err.statusCode === 404 || err.statusCode === 410) {
            await PushSubscription.findByIdAndDelete(subscription._id);
            console.log(`Cleaned up expired subscription for user: ${userId}`);
          } else {
            console.error('Error sending push notification:', err);
          }
        }
      });
      
    
      await Promise.all(pushPromises);
    }

  } catch (error) {
    console.error('Failed to process push notifications:', error);
  }
};

module.exports = { sendPushToUser };