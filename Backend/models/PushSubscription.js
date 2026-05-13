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
    default: 'web'
  },

  expoToken: { type: String },
  endpoint: { 
    type: String
  },
  expirationTime: {
    type: Date,
    default: null
  },
  keys: {
    p256dh: { type: String },
    auth: { type: String }
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);