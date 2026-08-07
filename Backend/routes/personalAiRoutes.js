const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
  initPersonalAI, 
  submitContextAnswers, 
  getAIProfile, 
  processVisitorChat,
  visitorChatLimiter
} = require('../controllers/personalAiController');

const router = express.Router();

router.post('/init', protect, initPersonalAI);
router.post('/submit-answers', protect, submitContextAnswers);

router.get('/profile/:username', getAIProfile);
router.post('/chat', visitorChatLimiter, processVisitorChat);

module.exports = router;