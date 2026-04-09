const express = require('express');
const { generateItemDescription } = require('../controllers/aiController');

const router = express.Router();

// Route: POST /api/ai/generate-description
router.post('/generate-description', generateItemDescription);

module.exports = router;