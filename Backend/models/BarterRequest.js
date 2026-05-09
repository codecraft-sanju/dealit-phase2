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
    fullName: { 
      type: String,
      required: function() { return this.delivery_method === 'courier'; }
    },
    phone: { 
      type: String,
      required: function() { return this.delivery_method === 'courier'; }
    },
    houseNo: { 
      type: String,
      required: function() { return this.delivery_method === 'courier'; },
      validate: {
        validator: function(v) {
          if (this.delivery_method !== 'courier') return true;
          return v ? /\d/.test(v) : false;
        },
        message: 'House No must contain at least one digit for shipping purposes.'
      }
    },
    areaStreet: { 
      type: String,
      required: function() { return this.delivery_method === 'courier'; }
    },
    landmark: { type: String, default: '' },
    city: { 
      type: String,
      required: function() { return this.delivery_method === 'courier'; }
    },
    state: { 
      type: String,
      required: function() { return this.delivery_method === 'courier'; }
    },
    pincode: { 
      type: String,
      required: function() { return this.delivery_method === 'courier'; }
    }
  },
  shippingCost: { type: Number, default: 0 },
  razorpay_order_id: { type: String },
  razorpay_payment_id: { type: String },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BarterRequest', barterRequestSchema);