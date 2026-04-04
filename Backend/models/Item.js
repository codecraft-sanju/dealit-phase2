const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  supabaseId: { type: String, required: true, unique: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  supabaseUserId: { type: String },
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  condition: { type: String },
  images: [{ type: String }],
  preferred_item: { type: String },
  
  status: { 
    type: String, 
    enum: ['pending', 'active', 'rejected', 'swapped'], 
    default: 'pending' 
  },
  
  rejection_reason: { type: String },

  estimated_value: { type: Number, default: 0 },
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Item', itemSchema);