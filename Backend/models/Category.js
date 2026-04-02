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
    default: 'Package' // Agar koi select na kare toh default Package rahega
  },
  isActive: {
    type: Boolean,
    default: true
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Category', categorySchema); 