const express = require('express');
const router = express.Router();

const { createOrder, verifyPayment, razorpayWebhook, getUserTransactions } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.post('/webhook', razorpayWebhook);
router.get('/transactions', protect, getUserTransactions);

module.exports = router;