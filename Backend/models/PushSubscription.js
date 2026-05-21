const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['web', 'expo'], 
    default: 'web' // NEW: Added type to differentiate mobile and web tokens
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
    p256dh: { type: String }, //Removed required: true for Expo compatibility
    auth: { type: String }    // Removed required: true for Expo compatibility
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
});

pushSubscriptionSchema.index({ user: 1, endpoint: 1 }, { unique: true });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);