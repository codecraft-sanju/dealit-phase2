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
isReadyToDispatch: { type: Boolean, default: false },
  orderStatus: {
    type: String,
   
    enum: ['pending', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled'],
   
    default: 'pending'
  },
  paymentStatus: {
    type: String,
 
    enum: ['paid', 'refund_processing', 'refunded', 'refund_failed'], 
    default: 'paid' 
  },
  isSellerPaid: { 
    type: Boolean, 
    default: false 
  },

  orderType: { 
    type: String, 
    enum: ['purchase', 'barter'], 
    default: 'purchase' 
  },
  barterRequestRef: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'BarterRequest' 
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


orderSchema.index(
  { 'trackingDetails.awb_code': 1 },
  { partialFilterExpression: { 'trackingDetails.awb_code': { $exists: true, $ne: '' } } }
);


// 6. Razorpay Webhook: Refund process hone par order find karne ke liye
orderSchema.index({ razorpay_payment_id: 1 });


module.exports = mongoose.model('Order', orderSchema);