import { logger } from '../utils/logger.js';

// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
  // Don't log errors that have already been handled
  if (res.headersSent) {
    return next(err);
  }

  // Log error using Winston logger with structured logging
  const errorLog = {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id || 'anonymous',
    ip: req.ip,
    timestamp: new Date().toISOString(),
    errorCode: err.code,
    errorName: err.name
  };

  // Use appropriate logging level based on error severity
  if (err.statusCode && err.statusCode < 500) {
    // Client errors (4xx) - log as warn
    logger.warn('Client error', errorLog);
  } else {
    // Server errors (5xx) or unhandled errors - log as error
    logger.error('Server error', errorLog);
  }

  // Handle Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'Resource already exists',
      field: err.meta?.target?.[0] || 'unknown',
      code: 'DUPLICATE_RESOURCE',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Resource not found',
      code: 'RESOURCE_NOT_FOUND',
      timestamp: new Date().toISOString()
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError' || err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.details || err.message,
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED',
      timestamp: new Date().toISOString()
    });
  }

  // Handle Stripe errors
  if (err.type === 'StripeError' || err.type === 'StripeAPIError') {
    return res.status(400).json({
      success: false,
      error: 'Payment error',
      details: err.message,
      code: 'STRIPE_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  // Handle custom API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      details: err.details,
      code: err.code || 'API_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    success: false,
    error: isDevelopment ? message : 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { 
      stack: err.stack,
      details: err.details 
    })
  });
};

// Custom error class for API errors
export class ApiError extends Error {
  constructor(message, statusCode = 500, details = null, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation error class
export class ValidationError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
    this.statusCode = 400;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found error class
export class NotFoundError extends ApiError {
  constructor(resource = 'Resource', id = null) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 404, null, 'RESOURCE_NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

// Unauthorized error class
export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(message, 401, null, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

// Forbidden error class
export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(message, 403, null, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}
