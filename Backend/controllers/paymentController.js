const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User'); 
const Transaction = require('../models/Transaction');

// Razorpay instance initialize karna
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 1. Order Create karne ki API
const createOrder = async (req, res) => {
  try {
    const { amount } = req.body; // Amount Rupees mein aayega

    if (!amount) {
      return res.status(400).json({ success: false, message: 'Amount is required' });
    }

    const options = {
      amount: amount * 100, // Razorpay paise mein amount leta hai, isliye 100 se multiply kiya
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
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

      // Actual amount in INR
      const actualAmountInINR = orderDetails.amount / 100; 

      // NAYA: Transaction Database mein save karna
      const newTransaction = new Transaction({
        user: userId,
        amount: actualAmountInINR,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        status: 'success'
      });
      await newTransaction.save();

      // User ke credits update karna
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { account_credits: actualAmountInINR } }, 
        { new: true }
      ).select('-password'); 

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
module.exports = {
  createOrder,
  verifyPayment
};