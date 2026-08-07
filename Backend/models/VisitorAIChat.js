const mongoose = require('mongoose');

const visitorAIChatSchema = new mongoose.Schema({
  personalAI: { type: mongoose.Schema.Types.ObjectId, ref: 'PersonalAI', required: true },
  visitorId: { type: String, required: true }, // IP address ya browser fingerprint
  messages: [{
    role: { type: String, enum: ['user', 'assistant'] },
    content: { type: String },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('VisitorAIChat', visitorAIChatSchema);