const express = require('express');
const router = express.Router();

const { getPublicOffers } = require('../controllers/offerController');

router.get('/', getPublicOffers);

module.exports = router;