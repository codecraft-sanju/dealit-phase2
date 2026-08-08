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
  

  theme: { 
    type: String, 
    enum: ['midnight-glass', 'minimal-snow', 'cyberpunk-neon'], 
    default: 'midnight-glass' 
  },
  
 
  layout: {
    type: String,
    enum: ['center', 'left', 'right'],
    default: 'center'
  },
  
  knowledgeBaseText: { type: String, default: "" } 
}, { timestamps: true });

module.exports = mongoose.model('PersonalAI', personalAISchema);