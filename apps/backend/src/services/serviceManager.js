import { logger } from '../utils/logger.js';
import { EventEmitter } from 'events';

/**
 * Service Manager - Handles service lifecycle and isolation
 * Provides graceful degradation for non-critical services
 */
class ServiceManager extends EventEmitter {
  constructor() {
    super();
    this.services = new Map();
    this.serviceStatus = new Map();
    this.criticalServices = new Set();
    this.nonCriticalServices = new Set();
    this.startupTimeout = 30000; // 30 seconds
    this.retryAttempts = 3;
    this.retryDelay = 2000; // 2 seconds
  }

  /**
   * Register a service with the manager
   * @param {string} name - Service name
   * @param {Object} service - Service instance
   * @param {boolean} critical - Whether service is critical for startup
   */
  registerService(name, service, critical = false) {
    this.services.set(name, service);
    this.serviceStatus.set(name, {
      status: 'not_started',
      lastError: null,
      startTime: null,
      retryCount: 0,
      critical
    });

    if (critical) {
      this.criticalServices.add(name);
    } else {
      this.nonCriticalServices.add(name);
    }

    logger.info(`Service registered: ${name} (${critical ? 'critical' : 'non-critical'})`);
  }

  /**
   * Start all services with proper error handling
   */
  async startAllServices() {
    logger.info('🚀 Starting all services...');
    
    // Start critical services first
    const criticalResults = await this._startServiceGroup(Array.from(this.criticalServices), true);
    
    // Check if any critical services failed
    const failedCritical = criticalResults.filter(result => !result.success);
    if (failedCritical.length > 0) {
      const errorMessage = `Critical services failed to start: ${failedCritical.map(r => r.name).join(', ')}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Start non-critical services (failures are logged but don't stop startup)
    const nonCriticalResults = await this._startServiceGroup(Array.from(this.nonCriticalServices), false);
    const failedNonCritical = nonCriticalResults.filter(result => !result.success);
    
    if (failedNonCritical.length > 0) {
      logger.warn(`Non-critical services failed to start (continuing anyway): ${failedNonCritical.map(r => r.name).join(', ')}`);
    }

    const totalServices = this.services.size;
    const successfulServices = criticalResults.filter(r => r.success).length + nonCriticalResults.filter(r => r.success).length;
    
    logger.info(`✅ Service startup complete: ${successfulServices}/${totalServices} services started`);
    
    return {
      success: true,
      totalServices,
      successfulServices,
      criticalServices: criticalResults,
      nonCriticalServices: nonCriticalResults
    };
  }

  /**
   * Start a group of services
   * @param {string[]} serviceNames - Array of service names to start
   * @param {boolean} critical - Whether these are critical services
   */
  async _startServiceGroup(serviceNames, critical) {
    const results = [];
    
    for (const serviceName of serviceNames) {
      const result = await this._startService(serviceName, critical);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Start an individual service with retry logic
   * @param {string} serviceName - Name of the service to start
   * @param {boolean} critical - Whether this is a critical service
   */
  async _startService(serviceName, critical) {
    const service = this.services.get(serviceName);
    const status = this.serviceStatus.get(serviceName);
    
    if (!service) {
      logger.error(`Service not found: ${serviceName}`);
      return { name: serviceName, success: false, error: 'Service not found' };
    }

    logger.info(`Starting ${critical ? 'critical' : 'non-critical'} service: ${serviceName}`);
    status.status = 'starting';
    status.startTime = new Date();

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        // Start the service with timeout
        await this._startServiceWithTimeout(service, serviceName);
        
        status.status = 'running';
        status.lastError = null;
        status.retryCount = attempt - 1;
        
        logger.info(`✅ Service started successfully: ${serviceName} (attempt ${attempt})`);
        this.emit('serviceStarted', { name: serviceName, critical });
        
        return { name: serviceName, success: true, attempt };
      } catch (error) {
        status.lastError = error.message;
        status.retryCount = attempt;
        
        logger.error(`❌ Service startup failed: ${serviceName} (attempt ${attempt}/${this.retryAttempts})`, {
          error: error.message,
          stack: error.stack
        });

        if (attempt < this.retryAttempts) {
          logger.info(`⏳ Retrying ${serviceName} in ${this.retryDelay}ms...`);
          await this._delay(this.retryDelay * attempt); // Exponential backoff
        }
      }
    }

    // All attempts failed
    status.status = 'failed';
    this.emit('serviceFailed', { name: serviceName, critical, error: status.lastError });
    
    return { 
      name: serviceName, 
      success: false, 
      error: status.lastError,
      attempts: this.retryAttempts
    };
  }

  /**
   * Start a service with timeout protection
   */
  async _startServiceWithTimeout(service, serviceName) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Service startup timeout: ${serviceName}`));
      }, this.startupTimeout);

      const startPromise = service.start ? service.start() : Promise.resolve();
      
      startPromise
        .then(() => {
          clearTimeout(timeout);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Get the status of all services
   */
  getServiceStatus() {
    const status = {};
    
    for (const [name, serviceStatus] of this.serviceStatus.entries()) {
      status[name] = {
        ...serviceStatus,
        uptime: serviceStatus.startTime ? Date.now() - serviceStatus.startTime.getTime() : 0
      };
    }
    
    return status;
  }

  /**
   * Get health check information for all services
   */
  async getHealthCheck() {
    const services = {};
    const overall = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      criticalServicesHealthy: true,
      totalServices: this.services.size,
      runningServices: 0
    };

    for (const [name, service] of this.services.entries()) {
      const status = this.serviceStatus.get(name);
      let healthStatus = 'unknown';
      let details = {};

      try {
        if (status.status === 'running' && service.getHealth) {
          const health = await service.getHealth();
          healthStatus = health.status || 'healthy';
          details = health.details || {};
        } else if (status.status === 'running') {
          healthStatus = 'healthy';
        } else if (status.status === 'failed') {
          healthStatus = 'unhealthy';
          details.error = status.lastError;
        } else {
          healthStatus = status.status;
        }

        if (healthStatus === 'healthy' || healthStatus === 'running') {
          overall.runningServices++;
        }

        // Check if critical services are healthy
        if (this.criticalServices.has(name) && healthStatus !== 'healthy' && healthStatus !== 'running') {
          overall.criticalServicesHealthy = false;
          overall.status = 'degraded';
        }

      } catch (error) {
        healthStatus = 'unhealthy';
        details.error = error.message;
        
        if (this.criticalServices.has(name)) {
          overall.criticalServicesHealthy = false;
          overall.status = 'degraded';
        }
      }

      services[name] = {
        status: healthStatus,
        critical: this.criticalServices.has(name),
        uptime: status.startTime ? Date.now() - status.startTime.getTime() : 0,
        retryCount: status.retryCount,
        ...details
      };
    }

    // Determine overall status
    if (!overall.criticalServicesHealthy) {
      overall.status = 'degraded';
    } else if (overall.runningServices === 0) {
      overall.status = 'unhealthy';
    }

    return { ...overall, services };
  }

  /**
   * Stop all services gracefully
   */
  async stopAllServices() {
    logger.info('🛑 Stopping all services...');
    
    const results = [];
    
    // Stop services in reverse order (non-critical first)
    for (const serviceName of [...this.nonCriticalServices, ...this.criticalServices]) {
      try {
        const service = this.services.get(serviceName);
        if (service && service.stop) {
          await service.stop();
        }
        
        const status = this.serviceStatus.get(serviceName);
        status.status = 'stopped';
        
        logger.info(`✅ Service stopped: ${serviceName}`);
        results.push({ name: serviceName, success: true });
      } catch (error) {
        logger.error(`❌ Failed to stop service: ${serviceName}`, { error: error.message });
        results.push({ name: serviceName, success: false, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Restart a specific service
   */
  async restartService(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    logger.info(`🔄 Restarting service: ${serviceName}`);
    
    // Stop the service first
    try {
      if (service.stop) {
        await service.stop();
      }
    } catch (error) {
      logger.warn(`Warning during service stop: ${serviceName}`, { error: error.message });
    }

    // Start the service again
    const critical = this.criticalServices.has(serviceName);
    const result = await this._startService(serviceName, critical);
    
    return result;
  }

  /**
   * Utility method for delays
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default ServiceManager;