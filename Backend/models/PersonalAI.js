const mongoose = require('mongoose');

const personalAISchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, unique: true, required: true }, // linktr.ee/username format ke liye
  baseIdea: { type: String, required: true },
  setupStatus: { 
    type: String, 
    enum: ['pending', 'asking_questions', 'completed'], 
    default: 'pending' 
  },
  contextQuestions: [{ type: String }], // AI dwara puche gaye 4-5 sawal
  userAnswers: [{ type: String }], // User ke diye gaye jawab
  finalSystemPrompt: { type: String }, // Optimized system prompt jo chat ke time use hoga
  isActive: { type: Boolean, default: true },
  totalChats: { type: Number, default: 0 } // Analytics ke liye
}, { timestamps: true });

module.exports = mongoose.model('PersonalAI', personalAISchema);