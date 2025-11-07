import { logger } from './logger.js';

/**
 * Service-specific logger with categorization and structured logging
 */
class ServiceLogger {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.context = { service: serviceName };
  }

  /**
   * Log service startup
   */
  logStartup(details = {}) {
    logger.info(`🚀 Service starting: ${this.serviceName}`, {
      ...this.context,
      event: 'startup',
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log successful service start
   */
  logStartupSuccess(details = {}) {
    logger.info(`✅ Service started successfully: ${this.serviceName}`, {
      ...this.context,
      event: 'startup_success',
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log service startup failure
   */
  logStartupFailure(error, details = {}) {
    logger.error(`❌ Service startup failed: ${this.serviceName}`, {
      ...this.context,
      event: 'startup_failure',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log service shutdown
   */
  logShutdown(details = {}) {
    logger.info(`🛑 Service stopping: ${this.serviceName}`, {
      ...this.context,
      event: 'shutdown',
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log successful service shutdown
   */
  logShutdownSuccess(details = {}) {
    logger.info(`✅ Service stopped successfully: ${this.serviceName}`, {
      ...this.context,
      event: 'shutdown_success',
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log service shutdown failure
   */
  logShutdownFailure(error, details = {}) {
    logger.error(`❌ Service shutdown failed: ${this.serviceName}`, {
      ...this.context,
      event: 'shutdown_failure',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log service health check
   */
  logHealthCheck(status, details = {}) {
    const level = status === 'healthy' ? 'debug' : status === 'degraded' ? 'warn' : 'error';
    const emoji = status === 'healthy' ? '💚' : status === 'degraded' ? '💛' : '❤️';
    
    logger[level](`${emoji} Health check: ${this.serviceName} - ${status}`, {
      ...this.context,
      event: 'health_check',
      status,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log service recovery attempt
   */
  logRecoveryAttempt(attempt, maxAttempts, error, details = {}) {
    logger.warn(`🔄 Recovery attempt: ${this.serviceName} (${attempt}/${maxAttempts})`, {
      ...this.context,
      event: 'recovery_attempt',
      attempt,
      maxAttempts,
      originalError: error,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log successful service recovery
   */
  logRecoverySuccess(attempts, details = {}) {
    logger.info(`✅ Service recovered: ${this.serviceName} (after ${attempts} attempts)`, {
      ...this.context,
      event: 'recovery_success',
      attempts,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log failed service recovery
   */
  logRecoveryFailure(attempts, error, details = {}) {
    logger.error(`❌ Service recovery failed: ${this.serviceName} (after ${attempts} attempts)`, {
      ...this.context,
      event: 'recovery_failure',
      attempts,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log service degradation
   */
  logDegradation(reason, fallbackMode, details = {}) {
    logger.warn(`⚠️ Service degraded: ${this.serviceName} - ${reason}`, {
      ...this.context,
      event: 'degradation',
      reason,
      fallbackMode,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log service configuration
   */
  logConfiguration(config, details = {}) {
    logger.info(`⚙️ Service configuration: ${this.serviceName}`, {
      ...this.context,
      event: 'configuration',
      config,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log service metrics
   */
  logMetrics(metrics, details = {}) {
    logger.debug(`📊 Service metrics: ${this.serviceName}`, {
      ...this.context,
      event: 'metrics',
      metrics,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log service warning
   */
  logWarning(message, details = {}) {
    logger.warn(`⚠️ ${this.serviceName}: ${message}`, {
      ...this.context,
      event: 'warning',
      message,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log service error
   */
  logError(message, error, details = {}) {
    logger.error(`❌ ${this.serviceName}: ${message}`, {
      ...this.context,
      event: 'error',
      message,
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log service info
   */
  logInfo(message, details = {}) {
    logger.info(`ℹ️ ${this.serviceName}: ${message}`, {
      ...this.context,
      event: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Log service debug information
   */
  logDebug(message, details = {}) {
    logger.debug(`🔍 ${this.serviceName}: ${message}`, {
      ...this.context,
      event: 'debug',
      message,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext) {
    const childLogger = new ServiceLogger(this.serviceName);
    childLogger.context = { ...this.context, ...additionalContext };
    return childLogger;
  }
}

/**
 * Service Logger Factory
 */
class ServiceLoggerFactory {
  static loggers = new Map();

  /**
   * Get or create a service logger
   */
  static getLogger(serviceName) {
    if (!this.loggers.has(serviceName)) {
      this.loggers.set(serviceName, new ServiceLogger(serviceName));
    }
    return this.loggers.get(serviceName);
  }

  /**
   * Create a new logger instance (not cached)
   */
  static createLogger(serviceName) {
    return new ServiceLogger(serviceName);
  }

  /**
   * Get all service loggers
   */
  static getAllLoggers() {
    return Array.from(this.loggers.values());
  }

  /**
   * Clear all cached loggers
   */
  static clearLoggers() {
    this.loggers.clear();
  }
}

/**
 * Service Event Logger - Logs service lifecycle events
 */
class ServiceEventLogger {
  constructor() {
    this.events = [];
    this.maxEvents = 1000; // Keep last 1000 events
  }

  /**
   * Log a service event
   */
  logEvent(serviceName, eventType, data = {}) {
    const event = {
      id: this._generateEventId(),
      serviceName,
      eventType,
      timestamp: new Date().toISOString(),
      data
    };

    this.events.unshift(event);
    
    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    // Log to main logger as well
    const serviceLogger = ServiceLoggerFactory.getLogger(serviceName);
    serviceLogger.logDebug(`Event: ${eventType}`, data);

    return event;
  }

  /**
   * Get recent events for a service
   */
  getServiceEvents(serviceName, limit = 50) {
    return this.events
      .filter(event => event.serviceName === serviceName)
      .slice(0, limit);
  }

  /**
   * Get all recent events
   */
  getAllEvents(limit = 100) {
    return this.events.slice(0, limit);
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType, limit = 50) {
    return this.events
      .filter(event => event.eventType === eventType)
      .slice(0, limit);
  }

  /**
   * Clear all events
   */
  clearEvents() {
    this.events = [];
  }

  /**
   * Generate unique event ID
   */
  _generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Create singleton instance
const serviceEventLogger = new ServiceEventLogger();

export default ServiceLogger;
export { ServiceLoggerFactory, ServiceEventLogger, serviceEventLogger };