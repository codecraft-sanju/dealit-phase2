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
    enum: ['pending', 'active', 'rejected','reserved', 'swapped'], 
    default: 'pending' 
  },
  
  rejection_reason: { type: String },
  estimated_value: { type: Number, default: 0 },
  
  weight: { 
    type: Number, 
    required: true,
    default: 0.5 // Default 500g in Kg
  },
  dimensions: {
    length: { type: Number, default: 10 }, // cm me
    width: { type: Number, default: 10 },  // cm me
    height: { type: Number, default: 10 }  // cm me
  },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// ⚡ PERFORMANCE INDEXES ADDED HERE ⚡

// 1. Text Index for fast searching by Admin
itemSchema.index({ title: 'text', category: 'text', condition: 'text' });

// 2. Compound Index for fast filtering and sorting (e.g., getting pending items ordered by date)
itemSchema.index({ status: 1, created_at: -1 });

// 3. Index for fast lookup of a user's items
itemSchema.index({ owner: 1 });

module.exports = mongoose.model('Item', itemSchema);