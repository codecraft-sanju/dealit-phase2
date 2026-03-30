const express = require('express');
const router = express.Router();
const { 
  createBarterRequest, 
  getReceivedRequests,
  getSentRequests,
  getBarterRequestById, 
  updateBarterRequest, 
  deleteBarterRequest 
} = require('../controllers/barterController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createBarterRequest);

router.route('/received').get(protect, getReceivedRequests);
router.route('/sent').get(protect, getSentRequests);

router.route('/:id')
  .get(protect, getBarterRequestById)
  .put(protect, updateBarterRequest)
  .delete(protect, deleteBarterRequest);

module.exports = router;