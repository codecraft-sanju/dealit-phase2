const express = require('express');
const router = express.Router();
const { 
  getPendingItems, 
  updateItemStatus, 
  getAllUsers, 
  deleteUser, 
  getAllItems 
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

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

module.exports = router;