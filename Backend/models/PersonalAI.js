const mongoose = require('mongoose');

const personalAISchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, unique: true, required: true },
  baseIdea: { type: String, required: true },
  setupStatus: { 
    type: String, 
    enum: ['pending', 'asking_questions', 'completed'], 
    default: 'pending' 
  },
  contextQuestions: [{ type: String }],
  userAnswers: [{ type: String }],
  finalSystemPrompt: { type: String },
  isActive: { type: Boolean, default: true },
  totalChats: { type: Number, default: 0 },
  
  // NEW: Themes & Knowledge Base
  theme: { 
    type: String, 
    enum: ['midnight-glass', 'minimal-snow', 'cyberpunk-neon'], 
    default: 'midnight-glass' 
  },
  knowledgeBaseText: { type: String, default: "" } // PDF se extract kiya hua data
}, { timestamps: true });

module.exports = mongoose.model('PersonalAI', personalAISchema);