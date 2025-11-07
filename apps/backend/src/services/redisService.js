import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

/**
 * Redis Service for Railway Deployment
 * Handles Redis connection with Railway-specific optimizations
 */
class RedisService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 1000; // Start with 1 second
    this.maxRetryDelay = 30000; // Max 30 seconds
    this.connectionStartTime = null;
    this.lastPingTime = null;
    this.healthCheckInterval = null;
    this.healthCheckFrequency = 30000; // 30 seconds
    this.connectionMetrics = {
      totalConnections: 0,
      failedConnections: 0,
      reconnections: 0,
      lastError: null
    };

    // Initialize connection
    this.connect();
    
    // Start health monitoring
    this.startHealthMonitoring();
  }

  /**
   * Get Redis connection configuration optimized for Railway
   */
  getConnectionConfig() {
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_PRIVATE_URL;
    
    if (!redisUrl) {
      logger.warn('No Redis URL found in environment variables. Redis will be disabled.');
      return null;
    }

    return {
      // Connection URL (Railway provides this)
      connectionString: redisUrl,
      
      // Connection options optimized for Railway's network
      connectTimeout: 15000, // 15 seconds
      commandTimeout: 10000, // 10 seconds
      lazyConnect: false, // Connect immediately
      keepAlive: 30000, // 30 seconds
      
      // Retry configuration
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      
      // Connection pool settings
      family: 4, // Use IPv4
      
      // Error handling
      enableOfflineQueue: false, // Don't queue commands when disconnected
      
      // Reconnection settings
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        return err.message.includes(targetError);
      }
    };
  }

  /**
   * Connect to Redis with retry logic
   */
  async connect() {
    const config = this.getConnectionConfig();
    
    if (!config) {
      logger.info('Redis is disabled - no connection URL provided');
      return false;
    }

    try {
      this.connectionStartTime = Date.now();
      this.connectionAttempts++;
      this.connectionMetrics.totalConnections++;

      logger.info(`Attempting Redis connection (attempt ${this.connectionAttempts}/${this.maxRetries})`);

      // Create Redis instance
      this.redis = new Redis(config.connectionString, {
        connectTimeout: config.connectTimeout,
        commandTimeout: config.commandTimeout,
        lazyConnect: config.lazyConnect,
        keepAlive: config.keepAlive,
        retryDelayOnFailover: config.retryDelayOnFailover,
        maxRetriesPerRequest: config.maxRetriesPerRequest,
        enableReadyCheck: config.enableReadyCheck,
        family: config.family,
        enableOfflineQueue: config.enableOfflineQueue,
        reconnectOnError: config.reconnectOnError
      });

      // Set up event listeners
      this.setupEventListeners();

      // Test connection
      await this.redis.ping();
      
      this.isConnected = true;
      this.connectionAttempts = 0; // Reset on successful connection
      
      const connectionTime = Date.now() - this.connectionStartTime;
      logger.info(`Redis connected successfully in ${connectionTime}ms`);
      
      return true;

    } catch (error) {
      this.connectionMetrics.failedConnections++;
      this.connectionMetrics.lastError = error.message;
      
      logger.error(`Redis connection failed (attempt ${this.connectionAttempts}/${this.maxRetries}):`, error.message);

      if (this.connectionAttempts < this.maxRetries) {
        const delay = this.calculateRetryDelay();
        logger.info(`Retrying Redis connection in ${delay}ms...`);
        
        setTimeout(() => {
          this.connect();
        }, delay);
      } else {
        logger.error('Max Redis connection attempts reached. Redis will be disabled.');
        this.isConnected = false;
      }

      return false;
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  calculateRetryDelay() {
    const exponentialDelay = this.retryDelay * Math.pow(2, this.connectionAttempts - 1);
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    const delay = Math.min(exponentialDelay + jitter, this.maxRetryDelay);
    return Math.floor(delay);
  }

  /**
   * Set up Redis event listeners
   */
  setupEventListeners() {
    if (!this.redis) return;

    this.redis.on('connect', () => {
      logger.info('Redis connection established');
      this.isConnected = true;
    });

    this.redis.on('ready', () => {
      logger.info('Redis is ready to receive commands');
      this.isConnected = true;
    });

    this.redis.on('error', (error) => {
      logger.error('Redis error:', error.message);
      this.isConnected = false;
      this.connectionMetrics.lastError = error.message;
    });

    this.redis.on('close', () => {
      logger.warn('Redis connection closed');
      this.isConnected = false;
    });

    this.redis.on('reconnecting', (delay) => {
      logger.info(`Redis reconnecting in ${delay}ms...`);
      this.connectionMetrics.reconnections++;
    });

    this.redis.on('end', () => {
      logger.warn('Redis connection ended');
      this.isConnected = false;
    });
  }

  /**
   * Check if Redis is available and connected
   */
  isAvailable() {
    return !!(this.redis && this.isConnected);
  }

  /**
   * Test Redis connection (alias for ping)
   */
  async testConnection() {
    return await this.ping();
  }

  /**
   * Ping Redis to check connection health
   */
  async ping() {
    if (!this.isAvailable()) {
      throw new Error('Redis is not available');
    }

    try {
      const startTime = Date.now();
      const result = await this.redis.ping();
      const responseTime = Date.now() - startTime;
      
      this.lastPingTime = Date.now();
      
      return {
        success: true,
        responseTime,
        result
      };
    } catch (error) {
      logger.error('Redis ping failed:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Get Redis connection status and metrics
   */
  getStatus() {
    const status = {
      connected: this.isConnected,
      available: this.isAvailable(),
      connectionAttempts: this.connectionAttempts,
      metrics: { ...this.connectionMetrics },
      lastPingTime: this.lastPingTime,
      uptime: this.connectionStartTime ? Date.now() - this.connectionStartTime : 0
    };

    if (this.redis) {
      status.serverInfo = {
        host: this.redis.options.host || 'unknown',
        port: this.redis.options.port || 'unknown',
        db: this.redis.options.db || 0
      };
    }

    return status;
  }

  /**
   * Get detailed Redis information
   */
  async getInfo() {
    if (!this.isAvailable()) {
      return {
        available: false,
        error: 'Redis is not available'
      };
    }

    try {
      const [info, memory, keyspace] = await Promise.all([
        this.redis.info(),
        this.redis.info('memory'),
        this.redis.info('keyspace')
      ]);

      // Parse memory info
      const memoryLines = memory.split('\r\n');
      const memoryInfo = {};
      memoryLines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          if (key.startsWith('used_memory')) {
            memoryInfo[key] = value;
          }
        }
      });

      // Parse keyspace info
      const keyspaceLines = keyspace.split('\r\n');
      const keyspaceInfo = {};
      keyspaceLines.forEach(line => {
        if (line.startsWith('db')) {
          const [db, stats] = line.split(':');
          keyspaceInfo[db] = stats;
        }
      });

      return {
        available: true,
        connected: this.isConnected,
        memory: memoryInfo,
        keyspace: keyspaceInfo,
        serverInfo: info.split('\r\n').slice(0, 10).join('\n'), // First 10 lines of server info
        status: this.getStatus()
      };

    } catch (error) {
      logger.error('Failed to get Redis info:', error.message);
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Safe Redis operations with fallback
   */
  async get(key) {
    if (!this.isAvailable()) {
      logger.debug(`Redis not available for GET ${key}`);
      return null;
    }

    try {
      return await this.redis.get(key);
    } catch (error) {
      logger.error(`Redis GET failed for key ${key}:`, error.message);
      return null;
    }
  }

  async set(key, value, ttl = null) {
    if (!this.isAvailable()) {
      logger.debug(`Redis not available for SET ${key}`);
      return false;
    }

    try {
      if (ttl) {
        await this.redis.setex(key, ttl, value);
      } else {
        await this.redis.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error(`Redis SET failed for key ${key}:`, error.message);
      return false;
    }
  }

  async del(key) {
    if (!this.isAvailable()) {
      logger.debug(`Redis not available for DEL ${key}`);
      return false;
    }

    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      logger.error(`Redis DEL failed for key ${key}:`, error.message);
      return false;
    }
  }

  async exists(key) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXISTS failed for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Start health monitoring with automatic reconnection
   */
  startHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        if (this.isAvailable()) {
          // Perform health check ping
          await this.ping();
          logger.debug('Redis health check passed');
        } else if (!this.isConnected && this.connectionAttempts === 0) {
          // Attempt reconnection if not connected and not currently trying
          logger.info('Redis health check detected disconnection, attempting reconnection...');
          this.connect();
        }
      } catch (error) {
        logger.warn('Redis health check failed:', error.message);
        this.isConnected = false;
        
        // Attempt reconnection
        if (this.connectionAttempts === 0) {
          logger.info('Attempting Redis reconnection due to health check failure...');
          this.connect();
        }
      }
    }, this.healthCheckFrequency);

    logger.info(`Redis health monitoring started (interval: ${this.healthCheckFrequency}ms)`);
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      logger.info('Redis health monitoring stopped');
    }
  }

  /**
   * Force reconnection (useful for manual recovery)
   */
  async forceReconnect() {
    logger.info('Forcing Redis reconnection...');
    
    // Disconnect current connection
    if (this.redis) {
      try {
        this.redis.disconnect();
      } catch (error) {
        // Ignore disconnect errors
      }
    }
    
    // Reset state
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.redis = null;
    
    // Attempt new connection
    return await this.connect();
  }

  /**
   * Graceful shutdown
   */
  async disconnect() {
    // Stop health monitoring
    this.stopHealthMonitoring();
    
    if (this.redis) {
      try {
        logger.info('Disconnecting from Redis...');
        await this.redis.quit();
        this.isConnected = false;
        logger.info('Redis disconnected successfully');
      } catch (error) {
        logger.error('Error disconnecting from Redis:', error.message);
        // Force disconnect if graceful quit fails
        this.redis.disconnect();
      }
    }
  }
}

// Create singleton instance
const redisService = new RedisService();

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  await redisService.disconnect();
});

process.on('SIGINT', async () => {
  await redisService.disconnect();
});

export default redisService;