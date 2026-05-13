const webpush = require('web-push');

const { Expo } = require('expo-server-sdk');
const PushSubscription = require('../models/PushSubscription');

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);


const expo = new Expo();

const sendPushToUser = async (userId, payload) => {
  try {
    const subscriptions = await PushSubscription.find({ user: userId });
    
    if (subscriptions.length === 0) return;

    
    const webSubscriptions = [];
    const expoMessages = [];

    subscriptions.forEach(sub => {
      if (sub.type === 'expo' && Expo.isExpoPushToken(sub.expoToken)) {
        expoMessages.push({
          to: sub.expoToken,
          sound: 'default',
          title: payload.title,
          body: payload.message,
          data: { url: payload.url || '/' },
        });
      } else if (sub.type === 'web') {
        webSubscriptions.push(sub);
      }
    });

    // Handle Web Push
    if (webSubscriptions.length > 0) {
      const pushPromises = webSubscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(subscription, JSON.stringify(payload));
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await PushSubscription.findByIdAndDelete(subscription._id);
          } else {
            console.error('Error sending push notification:', err);
          }
        }
      });
      await Promise.all(pushPromises);
    }

   
    if (expoMessages.length > 0) {
      const chunks = expo.chunkPushNotifications(expoMessages);
      for (let chunk of chunks) {
        try {
          await expo.sendPushNotificationsAsync(chunk);
        } catch (error) {
          console.error('Error sending Expo push chunk:', error);
        }
      }
    }

  } catch (error) {
    console.error('Failed to process push notifications:', error);
  }
};

module.exports = { sendPushToUser };