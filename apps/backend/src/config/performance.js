import NodeCache from 'node-cache';
import { performance } from 'perf_hooks';

// Cache configuration
const cache = new NodeCache({
  stdTTL: 600, // 10 minutes default TTL
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false // Better performance, but be careful with object mutations
});

// Performance monitoring
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.slowQueryThreshold = 1000; // 1 second
    this.cacheHitRate = { hits: 0, misses: 0 };
  }

  startTimer(operation) {
    return performance.now();
  }

  endTimer(operation, startTime, metadata = {}) {
    const duration = performance.now() - startTime;
    
    // Log slow operations
    if (duration > this.slowQueryThreshold) {
      console.warn(`🐌 Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`, metadata);
    }

    // Store metrics
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        maxTime: 0,
        minTime: Infinity
      });
    }

    const metric = this.metrics.get(operation);
    metric.count++;
    metric.totalTime += duration;
    metric.avgTime = metric.totalTime / metric.count;
    metric.maxTime = Math.max(metric.maxTime, duration);
    metric.minTime = Math.min(metric.minTime, duration);

    return duration;
  }

  getMetrics() {
    const metrics = {};
    for (const [operation, data] of this.metrics) {
      metrics[operation] = {
        ...data,
        avgTime: parseFloat(data.avgTime.toFixed(2)),
        maxTime: parseFloat(data.maxTime.toFixed(2)),
        minTime: parseFloat(data.minTime.toFixed(2))
      };
    }

    return {
      operations: metrics,
      cache: {
        hitRate: this.cacheHitRate.hits / (this.cacheHitRate.hits + this.cacheHitRate.misses) || 0,
        hits: this.cacheHitRate.hits,
        misses: this.cacheHitRate.misses,
        keys: cache.keys().length
      }
    };
  }

  recordCacheHit() {
    this.cacheHitRate.hits++;
  }

  recordCacheMiss() {
    this.cacheHitRate.misses++;
  }
}

const monitor = new PerformanceMonitor();

// Cache utilities
export const cacheUtils = {
  // Get from cache with performance monitoring
  get(key) {
    const startTime = monitor.startTimer('cache_get');
    const value = cache.get(key);
    monitor.endTimer('cache_get', startTime, { key, hit: !!value });
    
    if (value) {
      monitor.recordCacheHit();
    } else {
      monitor.recordCacheMiss();
    }
    
    return value;
  },

  // Set cache with TTL
  set(key, value, ttl = 600) {
    const startTime = monitor.startTimer('cache_set');
    const result = cache.set(key, value, ttl);
    monitor.endTimer('cache_set', startTime, { key, ttl });
    return result;
  },

  // Delete from cache
  del(key) {
    return cache.del(key);
  },

  // Clear cache by pattern
  clearPattern(pattern) {
    const keys = cache.keys();
    const regex = new RegExp(pattern);
    const keysToDelete = keys.filter(key => regex.test(key));
    keysToDelete.forEach(key => cache.del(key));
    return keysToDelete.length;
  },

  // Get cache statistics
  getStats() {
    return cache.getStats();
  }
};

// Database query optimization utilities
export const dbUtils = {
  // Cached database query wrapper
  async cachedQuery(key, queryFn, ttl = 600) {
    const startTime = monitor.startTimer('db_cached_query');
    
    // Try cache first
    let result = cacheUtils.get(key);
    if (result) {
      monitor.endTimer('db_cached_query', startTime, { key, cached: true });
      return result;
    }

    // Execute query if not cached
    const queryStartTime = monitor.startTimer('db_query');
    try {
      result = await queryFn();
      monitor.endTimer('db_query', queryStartTime, { key });
      
      // Cache the result
      cacheUtils.set(key, result, ttl);
      
      monitor.endTimer('db_cached_query', startTime, { key, cached: false });
      return result;
    } catch (error) {
      monitor.endTimer('db_query', queryStartTime, { key, error: error.message });
      monitor.endTimer('db_cached_query', startTime, { key, error: error.message });
      throw error;
    }
  },

  // Batch query optimization
  async batchQuery(queries) {
    const startTime = monitor.startTimer('db_batch_query');
    
    try {
      const results = await Promise.all(queries);
      monitor.endTimer('db_batch_query', startTime, { count: queries.length });
      return results;
    } catch (error) {
      monitor.endTimer('db_batch_query', startTime, { count: queries.length, error: error.message });
      throw error;
    }
  }
};

// Subscription-specific cache keys
export const cacheKeys = {
  subscription: (userId) => `subscription:${userId}`,
  subscriptionAnalytics: (userId) => `subscription_analytics:${userId}`,
  paymentFrequencyOptions: (tier) => `payment_frequency_options:${tier}`,
  rewardCredits: (userId) => `reward_credits:${userId}`,
  additionalProperties: (subscriptionId) => `additional_properties:${subscriptionId}`,
  churnRisk: (userId) => `churn_risk:${userId}`,
  analyticsMetrics: (type, period) => `analytics:${type}:${period}`,
  userNotificationPreferences: (userId) => `notification_prefs:${userId}`
};

// Performance middleware
export const performanceMiddleware = (req, res, next) => {
  const startTime = monitor.startTimer(`${req.method}_${req.path}`);
  
  // Override res.json to measure response time
  const originalJson = res.json;
  res.json = function(data) {
    const duration = monitor.endTimer(`${req.method}_${req.path}`, startTime, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode
    });
    
    // Add performance headers
    res.set('X-Response-Time', `${duration.toFixed(2)}ms`);
    
    return originalJson.call(this, data);
  };

  next();
};

// Memory usage monitoring
export const memoryMonitor = {
  getUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024) // MB
    };
  },

  startMonitoring(intervalMs = 30000) {
    setInterval(() => {
      const usage = this.getUsage();
      if (usage.heapUsed > 500) { // Alert if heap usage > 500MB
        console.warn('🚨 High memory usage detected:', usage);
      }
    }, intervalMs);
  }
};

export { monitor };
export default {
  cache: cacheUtils,
  db: dbUtils,
  monitor,
  cacheKeys,
  performanceMiddleware,
  memoryMonitor
};