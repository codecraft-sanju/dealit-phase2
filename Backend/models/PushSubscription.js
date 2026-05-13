const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  endpoint: { 
    type: String, 
    required: true,
    unique: true 
  },
  expirationTime: {
    type: Date,
    default: null
  },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);