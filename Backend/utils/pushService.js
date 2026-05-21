const webpush = require('web-push');
const { Expo } = require('expo-server-sdk'); // NEW: Import Expo SDK
const PushSubscription = require('../models/PushSubscription');

const expo = new Expo();

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const sendPushToUser = async (userId, payload) => {
  try {
    const subscriptions = await PushSubscription.find({ user: userId });
    
    if (subscriptions.length === 0) return;

    //  Separate subscriptions by type
    const webSubscriptions = subscriptions.filter(sub => sub.type === 'web' && sub.endpoint && sub.keys);
    const expoSubscriptions = subscriptions.filter(sub => sub.type === 'expo' && sub.endpoint);

    const pushPromises = [];

    // 1. Process Web Push Notifications
    if (webSubscriptions.length > 0) {
      const webPromises = webSubscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(subscription, JSON.stringify(payload));
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await PushSubscription.findByIdAndDelete(subscription._id);
            console.log(`Cleaned up expired web subscription for user: ${userId}`);
          } else {
            console.error('Error sending web push notification:', err);
          }
        }
      });
      pushPromises.push(...webPromises);
    }

    // 2. Process Expo Mobile Push Notifications
    if (expoSubscriptions.length > 0) {
      const messages = [];
      
      for (let sub of expoSubscriptions) {
        // Validate the Expo token
        if (!Expo.isExpoPushToken(sub.endpoint)) {
          console.error(`Push token ${sub.endpoint} is not a valid Expo push token`);
          await PushSubscription.findByIdAndDelete(sub._id);
          continue;
        }

        // Construct the Expo message
        messages.push({
          to: sub.endpoint,
          sound: 'default',
          title: payload.title,
          body: payload.message,
          data: { url: payload.url }, // Pass the URL for the WebView to handle
        });
      }

  
      const chunks = expo.chunkPushNotifications(messages);
      
      for (let chunk of chunks) {
        pushPromises.push(
          expo.sendPushNotificationsAsync(chunk).then(tickets => {
          
            tickets.forEach(async (ticket, index) => {
              if (ticket.status === 'error' && ticket.details && ticket.details.error === 'DeviceNotRegistered') {
                 const invalidToken = chunk[index].to;
                 await PushSubscription.findOneAndDelete({ endpoint: invalidToken });
                 console.log(`Cleaned up expired expo subscription for user: ${userId}`);
              }
            });
          }).catch(err => {
            console.error('Error sending Expo push notification batch:', err);
          })
        );
      }
    }

  
    await Promise.all(pushPromises);

  } catch (error) {
    console.error('Failed to process push notifications:', error);
  }
};

module.exports = { sendPushToUser };