const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const recommendationController = require('../controllers/recommendation.controller');

const router = express.Router();

// GET /api/v1/recommendations/transporters?lat=&lng=&limit=
router.get('/transporters', protect, recommendationController.recommendTransporters);

module.exports = router;
