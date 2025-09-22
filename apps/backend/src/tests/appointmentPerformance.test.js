import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import appointmentCacheService from '../services/appointmentCacheService.js';
import appointmentPerformanceService from '../services/appointmentPerformanceService.js';
import availabilityService from '../services/availabilityService.js';
import appointmentService from '../services/appointmentService.js';

// Mock dependencies
vi.mock('../config/database.js', () => ({
  default: {
    appointment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn()
    },
    availabilityRule: {
      findMany: vi.fn()
    },
    serviceType: {
      findUnique: vi.fn()
    }
  }
}));

vi.mock('../services/serviceTypeService.js', () => ({
  default: {
    getServiceTypeById: vi.fn(),
    validateAdvanceBookingTime: vi.fn(),
    getExclusiveServiceConflicts: vi.fn()
  }
}));

vi.mock('../services/appointmentSocketService.js', () => ({
  default: {
    notifyNewBooking: vi.fn(),
    notifyAvailabilityUpdate: vi.fn()
  }
}));

vi.mock('../services/notificationDeliveryService.js', () => ({
  default: {
    sendAppointmentNotification: vi.fn()
  }
}));

describe('Appointment Performance and Caching', () => {
  beforeEach(() => {
    // Clear all caches and reset metrics
    appointmentCacheService.clearAll();
    appointmentPerformanceService.resetMetrics();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Cache Service', () => {
    it('should cache and retrieve availability data', () => {
      const date = new Date('2024-12-25');
      const serviceType = 'CLEANING';
      const duration = 60;
      const slots = [
        { time: '09:00', duration: 60, endTime: '10:00' },
        { time: '10:30', duration: 60, endTime: '11:30' }
      ];

      // Cache the data
      appointmentCacheService.setAvailability(date, serviceType, duration, slots);

      // Retrieve from cache
      const cached = appointmentCacheService.getAvailability(date, serviceType, duration);

      expect(cached).toEqual(slots);
    });

    it('should return null for cache miss', () => {
      const date = new Date('2024-12-25');
      const serviceType = 'CLEANING';
      const duration = 60;

      const cached = appointmentCacheService.getAvailability(date, serviceType, duration);

      expect(cached).toBeNull();
    });

    it('should cache and retrieve appointment data', () => {
      const appointmentId = 'apt-123';
      const appointment = {
        id: appointmentId,
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        scheduledDate: new Date('2024-12-25T10:00:00Z'),
        status: 'CONFIRMED'
      };

      // Cache the appointment
      appointmentCacheService.setAppointment(appointmentId, appointment);

      // Retrieve from cache
      const cached = appointmentCacheService.getAppointment(appointmentId);

      expect(cached).toEqual(appointment);
    });

    it('should invalidate availability cache for specific date', () => {
      const date = new Date('2024-12-25');
      const serviceType = 'CLEANING';
      const slots = [{ time: '09:00', duration: 60 }];

      // Cache data for multiple service types
      appointmentCacheService.setAvailability(date, 'CLEANING', 60, slots);
      appointmentCacheService.setAvailability(date, 'MAINTENANCE', 60, slots);
      appointmentCacheService.setAvailability(date, null, 60, slots);

      // Invalidate for specific service type
      const invalidated = appointmentCacheService.invalidateAvailability(date, 'CLEANING');

      expect(invalidated).toBeGreaterThan(0);

      // Should be cache miss for CLEANING
      const cleaningCached = appointmentCacheService.getAvailability(date, 'CLEANING', 60);
      expect(cleaningCached).toBeNull();

      // Should still have cache for MAINTENANCE
      const maintenanceCached = appointmentCacheService.getAvailability(date, 'MAINTENANCE', 60);
      expect(maintenanceCached).toEqual(slots);
    });

    it('should invalidate appointment cache and related lists', () => {
      const appointmentId = 'apt-123';
      const appointment = { id: appointmentId, customerName: 'John Doe' };
      const appointmentList = [appointment];

      // Cache appointment and list
      appointmentCacheService.setAppointment(appointmentId, appointment);
      appointmentCacheService.setAppointmentList({}, appointmentList, { page: 1, totalCount: 1 });

      // Invalidate appointment
      const invalidated = appointmentCacheService.invalidateAppointment(appointmentId);

      expect(invalidated).toBe(1);

      // Should be cache miss
      const cached = appointmentCacheService.getAppointment(appointmentId);
      expect(cached).toBeNull();

      // List should also be invalidated
      const listCached = appointmentCacheService.getAppointmentList({});
      expect(listCached).toBeNull();
    });

    it('should provide cache statistics', () => {
      const date = new Date('2024-12-25');
      const slots = [{ time: '09:00', duration: 60 }];

      // Generate some cache activity
      appointmentCacheService.setAvailability(date, 'CLEANING', 60, slots);
      appointmentCacheService.getAvailability(date, 'CLEANING', 60); // Hit
      appointmentCacheService.getAvailability(date, 'MAINTENANCE', 60); // Miss

      const stats = appointmentCacheService.getCacheStats();

      expect(stats).toHaveProperty('availability');
      expect(stats.availability).toHaveProperty('keys');
      expect(stats.availability).toHaveProperty('hits');
      expect(stats.availability).toHaveProperty('misses');
      expect(stats.availability).toHaveProperty('hitRate');
      expect(stats.availability.keys).toBeGreaterThan(0);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track operation timing', () => {
      const timer = appointmentPerformanceService.startTimer('test_operation');
      
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Wait 10ms
      }
      
      const duration = timer.end(true, { testData: 'value' });

      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeGreaterThanOrEqual(5); // More lenient timing

      const metrics = appointmentPerformanceService.getMetrics();
      expect(metrics.total_operations).toBe(1);
      expect(metrics.test_operation_count).toBe(1);
      expect(metrics.test_operation_avg_time).toBeGreaterThan(0);
    });

    it('should track failed operations', () => {
      const timer = appointmentPerformanceService.startTimer('test_operation');
      timer.end(false, { error: 'Test error' });

      const metrics = appointmentPerformanceService.getMetrics();
      expect(metrics.total_operations).toBe(1);
      expect(metrics.failed_operations).toBe(1);
      expect(metrics.success_rate).toBe(0);
    });

    it('should identify slow operations', () => {
      // Set a low threshold for testing
      appointmentPerformanceService.setThreshold('test_operation', 5);

      const timer = appointmentPerformanceService.startTimer('test_operation');
      
      // Simulate slow work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Wait 10ms (above threshold)
      }
      
      timer.end(true);

      const metrics = appointmentPerformanceService.getMetrics();
      expect(metrics.slow_operations).toBe(1);
      expect(metrics.slow_operation_rate).toBe(1);
    });

    it('should track cache hit/miss metrics', () => {
      const timer1 = appointmentPerformanceService.startTimer('cache_operation');
      timer1.end(true, { cacheHit: true });

      const timer2 = appointmentPerformanceService.startTimer('cache_operation');
      timer2.end(true, { cacheHit: false });

      const metrics = appointmentPerformanceService.getMetrics();
      expect(metrics.cache_hits).toBe(1);
      expect(metrics.cache_misses).toBe(1);
      expect(metrics.cache_hit_rate).toBe(0.5);
    });

    it('should provide operation summaries', () => {
      // Generate some test data
      appointmentPerformanceService.setThreshold('test_operation', 100);
      
      const timer1 = appointmentPerformanceService.startTimer('test_operation');
      timer1.end(true);
      
      const timer2 = appointmentPerformanceService.startTimer('test_operation');
      timer2.end(false);

      const summary = appointmentPerformanceService.getOperationSummary('test_operation');

      expect(summary).toHaveProperty('operationType', 'test_operation');
      expect(summary).toHaveProperty('count', 2);
      expect(summary).toHaveProperty('avgTime');
      expect(summary).toHaveProperty('maxTime');
      expect(summary).toHaveProperty('minTime');
      expect(summary.successRate).toBeGreaterThanOrEqual(0.4);
      expect(summary.successRate).toBeLessThanOrEqual(0.6);
      expect(summary).toHaveProperty('threshold', 100);
    });

    it('should generate performance reports', () => {
      // Generate some test data
      const timer = appointmentPerformanceService.startTimer('availability_calculation');
      timer.end(true, { cacheHit: false, slotsCount: 5 });

      const report = appointmentPerformanceService.generateReport();

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('overview');
      expect(report).toHaveProperty('operations');
      expect(report).toHaveProperty('topSlowOperations');
      expect(report).toHaveProperty('recommendations');

      expect(report.overview).toHaveProperty('totalOperations', 1);
      expect(report.overview).toHaveProperty('successRate', 1);
      expect(Array.isArray(report.operations)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should provide performance recommendations', () => {
      // Generate data that should trigger recommendations
      
      // Low cache hit rate
      for (let i = 0; i < 10; i++) {
        const timer = appointmentPerformanceService.startTimer('cache_operation');
        timer.end(true, { cacheHit: i < 3 }); // 30% hit rate
      }

      // Slow operations
      appointmentPerformanceService.setThreshold('slow_operation', 10);
      for (let i = 0; i < 5; i++) {
        const timer = appointmentPerformanceService.startTimer('slow_operation');
        const start = Date.now();
        while (Date.now() - start < 15) {
          // Simulate slow work
        }
        timer.end(true);
      }

      const report = appointmentPerformanceService.generateReport();
      
      expect(report.recommendations.length).toBeGreaterThan(0);
      
      const cacheRecommendation = report.recommendations.find(r => r.type === 'cache');
      expect(cacheRecommendation).toBeDefined();
      expect(cacheRecommendation.priority).toBe('high');

      const performanceRecommendation = report.recommendations.find(r => r.type === 'performance');
      expect(performanceRecommendation).toBeDefined();
    });

    it('should track database query performance', () => {
      const timer = appointmentPerformanceService.monitorDatabaseQuery('SELECT', 'appointments');
      timer.end(true, { databaseQueries: 1 });

      const metrics = appointmentPerformanceService.getMetrics();
      expect(metrics.database_queries).toBe(1);
      expect(metrics.database_query_count).toBe(1);
    });

    it('should monitor availability calculation performance', () => {
      const date = new Date('2024-12-25');
      const timer = appointmentPerformanceService.monitorAvailabilityCalculation(date, 'CLEANING');
      timer.end(true, { cacheHit: false, slotsCount: 8 });

      const metrics = appointmentPerformanceService.getMetrics();
      expect(metrics.availability_calculation_count).toBe(1);
    });

    it('should monitor appointment operations', () => {
      const timer = appointmentPerformanceService.monitorAppointmentOperation('creation', 'apt-123');
      timer.end(true, { appointmentId: 'apt-123' });

      const metrics = appointmentPerformanceService.getMetrics();
      expect(metrics.appointment_creation_count).toBe(1);
    });
  });

  describe('Integration Performance Tests', () => {
    it('should demonstrate cache performance improvement', async () => {
      const date = new Date('2024-12-25');
      const serviceType = 'CLEANING';
      const duration = 60;

      // Mock the database response
      const mockSlots = [
        { time: '09:00', duration: 60, endTime: '10:00' },
        { time: '10:30', duration: 60, endTime: '11:30' }
      ];

      // First call should be slow (cache miss)
      appointmentCacheService.setAvailability(date, serviceType, duration, mockSlots);

      // Measure cache hit performance
      const start = Date.now();
      const cached = appointmentCacheService.getAvailability(date, serviceType, duration);
      const cacheTime = Date.now() - start;

      expect(cached).toEqual(mockSlots);
      expect(cacheTime).toBeLessThan(10); // Should be very fast
    });

    it('should handle high-load scenarios', () => {
      const operations = 100;
      const promises = [];

      // Simulate concurrent operations
      for (let i = 0; i < operations; i++) {
        const timer = appointmentPerformanceService.startTimer('concurrent_test');
        
        // Simulate async work
        promises.push(
          new Promise(resolve => {
            setTimeout(() => {
              timer.end(true, { operationId: i });
              resolve();
            }, Math.random() * 10);
          })
        );
      }

      return Promise.all(promises).then(() => {
        const metrics = appointmentPerformanceService.getMetrics();
        expect(metrics.concurrent_test_count).toBe(operations);
        expect(metrics.total_operations).toBe(operations);
        expect(metrics.success_rate).toBe(1);
      });
    });

    it('should maintain performance under cache pressure', () => {
      // Fill cache with many entries
      for (let i = 0; i < 100; i++) {
        const date = new Date('2024-12-25');
        date.setDate(date.getDate() + i);
        
        appointmentCacheService.setAvailability(
          date, 
          `SERVICE_${i % 5}`, 
          60, 
          [{ time: '09:00', duration: 60 }]
        );
      }

      // Test cache retrieval performance
      const testDate = new Date('2024-12-25');
      const start = Date.now();
      
      for (let i = 0; i < 50; i++) {
        appointmentCacheService.getAvailability(testDate, 'SERVICE_0', 60);
      }
      
      const totalTime = Date.now() - start;
      const avgTime = totalTime / 50;

      expect(avgTime).toBeLessThan(5); // Should average less than 5ms per operation
    });
  });
});