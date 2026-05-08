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
    houseNo: { 
      type: String, 
      required: true,
      validate: {
        validator: function(v) {
          return /\d/.test(v);
        },
        message: 'House No must contain at least one digit for shipping purposes.'
      }
    },
    areaStreet: { type: String, required: true },
    landmark: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
  },

  orderStatus: {
    type: String,
    // -> MODIFICATION START: Added 'in_transit' to separate it from 'shipped'
    enum: ['pending', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled'],
    // -> MODIFICATION END
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    // Note: Assuming 'refund_failed' might be needed based on earlier webhook code, 
    // but sticking to your exact schema enum for now.
    enum: ['paid', 'refund_processing', 'refunded', 'refund_failed'], 
    default: 'paid' 
  },
  isSellerPaid: { 
    type: Boolean, 
    default: false 
  },
  
  cancellationReason: {
    type: String,
    default: ''
  },

  razorpay_order_id: { type: String },
  razorpay_payment_id: { type: String },

  trackingDetails: {
    shiprocket_order_id: { type: String },
    shiprocket_shipment_id: { type: String },
    awb_code: { type: String }, // Tracking Number
    courier_company: { type: String } ,
    expected_date: { type: String, default: '' }
  },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});



// 1. User App: "My Orders" API ke liye (Instantly load buyer's orders sorted by date)
orderSchema.index({ buyer: 1, created_at: -1 });

// 2. User App: "Seller Orders" API ke liye (Instantly load seller's received orders)
orderSchema.index({ seller: 1, created_at: -1 });

// 3. Admin Dashboard & Auto-Cancel Job: 
// Dashboard me 'delivered' ya 'pending' count karne aur 24 hours wale pending orders cancel karne ke liye
orderSchema.index({ orderStatus: 1, created_at: -1 });

// 4. Admin Panel: Payment status filter ke liye
orderSchema.index({ paymentStatus: 1, created_at: -1 });

// 5. Shiprocket Webhook: AWB number se order find karna webhook me sabse frequent task hai
// Unique false rakha hai in case starting me empty string ho.
orderSchema.index({ 'trackingDetails.awb_code': 1 });

// 6. Razorpay Webhook: Refund process hone par order find karne ke liye
orderSchema.index({ razorpay_payment_id: 1 });


module.exports = mongoose.model('Order', orderSchema);