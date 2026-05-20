// orderRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
  calculateShippingCost, 
  createOrder,
  getMyOrders,
  getSellerOrders,
  updateOrderStatus,
  dispatchOrder, 
  getShippingLabel, 
  handleShiprocketWebhook,
  getLiveTracking,
  getOrderById 
} = require('../controllers/orderController');


router.post('/status-update', handleShiprocketWebhook);

// Protected routes
router.post('/calculate-shipping', protect, calculateShippingCost); 
router.post('/checkout', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);     // For Buyer
router.get('/seller-orders', protect, getSellerOrders); // For Seller

router.get('/:orderId', protect, getOrderById); 

router.post('/:orderId/dispatch', protect, dispatchOrder); 
router.post('/:orderId/generate-label', protect, getShippingLabel); 
router.put('/:orderId/status', protect, updateOrderStatus); 
router.get('/:orderId/track', protect, getLiveTracking); 

module.exports = router;