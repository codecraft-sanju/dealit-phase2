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
      'SYSTEM'
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
  // Metadata taaki frontend par specific details dikha sakein (jaise kitne credits, kis wajah se)
  metadata: {
    amount: { type: Number, default: 0 },
    reason: { type: String }, // e.g., 'signup_bonus', 'item_listed', 'order_placed'
    referenceId: { type: mongoose.Schema.Types.ObjectId } // Kisi Item ya Order ki ID link karne ke liye
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

module.exports = mongoose.model('Notification', notificationSchema);