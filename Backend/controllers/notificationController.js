const Notification = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');
const User = require('../models/User');

const getUserNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    // const limit = parseInt(req.query.limit, 10) || 20; 
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const skip = (page - 1) * limit;
    const filterType = req.query.filter || 'All';

    // Base query
    let query = { user: req.user._id };

    // Apply filters based on request
    if (filterType === 'Unread') {
      query.isRead = false;
    } else if (filterType === 'Wallet') {
      query.type = { $in: ['CREDIT_ADDED', 'CREDIT_DEDUCTED'] };
    } else if (filterType === 'Trades') {
      query.type = 'TRADE_ALERT';
    } else if (filterType === 'Orders') {
      query.type = 'ORDER_UPDATE';
    }

    const total = await Notification.countDocuments(query);

    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

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
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, isRead: false },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found or already read' });
    }

   await User.findByIdAndUpdate(req.user._id, {
  $inc: { unreadNotificationsCount: -1 }
});

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
    const { endpoint, keys, expirationTime, type } = req.body;
    
    await PushSubscription.findOneAndUpdate(
      { endpoint: endpoint },
      { 
        user: req.user._id,
        endpoint: endpoint,
        keys: keys,
        expirationTime: expirationTime,
        type: type || 'web'
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
  
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    
    const userId = req.user._id;

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