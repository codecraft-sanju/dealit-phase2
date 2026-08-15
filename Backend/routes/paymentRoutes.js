const express = require('express');
const router = express.Router();

const { 
  createOrder, 
  verifyPayment, 
  razorpayWebhook, 
  getUserTransactions,
  getSavedPaymentMethods, 
  deleteSavedPaymentMethod ,
  downloadWalletStatement
} = require('../controllers/paymentController');

const { protect } = require('../middleware/authMiddleware');

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.post('/webhook', razorpayWebhook);
router.get('/transactions', protect, getUserTransactions);

router.get('/statement', protect, downloadWalletStatement);
router.get('/saved-methods', protect, getSavedPaymentMethods);
router.delete('/saved-methods/:tokenId', protect, deleteSavedPaymentMethod);

module.exports = router;