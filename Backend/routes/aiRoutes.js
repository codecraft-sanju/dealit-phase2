const express = require('express');
const { 
  generateItemDescription, 
  analyzeImages, 
  processChat,
  processCodeChat, 
  getChatHistory, 
  getChatSessions, 
  deleteChatSession,
  deleteAllChatSessions,
  synthesizeVoice,
  purchaseAILimitReset,
  generateMarketImage
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware'); 

const router = express.Router();

router.post('/generate-description', generateItemDescription);
router.post('/analyze-images', analyzeImages);
router.post('/generate-image', protect, generateMarketImage);
router.get('/chat/sessions', protect, getChatSessions);
router.delete('/chat/sessions', protect, deleteAllChatSessions);
router.get('/chat/history/:sessionId', protect, getChatHistory);
router.delete('/chat/session/:sessionId', protect, deleteChatSession);
router.post('/chat', protect, processChat);
router.post('/chat/code', protect, processCodeChat);

router.post('/synthesize-voice', protect, synthesizeVoice);

router.post('/reset-limit', protect, purchaseAILimitReset);

module.exports = router;