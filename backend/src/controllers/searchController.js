const Paper = require('../models/Paper');
const { logger } = require('../utils/logger');

// Basic search
const searchPapers = async (req, res) => {
  try {
    const {
      q = '',
      filters = 'all',
      page = 1,
      limit = 10,
      sort = 'relevance',
      order = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50);
    const skip = (pageNum - 1) * limitNum;

    const startTime = Date.now();

    // Build search query
    const searchOptions = {
      sortBy: sort === 'relevance' ? null : sort,
      sortOrder: order
    };

    // Add filters if specified
    if (req.query.keywords) {
      searchOptions.keywords = Array.isArray(req.query.keywords) ? req.query.keywords : [req.query.keywords];
    }
    if (req.query.authors) {
      searchOptions.authors = Array.isArray(req.query.authors) ? req.query.authors : [req.query.authors];
    }
    if (req.query.journalName) {
      searchOptions.journalName = req.query.journalName;
    }
    if (req.query.uploadedBy) {
      searchOptions.uploadedBy = req.query.uploadedBy;
    }

    // Execute search
    const papers = await Paper.searchPapers(q, searchOptions);
    const totalItems = papers.length;

    // Apply pagination
    const paginatedPapers = papers.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(totalItems / limitNum);

    const searchTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        papers: paginatedPapers.map(paper => paper.getPublicData()),
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        },
        searchStats: {
          query: q,
          totalResults: totalItems,
          searchTime: searchTime / 1000 // Convert to seconds
        }
      }
    });
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SEARCH_FAILED',
        message: 'Failed to perform search'
      }
    });
  }
};

// Advanced search
const advancedSearch = async (req, res) => {
  try {
    const {
      query = '',
      filters = {},
      sortBy = 'relevance',
      page = 1,
      limit = 10
    } = req.body;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50);
    const skip = (pageNum - 1) * limitNum;

    const startTime = Date.now();

    // Build search options
    const searchOptions = {
      sortBy: sortBy === 'relevance' ? null : sortBy,
      sortOrder: 'desc'
    };

    // Apply filters
    if (filters.keywords && filters.keywords.length > 0) {
      searchOptions.keywords = filters.keywords;
    }
    if (filters.authors && filters.authors.length > 0) {
      searchOptions.authors = filters.authors;
    }
    if (filters.journalName) {
      searchOptions.journalName = filters.journalName;
    }
    if (filters.uploadedBy) {
      searchOptions.uploadedBy = filters.uploadedBy;
    }
    if (filters.dateRange) {
      searchOptions.dateRange = filters.dateRange;
    }

    // Execute search
    const papers = await Paper.searchPapers(query, searchOptions);
    const totalItems = papers.length;

    // Apply pagination
    const paginatedPapers = papers.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(totalItems / limitNum);

    const searchTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        papers: paginatedPapers.map(paper => paper.getPublicData()),
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        },
        searchStats: {
          query,
          filters,
          totalResults: totalItems,
          searchTime: searchTime / 1000
        }
      }
    });
  } catch (error) {
    logger.error('Advanced search error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ADVANCED_SEARCH_FAILED',
        message: 'Failed to perform advanced search'
      }
    });
  }
};

// Get search suggestions
const getSearchSuggestions = async (req, res) => {
  try {
    const { q = '' } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: {
          suggestions: []
        }
      });
    }

    // Get suggestions from titles and keywords
    const titleSuggestions = await Paper.distinct('title', {
      title: { $regex: q, $options: 'i' },
      isPublic: true
    }).limit(5);

    const keywordSuggestions = await Paper.distinct('keywords', {
      keywords: { $regex: q, $options: 'i' },
      isPublic: true
    }).limit(5);

    // Combine and deduplicate suggestions
    const allSuggestions = [...titleSuggestions, ...keywordSuggestions];
    const uniqueSuggestions = [...new Set(allSuggestions)]
      .filter(suggestion => suggestion.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        suggestions: uniqueSuggestions
      }
    });
  } catch (error) {
    logger.error('Search suggestions error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SUGGESTIONS_FAILED',
        message: 'Failed to get search suggestions'
      }
    });
  }
};

// Get popular keywords
const getPopularKeywords = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Aggregate to get keyword frequency
    const keywordStats = await Paper.aggregate([
      { $match: { isPublic: true } },
      { $unwind: '$keywords' },
      {
        $group: {
          _id: '$keywords',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          keyword: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        keywords: keywordStats
      }
    });
  } catch (error) {
    logger.error('Popular keywords error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'KEYWORDS_FAILED',
        message: 'Failed to get popular keywords'
      }
    });
  }
};

// Get available authors
const getAvailableAuthors = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const authors = await Paper.aggregate([
      { $match: { isPublic: true } },
      { $unwind: '$authors' },
      { $match: { authors: { $ne: null, $ne: '' } } },
      {
        $group: {
          _id: '$authors',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          author: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        authors: authors.map(item => item.author)
      }
    });
  } catch (error) {
    logger.error('Available authors error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTHORS_FAILED',
        message: 'Failed to get available authors'
      }
    });
  }
};

// Get available journals
const getAvailableJournals = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const journals = await Paper.aggregate([
      { $match: { isPublic: true, journalName: { $exists: true, $ne: null, $ne: '' } } },
      {
        $group: {
          _id: '$journalName',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          journal: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        journals: journals.map(item => item.journal)
      }
    });
  } catch (error) {
    logger.error('Available journals error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'JOURNALS_FAILED',
        message: 'Failed to get available journals'
      }
    });
  }
};

// Get search statistics
const getSearchStats = async (req, res) => {
  try {
    const totalPapers = await Paper.countDocuments({ isPublic: true });
    const totalKeywords = await Paper.aggregate([
      { $match: { isPublic: true } },
      { $unwind: '$keywords' },
      { $group: { _id: null, uniqueKeywords: { $addToSet: '$keywords' } } },
      { $project: { count: { $size: '$uniqueKeywords' } } }
    ]);

    const journalStats = await Paper.aggregate([
      { $match: { isPublic: true, journalName: { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: '$journalName',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        totalPapers,
        uniqueKeywords: totalKeywords[0]?.count || 0,
        topJournals: journalStats,
        searchIndexStatus: 'active'
      }
    });
  } catch (error) {
    logger.error('Search stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_FAILED',
        message: 'Failed to get search statistics'
      }
    });
  }
};

module.exports = {
  searchPapers,
  advancedSearch,
  getSearchSuggestions,
  getPopularKeywords,
  getAvailableAuthors,
  getAvailableJournals,
  getSearchStats
}; 