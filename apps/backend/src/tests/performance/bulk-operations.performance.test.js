import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { BulkOperationService } from '../../services/bulkOperationService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Bulk Operations Performance Tests', () => {
  let bulkOperationService;
  let testUsers = [];

  beforeAll(async () => {
    bulkOperationService = new BulkOperationService();
    
    // Create test users for performance testing
    const userPromises = Array.from({ length: 1000 }, (_, i) => 
      prisma.user.create({
        data: {
          email: `perf-test-${i}@test.com`,
          name: `Performance Test User ${i}`,
          role: 'CUSTOMER',
          status: 'ACTIVE'
        }
      })
    );
    
    testUsers = await Promise.all(userPromises);
  });

  afterAll(async () => {
    // Cleanup test users
    await prisma.user.deleteMany({
      where: {
        email: { contains: 'perf-test-' }
      }
    });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Bulk User Suspension Performance', () => {
    it('should suspend 100 users within 2 seconds', async () => {
      const userIds = testUsers.slice(0, 100).map(u => u.id);
      const startTime = performance.now();

      const result = await bulkOperationService.suspendUsers(
        userIds,
        'admin-1',
        'Performance test suspension'
      );

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(2000); // 2 seconds
      expect(result.success).toBe(true);
      expect(result.processed).toBe(100);
      expect(result.failed).toBe(0);
    });

    it('should handle 500 users with batching within 10 seconds', async () => {
      const userIds = testUsers.slice(100, 600).map(u => u.id);
      const startTime = performance.now();

      const result = await bulkOperationService.suspendUsers(
        userIds,
        'admin-1',
        'Large batch performance test'
      );

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(10000); // 10 seconds
      expect(result.success).toBe(true);
      expect(result.processed).toBe(500);
    });

    it('should maintain consistent performance across multiple operations', async () => {
      const batchSize = 50;
      const numBatches = 5;
      const executionTimes = [];

      for (let i = 0; i < numBatches; i++) {
        const startIndex = 600 + (i * batchSize);
        const userIds = testUsers.slice(startIndex, startIndex + batchSize).map(u => u.id);
        
        const startTime = performance.now();
        
        await bulkOperationService.suspendUsers(
          userIds,
          'admin-1',
          `Consistency test batch ${i}`
        );
        
        const endTime = performance.now();
        executionTimes.push(endTime - startTime);
      }

      // Check that execution times are consistent (within 50% variance)
      const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
      const maxVariance = avgTime * 0.5;

      executionTimes.forEach(time => {
        expect(Math.abs(time - avgTime)).toBeLessThan(maxVariance);
      });
    });
  });

  describe('Memory Usage Performance', () => {
    it('should not exceed memory limits during large operations', async () => {
      const userIds = testUsers.slice(800, 1000).map(u => u.id);
      
      const initialMemory = process.memoryUsage();
      
      await bulkOperationService.suspendUsers(
        userIds,
        'admin-1',
        'Memory test suspension'
      );
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should clean up resources after operations', async () => {
      const userIds = testUsers.slice(0, 50).map(u => u.id);
      
      const initialMemory = process.memoryUsage();
      
      // Perform multiple operations
      for (let i = 0; i < 10; i++) {
        await bulkOperationService.suspendUsers(
          userIds,
          'admin-1',
          `Cleanup test ${i}`
        );
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory should not continuously grow
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Database Performance', () => {
    it('should use efficient database queries', async () => {
      const userIds = testUsers.slice(0, 100).map(u => u.id);
      
      // Mock Prisma to count queries
      let queryCount = 0;
      const originalUpdateMany = prisma.user.updateMany;
      const originalFindMany = prisma.user.findMany;
      
      prisma.user.updateMany = vi.fn().mockImplementation((...args) => {
        queryCount++;
        return originalUpdateMany.apply(prisma.user, args);
      });
      
      prisma.user.findMany = vi.fn().mockImplementation((...args) => {
        queryCount++;
        return originalFindMany.apply(prisma.user, args);
      });
      
      await bulkOperationService.suspendUsers(
        userIds,
        'admin-1',
        'Query efficiency test'
      );
      
      // Should use minimal number of queries (ideally 2: one to find, one to update)
      expect(queryCount).toBeLessThan(5);
      
      // Restore original methods
      prisma.user.updateMany = originalUpdateMany;
      prisma.user.findMany = originalFindMany;
    });

    it('should handle database connection limits', async () => {
      const userIds = testUsers.slice(0, 200).map(u => u.id);
      
      // Simulate multiple concurrent operations
      const operations = Array.from({ length: 10 }, () =>
        bulkOperationService.suspendUsers(
          userIds,
          'admin-1',
          'Concurrent operation test'
        )
      );
      
      const results = await Promise.allSettled(operations);
      
      // All operations should complete successfully
      const successfulOperations = results.filter(
        result => result.status === 'fulfilled' && result.value.success
      );
      
      expect(successfulOperations.length).toBe(10);
    });
  });

  describe('Progress Tracking Performance', () => {
    it('should provide accurate progress updates without performance impact', async () => {
      const userIds = testUsers.slice(0, 100).map(u => u.id);
      const progressUpdates = [];
      
      const progressCallback = (progress) => {
        progressUpdates.push({
          progress,
          timestamp: performance.now()
        });
      };
      
      const startTime = performance.now();
      
      await bulkOperationService.processWithProgress(
        userIds,
        async (batch) => {
          // Simulate processing
          await new Promise(resolve => setTimeout(resolve, 10));
          return { success: true };
        },
        { batchSize: 10, progressCallback }
      );
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Progress updates should not significantly impact performance
      expect(progressUpdates.length).toBeGreaterThan(5);
      expect(totalTime).toBeLessThan(2000);
      
      // Progress should be monotonically increasing
      for (let i = 1; i < progressUpdates.length; i++) {
        expect(progressUpdates[i].progress).toBeGreaterThanOrEqual(
          progressUpdates[i - 1].progress
        );
      }
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle errors efficiently without blocking', async () => {
      // Mix of valid and invalid user IDs
      const validIds = testUsers.slice(0, 50).map(u => u.id);
      const invalidIds = Array.from({ length: 50 }, (_, i) => `invalid-${i}`);
      const mixedIds = [...validIds, ...invalidIds];
      
      const startTime = performance.now();
      
      const result = await bulkOperationService.suspendUsers(
        mixedIds,
        'admin-1',
        'Error handling performance test'
      );
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Should complete within reasonable time despite errors
      expect(executionTime).toBeLessThan(3000);
      expect(result.processed).toBe(50);
      expect(result.failed).toBe(50);
      expect(result.errors).toHaveLength(50);
    });
  });

  describe('Scalability Tests', () => {
    it('should scale linearly with batch size', async () => {
      const batchSizes = [10, 50, 100, 200];
      const executionTimes = [];
      
      for (const batchSize of batchSizes) {
        const userIds = testUsers.slice(0, batchSize).map(u => u.id);
        
        const startTime = performance.now();
        
        await bulkOperationService.suspendUsers(
          userIds,
          'admin-1',
          `Scalability test - ${batchSize} users`
        );
        
        const endTime = performance.now();
        executionTimes.push({
          batchSize,
          time: endTime - startTime
        });
      }
      
      // Execution time should scale roughly linearly
      const timePerUser = executionTimes.map(({ batchSize, time }) => time / batchSize);
      const avgTimePerUser = timePerUser.reduce((a, b) => a + b, 0) / timePerUser.length;
      
      // Variance in time per user should be reasonable
      timePerUser.forEach(time => {
        expect(Math.abs(time - avgTimePerUser)).toBeLessThan(avgTimePerUser * 0.5);
      });
    });
  });

  describe('Resource Cleanup Performance', () => {
    it('should clean up resources promptly after operations', async () => {
      const userIds = testUsers.slice(0, 100).map(u => u.id);
      
      // Monitor resource usage
      const initialHandles = process._getActiveHandles().length;
      const initialRequests = process._getActiveRequests().length;
      
      await bulkOperationService.suspendUsers(
        userIds,
        'admin-1',
        'Resource cleanup test'
      );
      
      // Allow some time for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const finalHandles = process._getActiveHandles().length;
      const finalRequests = process._getActiveRequests().length;
      
      // Resource counts should not increase significantly
      expect(finalHandles - initialHandles).toBeLessThan(10);
      expect(finalRequests - initialRequests).toBeLessThan(5);
    });
  });
});