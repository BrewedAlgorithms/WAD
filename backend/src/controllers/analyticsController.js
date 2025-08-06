const Paper = require('../models/Paper');
const User = require('../models/User');
const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

// Get upload statistics
const getUploadStats = async (req, res) => {
  try {
    const totalPapers = await Paper.countDocuments();
    const totalUsers = await User.countDocuments();
    
    // Papers uploaded this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const papersThisMonth = await Paper.countDocuments({
      uploadedAt: { $gte: startOfMonth }
    });

    // Top keywords
    const topKeywords = await Paper.aggregate([
      { $unwind: '$keywords' },
      {
        $group: {
          _id: '$keywords',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          keyword: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Top journals
    const topJournals = await Paper.aggregate([
      { $match: { journalName: { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: '$journalName',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          journal: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Upload trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const uploadTrend = await Paper.aggregate([
      { $match: { uploadedAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$uploadedAt' },
            month: { $month: '$uploadedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $toString: { $cond: [{ $lt: ['$_id.month', 10] }, { $concat: ['0', { $toString: '$_id.month' }] }, { $toString: '$_id.month' }] } }
            ]
          },
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalPapers,
        totalUsers,
        papersThisMonth,
        topKeywords,
        topJournals,
        uploadTrend
      }
    });
  } catch (error) {
    logger.error('Upload stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_FAILED',
        message: 'Failed to get upload statistics'
      }
    });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = userId || req.user._id;

    // Get user info
    const user = await User.findById(targetUserId).select('firstName lastName email');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Get user's papers
    const userPapers = await Paper.find({ uploadedBy: targetUserId });
    const totalUploads = userPapers.length;

    // Calculate total downloads
    const totalDownloads = userPapers.reduce((sum, paper) => sum + (paper.downloadCount || 0), 0);

    // Get favorite keywords
    const favoriteKeywords = await Paper.aggregate([
      { $match: { uploadedBy: targetUserId } },
      { $unwind: '$keywords' },
      {
        $group: {
          _id: '$keywords',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $project: {
          keyword: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Get upload trend (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const uploadTrend = await Paper.aggregate([
      { $match: { uploadedBy: targetUserId, uploadedAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$uploadedAt' },
            month: { $month: '$uploadedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $toString: { $cond: [{ $lt: ['$_id.month', 10] }, { $concat: ['0', { $toString: '$_id.month' }] }, { $toString: '$_id.month' }] } }
            ]
          },
          count: 1,
          _id: 0
        }
      }
    ]);

    // Get recent uploads
    const recentUploads = await Paper.find({ uploadedBy: targetUserId })
      .sort({ uploadedAt: -1 })
      .limit(5)
      .select('title uploadedAt downloadCount');

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        },
        stats: {
          totalUploads,
          totalDownloads,
          favoriteKeywords: favoriteKeywords.map(k => k.keyword),
          uploadTrend,
          recentUploads
        }
      }
    });
  } catch (error) {
    logger.error('User stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'USER_STATS_FAILED',
        message: 'Failed to get user statistics'
      }
    });
  }
};

// Get system health
const getSystemHealth = async (req, res) => {
  try {
    const microserviceClient = require('../services/microserviceClient');
    
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check microservice health
    const microserviceHealth = await microserviceClient.checkHealth();
    
    // Get basic stats
    const totalPapers = await Paper.countDocuments();
    const totalUsers = await User.countDocuments();
    
    // Check disk space (basic check)
    const fs = require('fs');
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    let diskSpace = 'unknown';
    try {
      const stats = fs.statSync(uploadDir);
      diskSpace = 'available';
    } catch (error) {
      diskSpace = 'unavailable';
    }

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: dbStatus,
          microservice: microserviceHealth ? 'healthy' : 'unhealthy',
          fileSystem: diskSpace
        },
        stats: {
          totalPapers,
          totalUsers
        },
        version: '1.0.0'
      }
    });
  } catch (error) {
    logger.error('System health error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Failed to check system health'
      }
    });
  }
};

// Get research insights
const getResearchInsights = async (req, res) => {
  try {
    const { timeframe = '6months' } = req.query;
    
    let startDate = new Date();
    if (timeframe === '1month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (timeframe === '3months') {
      startDate.setMonth(startDate.getMonth() - 3);
    } else if (timeframe === '6months') {
      startDate.setMonth(startDate.getMonth() - 6);
    } else if (timeframe === '1year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    // Get trending research areas
    const trendingAreas = await Paper.aggregate([
      { $match: { uploadedAt: { $gte: startDate } } },
      { $unwind: '$keywords' },
      {
        $group: {
          _id: '$keywords',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          area: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Get most active journals
    const activeJournals = await Paper.aggregate([
      { $match: { uploadedAt: { $gte: startDate }, journalName: { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: '$journalName',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          journal: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Get most downloaded papers
    const popularPapers = await Paper.find({ uploadedAt: { $gte: startDate } })
      .sort({ downloadCount: -1 })
      .limit(10)
      .select('title downloadCount uploadedAt uploadedBy')
      .populate('uploadedBy', 'firstName lastName');

    res.json({
      success: true,
      data: {
        timeframe,
        trendingAreas,
        activeJournals,
        popularPapers: popularPapers.map(paper => paper.getPublicData())
      }
    });
  } catch (error) {
    logger.error('Research insights error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INSIGHTS_FAILED',
        message: 'Failed to get research insights'
      }
    });
  }
};

module.exports = {
  getUploadStats,
  getUserStats,
  getSystemHealth,
  getResearchInsights
}; 