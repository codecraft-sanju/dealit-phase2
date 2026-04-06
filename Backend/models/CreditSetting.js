const mongoose = require('mongoose');

const creditSettingSchema = new mongoose.Schema({
  isCreditSystemEnabled: { type: Boolean, default: true }, 
  creditsPerListing: { type: Number, default: 50 }, 
  maxListingsRewarded: { type: Number, default: 3 }, 
  maxAllowedListings: { type: Number, default: 5 },
  isWelcomeBonusEnabled: { type: Boolean, default: true },
  welcomeBonusAmount: { type: Number, default: 50 },
flatShippingCost: { type: Number, default: 60 },
  isReferralSystemEnabled: { type: Boolean, default: true },
  referralRewardCredits: { type: Number, default: 40 }, 
  maxReferralLimit: { type: Number, default: 5 },    
  milestoneReferralReward: { type: Number, default: 100 }, 
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CreditSetting', creditSettingSchema);