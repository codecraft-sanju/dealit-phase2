const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); 

const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,

  subscribePush,
  unsubscribePush
 
} = require('../controllers/notificationController');


router.use(protect);


router.post('/subscribe', subscribePush);
router.post('/unsubscribe', unsubscribePush);

router.get('/', getUserNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

module.exports = router;