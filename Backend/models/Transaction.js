const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true // Amount in INR
  },
  razorpay_order_id: { 
    type: String, 
    required: true 
  },
  razorpay_payment_id: { 
    type: String, 
    required: true 
  },
  razorpay_signature: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['success', 'failed', 'pending'], 
    default: 'success' 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);