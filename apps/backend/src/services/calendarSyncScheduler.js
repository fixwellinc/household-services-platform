import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import CalendarSyncService from './calendarSyncService.js';
import CalendarOAuthService from './calendarOAuthService.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

class CalendarSyncScheduler {
  constructor() {
    this.prisma = prisma;
    this.syncService = new CalendarSyncService();
    this.oauthService = new CalendarOAuthService();
    this.isRunning = false;
    this.scheduledTasks = new Map();
    this.retryQueue = new Map();
    this.maxRetries = 3;
    this.retryDelay = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Start the sync scheduler
   */
  start() {
    if (this.isRunning) {
      logger.info('Calendar sync scheduler is already running');
      return;
    }

    logger.info('Starting calendar sync scheduler');
    this.isRunning = true;

    // Schedule periodic full sync every hour
    this.scheduledTasks.set('fullSync', cron.schedule('0 * * * *', async () => {
      await this.performScheduledSync();
    }, {
      scheduled: true,
      timezone: 'America/New_York'
    }));

    // Schedule retry processing every 5 minutes
    this.scheduledTasks.set('retryProcessor', cron.schedule('*/5 * * * *', async () => {
      await this.processRetryQueue();
    }, {
      scheduled: true,
      timezone: 'America/New_York'
    }));

    // Schedule token validation every 6 hours
    this.scheduledTasks.set('tokenValidation', cron.schedule('0 */6 * * *', async () => {
      await this.validateAllTokens();
    }, {
      scheduled: true,
      timezone: 'America/New_York'
    }));

    // Schedule cleanup of old sync errors every day at midnight
    this.scheduledTasks.set('cleanup', cron.schedule('0 0 * * *', async () => {
      await this.cleanupOldSyncData();
    }, {
      scheduled: true,
      timezone: 'America/New_York'
    }));

    logger.info('Calendar sync scheduler started successfully');
  }

  /**
   * Stop the sync scheduler
   */
  stop() {
    if (!this.isRunning) {
      logger.info('Calendar sync scheduler is not running');
      return;
    }

    logger.info('Stopping calendar sync scheduler');
    
    // Stop all scheduled tasks
    this.scheduledTasks.forEach((task, name) => {
      task.destroy();
      logger.debug('Stopped scheduled task', { taskName: name });
    });
    
    this.scheduledTasks.clear();
    this.retryQueue.clear();
    this.isRunning = false;

    logger.info('Calendar sync scheduler stopped');
  }

  /**
   * Perform scheduled full sync
   */
  async performScheduledSync() {
    try {
      logger.info('Starting scheduled calendar sync');
      
      const result = await this.syncService.performFullSync();
      
      logger.info('Scheduled sync completed', {
        successfulSyncs: result.successfulSyncs,
        totalSyncs: result.totalSyncs
      });
      
      // Add failed syncs to retry queue
      const failedSyncs = result.results.filter(r => !r.success);
      for (const failedSync of failedSyncs) {
        await this.addToRetryQueue(failedSync.calendarSyncId, 'fullSync', failedSync.error);
      }

      // Log sync statistics
      await this.logSyncStatistics(result);
      
    } catch (error) {
      logger.error('Scheduled sync failed', {
        error: error.message,
        stack: error.stack
      });
      await this.logSyncError('scheduledSync', error.message);
    }
  }

  /**
   * Process retry queue
   */
  async processRetryQueue() {
    if (this.retryQueue.size === 0) {
      return;
    }

    logger.info('Processing retry queue', {
      queueSize: this.retryQueue.size
    });

    const retryPromises = [];
    const itemsToRemove = [];

    for (const [key, retryItem] of this.retryQueue.entries()) {
      if (Date.now() - retryItem.lastAttempt < this.retryDelay) {
        continue; // Not ready for retry yet
      }

      if (retryItem.attempts >= this.maxRetries) {
        logger.error('Max retries exceeded, removing from queue', {
          key,
          calendarSyncId: retryItem.calendarSyncId,
          attempts: retryItem.attempts
        });
        itemsToRemove.push(key);
        await this.handleMaxRetriesExceeded(retryItem);
        continue;
      }

      retryPromises.push(this.processRetryItem(key, retryItem));
    }

    // Remove items that exceeded max retries
    itemsToRemove.forEach(key => this.retryQueue.delete(key));

    // Process retry items
    await Promise.allSettled(retryPromises);
  }

  /**
   * Process individual retry item
   */
  async processRetryItem(key, retryItem) {
    try {
      logger.info('Retrying calendar sync operation', {
        operation: retryItem.operation,
        calendarSyncId: retryItem.calendarSyncId,
        attempt: retryItem.attempts + 1
      });
      
      retryItem.attempts++;
      retryItem.lastAttempt = Date.now();

      let success = false;

      switch (retryItem.operation) {
        case 'fullSync':
          const result = await this.syncService.syncExternalChangesToLocal(
            retryItem.calendarSyncId,
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)  // 30 days ahead
          );
          success = result.success;
          break;
        
        case 'tokenRefresh':
          await this.refreshCalendarToken(retryItem.calendarSyncId);
          success = true;
          break;
        
        default:
          logger.error('Unknown retry operation', {
            operation: retryItem.operation,
            key
          });
          success = false;
      }

      if (success) {
        logger.info('Retry successful', { key });
        this.retryQueue.delete(key);
        
        // Clear sync errors
        await this.prisma.calendarSync.update({
          where: { id: retryItem.calendarSyncId },
          data: {
            syncErrors: null,
            lastSyncAt: new Date(),
            updatedAt: new Date()
          }
        });
      } else {
        logger.warn('Retry failed, will try again later', { key });
      }

    } catch (error) {
      logger.error('Retry failed', {
        key,
        error: error.message,
        stack: error.stack
      });
      retryItem.lastError = error.message;
    }
  }

  /**
   * Add item to retry queue
   */
  async addToRetryQueue(calendarSyncId, operation, error) {
    const key = `${calendarSyncId}-${operation}`;
    
    if (this.retryQueue.has(key)) {
      // Update existing retry item
      const retryItem = this.retryQueue.get(key);
      retryItem.lastError = error;
      retryItem.lastAttempt = Date.now();
    } else {
      // Add new retry item
      this.retryQueue.set(key, {
        calendarSyncId,
        operation,
        attempts: 0,
        lastAttempt: Date.now(),
        lastError: error,
        createdAt: Date.now()
      });
    }

    logger.info('Added to retry queue', {
      key,
      calendarSyncId,
      operation,
      error
    });
  }

  /**
   * Handle max retries exceeded
   */
  async handleMaxRetriesExceeded(retryItem) {
    try {
      // Disable the calendar sync
      await this.prisma.calendarSync.update({
        where: { id: retryItem.calendarSyncId },
        data: {
          isActive: false,
          syncErrors: `Max retries exceeded: ${retryItem.lastError}`,
          updatedAt: new Date()
        }
      });

      logger.error('Calendar sync disabled due to repeated failures', {
        calendarSyncId: retryItem.calendarSyncId,
        lastError: retryItem.lastError,
        attempts: retryItem.attempts
      });
      
      // Log critical error
      await this.logSyncError('maxRetriesExceeded', `Calendar sync ${retryItem.calendarSyncId} disabled: ${retryItem.lastError}`);
      
    } catch (error) {
      logger.error('Failed to handle max retries exceeded', {
        error: error.message,
        stack: error.stack,
        calendarSyncId: retryItem.calendarSyncId
      });
    }
  }

  /**
   * Validate all calendar tokens
   */
  async validateAllTokens() {
    try {
      logger.info('Starting token validation');
      
      const activeCalendarSyncs = await this.oauthService.getActiveCalendarSyncs();
      const validationPromises = activeCalendarSyncs.map(sync => 
        this.validateCalendarToken(sync.id)
      );

      const results = await Promise.allSettled(validationPromises);
      
      let validTokens = 0;
      let invalidTokens = 0;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.valid) {
          validTokens++;
        } else {
          invalidTokens++;
          const calendarSync = activeCalendarSyncs[index];
          this.addToRetryQueue(calendarSync.id, 'tokenRefresh', 'Token validation failed');
        }
      });

      logger.info('Token validation completed', {
        validTokens,
        invalidTokens
      });
      
    } catch (error) {
      logger.error('Token validation failed', {
        error: error.message,
        stack: error.stack
      });
      await this.logSyncError('tokenValidation', error.message);
    }
  }

  /**
   * Validate individual calendar token
   */
  async validateCalendarToken(calendarSyncId) {
    try {
      const result = await this.oauthService.validateCalendarSync(calendarSyncId);
      
      if (!result.valid) {
        logger.warn('Invalid token for calendar sync', {
          calendarSyncId,
          error: result.error
        });
      }
      
      return result;
    } catch (error) {
      logger.error('Token validation failed', {
        calendarSyncId,
        error: error.message,
        stack: error.stack
      });
      return { valid: false, error: error.message };
    }
  }

  /**
   * Refresh calendar token
   */
  async refreshCalendarToken(calendarSyncId) {
    try {
      const calendarSync = await this.prisma.calendarSync.findUnique({
        where: { id: calendarSyncId }
      });

      if (!calendarSync) {
        throw new Error('Calendar sync not found');
      }

      if (calendarSync.provider === 'google') {
        await this.oauthService.refreshGoogleToken(calendarSyncId);
      } else if (calendarSync.provider === 'outlook') {
        // Outlook typically requires re-authentication
        throw new Error('Outlook token refresh requires re-authentication');
      } else {
        throw new Error(`Unknown calendar provider: ${calendarSync.provider}`);
      }

      logger.info('Token refreshed successfully', {
        calendarSyncId
      });
      
    } catch (error) {
      logger.error('Token refresh failed', {
        calendarSyncId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Clean up old sync data
   */
  async cleanupOldSyncData() {
    try {
      logger.info('Starting sync data cleanup');
      
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Clear old sync errors (keep errors for 30 days)
      const clearedErrors = await this.prisma.calendarSync.updateMany({
        where: {
          syncErrors: { not: null },
          updatedAt: { lt: thirtyDaysAgo }
        },
        data: {
          syncErrors: null
        }
      });

      logger.info('Cleanup completed', {
        clearedErrors: clearedErrors.count
      });
      
    } catch (error) {
      logger.error('Sync data cleanup failed', {
        error: error.message,
        stack: error.stack
      });
      await this.logSyncError('cleanup', error.message);
    }
  }

  /**
   * Log sync statistics
   */
  async logSyncStatistics(syncResult) {
    try {
      const stats = {
        timestamp: new Date(),
        totalSyncs: syncResult.totalSyncs,
        successfulSyncs: syncResult.successfulSyncs,
        failedSyncs: syncResult.totalSyncs - syncResult.successfulSyncs,
        retryQueueSize: this.retryQueue.size
      };

      logger.info('Sync Statistics', stats);
      
      // You could store these stats in a database table for monitoring
      // await prisma.syncStatistics.create({ data: stats });
      
    } catch (error) {
      logger.error('Failed to log sync statistics', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Log sync error
   */
  async logSyncError(operation, errorMessage) {
    try {
      const errorLog = {
        timestamp: new Date(),
        operation,
        error: errorMessage,
        retryQueueSize: this.retryQueue.size
      };

      logger.error('Sync Error', errorLog);
      
      // You could store these errors in a database table for monitoring
      // await prisma.syncErrors.create({ data: errorLog });
      
    } catch (error) {
      logger.error('Failed to log sync error', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      scheduledTasks: Array.from(this.scheduledTasks.keys()),
      retryQueueSize: this.retryQueue.size,
      retryItems: Array.from(this.retryQueue.entries()).map(([key, item]) => ({
        key,
        calendarSyncId: item.calendarSyncId,
        operation: item.operation,
        attempts: item.attempts,
        lastError: item.lastError,
        nextRetry: new Date(item.lastAttempt + this.retryDelay)
      }))
    };
  }

  /**
   * Force sync for specific calendar
   */
  async forceSyncCalendar(calendarSyncId) {
    try {
      logger.info('Force syncing calendar', {
        calendarSyncId
      });
      
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);  // 30 days ahead
      
      const result = await this.syncService.syncExternalChangesToLocal(
        calendarSyncId,
        startDate,
        endDate
      );

      if (!result.success) {
        await this.addToRetryQueue(calendarSyncId, 'fullSync', 'Force sync failed');
      }

      return result;
      
    } catch (error) {
      logger.error('Force sync failed', {
        calendarSyncId,
        error: error.message,
        stack: error.stack
      });
      await this.addToRetryQueue(calendarSyncId, 'fullSync', error.message);
      throw error;
    }
  }

  /**
   * Clear retry queue for specific calendar
   */
  clearRetryQueue(calendarSyncId) {
    const keysToRemove = [];
    
    for (const [key, item] of this.retryQueue.entries()) {
      if (item.calendarSyncId === calendarSyncId) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => this.retryQueue.delete(key));
    
    logger.info('Cleared retry items', {
      count: keysToRemove.length,
      calendarSyncId
    });
    
    return keysToRemove.length;
  }

  /**
   * Handle appointment sync with conflict resolution
   */
  async syncAppointmentWithConflictResolution(appointment, action = 'create') {
    try {
      // Check for conflicts before syncing
      if (action === 'create' || action === 'update') {
        const startDate = new Date(appointment.scheduledDate);
        const endDate = new Date(appointment.scheduledDate.getTime() + appointment.duration * 60000);
        
        const conflictCheck = await this.syncService.checkForConflictsAcrossCalendars(
          startDate,
          endDate,
          appointment.calendarEventId
        );

        if (conflictCheck.hasConflicts) {
          logger.warn('Conflicts detected for appointment', {
            appointmentId: appointment.id,
            conflictsByProvider: conflictCheck.conflictsByProvider
          });
          
          // You could implement conflict resolution logic here
          // For now, we'll log the conflicts and proceed
          await this.logSyncError('conflictDetected', 
            `Appointment ${appointment.id} has conflicts: ${conflictCheck.totalConflicts} conflicts found`
          );
        }
      }

      // Perform the sync
      const result = await this.syncService.syncAppointmentToAllCalendars(appointment, action);
      
      // Add failed syncs to retry queue
      const failedSyncs = result.results.filter(r => !r.success);
      for (const failedSync of failedSyncs) {
        await this.addToRetryQueue(
          failedSync.calendarSyncId, 
          `appointmentSync-${action}`, 
          failedSync.error
        );
      }

      return result;
      
    } catch (error) {
      logger.error('Appointment sync failed', {
        appointmentId: appointment.id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

export default CalendarSyncScheduler;