import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import CalendarSyncScheduler from '../services/calendarSyncScheduler.js';
import { PrismaClient } from '@prisma/client';

// Mock external dependencies
vi.mock('node-cron', () => ({
  default: {
    schedule: vi.fn((pattern, callback, options) => ({
      destroy: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    }))
  }
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    calendarSync: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn()
    }
  }))
}));

const mockSyncService = {
  performFullSync: vi.fn(),
  syncExternalChangesToLocal: vi.fn(),
  checkForConflictsAcrossCalendars: vi.fn(),
  syncAppointmentToAllCalendars: vi.fn()
};

vi.mock('../services/calendarSyncService.js', () => ({
  default: vi.fn(() => mockSyncService)
}));

const mockOAuthService = {
  getActiveCalendarSyncs: vi.fn(),
  validateCalendarSync: vi.fn(),
  refreshGoogleToken: vi.fn()
};

vi.mock('../services/calendarOAuthService.js', () => ({
  default: vi.fn(() => mockOAuthService)
}));

describe('CalendarSyncScheduler', () => {
  let scheduler;

  beforeEach(() => {
    vi.clearAllMocks();
    scheduler = new CalendarSyncScheduler();
  });

  afterEach(() => {
    if (scheduler.isRunning) {
      scheduler.stop();
    }
    vi.restoreAllMocks();
  });

  describe('start/stop', () => {
    it('should start the scheduler successfully', async () => {
      const cron = vi.mocked(await import('node-cron')).default;
      
      scheduler.start();

      expect(scheduler.isRunning).toBe(true);
      expect(cron.schedule).toHaveBeenCalledTimes(4); // 4 scheduled tasks
      expect(scheduler.scheduledTasks.size).toBe(4);
    });

    it('should not start if already running', async () => {
      const cron = vi.mocked(await import('node-cron')).default;
      
      scheduler.start();
      const firstCallCount = cron.schedule.mock.calls.length;
      
      scheduler.start(); // Try to start again
      
      expect(cron.schedule).toHaveBeenCalledTimes(firstCallCount); // No additional calls
    });

    it('should stop the scheduler successfully', async () => {
      const mockTask = {
        destroy: vi.fn(),
        start: vi.fn(),
        stop: vi.fn()
      };
      
      const cron = vi.mocked(await import('node-cron')).default;
      cron.schedule.mockReturnValue(mockTask);
      
      scheduler.start();
      scheduler.stop();

      expect(scheduler.isRunning).toBe(false);
      expect(scheduler.scheduledTasks.size).toBe(0);
      expect(mockTask.destroy).toHaveBeenCalledTimes(4); // 4 tasks destroyed
    });
  });

  describe('performScheduledSync', () => {
    it('should perform full sync successfully', async () => {
      const mockSyncResult = {
        success: true,
        totalSyncs: 2,
        successfulSyncs: 2,
        results: [
          { provider: 'google', success: true },
          { provider: 'outlook', success: true }
        ]
      };

      mockSyncService.performFullSync.mockResolvedValue(mockSyncResult);

      await scheduler.performScheduledSync();

      expect(mockSyncService.performFullSync).toHaveBeenCalled();
      expect(scheduler.retryQueue.size).toBe(0); // No failed syncs to retry
    });

    it('should add failed syncs to retry queue', async () => {
      const mockSyncResult = {
        success: false,
        totalSyncs: 2,
        successfulSyncs: 1,
        results: [
          { provider: 'google', calendarSyncId: 'sync1', success: true },
          { provider: 'outlook', calendarSyncId: 'sync2', success: false, error: 'Token expired' }
        ]
      };

      mockSyncService.performFullSync.mockResolvedValue(mockSyncResult);

      await scheduler.performScheduledSync();

      expect(scheduler.retryQueue.size).toBe(1);
      expect(scheduler.retryQueue.has('sync2-fullSync')).toBe(true);
    });

    it('should handle sync errors gracefully', async () => {
      mockSyncService.performFullSync.mockRejectedValue(new Error('Sync service unavailable'));

      await scheduler.performScheduledSync();

      expect(mockSyncService.performFullSync).toHaveBeenCalled();
      // Should not throw error, should handle gracefully
    });
  });

  describe('processRetryQueue', () => {
    it('should skip items not ready for retry', async () => {
      // Add item to retry queue with recent timestamp
      scheduler.retryQueue.set('test-key', {
        calendarSyncId: 'sync1',
        operation: 'fullSync',
        attempts: 0,
        lastAttempt: Date.now(), // Recent attempt
        lastError: 'Test error'
      });

      await scheduler.processRetryQueue();

      // Item should still be in queue (not processed)
      expect(scheduler.retryQueue.has('test-key')).toBe(true);
    });

    it('should remove items that exceeded max retries', async () => {
      // Add item with max retries exceeded
      scheduler.retryQueue.set('test-key', {
        calendarSyncId: 'sync1',
        operation: 'fullSync',
        attempts: scheduler.maxRetries,
        lastAttempt: Date.now() - scheduler.retryDelay - 1000, // Ready for retry
        lastError: 'Test error'
      });

      scheduler.prisma.calendarSync.update.mockResolvedValue({});

      await scheduler.processRetryQueue();

      // Item should be removed from queue
      expect(scheduler.retryQueue.has('test-key')).toBe(false);
    });

    it('should process retry items successfully', async () => {
      // Add item ready for retry
      scheduler.retryQueue.set('sync1-fullSync', {
        calendarSyncId: 'sync1',
        operation: 'fullSync',
        attempts: 0,
        lastAttempt: Date.now() - scheduler.retryDelay - 1000, // Ready for retry
        lastError: 'Test error'
      });

      mockSyncService.syncExternalChangesToLocal.mockResolvedValue({ success: true });
      scheduler.prisma.calendarSync.update.mockResolvedValue({});

      await scheduler.processRetryQueue();

      expect(mockSyncService.syncExternalChangesToLocal).toHaveBeenCalled();
      expect(scheduler.retryQueue.has('sync1-fullSync')).toBe(false); // Removed after success
    });
  });

  describe('validateAllTokens', () => {
    it('should validate all active calendar tokens', async () => {
      const mockCalendarSyncs = [
        { id: 'sync1', provider: 'google' },
        { id: 'sync2', provider: 'outlook' }
      ];

      mockOAuthService.getActiveCalendarSyncs.mockResolvedValue(mockCalendarSyncs);
      mockOAuthService.validateCalendarSync
        .mockResolvedValueOnce({ valid: true })
        .mockResolvedValueOnce({ valid: false, error: 'Token expired' });

      await scheduler.validateAllTokens();

      expect(mockOAuthService.validateCalendarSync).toHaveBeenCalledTimes(2);
      expect(scheduler.retryQueue.size).toBe(1); // One invalid token added to retry queue
    });
  });

  describe('forceSyncCalendar', () => {
    it('should force sync specific calendar successfully', async () => {
      const calendarSyncId = 'sync1';
      const mockSyncResult = { success: true };

      mockSyncService.syncExternalChangesToLocal.mockResolvedValue(mockSyncResult);

      const result = await scheduler.forceSyncCalendar(calendarSyncId);

      expect(mockSyncService.syncExternalChangesToLocal).toHaveBeenCalledWith(
        calendarSyncId,
        expect.any(Date),
        expect.any(Date)
      );
      expect(result).toEqual(mockSyncResult);
    });

    it('should add failed force sync to retry queue', async () => {
      const calendarSyncId = 'sync1';
      const mockSyncResult = { success: false };

      mockSyncService.syncExternalChangesToLocal.mockResolvedValue(mockSyncResult);

      await scheduler.forceSyncCalendar(calendarSyncId);

      expect(scheduler.retryQueue.size).toBe(1);
      expect(scheduler.retryQueue.has('sync1-fullSync')).toBe(true);
    });
  });

  describe('syncAppointmentWithConflictResolution', () => {
    it('should sync appointment without conflicts', async () => {
      const appointment = {
        id: 'apt1',
        scheduledDate: new Date('2024-01-15T10:00:00Z'),
        duration: 60
      };

      const mockConflictCheck = {
        hasConflicts: false,
        conflictsByProvider: []
      };

      const mockSyncResult = {
        success: true,
        results: [
          { provider: 'google', success: true },
          { provider: 'outlook', success: true }
        ]
      };

      mockSyncService.checkForConflictsAcrossCalendars.mockResolvedValue(mockConflictCheck);
      mockSyncService.syncAppointmentToAllCalendars.mockResolvedValue(mockSyncResult);

      const result = await scheduler.syncAppointmentWithConflictResolution(appointment, 'create');

      expect(mockSyncService.checkForConflictsAcrossCalendars).toHaveBeenCalled();
      expect(mockSyncService.syncAppointmentToAllCalendars).toHaveBeenCalledWith(appointment, 'create');
      expect(result).toEqual(mockSyncResult);
    });

    it('should handle conflicts and still proceed with sync', async () => {
      const appointment = {
        id: 'apt1',
        scheduledDate: new Date('2024-01-15T10:00:00Z'),
        duration: 60
      };

      const mockConflictCheck = {
        hasConflicts: true,
        conflictsByProvider: [
          { provider: 'google', conflicts: [{ summary: 'Existing meeting' }] }
        ],
        totalConflicts: 1
      };

      const mockSyncResult = {
        success: true,
        results: [
          { provider: 'google', success: true },
          { provider: 'outlook', success: true }
        ]
      };

      mockSyncService.checkForConflictsAcrossCalendars.mockResolvedValue(mockConflictCheck);
      mockSyncService.syncAppointmentToAllCalendars.mockResolvedValue(mockSyncResult);

      const result = await scheduler.syncAppointmentWithConflictResolution(appointment, 'create');

      expect(mockSyncService.checkForConflictsAcrossCalendars).toHaveBeenCalled();
      expect(mockSyncService.syncAppointmentToAllCalendars).toHaveBeenCalledWith(appointment, 'create');
      expect(result).toEqual(mockSyncResult);
    });

    it('should add failed appointment syncs to retry queue', async () => {
      const appointment = {
        id: 'apt1',
        scheduledDate: new Date('2024-01-15T10:00:00Z'),
        duration: 60
      };

      const mockConflictCheck = {
        hasConflicts: false,
        conflictsByProvider: []
      };

      const mockSyncResult = {
        success: false,
        results: [
          { provider: 'google', calendarSyncId: 'sync1', success: true },
          { provider: 'outlook', calendarSyncId: 'sync2', success: false, error: 'API error' }
        ]
      };

      mockSyncService.checkForConflictsAcrossCalendars.mockResolvedValue(mockConflictCheck);
      mockSyncService.syncAppointmentToAllCalendars.mockResolvedValue(mockSyncResult);

      await scheduler.syncAppointmentWithConflictResolution(appointment, 'create');

      expect(scheduler.retryQueue.size).toBe(1);
      expect(scheduler.retryQueue.has('sync2-appointmentSync-create')).toBe(true);
    });
  });

  describe('getStatus', () => {
    it('should return scheduler status', () => {
      scheduler.start();
      
      // Add some items to retry queue
      scheduler.retryQueue.set('test-key', {
        calendarSyncId: 'sync1',
        operation: 'fullSync',
        attempts: 1,
        lastAttempt: Date.now(),
        lastError: 'Test error'
      });

      const status = scheduler.getStatus();

      expect(status.isRunning).toBe(true);
      expect(status.scheduledTasks).toHaveLength(4);
      expect(status.retryQueueSize).toBe(1);
      expect(status.retryItems).toHaveLength(1);
      expect(status.retryItems[0].key).toBe('test-key');
    });
  });

  describe('clearRetryQueue', () => {
    it('should clear retry queue for specific calendar', () => {
      // Add items for different calendars
      scheduler.retryQueue.set('sync1-fullSync', {
        calendarSyncId: 'sync1',
        operation: 'fullSync'
      });
      scheduler.retryQueue.set('sync2-fullSync', {
        calendarSyncId: 'sync2',
        operation: 'fullSync'
      });
      scheduler.retryQueue.set('sync1-tokenRefresh', {
        calendarSyncId: 'sync1',
        operation: 'tokenRefresh'
      });

      const clearedCount = scheduler.clearRetryQueue('sync1');

      expect(clearedCount).toBe(2); // Two items for sync1 cleared
      expect(scheduler.retryQueue.size).toBe(1); // One item for sync2 remains
      expect(scheduler.retryQueue.has('sync2-fullSync')).toBe(true);
    });
  });

  describe('cleanupOldSyncData', () => {
    it('should clean up old sync errors', async () => {
      scheduler.prisma.calendarSync.updateMany.mockResolvedValue({ count: 5 });

      await scheduler.cleanupOldSyncData();

      expect(scheduler.prisma.calendarSync.updateMany).toHaveBeenCalledWith({
        where: {
          syncErrors: { not: null },
          updatedAt: { lt: expect.any(Date) }
        },
        data: {
          syncErrors: null
        }
      });
    });
  });
});