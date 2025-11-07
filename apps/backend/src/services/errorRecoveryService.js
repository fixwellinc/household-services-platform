import { logger } from '../utils/logger.js';
import { EventEmitter } from 'events';

/**
 * Error Recovery Service - Handles service failures and recovery strategies
 */
class ErrorRecoveryService extends EventEmitter {
  constructor(serviceManager) {
    super();
    this.serviceManager = serviceManager;
    this.recoveryStrategies = new Map();
    this.recoveryAttempts = new Map();
    this.maxRecoveryAttempts = 3;
    this.recoveryDelay = 5000; // 5 seconds
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  /**
   * Register recovery strategy for a service
   */
  registerRecoveryStrategy(serviceName, strategy) {
    this.recoveryStrategies.set(serviceName, strategy);
    logger.info(`Recovery strategy registered for service: ${serviceName}`);
  }

  /**
   * Start monitoring services for failures
   */
  startMonitoring(intervalMs = 30000) {
    if (this.isMonitoring) {
      logger.warn('Error recovery monitoring already started');
      return;
    }

    this.isMonitoring = true;
    logger.info(`🔍 Starting error recovery monitoring (interval: ${intervalMs}ms)`);

    this.monitoringInterval = setInterval(async () => {
      await this._checkServiceHealth();
    }, intervalMs);

    // Listen to service manager events
    this.serviceManager.on('serviceFailed', this._handleServiceFailure.bind(this));
    this.serviceManager.on('serviceStarted', this._handleServiceRecovery.bind(this));
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.serviceManager.removeAllListeners('serviceFailed');
    this.serviceManager.removeAllListeners('serviceStarted');
    
    logger.info('🛑 Error recovery monitoring stopped');
  }

  /**
   * Handle service failure
   */
  async _handleServiceFailure(event) {
    const { name, critical, error } = event;
    
    logger.error(`🚨 Service failure detected: ${name}`, {
      critical,
      error,
      timestamp: new Date().toISOString()
    });

    // Emit failure event for external handlers
    this.emit('serviceFailure', event);

    // Don't attempt recovery for critical services during startup
    // They should fail fast and stop the application
    if (critical) {
      logger.error(`❌ Critical service ${name} failed - application should stop`);
      this.emit('criticalServiceFailure', event);
      return;
    }

    // Attempt recovery for non-critical services
    await this._attemptRecovery(name, error);
  }

  /**
   * Handle service recovery
   */
  _handleServiceRecovery(event) {
    const { name } = event;
    
    // Reset recovery attempts on successful start
    this.recoveryAttempts.delete(name);
    
    logger.info(`✅ Service recovered: ${name}`);
    this.emit('serviceRecovery', event);
  }

  /**
   * Attempt to recover a failed service
   */
  async _attemptRecovery(serviceName, error) {
    const attempts = this.recoveryAttempts.get(serviceName) || 0;
    
    if (attempts >= this.maxRecoveryAttempts) {
      logger.error(`❌ Max recovery attempts reached for service: ${serviceName}`);
      this.emit('recoveryFailed', { serviceName, attempts, error });
      return;
    }

    const newAttempts = attempts + 1;
    this.recoveryAttempts.set(serviceName, newAttempts);

    logger.info(`🔄 Attempting recovery for service: ${serviceName} (attempt ${newAttempts}/${this.maxRecoveryAttempts})`);

    try {
      // Apply custom recovery strategy if available
      const strategy = this.recoveryStrategies.get(serviceName);
      if (strategy) {
        await strategy.recover(error);
      }

      // Wait before attempting restart
      await this._delay(this.recoveryDelay * newAttempts); // Exponential backoff

      // Attempt to restart the service
      const result = await this.serviceManager.restartService(serviceName);
      
      if (result.success) {
        logger.info(`✅ Service recovery successful: ${serviceName}`);
        this.recoveryAttempts.delete(serviceName);
        this.emit('recoverySuccess', { serviceName, attempts: newAttempts });
      } else {
        logger.error(`❌ Service recovery failed: ${serviceName}`, { error: result.error });
        // Will retry on next monitoring cycle if under max attempts
      }
      
    } catch (recoveryError) {
      logger.error(`❌ Recovery attempt failed for service: ${serviceName}`, {
        attempt: newAttempts,
        error: recoveryError.message,
        originalError: error
      });
    }
  }

  /**
   * Check health of all services
   */
  async _checkServiceHealth() {
    try {
      const healthCheck = await this.serviceManager.getHealthCheck();
      
      // Check for services that have become unhealthy
      for (const [serviceName, serviceHealth] of Object.entries(healthCheck.services)) {
        if (serviceHealth.status === 'unhealthy' && !serviceHealth.critical) {
          // Only attempt recovery for non-critical services
          const currentAttempts = this.recoveryAttempts.get(serviceName) || 0;
          
          if (currentAttempts < this.maxRecoveryAttempts) {
            logger.warn(`⚠️ Unhealthy service detected: ${serviceName}`);
            await this._attemptRecovery(serviceName, serviceHealth.error || 'Health check failed');
          }
        }
      }
      
    } catch (error) {
      logger.error('❌ Error during health check monitoring', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Get recovery status for all services
   */
  getRecoveryStatus() {
    const status = {};
    
    for (const [serviceName, attempts] of this.recoveryAttempts.entries()) {
      status[serviceName] = {
        attempts,
        maxAttempts: this.maxRecoveryAttempts,
        canRecover: attempts < this.maxRecoveryAttempts,
        hasStrategy: this.recoveryStrategies.has(serviceName)
      };
    }
    
    return {
      monitoring: this.isMonitoring,
      services: status,
      totalFailedServices: this.recoveryAttempts.size
    };
  }

  /**
   * Reset recovery attempts for a service
   */
  resetRecoveryAttempts(serviceName) {
    this.recoveryAttempts.delete(serviceName);
    logger.info(`Recovery attempts reset for service: ${serviceName}`);
  }

  /**
   * Reset all recovery attempts
   */
  resetAllRecoveryAttempts() {
    this.recoveryAttempts.clear();
    logger.info('All recovery attempts reset');
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Recovery Strategy Classes
 */

class RedisRecoveryStrategy {
  async recover(error) {
    logger.info('🔴 Applying Redis recovery strategy');
    
    // Redis-specific recovery logic
    // Could include clearing connection pools, resetting configuration, etc.
    
    // For now, just log the strategy application
    logger.info('Redis recovery strategy applied - will attempt reconnection');
  }
}

class SocketIORecoveryStrategy {
  async recover(error) {
    logger.info('🔌 Applying Socket.IO recovery strategy');
    
    // Socket.IO-specific recovery logic
    // Could include clearing connection pools, resetting namespaces, etc.
    
    logger.info('Socket.IO recovery strategy applied - will attempt restart');
  }
}

class NextJSRecoveryStrategy {
  async recover(error) {
    logger.info('⚛️ Applying Next.js recovery strategy');
    
    // Next.js-specific recovery logic
    // Could include clearing build cache, checking file system, etc.
    
    logger.info('Next.js recovery strategy applied - will attempt restart');
  }
}

export default ErrorRecoveryService;
export { RedisRecoveryStrategy, SocketIORecoveryStrategy, NextJSRecoveryStrategy };