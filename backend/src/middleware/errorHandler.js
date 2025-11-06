const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('An unhandled error occurred:', {
    error: {
      message: err.message,
      name: err.name,
      ...err,
    },
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // MongoDB validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => error.message);
    logger.warn('Validation error:', { details: errors });
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors
      }
    });
  }

  // MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    logger.warn('Duplicate key error:', { field });
    return res.status(400).json({
      success: false,
      error: {
        code: 'DUPLICATE_ERROR',
        message: `${field} already exists`
      }
    });
  }

  // MongoDB cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    logger.warn('Cast error (invalid ID format):', { path: err.path, value: err.value });
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid ID format'
      }
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    logger.warn('Invalid JWT token error.');
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token'
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    logger.warn('Expired JWT token error.');
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired'
      }
    });
  }

  // File system errors
  if (err.code === 'ENOENT') {
    logger.warn('File not found error (ENOENT).');
    return res.status(404).json({
      success: false,
      error: {
        code: 'FILE_NOT_FOUND',
        message: 'File not found'
      }
    });
  }

  // Network errors (for microservices communication)
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    logger.error('Service unavailable error (ECONNREFUSED/ENOTFOUND).');
    return res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'External service is unavailable'
      }
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  logger.error(`Sending default error response with status code: ${statusCode}`);

  res.status(statusCode).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : message
    }
  });
};

module.exports = errorHandler; 