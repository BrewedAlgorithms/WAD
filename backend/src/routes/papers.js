const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/upload');
const {
  uploadPaper,
  getAllPapers,
  getPaperById,
  updatePaper,
  deletePaper,
  downloadPaper,
  getUserPapers,
  extractMetadataFromAI,
  extractMetadataFromUrl,
  getRelatedPapers,
  toggleFavorite,
  getFavoritePapers,
  analyzeGorardSieve
} = require('../controllers/paperController');

const router = express.Router();

// Validation middleware
const validatePaperUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters'),
  body('detailed_summary')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Summary must be less than 5000 characters'),
  body('abstract')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Abstract must be less than 10000 characters'),
  body('keywords')
    .optional()
    .isArray()
    .withMessage('Keywords must be an array'),
  body('paperLink')
    .optional()
    .isURL()
    .withMessage('Paper link must be a valid URL'),
  body('journalName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Journal name must be less than 200 characters'),
  body('authors')
    .optional()
    .isArray()
    .withMessage('Authors must be an array'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
];

// Validation for URL-based metadata extraction
const validateUrlExtraction = [
  body('url')
    .isURL()
    .withMessage('Must be a valid URL')
];

// Routes
router.post('/upload', auth, uploadMiddleware, uploadPaper);
router.post('/metadatafromai', uploadMiddleware, extractMetadataFromAI);
router.post('/metadatafromurl', validateUrlExtraction, extractMetadataFromUrl);
router.get('/', getAllPapers);
router.get('/user/:userId?', auth, getUserPapers);
// Favorites must come before ID-based routes
router.get('/favorites/me', auth, getFavoritePapers);
router.post('/:paperId/favorite', auth, toggleFavorite);
router.get('/:paperId/related', getRelatedPapers);
router.post('/:paperId/gorard-sieve', auth, analyzeGorardSieve);
router.get('/:paperId', auth, getPaperById);
router.put('/:paperId', auth, validatePaperUpdate, updatePaper);
router.delete('/:paperId', auth, deletePaper);
router.get('/:paperId/download', auth, downloadPaper);

module.exports = router; 