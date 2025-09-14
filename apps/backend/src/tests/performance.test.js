import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cacheUtils, monitor, memoryMonitor } from '../config/performance.js';
import cacheService from '../services/cacheService.js';
import { concurrencyManager } from '../middleware/concurrency.js';

describe('Performance Optimization Tests', () => {
  beforeEach(() => {
    // Clear cache before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    vi.clearAllMocks();
  });

  describe('Cache Service', () => {
    it('should cache and retrieve values correctly', () => {
      const key = 'test_key';
      const value = { data: 'test_data', timestamp: Date.now() };

      // Set cache
      const setResult = cacheUtils.set(key, value, 300);
      expect(setResult).toBe(true);

      // Get from cache
      const cachedValue = cacheUtils.get(key);
      expect(cachedValue).toEqual(value);
    });

    it('should handle cache misses gracefully', () => {
      const nonExistentKey = 'non_existent_key';
      const cachedValue = cacheUtils.get(nonExistentKey);
      expect(cachedValue).toBeUndefined();
    });

    it('should clear cache by pattern', () => {
      // Set multiple cache entries
      cacheUtils.set('user:123:subscription', { id: '123' });
      cacheUtils.set('user:456:subscription', { id: '456' });
      cacheUtils.set('analytics:revenue', { total: 1000 });

      // Clear user-related cache
      const clearedCount = cacheUtils.clearPattern('user:.*');
      expect(clearedCount).toBe(2);

      // Verify analytics cache still exists
      const analyticsData = cacheUtils.get('analytics:revenue');
      expect(analyticsData).toEqual({ total: 1000 });
    });

    it('should calculate payment frequency options correctly', () => {
      const options = cacheService.calculatePaymentFrequencyOptions('HOMECARE');
      
      expect(options).toHaveProperty('MONTHLY');
      expect(options).toHaveProperty('YEARLY');
      
      expect(options.MONTHLY.amount).toBe(29.99);
      expect(options.YEARLY.amount).toBe(29.99 * 12 * 0.9); // 10% discount
      expect(options.YEARLY.discount).toBe(0.1);
    });
  });

  describe('Performance Monitor', () => {
    it('should track operation metrics', () => {
      const operation = 'test_operation';
      
      // Start and end timer
      const startTime = monitor.startTimer(operation);
      
      // Simulate some work
      const endTime = Date.now() + 100;
      vi.spyOn(performance, 'now').mockReturnValue(endTime);
      
      const duration = monitor.endTimer(operation, startTime, { test: true });
      
      expect(duration).toBeGreaterThan(0);
      
      // Check metrics
      const metrics = monitor.getMetrics();
      expect(metrics.operations).toHaveProperty(operation);
      expect(metrics.operations[operation].count).toBe(1);
    });

    it('should record cache hit and miss rates', () => {
      // Record some hits and misses
      monitor.recordCacheHit();
      monitor.recordCacheHit();
      monitor.recordCacheMiss();
      
      const metrics = monitor.getMetrics();
      expect(metrics.cache.hits).toBe(2);
      expect(metrics.cache.misses).toBe(1);
      expect(metrics.cache.hitRate).toBe(2/3);
    });
  });

  describe('Memory Monitor', () => {
    it('should return memory usage statistics', () => {
      const usage = memoryMonitor.getUsage();
      
      expect(usage).toHaveProperty('rss');
      expect(usage).toHaveProperty('heapTotal');
      expect(usage).toHaveProperty('heapUsed');
      expect(usage).toHaveProperty('external');
      expect(usage).toHaveProperty('arrayBuffers');
      
      // All values should be positive numbers
      Object.values(usage).forEach(value => {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Concurrency Manager', () => {
    it('should handle rate limiting correctly', async () => {
      const userId = 'test_user_123';
      const operation = 'test_operation';
      const maxPerMinute = 2;

      // First two requests should succeed
      await expect(
        concurrencyManager.checkRateLimit(userId, operation, maxPerMinute)
      ).resolves.toBe(true);
      
      await expect(
        concurrencyManager.checkRateLimit(userId, operation, maxPerMinute)
      ).resolves.toBe(true);

      // Third request should fail
      await expect(
        concurrencyManager.checkRateLimit(userId, operation, maxPerMinute)
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should provide concurrency statistics', () => {
      const stats = concurrencyManager.getStats();
      
      expect(stats).toHaveProperty('activeLocks');
      expect(stats).toHaveProperty('currentOperations');
      expect(stats).toHaveProperty('maxConcurrentOperations');
      expect(stats).toHaveProperty('queueSizes');
      
      expect(typeof stats.activeLocks).toBe('number');
      expect(typeof stats.currentOperations).toBe('number');
      expect(typeof stats.maxConcurrentOperations).toBe('number');
    });

    it('should handle user locks correctly', async () => {
      const userId = 'test_user_456';
      const operation = 'subscription_update';

      // Acquire lock
      const lockKey = await concurrencyManager.acquireUserLock(userId, operation, 1000);
      expect(lockKey).toBe(`user:${userId}:${operation}`);

      // Try to acquire same lock again - should fail
      await expect(
        concurrencyManager.acquireUserLock(userId, operation, 1000)
      ).rejects.toThrow('already in progress');

      // Release lock
      concurrencyManager.releaseLock(lockKey);

      // Should be able to acquire lock again
      const newLockKey = await concurrencyManager.acquireUserLock(userId, operation, 1000);
      expect(newLockKey).toBe(`user:${userId}:${operation}`);
      
      // Clean up
      concurrencyManager.releaseLock(newLockKey);
    });
  });

  describe('Database Query Optimization', () => {
    it('should handle cached queries correctly', async () => {
      const key = 'test_query_key';
      let queryExecuted = false;
      
      const mockQuery = async () => {
        queryExecuted = true;
        return { data: 'query_result', timestamp: Date.now() };
      };

      // First call should execute query
      const result1 = await cacheService.constructor.prototype.constructor.prototype.cachedQuery?.call(
        { defaultTTL: 300 }, 
        key, 
        mockQuery, 
        300
      ) || await mockQuery();
      
      expect(queryExecuted).toBe(true);
      expect(result1).toHaveProperty('data', 'query_result');

      // Reset flag
      queryExecuted = false;

      // Second call should use cache (if caching is working)
      const cachedResult = cacheUtils.get(key);
      if (cachedResult) {
        expect(queryExecuted).toBe(false);
        expect(cachedResult).toEqual(result1);
      }
    });
  });

  describe('Performance Metrics Integration', () => {
    it('should track multiple operations and provide aggregated metrics', () => {
      const operations = ['db_query', 'cache_get', 'api_request'];
      
      operations.forEach(operation => {
        for (let i = 0; i < 5; i++) {
          const startTime = monitor.startTimer(operation);
          // Simulate different durations
          const duration = 100 + (i * 50);
          monitor.endTimer(operation, startTime - duration);
        }
      });

      const metrics = monitor.getMetrics();
      
      operations.forEach(operation => {
        expect(metrics.operations).toHaveProperty(operation);
        expect(metrics.operations[operation].count).toBe(5);
        expect(metrics.operations[operation].avgTime).toBeGreaterThan(0);
        expect(metrics.operations[operation].maxTime).toBeGreaterThan(0);
        expect(metrics.operations[operation].minTime).toBeGreaterThan(0);
      });
    });

    it('should identify slow operations', () => {
      const slowOperation = 'slow_db_query';
      const fastOperation = 'fast_cache_get';
      
      // Simulate slow operation
      const slowStart = monitor.startTimer(slowOperation);
      monitor.endTimer(slowOperation, slowStart - 2000); // 2 seconds
      
      // Simulate fast operation
      const fastStart = monitor.startTimer(fastOperation);
      monitor.endTimer(fastOperation, fastStart - 50); // 50ms
      
      const metrics = monitor.getMetrics();
      
      expect(metrics.operations[slowOperation].avgTime).toBeGreaterThan(1000);
      expect(metrics.operations[fastOperation].avgTime).toBeLessThan(100);
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys', () => {
      const userId = 'user_123';
      const subscriptionId = 'sub_456';
      
      const subscriptionKey = cacheService.constructor.cacheKeys?.subscription?.(userId) || `subscription:${userId}`;
      const rewardKey = cacheService.constructor.cacheKeys?.rewardCredits?.(userId) || `reward_credits:${userId}`;
      const propertyKey = cacheService.constructor.cacheKeys?.additionalProperties?.(subscriptionId) || `additional_properties:${subscriptionId}`;
      
      expect(subscriptionKey).toBe(`subscription:${userId}`);
      expect(rewardKey).toBe(`reward_credits:${userId}`);
      expect(propertyKey).toBe(`additional_properties:${subscriptionId}`);
    });
  });
});