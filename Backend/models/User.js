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
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
  
  pickupAddress: {
    addressLine: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String }
  },
  
  account_credits: { type: Number, default: 0 },
  listedProductsCount: { type: Number, default: 0 },
  hasClaimedWelcomeBonus: { type: Boolean, default: false },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  totalReferrals: { type: Number, default: 0 }, 
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date },
  resetPasswordOtp: { type: String },
  resetPasswordOtpExpiry: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// ⚡ PERFORMANCE INDEXES ADDED HERE ⚡

// 1. Text Index for fast searching by Admin
userSchema.index({ full_name: 'text', email: 'text', phone: 'text', city: 'text' });

// 2. Standard Index for fast sorting (Newest users first)
userSchema.index({ created_at: -1 });

// 3. Standard Index for role filtering
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);