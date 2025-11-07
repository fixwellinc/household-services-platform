import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import redisService from '../redisService.js';

describe('RedisService', () => {
  beforeAll(async () => {
    // Wait a moment for Redis to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    await redisService.disconnect();
  });

  it('should handle Redis unavailability gracefully', async () => {
    // Test that the service doesn't crash when Redis is unavailable
    const status = redisService.getStatus();
    expect(status).toBeDefined();
    expect(typeof status.connected).toBe('boolean');
    expect(typeof status.available).toBe('boolean');
  });

  it('should provide connection metrics', async () => {
    const status = redisService.getStatus();
    expect(status.metrics).toBeDefined();
    expect(typeof status.metrics.totalConnections).toBe('number');
    expect(typeof status.metrics.failedConnections).toBe('number');
  });

  it('should handle get/set operations safely', async () => {
    // These should not throw errors even if Redis is unavailable
    const testKey = 'test:key';
    const testValue = 'test value';

    const setResult = await redisService.set(testKey, testValue);
    expect(typeof setResult).toBe('boolean');

    const getValue = await redisService.get(testKey);
    // getValue can be null if Redis is unavailable, which is expected
    expect(getValue === null || getValue === testValue).toBe(true);

    const delResult = await redisService.del(testKey);
    expect(typeof delResult).toBe('boolean');
  });

  it('should provide Redis info without crashing', async () => {
    const info = await redisService.getInfo();
    expect(info).toBeDefined();
    expect(typeof info.available).toBe('boolean');
    
    if (!info.available) {
      expect(info.error).toBeDefined();
    }
  });

  it('should handle ping operations safely', async () => {
    if (redisService.isAvailable()) {
      const pingResult = await redisService.ping();
      expect(pingResult.success).toBe(true);
      expect(typeof pingResult.responseTime).toBe('number');
    } else {
      // Should throw when Redis is not available
      await expect(redisService.ping()).rejects.toThrow();
    }
  });
});