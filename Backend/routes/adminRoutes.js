const express = require('express');
const router = express.Router();

const { 
  getPendingItems, 
  updateItemStatus, 
  getAllUsers, 
  deleteUser, 
  getAllItems,
  updateUserRole,
  getCreditSettings,     
  updateCreditSettings,
  getPublicCreditSettings,
  getAllTransactions,
  getAllOrders,          
  updateAdminOrderStatus,
  getDashboardStats,
  resolveFailedRefund,
  retryFailedRefund, getAILogs,getAISettings,     
  updateAISettings,  getAILogStats,
  resetUserAILimits,
  getAwsBillingStats,
  setupAwsBudgetAlert,
  getAllPersonalAIs,
  togglePersonalAIStatus,
  deletePersonalAIByAdmin
} = require('../controllers/adminController');

const {
  addOffer,
  getAdminOffers,
  deleteOffer,
  updateOffer
} = require('../controllers/offerController');

const { protect, admin } = require('../middleware/authMiddleware');

router.route('/public-settings')
  .get(getPublicCreditSettings);

router.route('/pending-items')
  .get(protect, admin, getPendingItems);

router.route('/item-status/:id')
  .put(protect, admin, updateItemStatus);

router.route('/all-items')
  .get(protect, admin, getAllItems);

router.route('/users')
  .get(protect, admin, getAllUsers);

router.route('/users/:id')
  .delete(protect, admin, deleteUser);

router.route('/users/role/:id')
  .put(protect, admin, updateUserRole);
  
router.route('/users/:id/reset-ai-limits')
  .put(protect, admin, resetUserAILimits);

router.route('/offers')
  .get(protect, admin, getAdminOffers)
  .post(protect, admin, addOffer);

router.route('/offers/:id')
  .put(protect, admin, updateOffer)
  .delete(protect, admin, deleteOffer);

router.route('/credit-settings')
  .get(protect, admin, getCreditSettings)
  .put(protect, admin, updateCreditSettings);

router.route('/transactions')
  .get(protect, admin, getAllTransactions);

router.route('/orders')
  .get(protect, admin, getAllOrders);

router.route('/orders/:id')
  .put(protect, admin, updateAdminOrderStatus);

router.put('/orders/:orderId/resolve-refund', protect, admin, resolveFailedRefund);
router.put('/orders/:orderId/retry-refund', protect, admin, retryFailedRefund);
router.get('/dashboard-stats', protect, admin, getDashboardStats);

router.get('/ai-logs', protect, admin, getAILogs);

router.route('/ai-settings')
  .get(protect, admin, getAISettings)
  .put(protect, admin, updateAISettings);

router.get('/ai-log-stats', protect, admin, getAILogStats);


router.route('/personal-ais')
  .get(protect, admin, getAllPersonalAIs);

router.route('/personal-ais/:id/toggle-status')
  .put(protect, admin, togglePersonalAIStatus);

router.route('/personal-ais/:id')
  .delete(protect, admin, deletePersonalAIByAdmin);

  router.get('/aws-billing', protect, admin, getAwsBillingStats);
router.post('/aws-budget', protect, admin, setupAwsBudgetAlert);
module.exports = router;