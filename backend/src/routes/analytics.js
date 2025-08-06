const express = require('express');
const { query } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  getUploadStats,
  getUserStats,
  getSystemHealth,
  getResearchInsights
} = require('../controllers/analyticsController');

const router = express.Router();

// Validation middleware
const validateTimeframe = [
  query('timeframe')
    .optional()
    .isIn(['1month', '3months', '6months', '1year'])
    .withMessage('Timeframe must be 1month, 3months, 6months, or 1year')
];

const validateUserId = [
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId')
];

// Routes
router.get('/uploads', getUploadStats);
router.get('/user/:userId?', auth, validateUserId, getUserStats);
router.get('/health', getSystemHealth);
router.get('/insights', validateTimeframe, getResearchInsights);

module.exports = router; 