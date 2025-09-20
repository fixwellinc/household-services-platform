/**
 * Background job processing service using Bull Queue
 */

import Bull from 'bull';
import { logger } from '../utils/logger.js';
import { cacheService } from './cacheService.js';

class BackgroundJobService {
  constructor() {
    this.queues = new Map();
    this.redisConfig = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 1, // Use different DB for queues
      }
    };
    
    this.init();
  }

  init() {
    // Initialize different queues for different job types
    this.createQueue('email', { 
      defaultJobOptions: { 
        removeOnComplete: 10, 
        removeOnFail: 50,
        attempts: 3,
        backoff: 'exponential'
      }
    });

    this.createQueue('export', { 
      defaultJobOptions: { 
        removeOnComplete: 5, 
        removeOnFail: 10,
        attempts: 2,
        timeout: 300000 // 5 minutes timeout for exports
      }
    });

    this.createQueue('analytics', { 
      defaultJobOptions: { 
        removeOnComplete: 3, 
        removeOnFail: 5,
        attempts: 2,
        delay: 5000 // 5 second delay for analytics jobs
      }
    });

    this.createQueue('cleanup', { 
      defaultJobOptions: { 
        removeOnComplete: 1, 
        removeOnFail: 3,
        attempts: 1
      }
    });

    this.createQueue('notifications', { 
      defaultJobOptions: { 
        removeOnComplete: 20, 
        removeOnFail: 50,
        attempts: 5,
        backoff: 'exponential'
      }
    });

    this.setupJobProcessors();
    this.setupEventHandlers();
  }

  createQueue(name, options = {}) {
    try {
      const queue = new Bull(name, {
        ...this.redisConfig,
        ...options
      });

      this.queues.set(name, queue);
      logger.info(`Created queue: ${name}`);
      
      return queue;
    } catch (error) {
      logger.error(`Failed to create queue ${name}:`, error);
      throw error;
    }
  }

  getQueue(name) {
    return this.queues.get(name);
  }

  setupJobProcessors() {
    // Email processing
    this.getQueue('email').process('send-email', 5, async (job) => {
      const { to, subject, html, template, data } = job.data;
      
      try {
        // Import email service dynamically to avoid circular dependencies
        const { emailService } = await import('./emailService.js');
        
        if (template) {
          await emailService.sendTemplateEmail(to, template, data);
        } else {
          await emailService.sendEmail(to, subject, html);
        }
        
        logger.info(`Email sent successfully to ${to}`);
        return { success: true, recipient: to };
      } catch (error) {
        logger.error('Email job failed:', error);
        throw error;
      }
    });

    // Export processing
    this.getQueue('export').process('generate-export', 2, async (job) => {
      const { exportId, type, filters, format, userId } = job.data;
      
      try {
        const { exportService } = await import('./exportService.js');
        
        // Update job progress
        job.progress(10);
        
        const result = await exportService.generateExport({
          exportId,
          type,
          filters,
          format,
          userId,
          onProgress: (progress) => job.progress(progress)
        });
        
        job.progress(100);
        logger.info(`Export ${exportId} completed successfully`);
        
        return result;
      } catch (error) {
        logger.error(`Export job ${exportId} failed:`, error);
        throw error;
      }
    });

    // Analytics processing
    this.getQueue('analytics').process('calculate-analytics', 3, async (job) => {
      const { type, dateRange, filters } = job.data;
      
      try {
        const { analyticsService } = await import('./analyticsService.js');
        
        const result = await analyticsService.calculateAnalytics(type, dateRange, filters);
        
        // Cache the results
        const cacheKey = `analytics:${type}:${JSON.stringify({ dateRange, filters })}`;
        await cacheService.set(cacheKey, result, 1800); // Cache for 30 minutes
        
        logger.info(`Analytics calculation completed for type: ${type}`);
        return result;
      } catch (error) {
        logger.error('Analytics job failed:', error);
        throw error;
      }
    });

    // Cleanup processing
    this.getQueue('cleanup').process('database-cleanup', 1, async (job) => {
      const { type, olderThan } = job.data;
      
      try {
        const { cleanupService } = await import('./cleanupService.js');
        
        const result = await cleanupService.performCleanup(type, olderThan);
        
        logger.info(`Database cleanup completed: ${result.deletedCount} records removed`);
        return result;
      } catch (error) {
        logger.error('Cleanup job failed:', error);
        throw error;
      }
    });

    // Notification processing
    this.getQueue('notifications').process('send-notification', 10, async (job) => {
      const { userId, type, title, message, data } = job.data;
      
      try {
        const { notificationService } = await import('./notificationService.js');
        
        await notificationService.sendNotification(userId, {
          type,
          title,
          message,
          data
        });
        
        logger.info(`Notification sent to user ${userId}`);
        return { success: true, userId };
      } catch (error) {
        logger.error('Notification job failed:', error);
        throw error;
      }
    });
  }

  setupEventHandlers() {
    this.queues.forEach((queue, name) => {
      queue.on('completed', (job, result) => {
        logger.info(`Job completed in queue ${name}:`, {
          jobId: job.id,
          type: job.name,
          duration: Date.now() - job.timestamp
        });
      });

      queue.on('failed', (job, error) => {
        logger.error(`Job failed in queue ${name}:`, {
          jobId: job.id,
          type: job.name,
          error: error.message,
          attempts: job.attemptsMade
        });
      });

      queue.on('stalled', (job) => {
        logger.warn(`Job stalled in queue ${name}:`, {
          jobId: job.id,
          type: job.name
        });
      });

      queue.on('progress', (job, progress) => {
        logger.debug(`Job progress in queue ${name}:`, {
          jobId: job.id,
          type: job.name,
          progress
        });
      });
    });
  }

  // Job creation methods
  async addEmailJob(emailData, options = {}) {
    const queue = this.getQueue('email');
    return await queue.add('send-email', emailData, {
      priority: options.priority || 0,
      delay: options.delay || 0,
      ...options
    });
  }

  async addExportJob(exportData, options = {}) {
    const queue = this.getQueue('export');
    return await queue.add('generate-export', exportData, {
      priority: options.priority || 0,
      ...options
    });
  }

  async addAnalyticsJob(analyticsData, options = {}) {
    const queue = this.getQueue('analytics');
    return await queue.add('calculate-analytics', analyticsData, {
      priority: options.priority || 0,
      ...options
    });
  }

  async addCleanupJob(cleanupData, options = {}) {
    const queue = this.getQueue('cleanup');
    return await queue.add('database-cleanup', cleanupData, {
      priority: options.priority || 0,
      ...options
    });
  }

  async addNotificationJob(notificationData, options = {}) {
    const queue = this.getQueue('notifications');
    return await queue.add('send-notification', notificationData, {
      priority: options.priority || 0,
      delay: options.delay || 0,
      ...options
    });
  }

  // Bulk job operations
  async addBulkJobs(queueName, jobs) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return await queue.addBulk(jobs);
  }

  // Job management
  async getJob(queueName, jobId) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return await queue.getJob(jobId);
  }

  async getJobs(queueName, types = ['waiting', 'active', 'completed', 'failed'], start = 0, end = 10) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return await queue.getJobs(types, start, end);
  }

  async getJobCounts(queueName) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return await queue.getJobCounts();
  }

  async removeJob(queueName, jobId) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
      return true;
    }
    return false;
  }

  async retryJob(queueName, jobId) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (job) {
      await job.retry();
      return true;
    }
    return false;
  }

  // Queue management
  async pauseQueue(queueName) {
    const queue = this.getQueue(queueName);
    if (queue) {
      await queue.pause();
      logger.info(`Queue ${queueName} paused`);
      return true;
    }
    return false;
  }

  async resumeQueue(queueName) {
    const queue = this.getQueue(queueName);
    if (queue) {
      await queue.resume();
      logger.info(`Queue ${queueName} resumed`);
      return true;
    }
    return false;
  }

  async cleanQueue(queueName, grace = 5000) {
    const queue = this.getQueue(queueName);
    if (queue) {
      await queue.clean(grace, 'completed');
      await queue.clean(grace, 'failed');
      logger.info(`Queue ${queueName} cleaned`);
      return true;
    }
    return false;
  }

  // Statistics and monitoring
  async getQueueStats() {
    const stats = {};
    
    for (const [name, queue] of this.queues) {
      try {
        const counts = await queue.getJobCounts();
        const workers = await queue.getWorkers();
        
        stats[name] = {
          ...counts,
          workers: workers.length,
          isPaused: await queue.isPaused()
        };
      } catch (error) {
        logger.error(`Failed to get stats for queue ${name}:`, error);
        stats[name] = { error: error.message };
      }
    }
    
    return stats;
  }

  // Scheduled jobs
  async scheduleRecurringJobs() {
    // Schedule daily cleanup
    await this.addCleanupJob(
      { type: 'audit_logs', olderThan: '30 days' },
      { 
        repeat: { cron: '0 2 * * *' }, // Daily at 2 AM
        jobId: 'daily-audit-cleanup'
      }
    );

    // Schedule hourly analytics refresh
    await this.addAnalyticsJob(
      { type: 'dashboard_metrics', dateRange: 'last_24h' },
      { 
        repeat: { cron: '0 * * * *' }, // Every hour
        jobId: 'hourly-analytics-refresh'
      }
    );

    logger.info('Recurring jobs scheduled');
  }

  // Graceful shutdown
  async close() {
    logger.info('Closing background job service...');
    
    const closePromises = Array.from(this.queues.values()).map(queue => 
      queue.close()
    );
    
    await Promise.all(closePromises);
    logger.info('All queues closed');
  }
}

// Create singleton instance
const backgroundJobService = new BackgroundJobService();

export { backgroundJobService };