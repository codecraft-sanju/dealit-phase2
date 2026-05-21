const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
 
  endpoint: { 
    type: String,
    required: true 
  },
  expirationTime: {
    type: Date,
    default: null
  },
  keys: {
    p256dh: { type: String, required: true }, // Keys bhi web push ke liye required hoti hain
    auth: { type: String, required: true }
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
});


pushSubscriptionSchema.index({ user: 1, endpoint: 1 }, { unique: true });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);