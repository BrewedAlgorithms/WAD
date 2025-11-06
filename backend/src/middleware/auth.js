const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logger } = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    logger.info(`Authentication attempt for request: ${req.method} ${req.originalUrl}`);
    
    if (!token) {
      logger.warn('Authentication failed: No token provided.');
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_MISSING',
          message: 'Access token is required'
        }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger.info(`Token decoded successfully for user ID: ${decoded.userId}`);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      logger.warn(`Authentication failed: User not found or inactive for ID: ${decoded.userId}`);
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found or inactive'
        }
      });
    }

    req.user = user;
    logger.info(`User authenticated successfully: ${user.email}`);
    next();
  } catch (error) {
    logger.error('Authentication error:', { error, request: { method: req.method, url: req.originalUrl } });
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid access token'
        }
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired'
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed'
      }
    });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      logger.info(`Admin authentication check for user: ${req.user.email}`);
      if (req.user.role !== 'admin') {
        logger.warn(`Admin access denied for user: ${req.user.email}`);
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Admin access required'
          }
        });
      }
      logger.info(`Admin access granted for user: ${req.user.email}`);
      next();
    });
  } catch (error) {
    next(error);
  }
};

// Optional auth: attaches req.user if token present, otherwise continues
const optionalAuth = async (req, _res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      logger.info('No token provided for optional auth, continuing as guest.');
      return next();
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (user && user.isActive) {
      req.user = user;
      logger.info(`Optional auth successful, user attached: ${user.email}`);
    } else {
      logger.warn(`Optional auth: User found but inactive or missing for ID: ${decoded.userId}`);
    }
  } catch (error) {
    logger.warn('Optional auth failed, continuing as guest', { error: { name: error.name, message: error.message } });
  } finally {
    next();
  }
};

module.exports = { auth, adminAuth, optionalAuth };