const mongoose = require('mongoose');

const aiSettingSchema = new mongoose.Schema({
  activeModelId: {
    type: String,
    default: 'llama-3.3-70b-versatile'
  },
  fallbackModelId: {
    type: String,
    default: 'llama-3.1-8b-instant'
  },
  isAutoTrainingEnabled: {
    type: Boolean,
    default: true
  },
  batchSize: {
    type: Number,
    default: 500
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AISetting', aiSettingSchema);