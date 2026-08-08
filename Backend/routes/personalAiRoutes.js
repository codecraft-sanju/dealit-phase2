const express = require('express');
const multer = require('multer'); 
const { protect } = require('../middleware/authMiddleware');
const { 
  initPersonalAI, 
  submitContextAnswers, 
  getAIProfile, 
  processVisitorChat,
  visitorChatLimiter,
  uploadKnowledgeBase, 
  getAnalytics,        
  updateDesign, 
  updateSystemPrompt,
  getMyAI,
  deletePersonalAI
} = require('../controllers/personalAiController');

const router = express.Router();

const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post('/init', protect, initPersonalAI);
router.post('/submit-answers', protect, submitContextAnswers);
router.post('/upload-pdf', protect, upload.single('document'), uploadKnowledgeBase);

router.get('/analytics', protect, getAnalytics);
router.delete('/delete', protect, deletePersonalAI);

router.put('/design', protect, updateDesign); 

router.get('/profile/:username', getAIProfile);
router.post('/chat', visitorChatLimiter, processVisitorChat);
router.put('/prompt', protect, updateSystemPrompt);
router.get('/me', protect, getMyAI);

module.exports = router;