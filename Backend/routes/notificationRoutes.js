const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Aapka auth middleware path match kar lena

const {
  getUserNotifications,
  markAsRead,
  markAllAsRead
} = require('../controllers/notificationController');

// Saare routes ko protect karna zaroori hai
router.use(protect);

// 1. Get all notifications for the logged-in user
router.get('/', getUserNotifications);

// 2. Mark ALL notifications as read
router.put('/read-all', markAllAsRead);

// 3. Mark a SINGLE notification as read
router.put('/:id/read', markAsRead);

module.exports = router;