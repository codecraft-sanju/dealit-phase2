const express = require('express');
const { generateItemDescription, analyzeImages, processChat, getChatHistory } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware'); 

const router = express.Router();

router.post('/generate-description', generateItemDescription);
router.post('/analyze-images', analyzeImages);


router.get('/chat/history', protect, getChatHistory);

router.post('/chat', protect, processChat);

module.exports = router;