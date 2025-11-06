const Paper = require('../models/Paper');
const SearchQuery = require('../models/SearchQuery');
const { logger } = require('../utils/logger');

// Basic search
const searchPapers = async (req, res) => {
  logger.info('Basic search request received', { query: req.query });
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
    logger.info('Building basic search query', { query: q, filters: req.query });
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
    logger.info('Executing basic search');
    const papers = await Paper.searchPapers(q, searchOptions);
    const totalItems = papers.length;
    logger.info(`Basic search found ${totalItems} total items`);

    // Apply pagination
    const paginatedPapers = papers.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(totalItems / limitNum);

    const searchTime = Date.now() - startTime;
    logger.info(`Basic search took ${searchTime}ms`);

    // Record search query to history (if query provided)
    try {
      if (q && q.trim()) {
        logger.info(`Recording search history for query: "${q}"`);
        await SearchQuery.record(req.user?._id, q);
      }
    } catch (historyErr) {
      logger.warn('Failed to record search history', historyErr);
    }

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
    logger.error('Search error:', { error, query: req.query });
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
  logger.info('Advanced search request received', { body: req.body });
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
    logger.info('Building advanced search query', { query, filters, sortBy });
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
    logger.info('Executing advanced search');
    const papers = await Paper.searchPapers(query, searchOptions);
    const totalItems = papers.length;
    logger.info(`Advanced search found ${totalItems} total items`);

    // Apply pagination
    const paginatedPapers = papers.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(totalItems / limitNum);

    const searchTime = Date.now() - startTime;
    logger.info(`Advanced search took ${searchTime}ms`);

    // Record search query to history (if query provided)
    try {
      if (query && query.trim()) {
        logger.info(`Recording advanced search history for query: "${query}"`);
        await SearchQuery.record(req.user?._id, query);
      }
    } catch (historyErr) {
      logger.warn('Failed to record advanced search history', historyErr);
    }

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
    logger.error('Advanced search error:', { error, body: req.body });
    res.status(500).json({
      success: false,
      error: {
        code: 'ADVANCED_SEARCH_FAILED',
        message: 'Failed to perform advanced search'
      }
    });
  }
};

// Get search suggestions (autocomplete with history + community)
const getSearchSuggestions = async (req, res) => {
  logger.info(`Get search suggestions request for query: "${req.query.q}"`);
  try {
    const { q = '' } = req.query;

    if (!q || q.length < 2) {
      logger.info('Query too short for suggestions, returning empty array.');
      return res.json({
        success: true,
        data: {
          suggestions: []
        }
      });
    }

    const searchText = q.trim().toLowerCase();
    logger.info(`Searching for suggestions with normalized text: "${searchText}"`);

    // 1) Personal history suggestions (prefix match), most recent first
    const userId = req.user?._id || null;
    logger.info(`Fetching personal history suggestions for user: ${userId}`);
    const personalHistory = await SearchQuery.find({
      userId,
      normalized: { $regex: `^${searchText}` },
    })
      .sort({ lastUsedAt: -1 })
      .limit(5)
      .select('query');
    logger.info(`Found ${personalHistory.length} personal history suggestions.`);

    // 2) Community suggestions from Paper titles/keywords
    logger.info('Fetching community suggestions from paper titles and keywords.');
    const titleSuggestions = await Paper.distinct('title', {
      title: { $regex: searchText, $options: 'i' },
      isPublic: true,
    });

    const keywordSuggestions = await Paper.distinct('keywords', {
      keywords: { $regex: searchText, $options: 'i' },
      isPublic: true,
    });
    logger.info(`Found ${titleSuggestions.length} title suggestions and ${keywordSuggestions.length} keyword suggestions.`);

    // 3) Global popular queries (other users), prefix match, sorted by frequency
    logger.info('Fetching global popular queries.');
    const globalHistory = await SearchQuery.find({
      userId: null,
      normalized: { $regex: `^${searchText}` },
    })
      .sort({ count: -1, lastUsedAt: -1 })
      .limit(10)
      .select('query');
    logger.info(`Found ${globalHistory.length} global history suggestions.`);

    // Combine with simple scoring: prefer personal history, then global, then paper-derived
    const combined = [
      ...personalHistory.map((d) => ({ type: 'history', value: d.query })),
      ...globalHistory.map((d) => ({ type: 'popular', value: d.query })),
      ...titleSuggestions.map((t) => ({ type: 'title', value: t })),
      ...keywordSuggestions.map((k) => ({ type: 'keyword', value: k })),
    ];

    const seen = new Set();
    const unique = [];
    for (const item of combined) {
      const key = item.value.toLowerCase();
      if (!key.includes(searchText)) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(item);
      if (unique.length >= 10) break;
    }
    logger.info(`Returning ${unique.length} unique suggestions.`);

    res.json({
      success: true,
      data: {
        suggestions: unique,
      },
    });
  } catch (error) {
    logger.error('Search suggestions error:', { error, query: req.query.q });
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
  logger.info('Get popular keywords request', { query: req.query });
  try {
    const { limit = 20 } = req.query;

    // Aggregate to get keyword frequency
    logger.info(`Aggregating popular keywords with a limit of ${limit}`);
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

    logger.info(`Found ${keywordStats.length} popular keywords.`);
    res.json({
      success: true,
      data: {
        keywords: keywordStats
      }
    });
  } catch (error) {
    logger.error('Popular keywords error:', { error, query: req.query });
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
  logger.info('Get available authors request', { query: req.query });
  try {
    const { limit = 50 } = req.query;

    logger.info(`Aggregating available authors with a limit of ${limit}`);
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

    logger.info(`Found ${authors.length} available authors.`);
    res.json({
      success: true,
      data: {
        authors: authors.map(item => item.author)
      }
    });
  } catch (error) {
    logger.error('Available authors error:', { error, query: req.query });
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
  logger.info('Get available journals request', { query: req.query });
  try {
    const { limit = 50 } = req.query;

    logger.info(`Aggregating available journals with a limit of ${limit}`);
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

    logger.info(`Found ${journals.length} available journals.`);
    res.json({
      success: true,
      data: {
        journals: journals.map(item => item.journal)
      }
    });
  } catch (error) {
    logger.error('Available journals error:', { error, query: req.query });
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
  logger.info('Get search stats request');
  try {
    const totalPapers = await Paper.countDocuments({ isPublic: true });
    logger.info(`Total public papers: ${totalPapers}`);
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
    logger.info(`Aggregated stats for ${totalKeywords[0]?.count || 0} unique keywords and top ${journalStats.length} journals.`);

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