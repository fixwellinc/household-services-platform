import { monitor } from '../config/performance.js';

// Concurrency control for payment processing
class ConcurrencyManager {
  constructor() {
    this.locks = new Map();
    this.queues = new Map();
    this.maxConcurrentOperations = 10;
    this.currentOperations = 0;
  }

  // Acquire lock for user-specific operations
  async acquireUserLock(userId, operation, timeout = 30000) {
    const lockKey = `user:${userId}:${operation}`;
    
    if (this.locks.has(lockKey)) {
      throw new Error(`Operation ${operation} already in progress for user ${userId}`);
    }

    const startTime = monitor.startTimer('concurrency_lock_acquire');
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.locks.delete(lockKey);
        monitor.endTimer('concurrency_lock_acquire', startTime, { userId, operation, timeout: true });
        reject(new Error(`Lock timeout for ${operation} on user ${userId}`));
      }, timeout);

      this.locks.set(lockKey, {
        userId,
        operation,
        startTime: Date.now(),
        timeoutId,
        resolve,
        reject
      });

      monitor.endTimer('concurrency_lock_acquire', startTime, { userId, operation, acquired: true });
      resolve(lockKey);
    });
  }

  // Release user lock
  releaseLock(lockKey) {
    const lock = this.locks.get(lockKey);
    if (lock) {
      clearTimeout(lock.timeoutId);
      this.locks.delete(lockKey);
      
      const duration = Date.now() - lock.startTime;
      monitor.endTimer('concurrency_lock_duration', lock.startTime, {
        userId: lock.userId,
        operation: lock.operation,
        duration
      });
    }
  }

  // Rate limiting for API operations
  async checkRateLimit(userId, operation, maxPerMinute = 10) {
    const key = `rate_limit:${userId}:${operation}`;
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    if (!this.queues.has(key)) {
      this.queues.set(key, []);
    }

    const queue = this.queues.get(key);
    
    // Remove old entries
    while (queue.length > 0 && queue[0] < windowStart) {
      queue.shift();
    }

    if (queue.length >= maxPerMinute) {
      throw new Error(`Rate limit exceeded for ${operation}. Max ${maxPerMinute} per minute.`);
    }

    queue.push(now);
    return true;
  }

  // Queue management for high-load operations
  async queueOperation(operation, priority = 0) {
    if (this.currentOperations >= this.maxConcurrentOperations) {
      return new Promise((resolve, reject) => {
        const queueKey = 'global_queue';
        if (!this.queues.has(queueKey)) {
          this.queues.set(queueKey, []);
        }

        this.queues.get(queueKey).push({
          operation,
          priority,
          resolve,
          reject,
          timestamp: Date.now()
        });

        // Sort by priority (higher priority first)
        this.queues.get(queueKey).sort((a, b) => b.priority - a.priority);
      });
    }

    return this.executeOperation(operation);
  }

  async executeOperation(operation) {
    this.currentOperations++;
    const startTime = monitor.startTimer('concurrent_operation');

    try {
      const result = await operation();
      monitor.endTimer('concurrent_operation', startTime, { success: true });
      return result;
    } catch (error) {
      monitor.endTimer('concurrent_operation', startTime, { success: false, error: error.message });
      throw error;
    } finally {
      this.currentOperations--;
      this.processQueue();
    }
  }

  processQueue() {
    const queueKey = 'global_queue';
    const queue = this.queues.get(queueKey);
    
    if (queue && queue.length > 0 && this.currentOperations < this.maxConcurrentOperations) {
      const next = queue.shift();
      this.executeOperation(next.operation)
        .then(next.resolve)
        .catch(next.reject);
    }
  }

  // Get concurrency statistics
  getStats() {
    return {
      activeLocks: this.locks.size,
      currentOperations: this.currentOperations,
      maxConcurrentOperations: this.maxConcurrentOperations,
      queueSizes: Object.fromEntries(
        Array.from(this.queues.entries()).map(([key, queue]) => [key, queue.length])
      )
    };
  }
}

const concurrencyManager = new ConcurrencyManager();

// Middleware for user operation locking
export const userLockMiddleware = (operation) => {
  return async (req, res, next) => {
    if (!req.user?.id) {
      return next();
    }

    const userId = req.user.id;
    let lockKey;

    try {
      // Check rate limit first
      await concurrencyManager.checkRateLimit(userId, operation);
      
      // Acquire lock
      lockKey = await concurrencyManager.acquireUserLock(userId, operation);
      
      // Store lock key for cleanup
      req.lockKey = lockKey;
      
      next();
    } catch (error) {
      if (lockKey) {
        concurrencyManager.releaseLock(lockKey);
      }
      
      if (error.message.includes('Rate limit exceeded')) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: error.message,
          retryAfter: 60
        });
      }
      
      if (error.message.includes('already in progress')) {
        return res.status(409).json({
          error: 'Operation in progress',
          message: error.message
        });
      }
      
      return res.status(500).json({
        error: 'Concurrency error',
        message: error.message
      });
    }
  };
};

// Middleware for releasing locks
export const releaseLockMiddleware = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (req.lockKey) {
      concurrencyManager.releaseLock(req.lockKey);
    }
    return originalSend.call(this, data);
  };
  
  next();
};

// Batch processing utilities
export const batchProcessor = {
  async processBatch(items, processor, batchSize = 10, concurrency = 3) {
    const startTime = monitor.startTimer('batch_processing');
    const results = [];
    
    try {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        // Process batch with limited concurrency
        const batchPromises = batch.map(item => 
          concurrencyManager.queueOperation(() => processor(item))
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);
      }
      
      monitor.endTimer('batch_processing', startTime, { 
        totalItems: items.length, 
        batchSize, 
        concurrency 
      });
      
      return results;
    } catch (error) {
      monitor.endTimer('batch_processing', startTime, { 
        totalItems: items.length, 
        error: error.message 
      });
      throw error;
    }
  }
};

export { concurrencyManager };
export default {
  concurrencyManager,
  userLockMiddleware,
  releaseLockMiddleware,
  batchProcessor
};