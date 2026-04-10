const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
  calculateShippingCost, // <-- NAYA CHANGE: Naya function import kiya
  createOrder,
  getMyOrders,
  getSellerOrders,
  updateOrderStatus
} = require('../controllers/orderController');


router.post('/calculate-shipping', protect, calculateShippingCost); 

router.post('/checkout', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);     // For Buyer
router.get('/seller-orders', protect, getSellerOrders); // For Seller
router.put('/:orderId/status', protect, updateOrderStatus); // Update Status

module.exports = router;