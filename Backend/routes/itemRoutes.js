const express = require('express');
const router = express.Router();
// NAYA: getMyItems ko import list me add kar liya
const { createItem, getItems, getMyItems, getItemById, updateItem, deleteItem } = require('../controllers/itemController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(getItems).post(protect, createItem);

// NAYA ROUTE: Logged-in user ke apne saare items lane ke liye
router.route('/me').get(protect, getMyItems);

router.route('/:id').get(getItemById).put(protect, updateItem).delete(protect, deleteItem);

module.exports = router;