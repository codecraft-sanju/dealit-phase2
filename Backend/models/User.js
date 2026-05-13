// models/User.js
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
    houseNo: { 
      type: String,
      validate: {
        validator: function(v) {
          return !v || /\d/.test(v);
        },
        message: 'House No must contain at least one digit for shipping purposes.'
      }
    },
    areaStreet: { type: String },
    landmark: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String }
  },

  savedAddresses: [{
    fullName: { type: String },
    phone: { type: String },
    houseNo: { type: String },
    areaStreet: { type: String },
    landmark: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String }
  }],
  
  account_credits: { type: Number, default: 0 },
  aura_points: { type: Number, default: 100 }, 
  
  listedProductsCount: { type: Number, default: 0 },
  
 
  rewardedListingsCount: { type: Number, default: 0 },
  
  hasClaimedWelcomeBonus: { type: Boolean, default: false },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  totalReferrals: { type: Number, default: 0 }, 
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date },
  resetPasswordOtp: { type: String },
  resetPasswordOtpExpiry: { type: Date },
  
  isDeleted: { type: Boolean, default: false },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

userSchema.index({ full_name: 'text', email: 'text', phone: 'text', city: 'text' });
userSchema.index({ created_at: -1 });
userSchema.index({ role: 1 });
userSchema.index({ isVerified: 1, created_at: -1 });

module.exports = mongoose.model('User', userSchema);