const mongoose = require('mongoose');

const aiTrainingLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  system_prompt: {
    type: String,
    required: true
  },
  user_message: {
    type: String,
    required: true
  },
  ai_response: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'cleaned', 'rejected', 'trained'],
    default: 'pending'
  },
  rejection_reason: {
    type: String,
    default: ''
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AITrainingLog', aiTrainingLogSchema);