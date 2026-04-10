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

module.exports = mongoose.model('Item', itemSchema);