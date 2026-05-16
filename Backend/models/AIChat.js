const mongoose = require('mongoose');

const aiChatSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true
  },
  title: {
    type: String,
    default: 'New Chat'
  },
  messages: [{
    role: { 
      type: String, 
      enum: ['user', 'assistant', 'system'], 
      required: true 
    },
    content: { 
      type: String, 
      required: true 
    },
    timestamp: { 
      type: Date, 
      default: Date.now 
    }
  }]
}, {
  
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const AIChat = mongoose.model('AIChat', aiChatSchema);

AIChat.syncIndexes().then(() => {
    console.log("AIChat indexes synced! (Old unique index removed automatically)");
}).catch(err => {
    console.log("Error syncing AIChat indexes:", err.message);
});

module.exports = AIChat;