const mongoose = require('mongoose');

const creditSettingSchema = new mongoose.Schema({
  isCreditSystemEnabled: { type: Boolean, default: true }, 
  creditsPerListing: { type: Number, default: 50 }, 
  maxListingsRewarded: { type: Number, default: 3 }, 
  maxAllowedListings: { type: Number, default: 5 },
  isWelcomeBonusEnabled: { type: Boolean, default: true },
  welcomeBonusAmount: { type: Number, default: 50 },
  minImagesRequired: { type: Number, default: 3 },
  isDiscountSimulationEnabled: { type: Boolean, default: false },
  isWhatsAppNotificationEnabled: { type: Boolean, default: true },
  isEmailNotificationEnabled: { type: Boolean, default: true },
  shippingMethod: { 
    type: String, 
    enum: ['flat', 'dynamic'], 
    default: 'flat' 
  },
  autoCancelHours: { 
    type: Number, 
    default: 24 
  },
  flatShippingCost: { type: Number, default: 60 },
  isNewUIEnabled: { type: Boolean, default: true },
  heroBannerImage: { type: String, default: '' }, 
  howItWorksImage: { type: String, default: '' },
  
  isReferralSystemEnabled: { type: Boolean, default: true },
  referralRewardCredits: { type: Number, default: 40 }, 
  maxReferralLimit: { type: Number, default: 5 },   
  milestoneReferralReward: { type: Number, default: 100 }, 
  auraReward: { type: Number, default: 50 },
  auraPenalty: { type: Number, default: 50 },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CreditSetting', creditSettingSchema);