const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  supabaseId: { type: String, unique: true, sparse: true }, 
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, 
  phone: { type: String },
  city: { type: String },
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  },
  profilePic: { type: String, default: '' },
  
  account_credits: { type: Number, default: 50 }, // Welcome bonus of 50 credits
  
  resetPasswordOtp: { type: String },
  resetPasswordOtpExpiry: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);