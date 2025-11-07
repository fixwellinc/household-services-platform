import { logger } from '../utils/logger.js';
import redisService from './redisService.js';

/**
 * Redis Service Wrapper - Manages Redis connections with graceful degradation
 */
class RedisServiceWrapper {
  constructor() {
    this.name = 'redis';
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 2000;
    this.fallbackMode = false;
  }

  async start() {
    logger.info('🔴 Starting Redis service...');
    
    try {
      // Try to connect to Redis
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          this.connectionAttempts = attempt;
          
          // Test Redis connection
          await redisService.testConnection();
          
          this.isConnected = true;
          this.fallbackMode = false;
          logger.info('✅ Redis service started successfully');
          return;
          
        } catch (error) {
          logger.warn(`⚠️ Redis connection attempt ${attempt}/${this.maxRetries} failed`, {
            error: error.message
          });

          if (attempt < this.maxRetries) {
            await this._delay(this.retryDelay * attempt);
          }
        }
      }

      // All attempts failed - enable fallback mode
      this.isConnected = false;
      this.fallbackMode = true;
      logger.warn('⚠️ Redis service failed to connect - enabling fallback mode (in-memory caching)');
      
      // Don't throw error for non-critical service
      return;
      
    } catch (error) {
      this.isConnected = false;
      this.fallbackMode = true;
      logger.warn('⚠️ Redis service startup failed - enabling fallback mode', {
        error: error.message
      });
      
      // Don't throw error for non-critical service
      return;
    }
  }

  async stop() {
    logger.info('🛑 Stopping Redis service...');
    
    try {
      if (this.isConnected) {
        await redisService.disconnect();
      }
      this.isConnected = false;
      this.fallbackMode = false;
      logger.info('✅ Redis service stopped');
    } catch (error) {
      logger.error('❌ Error stopping Redis service', { error: error.message });
      // Don't throw error for non-critical service
    }
  }

  async getHealth() {
    try {
      if (this.fallbackMode) {
        return {
          status: 'degraded',
          details: {
            connected: false,
            fallbackMode: true,
            connectionAttempts: this.connectionAttempts,
            message: 'Using in-memory fallback caching'
          }
        };
      }

      if (!this.isConnected) {
        return {
          status: 'unhealthy',
          details: {
            connected: false,
            fallbackMode: false,
            connectionAttempts: this.connectionAttempts,
            error: 'Redis not connected'
          }
        };
      }

      // Test Redis connection
      const start = Date.now();
      await redisService.testConnection();
      const responseTime = Date.now() - start;

      // Get Redis info
      const info = await redisService.getInfo();

      return {
        status: 'healthy',
        details: {
          connected: true,
          responseTime,
          connectionAttempts: this.connectionAttempts,
          ...info
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          error: error.message,
          connectionAttempts: this.connectionAttempts
        }
      };
    }
  }

  /**
   * Get Redis service instance
   */
  getService() {
    return redisService;
  }

  /**
   * Check if Redis is available (including fallback mode)
   */
  isAvailable() {
    return this.isConnected || this.fallbackMode;
  }

  /**
   * Check if using fallback mode
   */
  isFallbackMode() {
    return this.fallbackMode;
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default RedisServiceWrapper;