const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },

  itemPrice: { type: Number, required: true },      // Credits charged for the item
  shippingCost: { type: Number, default: 0 },       // Rupees charged for shipping
  totalAmount: { type: Number, required: true },    // itemPrice (credits) + shippingCost (rupees) for record

  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
  },

  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'refunded'],
    default: 'paid' 
  },
  isSellerPaid: { 
    type: Boolean, 
    default: false 
  },

 
  razorpay_order_id: { type: String },
  razorpay_payment_id: { type: String },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);