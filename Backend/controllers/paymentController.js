const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User'); 
const Transaction = require('../models/Transaction');

const { queueNotification } = require('../services/queue');

const Order = require('../models/Order');
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const CREDIT_PACKS = {
  'starter': { price: 49, credits: 50 },
  'popular': { price: 99, credits: 110 },
  'pro': { price: 199, credits: 250 }
};

const verifyRazorpayConnection = () => {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    console.log('Razorpay Connected Successfully');
    return true;
  } else {
    console.error('Razorpay Connection Failed: Missing Keys in .env');
    return false;
  }
};

const refundRazorpayPayment = async (paymentId, amount) => {
  try {
    const refund = await razorpayInstance.payments.refund(paymentId, {
      amount: amount * 100, 
      speed: 'optimum'
    });
    return { success: true, data: refund };
  } catch (error) {
    console.error('Razorpay Refund Error:', error);
    return { success: false, error };
  }
};

const fetchRazorpayPaymentInfo = async (paymentId) => {
  try {
    const payment = await razorpayInstance.payments.fetch(paymentId);
    return { success: true, data: payment };
  } catch (error) {
    console.error('Error fetching Razorpay payment info:', error);
    return { success: false, error };
  }
};

const createOrder = async (req, res) => {
  try {
    const { packId, customAmount, amount } = req.body; 

    let amountToCharge = 0;
    let creditsToAward = 0;

    if (packId === 'custom') {
      if (!customAmount || customAmount < 10) {
        return res.status(400).json({ success: false, message: 'Invalid custom amount' });
      }
      amountToCharge = customAmount;
      creditsToAward = customAmount;
    } else if (CREDIT_PACKS[packId]) {
      amountToCharge = CREDIT_PACKS[packId].price;
      creditsToAward = CREDIT_PACKS[packId].credits;
    } else if (amount) {
      amountToCharge = amount;
      creditsToAward = amount;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid pack selected or amount missing' });
    }

    const options = {
      amount: amountToCharge * 100, 
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        creditsToAward: creditsToAward.toString()
      }
    };

    const order = await razorpayInstance.orders.create(options);

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user._id; 

    const existingTransaction = await Transaction.findOne({ razorpay_payment_id });
    if (existingTransaction) {
      return res.status(400).json({ success: false, message: 'Payment already processed.' });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const signatureBuffer = Buffer.from(razorpay_signature, 'hex');
    
    let isAuthentic = false;
    if (expectedBuffer.length === signatureBuffer.length) {
        isAuthentic = crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    }

    if (isAuthentic) {
      const orderDetails = await razorpayInstance.orders.fetch(razorpay_order_id);

      if (orderDetails.status !== 'paid') {
          return res.status(400).json({ success: false, message: 'Payment incomplete at Razorpay end.' });
      }

      const actualAmountInINR = orderDetails.amount / 100; 
      const creditsToAdd = orderDetails.notes && orderDetails.notes.creditsToAward 
                           ? parseInt(orderDetails.notes.creditsToAward) 
                           : actualAmountInINR;

    
      const newTransaction = new Transaction({
        user: userId,
        amount: actualAmountInINR,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        status: 'success',
        transactionType: 'wallet_recharge'
      });
      await newTransaction.save();

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { account_credits: creditsToAdd } }, 
        { new: true }
      ).select('-password'); 

      queueNotification({
        user: userId,
        type: 'CREDIT_ADDED',
        title: 'Wallet Recharged! 💳',
        message: `${creditsToAdd} credits have been successfully added to your account.`,
        metadata: { 
          amount: actualAmountInINR, 
          reason: 'wallet_recharge',
          referenceId: newTransaction._id 
        }
      });

      res.status(200).json({
        success: true,
        message: 'Payment verified, transaction saved, and credits added successfully',
        user: updatedUser,
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid Signature. Payment Verification Failed.' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error during verification' });
  }
};

const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body.event;

    if (event === 'payment.captured') {
      const paymentEntity = req.body.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      const actualAmountInINR = paymentEntity.amount / 100;
      const userId = paymentEntity.notes ? paymentEntity.notes.userId : null;
      
      const creditsToAdd = paymentEntity.notes && paymentEntity.notes.creditsToAward 
                           ? parseInt(paymentEntity.notes.creditsToAward) 
                           : actualAmountInINR;
      
      const existingTransaction = await Transaction.findOne({ razorpay_payment_id: paymentId });
      
      if (!existingTransaction && userId) {
         const newTransaction = new Transaction({
           user: userId,
           amount: actualAmountInINR,
           razorpay_order_id: orderId,
           razorpay_payment_id: paymentId,
           razorpay_signature: 'verified_via_webhook',
           status: 'success',
           transactionType: 'wallet_recharge'
         });
         await newTransaction.save();

         await User.findByIdAndUpdate(
           userId,
           { $inc: { account_credits: creditsToAdd } }
         );

        
         queueNotification({
           user: userId,
           type: 'CREDIT_ADDED',
           title: 'Wallet Recharged! ',
           message: `${creditsToAdd} credits have been successfully added to your account.`,
           metadata: { 
             amount: actualAmountInINR, 
             reason: 'wallet_recharge',
             referenceId: newTransaction._id 
           }
         });
      }
    } 
  
    else if (event === 'refund.processed') {
      const refundEntity = req.body.payload.refund.entity;
      const paymentId = refundEntity.payment_id;

      const order = await Order.findOne({ razorpay_payment_id: paymentId, paymentStatus: 'refund_processing' }).populate('item');
      
      if (order) {
         order.paymentStatus = 'refunded';
         await order.save();

         queueNotification({
           user: order.buyer,
           type: 'CREDIT_ADDED',
           title: 'Bank Refund Successful ',
           message: `₹${order.shippingCost} shipping refund has been successfully processed by your bank.`,
           metadata: { amount: order.shippingCost, reason: 'bank_refund_success', referenceId: order._id, imageUrl: order.item?.images?.[0] }
         });
      }
    }
   
    else if (event === 'refund.failed') {
      const refundEntity = req.body.payload.refund.entity;
      const paymentId = refundEntity.payment_id;

      const order = await Order.findOne({ razorpay_payment_id: paymentId, paymentStatus: 'refund_processing' }).populate('item');
      
      if (order) {
         order.paymentStatus = 'refund_failed';
         await order.save();
         queueNotification({
           user: order.buyer,
           type: 'SYSTEM_ALERT',
           title: 'Refund Failed ⚠️',
           message: `Your bank rejected the ₹${order.shippingCost} shipping refund. Please contact support.`,
           metadata: { amount: order.shippingCost, reason: 'bank_refund_failed', referenceId: order._id, imageUrl: order.item?.images?.[0] }
         });
      }
    }
    

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook Error');
  }
};


const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user._id; 
    
    // Pagination aur Filters req.query se aayenge
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type || 'all';
    
    const skip = (page - 1) * limit;

    let query = { user: userId };
    if (type !== 'all') {
      query.transactionType = type;
    }

    const totalTransactions = await Transaction.countDocuments(query);

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total: totalTransactions,
      currentPage: page,
      totalPages: Math.ceil(totalTransactions / limit),
      hasMore: page < Math.ceil(totalTransactions / limit),
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching transactions' });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  razorpayWebhook,
  getUserTransactions,
  verifyRazorpayConnection,
  refundRazorpayPayment,
  fetchRazorpayPaymentInfo 
};