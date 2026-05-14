const mongoose = require('mongoose');

const barterRequestSchema = new mongoose.Schema({
  supabaseId: { type: String, required: true, unique: true },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  offered_item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  
  status: { 
    type: String, 
    enum: ['PENDING', 'AWAITING_PAYMENT', 'ACCEPTED', 'REJECTED', 'GHOSTING', 'CANCELLED'],
    default: 'PENDING' 
  },
  
  message: { type: String },

  rejectionReason: { type: String },

  requester_accepted: { type: Boolean, default: false },
  owner_accepted: { type: Boolean, default: false },
  
  requesterShippingAddress: {
    fullName: { type: String },
    phone: { type: String },
    houseNo: { 
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /\d/.test(v);
        },
        message: 'House No must contain at least one digit for shipping purposes.'
      }
    },
    areaStreet: { type: String },
    landmark: { type: String, default: '' },
    city: { type: String },
    state: { type: String },
    pincode: { type: String }
  },
  requesterShippingCost: { type: Number, default: 0 },
  requester_razorpay_order_id: { type: String },
  requester_razorpay_payment_id: { type: String },
  requesterPaymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },

  ownerShippingAddress: {
    fullName: { type: String },
    phone: { type: String },
    houseNo: { 
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /\d/.test(v);
        },
        message: 'House No must contain at least one digit for shipping purposes.'
      }
    },
    areaStreet: { type: String },
    landmark: { type: String, default: '' },
    city: { type: String },
    state: { type: String },
    pincode: { type: String }
  },
  ownerShippingCost: { type: Number, default: 0 },
  owner_razorpay_order_id: { type: String },
  owner_razorpay_payment_id: { type: String },
  ownerPaymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },

  expiresAt: { type: Date },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BarterRequest', barterRequestSchema);