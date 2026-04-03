const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    mobileImage: {
      type: String,
      required: true,
    },
    desktopImage: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Offer', offerSchema);