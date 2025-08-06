const express = require('express');
const { query, body } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  searchPapers,
  advancedSearch,
  getSearchSuggestions,
  getPopularKeywords,
  getAvailableAuthors,
  getAvailableJournals,
  getSearchStats
} = require('../controllers/searchController');

const router = express.Router();

// Validation middleware
const validateSearchQuery = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search query must not be empty'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('sort')
    .optional()
    .isIn(['relevance', 'uploadedAt', 'title', 'journalName'])
    .withMessage('Invalid sort field'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc')
];

const validateAdvancedSearch = [
  body('query')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search query must not be empty'),
  body('filters')
    .optional()
    .isObject()
    .withMessage('Filters must be an object'),
  body('filters.keywords')
    .optional()
    .isArray()
    .withMessage('Keywords filter must be an array'),
  body('filters.journalName')
    .optional()
    .isString()
    .withMessage('Journal name filter must be a string'),
  body('filters.dateRange')
    .optional()
    .isObject()
    .withMessage('Date range filter must be an object'),
  body('filters.dateRange.start')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('filters.dateRange.end')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('sortBy')
    .optional()
    .isIn(['relevance', 'uploadedAt', 'title', 'journalName'])
    .withMessage('Invalid sort field'),
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

const validateSuggestionsQuery = [
  query('q')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Query must be at least 2 characters long')
];

const validateKeywordsQuery = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Routes
router.get('/', validateSearchQuery, searchPapers);
router.post('/advanced', validateAdvancedSearch, advancedSearch);
router.get('/suggestions', validateSuggestionsQuery, getSearchSuggestions);
router.get('/keywords', validateKeywordsQuery, getPopularKeywords);
router.get('/authors', getAvailableAuthors);
router.get('/journals', getAvailableJournals);
router.get('/stats', getSearchStats);

module.exports = router; 