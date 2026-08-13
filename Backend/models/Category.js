// Category.js
const mongoose = require('mongoose'); 

const categorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Category name is required'], 
    unique: true,
    trim: true
  },
  icon: {
    type: String,
    default: 'Package'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  activeItemsCount: {
    type: Number,
    default: 0
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
});


categorySchema.index({ isActive: 1, activeItemsCount: -1 });

module.exports = mongoose.model('Category', categorySchema);