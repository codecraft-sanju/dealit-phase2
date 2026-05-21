const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: [
      'CREDIT_ADDED', 
      'CREDIT_DEDUCTED', 
      'TRADE_ALERT', 
      'ORDER_UPDATE',
      'SYSTEM',
      'AURA_UPDATE',
      'SYSTEM_ALERT'
    ], 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  metadata: {
    amount: { type: Number, default: 0 },
    reason: { type: String }, 
    referenceId: { type: mongoose.Schema.Types.ObjectId } ,
    imageUrl: { type: String }
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
});

notificationSchema.index({ user: 1, created_at: -1 });
notificationSchema.index({ user: 1, isRead: 1 });


notificationSchema.post('save', async function(doc) {
  try {
    
    const { sendPushToUser } = require('../utils/pushService');
    
    let url = '/';
    const refId = doc.metadata?.referenceId;

    switch (doc.type) {
      case 'CREDIT_ADDED':
      case 'CREDIT_DEDUCTED':
        url = '/wallet';
        break;
      case 'TRADE_ALERT':
        url = refId ? `/deal/${refId}` : '/swaps';
        break;
      case 'ORDER_UPDATE':
      case 'SYSTEM_ALERT':
        url = refId ? `/order/${refId}` : '/orders';
        break;
      case 'AURA_UPDATE':
        url = '/aura';
        break;
      case 'SYSTEM':
        url = '/dashboard';
        break;
    }

    const payload = {
      title: doc.title,
      message: doc.message,
      url: url 
    };

    await sendPushToUser(doc.user, payload);
  } catch (error) {
    console.error('Error in notification post-save hook:', error);
  }
});

module.exports = mongoose.model('Notification', notificationSchema);