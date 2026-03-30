const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  supabaseId: { type: String, required: true, unique: true },
  barterRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'BarterRequest' },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: { type: String, required: true },
  created_at: { type: Date }
});

module.exports = mongoose.model('Message', messageSchema);