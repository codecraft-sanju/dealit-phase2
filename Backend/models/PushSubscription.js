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
  endpoint: { 
    type: String,
    required: true 
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

pushSubscriptionSchema.index({ user: 1, endpoint: 1 }, { unique: true });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);