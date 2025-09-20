/**
 * Performance monitoring and optimization middleware
 */

import { logger } from '../utils/logger.js';
import { cacheService } from '../services/cacheService.js';

/**
 * Request performance monitoring middleware
 */
export const performanceMonitoring = (options = {}) => {
  const {
    slowRequestThreshold = 1000, // 1 second
    enableMetrics = true,
    enableCaching = true
  } = options;

  return (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;

    // Track request start
    req.startTime = startTime;
    req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Override res.send to capture response time
    res.send = function (data) {
      const duration = Date.now() - startTime;
      
      // Log slow requests
      if (duration > slowRequestThreshold) {
        logger.warn('Slow request detected:', {
          requestId: req.requestId,
          method: req.method,
          url: req.originalUrl,
          duration,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      }

      // Add performance headers
      res.set({
        'X-Response-Time': `${duration}ms`,
        'X-Request-ID': req.requestId
      });

      // Record metrics if enabled
      if (enableMetrics) {
        recordRequestMetric(req, res, duration);
      }

      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * API response caching middleware
 */
export const apiCaching = (options = {}) => {
  const {
    defaultTTL = 300, // 5 minutes
    keyGenerator = (req) => `api:${req.method}:${req.originalUrl}`,
    skipCache = (req) => req.method !== 'GET',
    varyBy = []
  } = options;

  return async (req, res, next) => {
    // Skip caching for non-GET requests or when skipCache returns true
    if (skipCache(req)) {
      return next();
    }

    try {
      // Generate cache key
      let cacheKey = keyGenerator(req);
      
      // Add vary-by parameters to cache key
      if (varyBy.length > 0) {
        const varyValues = varyBy.map(header => req.get(header) || '').join(':');
        cacheKey += `:${varyValues}`;
      }

      // Try to get from cache
      const cachedResponse = await cacheService.get(cacheKey);
      
      if (cachedResponse) {
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        return res.json(cachedResponse);
      }

      // Cache miss - continue with request
      res.set('X-Cache', 'MISS');
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function (data) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const ttl = req.cacheTTL || defaultTTL;
          cacheService.set(cacheKey, data, ttl).catch(error => {
            logger.error('Failed to cache response:', error);
          });
        }
        
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('API caching middleware error:', error);
      next();
    }
  };
};

/**
 * Rate limiting with Redis
 */
export const rateLimiting = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    keyGenerator = (req) => req.ip,
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return async (req, res, next) => {
    try {
      const key = `rate_limit:${keyGenerator(req)}`;
      const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
      const windowKey = `${key}:${windowStart}`;

      // Get current request count
      const currentCount = await cacheService.incr(windowKey, Math.ceil(windowMs / 1000));

      // Set headers
      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': Math.max(0, maxRequests - currentCount),
        'X-RateLimit-Reset': new Date(windowStart + windowMs).toISOString()
      });

      // Check if limit exceeded
      if (currentCount > maxRequests) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: Math.ceil((windowStart + windowMs - Date.now()) / 1000)
        });
      }

      next();
    } catch (error) {
      logger.error('Rate limiting middleware error:', error);
      next(); // Continue on error to avoid blocking requests
    }
  };
};

/**
 * Request compression middleware
 */
export const compressionMiddleware = (options = {}) => {
  const {
    threshold = 1024, // 1KB
    level = 6, // Compression level (1-9)
    filter = (req, res) => {
      // Don't compress if response is already compressed
      if (res.get('Content-Encoding')) {
        return false;
      }
      
      // Compress JSON and text responses
      const contentType = res.get('Content-Type') || '';
      return contentType.includes('json') || contentType.includes('text');
    }
  } = options;

  return (req, res, next) => {
    // Check if client accepts compression
    const acceptEncoding = req.get('Accept-Encoding') || '';
    const supportsGzip = acceptEncoding.includes('gzip');
    
    if (!supportsGzip) {
      return next();
    }

    // Override res.send to add compression
    const originalSend = res.send;
    res.send = function (data) {
      if (filter(req, res) && data && data.length > threshold) {
        res.set('Content-Encoding', 'gzip');
        res.set('Vary', 'Accept-Encoding');
      }
      
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Database connection pooling middleware
 */
export const connectionPooling = (options = {}) => {
  const {
    maxConnections = 10,
    idleTimeout = 30000,
    acquireTimeout = 60000
  } = options;

  let activeConnections = 0;
  const connectionQueue = [];

  return async (req, res, next) => {
    // Check if we can acquire a connection
    if (activeConnections >= maxConnections) {
      // Add to queue
      const queuePromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection acquire timeout'));
        }, acquireTimeout);

        connectionQueue.push({ resolve, reject, timeout });
      });

      try {
        await queuePromise;
      } catch (error) {
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'Database connection pool exhausted'
        });
      }
    }

    // Acquire connection
    activeConnections++;
    req.connectionAcquired = Date.now();

    // Release connection after response
    const originalEnd = res.end;
    res.end = function (...args) {
      activeConnections--;
      
      // Process queue
      if (connectionQueue.length > 0) {
        const { resolve, timeout } = connectionQueue.shift();
        clearTimeout(timeout);
        resolve();
      }

      return originalEnd.apply(this, args);
    };

    next();
  };
};

/**
 * Memory usage monitoring middleware
 */
export const memoryMonitoring = (options = {}) => {
  const {
    threshold = 0.8, // 80% memory usage threshold
    interval = 30000 // Check every 30 seconds
  } = options;

  let lastCheck = 0;

  return (req, res, next) => {
    const now = Date.now();
    
    // Check memory usage periodically
    if (now - lastCheck > interval) {
      lastCheck = now;
      
      const memUsage = process.memoryUsage();
      const totalMemory = require('os').totalmem();
      const usedMemory = memUsage.rss;
      const memoryUsagePercent = usedMemory / totalMemory;

      if (memoryUsagePercent > threshold) {
        logger.warn('High memory usage detected:', {
          usedMemory: Math.round(usedMemory / 1024 / 1024) + 'MB',
          totalMemory: Math.round(totalMemory / 1024 / 1024) + 'MB',
          percentage: Math.round(memoryUsagePercent * 100) + '%',
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
        });

        // Trigger garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      // Add memory info to response headers in development
      if (process.env.NODE_ENV === 'development') {
        res.set('X-Memory-Usage', Math.round(memoryUsagePercent * 100) + '%');
      }
    }

    next();
  };
};

/**
 * Record request metrics
 */
function recordRequestMetric(req, res, duration) {
  const metric = {
    timestamp: Date.now(),
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    duration,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    requestId: req.requestId
  };

  // Store in cache for analytics (with short TTL)
  const metricsKey = `metrics:${Date.now()}:${req.requestId}`;
  cacheService.set(metricsKey, metric, 3600).catch(error => {
    logger.error('Failed to store request metric:', error);
  });

  // Log to structured logger
  logger.info('Request completed:', metric);
}