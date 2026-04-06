const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
  createOrder,
  getMyOrders,
  getSellerOrders,
  updateOrderStatus
} = require('../controllers/orderController');

router.post('/checkout', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);     // For Buyer
router.get('/seller-orders', protect, getSellerOrders); // For Seller
router.put('/:orderId/status', protect, updateOrderStatus); // Update Status

module.exports = router;