const express = require('express');
const multer = require('multer'); // NEW: For PDF Uploads
const { protect } = require('../middleware/authMiddleware');
const { 
  initPersonalAI, 
  submitContextAnswers, 
  getAIProfile, 
  processVisitorChat,
  visitorChatLimiter,
  uploadKnowledgeBase, 
  getAnalytics,        
  updateTheme   ,
  updateSystemPrompt       
} = require('../controllers/personalAiController');

const router = express.Router();


const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Creator Routes
router.post('/init', protect, initPersonalAI);
router.post('/submit-answers', protect, submitContextAnswers);

// NEW: Premium Features Routes
router.post('/upload-pdf', protect, upload.single('document'), uploadKnowledgeBase);
router.get('/analytics', protect, getAnalytics);
router.put('/theme', protect, updateTheme);

// Public Routes
router.get('/profile/:username', getAIProfile);
router.post('/chat', visitorChatLimiter, processVisitorChat);
router.put('/prompt', protect, updateSystemPrompt);

module.exports = router;