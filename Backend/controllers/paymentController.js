const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User'); // Tumhare User model ka exact path

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

// 2. Payment Verify karke User ke Credits update karne ki API
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
    
    // Auth middleware se user ID aayegi
    const userId = req.user._id; 

    // Signature verify karne ka formula
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Payment verify ho gayi, ab User ke credits badha do (1 Rs = 1 Credit)
      const creditsToAdd = Number(amount); 

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { account_credits: creditsToAdd } }, // Credits increment kar rahe hain
        { new: true }
      ).select('-password'); // Password fetch karne ki zaroorat nahi hai

      res.status(200).json({
        success: true,
        message: 'Payment verified and credits added successfully',
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