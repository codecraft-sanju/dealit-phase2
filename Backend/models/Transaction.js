const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true // Amount in INR or Credits
  },
  razorpay_order_id: { 
    type: String, 
  },
razorpay_payment_id: { 
    type: String,
    unique: true,
    sparse: true
  },
  razorpay_signature: { 
    type: String, 
  },
  transactionType: { 
    type: String, 
    enum: ['wallet_recharge', 'shipping_fee', 'order_refund', 'shipping_refund'], 
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


// Dashboard me 7 din ka revenue nikalne ke liye yeh index query ko fast karega
transactionSchema.index({ status: 1, created_at: -1 });

// Payment verification ke time webhook me duplicate check instant hoga
transactionSchema.index({ razorpay_payment_id: 1 });

// User ki transaction history (getUserTransactions API) turant load hogi
transactionSchema.index({ user: 1, transactionType: 1 });


module.exports = mongoose.model('Transaction', transactionSchema);