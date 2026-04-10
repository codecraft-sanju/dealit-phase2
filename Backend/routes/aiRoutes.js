const express = require('express');
// NAYA CHANGE: Added analyzeImages to the import
const { generateItemDescription, analyzeImages } = require('../controllers/aiController');

const router = express.Router();

// Route: POST /api/ai/generate-description
router.post('/generate-description', generateItemDescription);

// NAYA CHANGE: Route for vision auto-fill
router.post('/analyze-images', analyzeImages);

module.exports = router;