/**
 * Database query optimization utilities
 */

import { logger } from './logger.js';
import { cacheService, cacheKeys } from '../services/cacheService.js';

class QueryOptimizer {
  constructor() {
    this.queryCache = new Map();
    this.performanceMetrics = new Map();
  }

  /**
   * Optimize Prisma queries with caching and performance monitoring
   */
  async optimizedQuery(cacheKey, queryFn, options = {}) {
    const {
      ttl = 300, // 5 minutes default
      skipCache = false,
      trackPerformance = true
    } = options;

    const startTime = Date.now();
    let fromCache = false;

    try {
      // Try cache first if not skipped
      if (!skipCache) {
        const cachedResult = await cacheService.get(cacheKey);
        if (cachedResult !== null) {
          fromCache = true;
          if (trackPerformance) {
            this.recordMetric(cacheKey, Date.now() - startTime, true);
          }
          return cachedResult;
        }
      }

      // Execute the query
      const result = await queryFn();

      // Cache the result
      if (!skipCache && result !== null) {
        await cacheService.set(cacheKey, result, ttl);
      }

      if (trackPerformance) {
        this.recordMetric(cacheKey, Date.now() - startTime, false);
      }

      return result;
    } catch (error) {
      logger.error('Optimized query failed:', {
        cacheKey,
        error: error.message,
        duration: Date.now() - startTime,
        fromCache
      });
      throw error;
    }
  }

  /**
   * Batch multiple queries for better performance
   */
  async batchQueries(queries) {
    const startTime = Date.now();
    const results = {};
    const cacheHits = {};
    const cacheMisses = [];

    try {
      // Check cache for all queries first
      const cacheKeys = queries.map(q => q.cacheKey);
      const cachedResults = await cacheService.mget(cacheKeys);

      // Separate cache hits and misses
      queries.forEach((query, index) => {
        if (cachedResults[query.cacheKey] !== null) {
          cacheHits[query.key] = cachedResults[query.cacheKey];
        } else {
          cacheMisses.push(query);
        }
      });

      // Execute queries that weren't cached
      const missResults = await Promise.all(
        cacheMisses.map(async (query) => {
          try {
            const result = await query.queryFn();
            return { key: query.key, cacheKey: query.cacheKey, result, ttl: query.ttl || 300 };
          } catch (error) {
            logger.error(`Batch query failed for ${query.key}:`, error);
            return { key: query.key, result: null, error };
          }
        })
      );

      // Cache the results from missed queries
      const cacheOperations = [];
      missResults.forEach(({ key, cacheKey, result, ttl, error }) => {
        if (!error && result !== null) {
          results[key] = result;
          cacheOperations.push({ key: cacheKey, value: result });
        } else if (error) {
          results[key] = { error: error.message };
        }
      });

      // Batch cache the new results
      if (cacheOperations.length > 0) {
        await cacheService.mset(cacheOperations);
      }

      // Combine cache hits with fresh results
      Object.assign(results, cacheHits);

      logger.info('Batch query completed:', {
        totalQueries: queries.length,
        cacheHits: Object.keys(cacheHits).length,
        cacheMisses: cacheMisses.length,
        duration: Date.now() - startTime
      });

      return results;
    } catch (error) {
      logger.error('Batch query failed:', error);
      throw error;
    }
  }

  /**
   * Paginated query with optimization
   */
  async paginatedQuery(baseQuery, options = {}) {
    const {
      page = 1,
      limit = 20,
      cachePrefix,
      ttl = 300,
      countQuery
    } = options;

    const offset = (page - 1) * limit;
    const cacheKey = cachePrefix ? `${cachePrefix}:page:${page}:limit:${limit}` : null;
    const countCacheKey = cachePrefix ? `${cachePrefix}:count` : null;

    try {
      // Get total count (cached)
      let totalCount = 0;
      if (countQuery && countCacheKey) {
        totalCount = await this.optimizedQuery(
          countCacheKey,
          countQuery,
          { ttl: ttl * 2 } // Cache count longer
        );
      }

      // Get paginated data
      const data = await this.optimizedQuery(
        cacheKey,
        () => baseQuery.skip(offset).take(limit),
        { ttl }
      );

      const totalPages = Math.ceil(totalCount / limit);

      return {
        data,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Paginated query failed:', error);
      throw error;
    }
  }

  /**
   * Search query with optimization
   */
  async searchQuery(searchFn, searchTerm, options = {}) {
    const {
      cachePrefix = 'search',
      ttl = 180, // Shorter TTL for search results
      minLength = 2
    } = options;

    if (!searchTerm || searchTerm.length < minLength) {
      return [];
    }

    const cacheKey = `${cachePrefix}:${searchTerm.toLowerCase()}`;

    return await this.optimizedQuery(
      cacheKey,
      () => searchFn(searchTerm),
      { ttl }
    );
  }

  /**
   * Aggregate query with caching
   */
  async aggregateQuery(aggregateFn, groupBy, options = {}) {
    const {
      cachePrefix = 'aggregate',
      ttl = 600, // Longer TTL for aggregates
      dateRange
    } = options;

    const cacheKey = `${cachePrefix}:${groupBy}:${dateRange || 'all'}`;

    return await this.optimizedQuery(
      cacheKey,
      aggregateFn,
      { ttl }
    );
  }

  /**
   * Record performance metrics
   */
  recordMetric(queryKey, duration, fromCache) {
    const metric = this.performanceMetrics.get(queryKey) || {
      totalQueries: 0,
      totalDuration: 0,
      cacheHits: 0,
      averageDuration: 0
    };

    metric.totalQueries++;
    metric.totalDuration += duration;
    if (fromCache) metric.cacheHits++;
    metric.averageDuration = metric.totalDuration / metric.totalQueries;
    metric.cacheHitRate = (metric.cacheHits / metric.totalQueries) * 100;

    this.performanceMetrics.set(queryKey, metric);

    // Log slow queries
    if (duration > 1000 && !fromCache) {
      logger.warn('Slow query detected:', {
        queryKey,
        duration,
        fromCache
      });
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const metrics = {};
    this.performanceMetrics.forEach((value, key) => {
      metrics[key] = { ...value };
    });
    return metrics;
  }

  /**
   * Clear performance metrics
   */
  clearMetrics() {
    this.performanceMetrics.clear();
  }

  /**
   * Invalidate related caches when data changes
   */
  async invalidateRelatedCaches(entityType, entityId, operation = 'update') {
    const patterns = this.getCacheInvalidationPatterns(entityType, operation);
    
    for (const pattern of patterns) {
      await cacheService.delPattern(pattern);
    }

    logger.info('Cache invalidated:', {
      entityType,
      entityId,
      operation,
      patterns
    });
  }

  /**
   * Get cache invalidation patterns for different entities
   */
  getCacheInvalidationPatterns(entityType, operation) {
    const patterns = [];

    switch (entityType) {
      case 'user':
        patterns.push(
          'user:*',
          'user:list:*',
          'user:count:*',
          'dashboard:*',
          'analytics:*'
        );
        break;

      case 'subscription':
        patterns.push(
          'subscription:*',
          'subscription:list:*',
          'subscription:analytics:*',
          'dashboard:*',
          'analytics:*'
        );
        break;

      case 'booking':
        patterns.push(
          'booking:*',
          'booking:list:*',
          'dashboard:*',
          'analytics:*'
        );
        break;

      case 'plan':
        patterns.push(
          'plan:*',
          'subscription:*',
          'dashboard:*'
        );
        break;

      default:
        // Generic invalidation
        patterns.push(
          `${entityType}:*`,
          'dashboard:*'
        );
    }

    return patterns;
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUpCache() {
    logger.info('Starting cache warm-up...');

    try {
      // Warm up dashboard metrics
      await this.optimizedQuery(
        cacheKeys.dashboardMetrics(),
        async () => {
          // This would be replaced with actual dashboard metrics query
          return {
            totalUsers: 0,
            activeSubscriptions: 0,
            revenue: 0,
            bookings: 0
          };
        },
        { ttl: 300 }
      );

      // Warm up common user lists
      const commonFilters = [
        { status: 'active' },
        { role: 'customer' },
        { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
      ];

      for (const filter of commonFilters) {
        await this.optimizedQuery(
          cacheKeys.userList(filter),
          async () => {
            // This would be replaced with actual user query
            return [];
          },
          { ttl: 300 }
        );
      }

      logger.info('Cache warm-up completed');
    } catch (error) {
      logger.error('Cache warm-up failed:', error);
    }
  }
}

// Create singleton instance
const queryOptimizer = new QueryOptimizer();

export { queryOptimizer };

// Helper functions for common query patterns
export const withCache = (cacheKey, ttl = 300) => (target, propertyKey, descriptor) => {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function (...args) {
    return await queryOptimizer.optimizedQuery(
      cacheKey,
      () => originalMethod.apply(this, args),
      { ttl }
    );
  };
  
  return descriptor;
};

export const withInvalidation = (entityType) => (target, propertyKey, descriptor) => {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function (...args) {
    const result = await originalMethod.apply(this, args);
    
    // Invalidate caches after successful mutation
    if (result && !result.error) {
      await queryOptimizer.invalidateRelatedCaches(entityType, result.id);
    }
    
    return result;
  };
  
  return descriptor;
};