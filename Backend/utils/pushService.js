// utils/pushService.js
const webpush = require('web-push');
const { Expo } = require('expo-server-sdk'); // Import Expo SDK
const PushSubscription = require('../models/PushSubscription');

const expo = new Expo();

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const sendPushToUser = async (userId, payload) => {
  try {
    console.log(`\n===========================================`);
    console.log(`🚀 PUSH NOTIFICATION DEBUG START`);
    console.log(`Target User ID: ${userId}`);
    console.log(`Payload Title: ${payload.title}`);

    const subscriptions = await PushSubscription.find({ user: userId });
    console.log(`Total active subscriptions in DB: ${subscriptions.length}`);
    
    if (subscriptions.length === 0) {
      console.log(`❌ No subscriptions found for this user. Exiting.`);
      console.log(`===========================================\n`);
      return;
    }

    // Separate subscriptions by type
    const webSubscriptions = subscriptions.filter(sub => sub.type === 'web' && sub.endpoint && sub.keys);
    const expoSubscriptions = subscriptions.filter(sub => sub.type === 'expo' && sub.endpoint);

    console.log(`🌐 Web Subscriptions found: ${webSubscriptions.length}`);
    console.log(`📱 Expo (Mobile) Subscriptions found: ${expoSubscriptions.length}`);

    const pushPromises = [];

    // 1. Process Web Push Notifications
    if (webSubscriptions.length > 0) {
      const webPromises = webSubscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(subscription, JSON.stringify(payload));
          console.log(`✅ Web Push sent successfully to endpoint: ${subscription.endpoint.substring(0, 30)}...`);
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await PushSubscription.findByIdAndDelete(subscription._id);
            console.log(`🧹 Cleaned up expired web subscription for user: ${userId}`);
          } else {
            console.error('🚨 Error sending web push notification:', err.message);
          }
        }
      });
      pushPromises.push(...webPromises);
    }

    // 2. Process Expo Mobile Push Notifications
    if (expoSubscriptions.length > 0) {
      const messages = [];
      
      for (let sub of expoSubscriptions) {
        console.log(`🔍 Checking Expo Token: ${sub.endpoint}`);

        // Validate the Expo token
        if (!Expo.isExpoPushToken(sub.endpoint)) {
          console.error(`🚨 Invalid Expo token found: ${sub.endpoint}. Deleting from DB.`);
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

      console.log(`📨 Valid Expo messages ready to send: ${messages.length}`);

      if (messages.length > 0) {
        const chunks = expo.chunkPushNotifications(messages);
        
        for (let chunk of chunks) {
          pushPromises.push(
            expo.sendPushNotificationsAsync(chunk)
              .then(tickets => {
                console.log(`✅ Expo Server Response (Tickets):`, JSON.stringify(tickets, null, 2));
                
                tickets.forEach(async (ticket, index) => {
                  if (ticket.status === 'error') {
                    console.error(`🚨 Expo Ticket Error for ${chunk[index].to}:`, ticket);
                    if (ticket.details && ticket.details.error === 'DeviceNotRegistered') {
                       const invalidToken = chunk[index].to;
                       await PushSubscription.findOneAndDelete({ endpoint: invalidToken });
                       console.log(`🧹 Cleaned up unregistered expo subscription for user: ${userId}`);
                    }
                  }
                });
              })
              .catch(err => {
                console.error('🚨 Error sending Expo push notification batch:', err);
              })
          );
        }
      }
    }

    await Promise.all(pushPromises);
    console.log(`🏁 PUSH NOTIFICATION DEBUG END`);
    console.log(`===========================================\n`);

  } catch (error) {
    console.error('🚨 Failed to process push notifications (Critical Error):', error);
  }
};

module.exports = { sendPushToUser };