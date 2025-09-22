import rateLimit from 'express-rate-limit';
import { auditService } from '../services/auditService.js';
import { ValidationError } from './error.js';
import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

// Enhanced rate limiting for appointment booking endpoints
export const appointmentBookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Strict limit for booking attempts
  message: {
    error: 'Too many booking attempts. Please wait before trying again.',
    retryAfter: '15 minutes',
    code: 'BOOKING_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP + email combination for better tracking
    const email = req.body?.customerEmail || req.user?.email;
    return email ? `${req.ip}-${email}` : req.ip;
  },
  handler: (req, res) => {
    // Log rate limit violations for security monitoring
    auditService.logEvent({
      userId: req.user?.id || 'anonymous',
      userEmail: req.body?.customerEmail || req.user?.email,
      action: 'RATE_LIMIT_EXCEEDED',
      resource: 'appointment_booking',
      details: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        attempts: req.rateLimit.totalHits
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      errorMessage: 'Booking rate limit exceeded'
    });

    res.status(429).json({
      error: 'Too many booking attempts. Please wait before trying again.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
      code: 'BOOKING_RATE_LIMIT_EXCEEDED'
    });
  }
});

// Enhanced rate limiting for availability checks
export const availabilityCheckLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Reasonable limit for availability checks
  message: {
    error: 'Too many availability requests. Please slow down.',
    retryAfter: '1 minute',
    code: 'AVAILABILITY_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many availability requests. Please slow down.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
      code: 'AVAILABILITY_RATE_LIMIT_EXCEEDED'
    });
  }
});

// Enhanced rate limiting for admin configuration changes
export const adminConfigLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limited admin configuration changes
  message: {
    error: 'Too many configuration changes. Please wait before making more changes.',
    retryAfter: '5 minutes',
    code: 'ADMIN_CONFIG_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res) => {
    // Log admin rate limit violations
    auditService.logEvent({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'ADMIN_RATE_LIMIT_EXCEEDED',
      resource: 'admin_configuration',
      details: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        attempts: req.rateLimit.totalHits
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      errorMessage: 'Admin configuration rate limit exceeded'
    });

    res.status(429).json({
      error: 'Too many configuration changes. Please wait before making more changes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
      code: 'ADMIN_CONFIG_RATE_LIMIT_EXCEEDED'
    });
  }
});

// Enhanced input sanitization for appointment data
export const sanitizeAppointmentInput = (req, res, next) => {
  try {
    if (req.body) {
      // Sanitize string fields
      const stringFields = [
        'customerName', 'customerEmail', 'customerPhone', 
        'propertyAddress', 'notes', 'serviceType'
      ];

      stringFields.forEach(field => {
        if (req.body[field] && typeof req.body[field] === 'string') {
          // Remove HTML tags and dangerous characters
          req.body[field] = DOMPurify.sanitize(req.body[field], { 
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: []
          });
          
          // Trim whitespace
          req.body[field] = req.body[field].trim();
          
          // Additional validation for specific fields
          if (field === 'customerEmail') {
            req.body[field] = validator.normalizeEmail(req.body[field]) || req.body[field];
          }
          
          if (field === 'customerPhone') {
            // Remove non-numeric characters except + and spaces, but preserve basic formatting
            // Also remove text like "ext" and numbers after it
            req.body[field] = req.body[field].replace(/\s*(ext|extension)\s*\d+/i, '').replace(/[^\d\+\s\-\(\)]/g, '').trim();
          }
        }
      });

      // Validate and sanitize date fields
      if (req.body.scheduledDate) {
        const date = new Date(req.body.scheduledDate);
        if (isNaN(date.getTime())) {
          throw new ValidationError('Invalid scheduled date format');
        }
        req.body.scheduledDate = date.toISOString();
      }

      // Validate numeric fields
      if (req.body.duration !== undefined) {
        const duration = parseInt(req.body.duration);
        if (isNaN(duration) || duration < 15 || duration > 480) {
          throw new ValidationError('Duration must be between 15 minutes and 8 hours');
        }
        req.body.duration = duration;
      }
    }

    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = DOMPurify.sanitize(req.query[key], {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: []
          }).trim();
        }
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Audit logging middleware for admin configuration changes
export const auditAdminConfigChanges = (action, resource) => {
  return (req, res, next) => {
    // Store original data for comparison
    req.originalData = { ...req.body };
    
    // Override res.json to capture response and log audit event
    const originalJson = res.json;
    res.json = function(data) {
      // Log successful admin configuration changes
      if (res.statusCode >= 200 && res.statusCode < 300) {
        auditService.logEvent({
          userId: req.user?.id,
          userEmail: req.user?.email,
          action: action,
          resource: resource,
          resourceId: req.params?.id || 'N/A',
          details: {
            originalData: req.originalData,
            changes: req.body,
            responseData: data,
            method: req.method,
            endpoint: req.originalUrl
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          sessionId: req.sessionID,
          success: true
        });
      }
      
      return originalJson.call(this, data);
    };

    // Handle errors in error middleware
    req.auditConfig = { action, resource };
    next();
  };
};

// Security validation for appointment booking
export const validateAppointmentSecurity = (req, res, next) => {
  try {
    const { customerEmail, customerPhone, propertyAddress, scheduledDate } = req.body;

    // Enhanced email validation
    if (customerEmail && !validator.isEmail(customerEmail)) {
      throw new ValidationError('Invalid email format');
    }

    // Enhanced phone validation
    if (customerPhone && !validator.isMobilePhone(customerPhone, 'any', { strictMode: false })) {
      throw new ValidationError('Invalid phone number format');
    }

    // Address validation (basic length and content check)
    if (propertyAddress) {
      if (propertyAddress.length < 10 || propertyAddress.length > 500) {
        throw new ValidationError('Property address must be between 10 and 500 characters');
      }
      
      // Check for suspicious patterns
      const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /data:text\/html/i
      ];
      
      if (suspiciousPatterns.some(pattern => pattern.test(propertyAddress))) {
        throw new ValidationError('Property address contains invalid characters');
      }
    }

    // Date validation
    if (scheduledDate) {
      const appointmentDate = new Date(scheduledDate);
      const now = new Date();
      const maxFutureDate = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year

      if (appointmentDate <= now) {
        throw new ValidationError('Appointment must be scheduled for a future date');
      }

      if (appointmentDate > maxFutureDate) {
        throw new ValidationError('Appointment cannot be scheduled more than 1 year in advance');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// IP-based security checks
export const checkSuspiciousActivity = (req, res, next) => {
  const ip = req.ip;
  const userAgent = req.get('User-Agent');
  
  // Check for suspicious user agents
  const suspiciousUserAgents = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i
  ];

  // Allow legitimate bots but log them
  if (suspiciousUserAgents.some(pattern => pattern.test(userAgent))) {
    auditService.logEvent({
      userId: 'system',
      action: 'SUSPICIOUS_USER_AGENT_DETECTED',
      resource: 'appointment_booking',
      details: {
        ip: ip,
        userAgent: userAgent,
        endpoint: req.path,
        method: req.method
      },
      ipAddress: ip,
      userAgent: userAgent,
      success: true
    });
  }

  // Check for missing or suspicious headers
  if (!userAgent || userAgent.length < 10) {
    auditService.logEvent({
      userId: 'system',
      action: 'SUSPICIOUS_REQUEST_HEADERS',
      resource: 'appointment_booking',
      details: {
        ip: ip,
        userAgent: userAgent || 'MISSING',
        endpoint: req.path,
        headers: req.headers
      },
      ipAddress: ip,
      userAgent: userAgent,
      success: true
    });
  }

  next();
};

// Middleware to log failed authentication attempts
export const logFailedAuth = (req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    // Log failed authentication attempts
    if (res.statusCode === 401 || res.statusCode === 403) {
      auditService.logEvent({
        userId: req.body?.email || 'unknown',
        userEmail: req.body?.email,
        action: 'AUTHENTICATION_FAILED',
        resource: 'appointment_system',
        details: {
          endpoint: req.path,
          method: req.method,
          statusCode: res.statusCode,
          errorData: data
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: data?.error || 'Authentication failed'
      });
    }
    
    return originalJson.call(this, data);
  };

  next();
};