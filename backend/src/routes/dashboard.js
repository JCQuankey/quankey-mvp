// backend/src/routes/dashboard.js

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { 
  getStats, 
  getRecommendations, 
  getActivity 
} = require('../controllers/dashboardController');

// PATENT-CRITICAL: All dashboard routes require authentication
// This ensures only authenticated users can view quantum statistics

// Get comprehensive dashboard statistics
router.get('/stats', authMiddleware, getStats);

// Get personalized security recommendations
router.get('/recommendations', authMiddleware, getRecommendations);

// Get activity timeline
router.get('/activity', authMiddleware, getActivity);

module.exports = router;