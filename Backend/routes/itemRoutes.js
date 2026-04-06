const express = require('express');
const router = express.Router();

const { createItem, getItems, getMyItems, getItemById, updateItem, deleteItem, searchItems, getRelatedItems } = require('../controllers/itemController');

const { protect } = require('../middleware/authMiddleware');

router.route('/').get(getItems).post(protect, createItem);
router.route('/me').get(protect, getMyItems);
router.route('/search').get(searchItems);
router.route('/:id/related').get(getRelatedItems);


router.route('/:id').get(getItemById).put(protect, updateItem).delete(protect, deleteItem);

module.exports = router;