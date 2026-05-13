const Notification = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');

const getUserNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20; 
    const skip = (page - 1) * limit;

    const total = await Notification.countDocuments({ user: req.user._id });

    const notifications = await Notification.find({ user: req.user._id })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const unreadCount = await Notification.countDocuments({ 
      user: req.user._id, 
      isRead: false 
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      unreadCount: unreadCount,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching notifications' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Server Error updating notification' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Server Error updating notifications' });
  }
};

// CHANGED: Logic to handle both expo and web subscriptions
const subscribePush = async (req, res) => {
  try {
    const { type, token, endpoint, keys, expirationTime } = req.body;
    
    if (type === 'expo') {
      await PushSubscription.findOneAndUpdate(
        { expoToken: token, user: req.user._id },
        { type: 'expo', expoToken: token, user: req.user._id },
        { upsert: true, new: true }
      );
    } else {
      await PushSubscription.findOneAndUpdate(
        { endpoint: endpoint },
        { 
          type: 'web',
          user: req.user._id,
          endpoint: endpoint,
          keys: keys,
          expirationTime: expirationTime
        },
        { upsert: true, new: true }
      );
    }

    res.status(201).json({ success: true, message: 'Subscribed to push notifications' });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ success: false, message: 'Server error saving subscription' });
  }
};

// CHANGED: Logic to handle unsubscribe for both expo and web
const unsubscribePush = async (req, res) => {
  try {
    const { type, token, endpoint } = req.body;
    
    if (type === 'expo') {
      await PushSubscription.findOneAndDelete({ expoToken: token, user: req.user._id });
    } else {
      await PushSubscription.findOneAndDelete({ endpoint, user: req.user._id });
    }
    
    res.status(200).json({ success: true, message: 'Unsubscribed from push notifications' });
  } catch (error) {
    console.error('Error deleting push subscription:', error);
    res.status(500).json({ success: false, message: 'Server error deleting subscription' });
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  subscribePush,
  unsubscribePush
};