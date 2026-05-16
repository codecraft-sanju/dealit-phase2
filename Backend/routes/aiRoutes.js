const express = require('express');
const { 
  generateItemDescription, 
  analyzeImages, 
  processChat, 
  getChatHistory, 
  getChatSessions, 
  deleteChatSession,
  deleteAllChatSessions 
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware'); 

const router = express.Router();

router.post('/generate-description', generateItemDescription);
router.post('/analyze-images', analyzeImages);

router.get('/chat/sessions', protect, getChatSessions);
router.delete('/chat/sessions', protect, deleteAllChatSessions);
router.get('/chat/history/:sessionId', protect, getChatHistory);
router.delete('/chat/session/:sessionId', protect, deleteChatSession);
router.post('/chat', protect, processChat);

module.exports = router;