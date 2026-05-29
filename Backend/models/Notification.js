const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: [
      'CREDIT_ADDED', 
      'CREDIT_DEDUCTED', 
      'TRADE_ALERT', 
      'ORDER_UPDATE',
      'SYSTEM',
      'AURA_UPDATE',
      'SYSTEM_ALERT'
    ], 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  metadata: {
    amount: { type: Number, default: 0 },
    reason: { type: String }, 
    referenceId: { type: mongoose.Schema.Types.ObjectId } ,
    imageUrl: { type: String }
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
});

notificationSchema.index({ user: 1, created_at: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

// Note: The post('save') hook has been completely removed.
// Push Notifications are now exclusively and safely handled by workers/notificationWorker.js

module.exports = mongoose.model('Notification', notificationSchema);