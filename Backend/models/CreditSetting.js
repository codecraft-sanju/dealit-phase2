const mongoose = require('mongoose');

const creditSettingSchema = new mongoose.Schema({

  isCreditSystemEnabled: { type: Boolean, default: true }, 
 
  creditsPerListing: { type: Number, default: 50 }, 
  
  maxListingsRewarded: { type: Number, default: 3 }, 
  maxAllowedListings: { type: Number, default: 5 },
  
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CreditSetting', creditSettingSchema);