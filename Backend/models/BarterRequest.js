const mongoose = require('mongoose');

const barterRequestSchema = new mongoose.Schema({
  supabaseId: { type: String, required: true, unique: true },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  offered_item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  

  status: { 
    type: String, 
    enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'GHOSTING', 'CANCELLED'],
    default: 'PENDING' 
  },
 
  
  message: { type: String },
  requester_accepted: { type: Boolean, default: false },
  owner_accepted: { type: Boolean, default: false },
  
  delivery_method: { type: String, enum: ['mutual', 'courier'], default: 'mutual' },
  shippingAddress: {
    fullName: { type: String },
    phone: { type: String },
    houseNo: { type: String },
    areaStreet: { type: String },
    landmark: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String }
  },
  shippingCost: { type: Number, default: 0 },
  razorpay_order_id: { type: String },
  razorpay_payment_id: { type: String },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BarterRequest', barterRequestSchema);