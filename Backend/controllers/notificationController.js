const Notification = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');
const User = require('../models/User');

const getUserNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20; 
    const skip = (page - 1) * limit;

    const total = await Notification.countDocuments({ user: req.user._id });

    //  Added .lean() for faster read performance
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Count queries hata kar seedha User model se pre-calculated count fetch kiya
    const user = await User.findById(req.user._id).select('unreadNotificationsCount');

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      unreadCount: user ? user.unreadNotificationsCount : 0, 
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching notifications' });
  }
};

const markAsRead = async (req, res) => {
  try {
    // CHANGED: Sirf tab update karega agar isRead false hai
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, isRead: false },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found or already read' });
    }

    // CHANGED: User fetch karke check kiya taaki counter zero se niche na jaye
    const user = await User.findById(req.user._id);
    if (user && user.unreadNotificationsCount > 0) {
      user.unreadNotificationsCount -= 1;
      await user.save();
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

    // CHANGED: User model mein counter ko reset karke 0 kar diya
    await User.findByIdAndUpdate(req.user._id, {
      unreadNotificationsCount: 0
    });

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Server Error updating notifications' });
  }
};

const subscribePush = async (req, res) => {
  try {
    const { endpoint, keys, expirationTime } = req.body;
    
    await PushSubscription.findOneAndUpdate(
      { endpoint: endpoint },
      { 
        user: req.user._id,
        endpoint: endpoint,
        keys: keys,
        expirationTime: expirationTime
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, message: 'Subscribed to push notifications' });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ success: false, message: 'Server error saving subscription' });
  }
};

const unsubscribePush = async (req, res) => {
  try {
    const { endpoint } = req.body;
    
    await PushSubscription.findOneAndDelete({ endpoint, user: req.user._id });
    
    res.status(200).json({ success: true, message: 'Unsubscribed from push notifications' });
  } catch (error) {
    console.error('Error deleting push subscription:', error);
    res.status(500).json({ success: false, message: 'Server error deleting subscription' });
  }
};

const syncUnreadCount = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : req.body.userId;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const actualUnreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    await User.findByIdAndUpdate(userId, {
      unreadNotificationsCount: actualUnreadCount
    });

    res.status(200).json({ 
      success: true, 
      message: 'Counter synced successfully',
      actualUnreadCount 
    });
  } catch (error) {
    console.error('Error syncing counter:', error);
    res.status(500).json({ success: false, message: 'Server Error syncing counter' });
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  subscribePush,
  unsubscribePush,
  syncUnreadCount
};