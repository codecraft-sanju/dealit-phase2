const mongoose = require('mongoose');

const auraLogSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  reason: { 
    type: String, 
    required: true // e.g., "Successful Deal Completed", "Signup Bonus", "Profile Completed"
  },
  points: { 
    type: Number, 
    required: true // e.g., 50 (if positive) or 20 (if negative - keep it positive/negative based on 'type')
  },
  type: { 
    type: String, 
    enum: ['positive', 'negative'], 
    required: true 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
});


// User ki history fetch karte waqt hamesha date ke hisaab se descending order me chahiye hogi
auraLogSchema.index({ user: 1, created_at: -1 });

module.exports = mongoose.model('AuraLog', auraLogSchema);