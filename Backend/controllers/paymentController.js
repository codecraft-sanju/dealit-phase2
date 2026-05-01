const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User'); 
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

// Razorpay instance initialize karna
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// <-- NAYA CHANGE START: Razorpay keys check karne ka function -->
const verifyRazorpayConnection = () => {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    console.log('Razorpay Connected Successfully');
    return true;
  } else {
    console.error('Razorpay Connection Failed: Missing Keys in .env');
    return false;
  }
};
// <-- NAYA CHANGE END -->

// 1. Order Create karne ki API
const createOrder = async (req, res) => {
  try {
    const { amount } = req.body; 

    if (!amount) {
      return res.status(400).json({ success: false, message: 'Amount is required' });
    }

    const options = {
      amount: amount * 100, 
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
      notes: {
        userId: req.user._id.toString()
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

      // User ke credits update karna
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { account_credits: actualAmountInINR } }, 
        { new: true }
      ).select('-password'); 

      
      await Notification.create({
        user: userId,
        type: 'CREDIT_ADDED',
        title: 'Wallet Recharged! 💳',
        message: `₹${actualAmountInINR} credits have been successfully added to your account.`,
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
           { $inc: { account_credits: actualAmountInINR } }
         );

         await Notification.create({
           user: userId,
           type: 'CREDIT_ADDED',
           title: 'Wallet Recharged! 💳',
           message: `₹${actualAmountInINR} credits have been successfully added to your account via webhook.`,
           metadata: { 
             amount: actualAmountInINR, 
             reason: 'wallet_recharge',
             referenceId: newTransaction._id 
           }
         });
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook Error');
  }
};

// NAYA: Backend Pagination & Filtering Logic
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
  verifyRazorpayConnection 
};