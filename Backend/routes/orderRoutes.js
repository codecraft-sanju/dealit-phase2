const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
  calculateShippingCost, 
  createOrder,
  getMyOrders,
  getSellerOrders,
  updateOrderStatus,
  handleShiprocketWebhook 
} = require('../controllers/orderController');


router.post('/shiprocket-webhook', handleShiprocketWebhook); 

router.post('/calculate-shipping', protect, calculateShippingCost); 
router.post('/checkout', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);     // For Buyer
router.get('/seller-orders', protect, getSellerOrders); // For Seller
router.put('/:orderId/status', protect, updateOrderStatus); // Update Status

module.exports = router;