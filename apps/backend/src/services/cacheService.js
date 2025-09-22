/**
 * Redis caching service for performance optimization
 */

import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

class CacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.defaultTTL = 300; // 5 minutes default TTL
    // Fallback in-memory cache when Redis is not available
    this.memoryCache = new Map();
    this.init();
  }

  async init() {
    // Skip Redis initialization if DISABLE_REDIS is set or in production without Redis URL
    if (process.env.DISABLE_REDIS === 'true' || 
        (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL)) {
      logger.info('Redis cache disabled - running without cache');
      this.isConnected = false;
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.redis = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis cache connected successfully');
      });

      this.redis.on('error', (error) => {
        this.isConnected = false;
        logger.error('Redis cache connection error:', error);
      });

      this.redis.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis cache connection closed');
      });

      await this.redis.connect();
    } catch (error) {
      logger.error('Failed to initialize Redis cache:', error);
      this.isConnected = false;
    }
  }

  /**
   * Get value from cache
   */
  async get(key) {
    if (!this.isConnected) {
      // Use in-memory cache as fallback
      const cacheEntry = this.memoryCache.get(this.formatKey(key));
      if (cacheEntry && cacheEntry.expires > Date.now()) {
        return cacheEntry.value;
      }
      if (cacheEntry) {
        this.memoryCache.delete(this.formatKey(key));
      }
      return null;
    }

    try {
      const value = await this.redis.get(this.formatKey(key));
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isConnected) {
      // Use in-memory cache as fallback
      const expires = Date.now() + (ttl * 1000);
      this.memoryCache.set(this.formatKey(key), { value, expires });
      // Clean up expired entries periodically
      this.cleanupMemoryCache();
      return true;
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.setex(this.formatKey(key), ttl, serializedValue);
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.redis.del(this.formatKey(key));
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const keys = await this.redis.keys(this.formatKey(pattern));
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache pattern delete error:', error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.redis.exists(this.formatKey(key));
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Increment counter in cache
   */
  async incr(key, ttl = this.defaultTTL) {
    if (!this.isConnected) {
      return 0;
    }

    try {
      const formattedKey = this.formatKey(key);
      const value = await this.redis.incr(formattedKey);
      
      // Set TTL only if this is the first increment
      if (value === 1) {
        await this.redis.expire(formattedKey, ttl);
      }
      
      return value;
    } catch (error) {
      logger.error('Cache increment error:', error);
      return 0;
    }
  }

  /**
   * Get multiple values from cache
   */
  async mget(keys) {
    if (!this.isConnected || !keys.length) {
      return {};
    }

    try {
      const formattedKeys = keys.map(key => this.formatKey(key));
      const values = await this.redis.mget(...formattedKeys);
      
      const result = {};
      keys.forEach((key, index) => {
        result[key] = values[index] ? JSON.parse(values[index]) : null;
      });
      
      return result;
    } catch (error) {
      logger.error('Cache mget error:', error);
      return {};
    }
  }

  /**
   * Set multiple values in cache
   */
  async mset(keyValuePairs, ttl = this.defaultTTL) {
    if (!this.isConnected || !keyValuePairs.length) {
      return false;
    }

    try {
      const pipeline = this.redis.pipeline();
      
      keyValuePairs.forEach(({ key, value }) => {
        const formattedKey = this.formatKey(key);
        const serializedValue = JSON.stringify(value);
        pipeline.setex(formattedKey, ttl, serializedValue);
      });
      
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Cache mset error:', error);
      return false;
    }
  }

  /**
   * Cache with automatic refresh
   */
  async getOrSet(key, fetchFunction, ttl = this.defaultTTL) {
    try {
      // Try to get from cache first
      let value = await this.get(key);
      
      if (value !== null) {
        return value;
      }

      // If not in cache, fetch the data
      value = await fetchFunction();
      
      // Store in cache for next time
      await this.set(key, value, ttl);
      
      return value;
    } catch (error) {
      logger.error('Cache getOrSet error:', error);
      // If cache fails, still try to fetch the data
      return await fetchFunction();
    }
  }

  /**
   * Invalidate cache patterns for specific entities
   */
  async invalidateEntity(entityType, entityId = '*') {
    const patterns = [
      `${entityType}:${entityId}`,
      `${entityType}:list:*`,
      `${entityType}:count:*`,
      `dashboard:*`,
      `analytics:*`
    ];

    for (const pattern of patterns) {
      await this.delPattern(pattern);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!this.isConnected) {
      return { connected: false };
    }

    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      
      return {
        connected: true,
        memory: this.parseRedisInfo(info),
        keyspace: this.parseRedisInfo(keyspace)
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return { connected: false, error: error.message };
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  async flush() {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.redis.flushdb();
      logger.info('Cache flushed successfully');
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Format cache key with prefix
   */
  formatKey(key) {
    const prefix = process.env.CACHE_PREFIX || 'fixwell';
    return `${prefix}:${key}`;
  }

  /**
   * Parse Redis info string into object
   */
  parseRedisInfo(infoString) {
    const info = {};
    infoString.split('\r\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          info[key] = isNaN(value) ? value : Number(value);
        }
      }
    });
    return info;
  }

  /**
   * Clean up expired entries from memory cache
   */
  cleanupMemoryCache() {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expires <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
      logger.info('Redis cache connection closed');
    }
    // Clear memory cache
    this.memoryCache.clear();
  }
}

// Create singleton instance
const cacheService = new CacheService();

export { cacheService };

// Cache key generators for different entities
export const cacheKeys = {
  user: (id) => `user:${id}`,
  userList: (filters) => `user:list:${JSON.stringify(filters)}`,
  userCount: (filters) => `user:count:${JSON.stringify(filters)}`,
  
  subscription: (id) => `subscription:${id}`,
  subscriptionList: (filters) => `subscription:list:${JSON.stringify(filters)}`,
  subscriptionAnalytics: () => 'subscription:analytics',
  
  dashboard: (type) => `dashboard:${type}`,
  dashboardMetrics: () => 'dashboard:metrics',
  
  audit: (filters) => `audit:${JSON.stringify(filters)}`,
  
  monitoring: (type) => `monitoring:${type}`,
  
  communication: (type, id) => `communication:${type}:${id}`,
  
  report: (type, params) => `report:${type}:${JSON.stringify(params)}`
};