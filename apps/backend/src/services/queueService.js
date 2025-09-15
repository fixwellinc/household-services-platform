import Bull from 'bull';
import Redis from 'ioredis';
import winston from 'winston';

// Configure queue logger
const queueLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'queue' },
  transports: [
    new winston.transports.File({ filename: 'logs/queue.log' }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  queueLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  lazyConnect: true, // Don't connect immediately
};

class QueueService {
  constructor() {
    this.queues = new Map();
    this.redisAvailable = false;
    this.redis = null;
    this.initializeRedis();
  }

  async initializeRedis() {
    // Only initialize Redis if URL is provided or in production with proper config
    if (process.env.REDIS_URL || (process.env.NODE_ENV === 'production' && process.env.REDIS_HOST)) {
      try {
        this.redis = new Redis(process.env.REDIS_URL || redisConfig);
        
        // Test connection
        await this.redis.ping();
        this.redisAvailable = true;
        queueLogger.info('Redis connection established successfully');
        this.setupQueues();
      } catch (error) {
        queueLogger.warn('Redis connection failed, operating without queues:', error.message);
        this.redisAvailable = false;
        this.redis = null;
      }
    } else {
      queueLogger.info('Redis not configured, operating without queues');
      this.redisAvailable = false;
    }
  }

  setupQueues() {
    if (!this.redisAvailable) {
      queueLogger.info('Skipping queue setup - Redis not available');
      return;
    }

    // Email processing queue
    this.createQueue('email', {
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    // Notification processing queue
    this.createQueue('notifications', {
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 25,
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
      },
    });

    // Data export queue
    this.createQueue('exports', {
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 10,
        attempts: 1,
        timeout: 300000, // 5 minutes
      },
    });

    // Bulk operations queue
    this.createQueue('bulk-operations', {
      defaultJobOptions: {
        removeOnComplete: 20,
        removeOnFail: 20,
        attempts: 1,
        timeout: 600000, // 10 minutes
      },
    });

    // Analytics processing queue
    this.createQueue('analytics', {
      defaultJobOptions: {
        removeOnComplete: 30,
        removeOnFail: 15,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });

    // System maintenance queue
    this.createQueue('maintenance', {
      defaultJobOptions: {
        removeOnComplete: 5,
        removeOnFail: 5,
        attempts: 1,
      },
    });
  }

  createQueue(name, options = {}) {
    const queue = new Bull(name, {
      redis: redisConfig,
      ...options,
    });

    // Global queue event handlers
    queue.on('error', (error) => {
      queueLogger.error(`Queue ${name} error:`, error);
    });

    queue.on('waiting', (jobId) => {
      queueLogger.info(`Job ${jobId} waiting in queue ${name}`);
    });

    queue.on('active', (job, jobPromise) => {
      queueLogger.info(`Job ${job.id} started in queue ${name}`);
    });

    queue.on('completed', (job, result) => {
      queueLogger.info(`Job ${job.id} completed in queue ${name}`, { result });
    });

    queue.on('failed', (job, err) => {
      queueLogger.error(`Job ${job.id} failed in queue ${name}:`, err);
    });

    queue.on('progress', (job, progress) => {
      queueLogger.info(`Job ${job.id} progress in queue ${name}: ${progress}%`);
    });

    queue.on('stalled', (job) => {
      queueLogger.warn(`Job ${job.id} stalled in queue ${name}`);
    });

    this.queues.set(name, queue);
    return queue;
  }

  getQueue(name) {
    return this.queues.get(name);
  }

  // Helper method to handle when Redis is not available
  async addJobSafely(queueName, jobType, data, options = {}) {
    if (!this.redisAvailable) {
      queueLogger.warn(`Queue ${queueName} not available (Redis not connected), executing job ${jobType} immediately`);
      // For critical jobs like emails, we could execute them directly
      // For now, we'll just log and return a mock job ID
      return { id: `direct_${Date.now()}`, data: { executed: 'immediately' } };
    }
    
    const queue = this.getQueue(queueName);
    if (!queue) {
      queueLogger.error(`Queue ${queueName} not found`);
      return null;
    }
    
    return await queue.add(jobType, data, options);
  }

  // Email queue methods
  async addEmailJob(type, data, options = {}) {
    return await this.addJobSafely('email', type, data, options);
  }

  async addEmailBlastJob(data, options = {}) {
    return await this.addEmailJob('email-blast', data, {
      priority: 5,
      ...options,
    });
  }

  async addWelcomeEmailJob(data, options = {}) {
    return await this.addEmailJob('welcome-email', data, {
      priority: 10,
      ...options,
    });
  }

  // Notification queue methods
  async addNotificationJob(type, data, options = {}) {
    return await this.addJobSafely('notifications', type, data, options);
  }

  async addPushNotificationJob(data, options = {}) {
    return await this.addNotificationJob('push-notification', data, {
      priority: 8,
      ...options,
    });
  }

  // Export queue methods
  async addExportJob(type, data, options = {}) {
    return await this.addJobSafely('exports', type, data, {
      priority: 3,
      ...options,
    });
  }

  async addDataExportJob(data, options = {}) {
    return await this.addExportJob('data-export', data, options);
  }

  async addReportGenerationJob(data, options = {}) {
    return await this.addExportJob('report-generation', data, options);
  }

  // Bulk operations queue methods
  async addBulkOperationJob(type, data, options = {}) {
    return await this.addJobSafely('bulk-operations', type, data, {
      priority: 1,
      ...options,
    });
  }

  async addBulkUserUpdateJob(data, options = {}) {
    return await this.addBulkOperationJob('bulk-user-update', data, options);
  }

  async addBulkSubscriptionUpdateJob(data, options = {}) {
    return await this.addBulkOperationJob('bulk-subscription-update', data, options);
  }

  // Analytics queue methods
  async addAnalyticsJob(type, data, options = {}) {
    return await this.addJobSafely('analytics', type, data, options);
  }

  async addMetricsCalculationJob(data, options = {}) {
    return await this.addAnalyticsJob('metrics-calculation', data, options);
  }

  async addChurnPredictionJob(data, options = {}) {
    return await this.addAnalyticsJob('churn-prediction', data, options);
  }

  // Maintenance queue methods
  async addMaintenanceJob(type, data, options = {}) {
    return await this.addJobSafely('maintenance', type, data, options);
  }

  async addDatabaseCleanupJob(data, options = {}) {
    return await this.addMaintenanceJob('database-cleanup', data, options);
  }

  async addLogCleanupJob(data, options = {}) {
    return await this.addMaintenanceJob('log-cleanup', data, options);
  }

  // Queue management methods
  async getQueueStats(queueName) {
    if (!this.redisAvailable) {
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        status: 'Redis not available'
      };
    }
    
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      name: queueName,
      counts: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
      },
      jobs: {
        waiting: waiting.slice(0, 10), // Latest 10
        active: active.slice(0, 10),
        failed: failed.slice(0, 10),
      },
    };
  }

  async getAllQueueStats() {
    const stats = {};
    for (const queueName of this.queues.keys()) {
      stats[queueName] = await this.getQueueStats(queueName);
    }
    return stats;
  }

  async pauseQueue(queueName) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    await queue.pause();
    queueLogger.info(`Queue ${queueName} paused`);
  }

  async resumeQueue(queueName) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    await queue.resume();
    queueLogger.info(`Queue ${queueName} resumed`);
  }

  async cleanQueue(queueName, grace = 0, status = 'completed') {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    
    const cleaned = await queue.clean(grace, status);
    queueLogger.info(`Cleaned ${cleaned.length} ${status} jobs from queue ${queueName}`);
    return cleaned;
  }

  async retryFailedJobs(queueName, limit = 10) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const failedJobs = await queue.getFailed(0, limit - 1);
    const retryPromises = failedJobs.map(job => job.retry());
    
    await Promise.all(retryPromises);
    queueLogger.info(`Retried ${failedJobs.length} failed jobs in queue ${queueName}`);
    
    return failedJobs.length;
  }

  // Graceful shutdown
  async close() {
    queueLogger.info('Closing all queues...');
    
    if (this.queues.size > 0) {
      const closePromises = Array.from(this.queues.values()).map(queue => queue.close());
      await Promise.all(closePromises);
    }
    
    if (this.redis && this.redisAvailable) {
      await this.redis.disconnect();
    }
    queueLogger.info('All queues closed');
  }
}

export default new QueueService();