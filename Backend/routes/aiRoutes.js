const express = require('express');
const { generateItemDescription, analyzeImages, processChat } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware'); // Assuming you have auth middleware

const router = express.Router();


router.post('/generate-description', generateItemDescription);
router.post('/analyze-images', analyzeImages);
router.post('/chat', protect, processChat);

module.exports = router;