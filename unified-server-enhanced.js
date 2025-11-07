import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

// Import environment configuration (must be first)
import { validateEnvironment } from './apps/backend/src/config/environmentValidator.js';
import { applyEnvironmentDefaults } from './apps/backend/src/config/environmentDefaults.js';

// Import service management
import ServiceManager from './apps/backend/src/services/serviceManager.js';
import ErrorRecoveryService, { 
  RedisRecoveryStrategy, 
  SocketIORecoveryStrategy, 
  NextJSRecoveryStrategy 
} from './apps/backend/src/services/errorRecoveryService.js';

// Import individual services
import DatabaseService from './apps/backend/src/services/databaseService.js';
import RedisServiceWrapper from './apps/backend/src/services/redisServiceWrapper.js';
import NextJSService from './apps/backend/src/services/nextjsService.js';
import SocketIOService from './apps/backend/src/services/socketService.js';
import BackendService from './apps/backend/src/services/backendService.js';
import MaintenancePageService from './apps/backend/src/services/maintenancePageService.js';

// Import logging
import { logger } from './apps/backend/src/utils/logger.js';
import { ServiceLoggerFactory, serviceEventLogger } from './apps/backend/src/utils/serviceLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Enhanced Unified Server with Service Isolation and Graceful Degradation
 */
class EnhancedUnifiedServer {
  constructor() {
    this.serviceManager = new ServiceManager();
    this.errorRecovery = new ErrorRecoveryService(this.serviceManager);
    this.httpServer = null;
    this.isStarted = false;
    this.startupTime = null;
    
    // Configuration
    this.hostname = process.env.HOSTNAME || '0.0.0.0';
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.frontendDir = path.join(__dirname, 'apps/frontend');
    
    // Service instances
    this.services = {
      database: new DatabaseService(),
      redis: new RedisServiceWrapper(),
      backend: new BackendService(),
      nextjs: new NextJSService({
        frontendDir: this.frontendDir,
        hostname: this.hostname,
        port: this.port
      }),
      socketio: new SocketIOService(),
      maintenance: new MaintenancePageService()
    };
    
    this._setupServices();
    this._setupErrorRecovery();
    this._setupEventHandlers();
  }

  /**
   * Setup service registration
   */
  _setupServices() {
    // Register critical services (must start successfully)
    this.serviceManager.registerService('database', this.services.database, true);
    this.serviceManager.registerService('backend', this.services.backend, true);
    this.serviceManager.registerService('maintenance', this.services.maintenance, true);
    
    // Register non-critical services (can fail gracefully)
    this.serviceManager.registerService('redis', this.services.redis, false);
    this.serviceManager.registerService('nextjs', this.services.nextjs, false);
    this.serviceManager.registerService('socketio', this.services.socketio, false);
    
    logger.info('🔧 Services registered with service manager');
  }

  /**
   * Setup error recovery strategies
   */
  _setupErrorRecovery() {
    this.errorRecovery.registerRecoveryStrategy('redis', new RedisRecoveryStrategy());
    this.errorRecovery.registerRecoveryStrategy('socketio', new SocketIORecoveryStrategy());
    this.errorRecovery.registerRecoveryStrategy('nextjs', new NextJSRecoveryStrategy());
    
    logger.info('🔄 Error recovery strategies configured');
  }

  /**
   * Setup event handlers
   */
  _setupEventHandlers() {
    // Service manager events
    this.serviceManager.on('serviceStarted', (event) => {
      serviceEventLogger.logEvent(event.name, 'started', { critical: event.critical });
    });

    this.serviceManager.on('serviceFailed', (event) => {
      serviceEventLogger.logEvent(event.name, 'failed', { 
        critical: event.critical, 
        error: event.error 
      });
    });

    // Error recovery events
    this.errorRecovery.on('serviceFailure', (event) => {
      logger.warn(`🚨 Service failure detected: ${event.name}`, event);
    });

    this.errorRecovery.on('serviceRecovery', (event) => {
      logger.info(`✅ Service recovered: ${event.name}`, event);
    });

    this.errorRecovery.on('criticalServiceFailure', (event) => {
      logger.error(`💥 Critical service failure: ${event.name} - shutting down`, event);
      this._handleCriticalFailure(event);
    });

    // Process event handlers
    process.on('SIGTERM', () => this._gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this._gracefulShutdown('SIGINT'));
    process.on('uncaughtException', (error) => this._handleUncaughtException(error));
    process.on('unhandledRejection', (reason, promise) => this._handleUnhandledRejection(reason, promise));
  }

  /**
   * Start the unified server
   */
  async start() {
    try {
      this.startupTime = new Date();
      logger.info('🚀 Starting Enhanced Unified Server...');
      
      // Apply environment defaults and validate (must be first)
      logger.info('⚙️  Configuring environment...');
      try {
        applyEnvironmentDefaults();
        validateEnvironment();
      } catch (envError) {
        logger.error('❌ Environment configuration failed', {
          error: envError.message,
          stack: envError.stack
        });
        throw envError;
      }
      
      logger.info(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌐 Hostname: ${this.hostname}`);
      logger.info(`🔌 Port: ${this.port}`);

      // Start all services with better error handling
      logger.info('🔧 Starting services...');
      logger.info('📋 Registered services:', {
        critical: Array.from(this.serviceManager.criticalServices || []),
        nonCritical: Array.from(this.serviceManager.nonCriticalServices || [])
      });
      
      let serviceResults;
      try {
        logger.info('⏳ Calling startAllServices()...');
        serviceResults = await this.serviceManager.startAllServices();
        logger.info('✅ startAllServices() completed', serviceResults);
      } catch (serviceError) {
        logger.error('❌ Service startup failed', {
          error: serviceError.message,
          stack: serviceError.stack
        });
        // Log which services failed
        try {
          const healthCheck = await this.serviceManager.getHealthCheck();
          logger.error('📊 Service status:', healthCheck);
        } catch (healthError) {
          logger.error('❌ Failed to get health check:', healthError.message);
        }
        throw serviceError;
      }
      
      // Create HTTP server
      this.httpServer = createServer((req, res) => this._handleRequest(req, res));

      // Start Socket.IO if available
      if (this.services.socketio.isAvailable()) {
        try {
          await this.services.socketio.start(this.httpServer);
          
          // Make Socket.IO available to backend
          if (this.services.backend.isAvailable()) {
            const backendApp = this.services.backend.getApp();
            backendApp.set('io', this.services.socketio.getIO());
          }
        } catch (socketError) {
          logger.warn('⚠️ Socket.IO startup failed, continuing without real-time features', {
            error: socketError.message
          });
        }
      }

      // Start HTTP server
      try {
        await this._startHttpServer();
      } catch (serverError) {
        logger.error('❌ HTTP server startup failed', {
          error: serverError.message,
          stack: serverError.stack
        });
        throw serverError;
      }
      
      // Start error recovery monitoring
      this.errorRecovery.startMonitoring(30000); // Check every 30 seconds
      
      this.isStarted = true;
      const startupDuration = Date.now() - this.startupTime.getTime();
      
      logger.info(`✅ Enhanced Unified Server started successfully in ${startupDuration}ms`);
      logger.info(`🔌 API available at http://${this.hostname}:${this.port}/api`);
      logger.info(`🏥 Health check available at http://${this.hostname}:${this.port}/api/health`);
      
      // Log service status
      const healthCheck = await this.serviceManager.getHealthCheck();
      logger.info(`📊 Service Status: ${healthCheck.runningServices}/${healthCheck.totalServices} services running`);
      
      return serviceResults;
      
    } catch (error) {
      logger.error('❌ Failed to start Enhanced Unified Server', {
        error: error.message,
        stack: error.stack
      });
      
      await this._cleanup();
      throw error;
    }
  }

  /**
   * Handle HTTP requests with service isolation
   */
  async _handleRequest(req, res) {
    try {
      // Add request ID for tracing
      req.requestId = this._generateRequestId();
      
      // Log request (debug level)
      logger.debug('📥 Request received', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent']
      });

      // Health check endpoint (always available)
      if (req.url === '/api/health' || req.url === '/health') {
        return this._handleHealthCheck(req, res);
      }

      // API requests
      if (req.url && req.url.startsWith('/api')) {
        return this._handleAPIRequest(req, res);
      }

      // Frontend requests
      return this._handleFrontendRequest(req, res);
      
    } catch (error) {
      logger.error('❌ Request handling error', {
        requestId: req.requestId,
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method
      });
      
      this._handleRequestError(req, res, error);
    }
  }

  /**
   * Handle API requests
   */
  async _handleAPIRequest(req, res) {
    if (!this.services.backend.isAvailable()) {
      logger.warn('⚠️ Backend service unavailable for API request', {
        requestId: req.requestId,
        url: req.url
      });
      
      return this.services.maintenance.serveAPIMaintenance(req, res, {
        reason: 'Backend service temporarily unavailable'
      });
    }

    try {
      await this.services.backend.handleRequest(req, res);
    } catch (error) {
      logger.error('❌ Backend request handling failed', {
        requestId: req.requestId,
        error: error.message,
        url: req.url
      });
      
      this.services.maintenance.serveAPIMaintenance(req, res, {
        reason: 'API request processing failed'
      });
    }
  }

  /**
   * Handle frontend requests
   */
  async _handleFrontendRequest(req, res) {
    if (!this.services.nextjs.isAvailable()) {
      logger.warn('⚠️ Next.js service unavailable for frontend request', {
        requestId: req.requestId,
        url: req.url
      });
      
      const apiStatus = this.services.backend.isAvailable() ? 'operational' : 'degraded';
      
      return this.services.maintenance.serveFrontendMaintenance(req, res, {
        reason: 'Frontend temporarily unavailable while we make improvements',
        apiStatus,
        showApiInfo: this.services.backend.isAvailable()
      });
    }

    try {
      await this.services.nextjs.handleRequest(req, res);
    } catch (error) {
      logger.error('❌ Next.js request handling failed', {
        requestId: req.requestId,
        error: error.message,
        url: req.url
      });
      
      this.services.maintenance.serveFrontendMaintenance(req, res, {
        reason: 'Frontend request processing failed'
      });
    }
  }

  /**
   * Handle health check requests
   */
  async _handleHealthCheck(req, res) {
    try {
      const healthCheck = await this.serviceManager.getHealthCheck();
      const recoveryStatus = this.errorRecovery.getRecoveryStatus();
      
      // Import environment status functions
      const { getEnvironmentStatus } = await import('./apps/backend/src/config/environmentValidator.js');
      const { getConfigurationStatus } = await import('./apps/backend/src/config/environmentDefaults.js');
      
      const environmentStatus = getEnvironmentStatus();
      const configurationStatus = getConfigurationStatus();
      
      // Determine overall status
      let overallStatus = 'healthy';
      if (!healthCheck.criticalServicesHealthy || !environmentStatus.valid) {
        overallStatus = 'unhealthy';
      } else if (healthCheck.status === 'degraded' || environmentStatus.warningCount > 0) {
        overallStatus = 'degraded';
      }

      const response = {
        status: overallStatus,
        timestamp: healthCheck.timestamp,
        uptime: this.startupTime ? Date.now() - this.startupTime.getTime() : 0,
        environment: {
          name: environmentStatus.environment,
          isRailway: environmentStatus.isRailway,
          valid: environmentStatus.valid,
          errors: environmentStatus.errorCount,
          warnings: environmentStatus.warningCount,
          defaultsApplied: environmentStatus.defaultsApplied
        },
        version: process.env.npm_package_version || '1.0.0',
        server: {
          hostname: this.hostname,
          port: this.port,
          started: this.isStarted,
          startupTime: this.startupTime?.toISOString()
        },
        services: healthCheck.services,
        summary: {
          total: healthCheck.totalServices,
          running: healthCheck.runningServices,
          critical: Array.from(this.serviceManager.criticalServices).length,
          nonCritical: Array.from(this.serviceManager.nonCriticalServices).length
        },
        recovery: {
          monitoring: recoveryStatus.monitoring,
          failedServices: recoveryStatus.totalFailedServices,
          services: recoveryStatus.services
        },
        configuration: configurationStatus
      };

      // Set appropriate status code
      const statusCode = overallStatus === 'healthy' ? 200 : 
                        overallStatus === 'degraded' ? 200 : 503;

      res.statusCode = statusCode;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.end(JSON.stringify(response, null, 2));
      
    } catch (error) {
      logger.error('❌ Health check failed', {
        error: error.message,
        stack: error.stack
      });
      
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        status: 'error',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      }));
    }
  }

  /**
   * Handle request errors
   */
  _handleRequestError(req, res, error) {
    if (res.headersSent) {
      return;
    }

    const isApiRequest = req.url && req.url.startsWith('/api');
    
    if (isApiRequest) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Internal server error',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      }));
    } else {
      this.services.maintenance.serveFrontendMaintenance(req, res, {
        reason: 'An unexpected error occurred'
      });
    }
  }

  /**
   * Start HTTP server
   */
  async _startHttpServer() {
    return new Promise((resolve, reject) => {
      logger.info(`🔌 Starting HTTP server on ${this.hostname}:${this.port}...`);
      this.httpServer.listen(this.port, this.hostname, (error) => {
        if (error) {
          logger.error(`❌ HTTP server failed to listen: ${error.message}`, {
            error: error.message,
            stack: error.stack,
            port: this.port,
            hostname: this.hostname
          });
          reject(error);
        } else {
          logger.info(`✅ HTTP server listening on ${this.hostname}:${this.port}`);
          resolve();
        }
      });
      
      // Add error handler for server errors
      this.httpServer.on('error', (error) => {
        logger.error(`❌ HTTP server error: ${error.message}`, {
          error: error.message,
          stack: error.stack,
          code: error.code
        });
      });
    });
  }

  /**
   * Handle critical service failures
   */
  async _handleCriticalFailure(event) {
    logger.error(`💥 Critical service failure detected: ${event.name}`, event);
    
    // Give some time for logging to complete
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }

  /**
   * Handle uncaught exceptions
   */
  _handleUncaughtException(error) {
    logger.error('💥 Uncaught Exception', {
      error: error.message,
      stack: error.stack
    });
    
    this._gracefulShutdown('uncaughtException');
  }

  /**
   * Handle unhandled promise rejections
   */
  _handleUnhandledRejection(reason, promise) {
    logger.error('💥 Unhandled Promise Rejection', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise.toString()
    });
    
    this._gracefulShutdown('unhandledRejection');
  }

  /**
   * Graceful shutdown
   */
  async _gracefulShutdown(signal) {
    logger.info(`🛑 Graceful shutdown initiated (${signal})`);
    
    try {
      // Stop accepting new connections
      if (this.httpServer) {
        this.httpServer.close();
      }
      
      // Stop error recovery monitoring
      this.errorRecovery.stopMonitoring();
      
      // Stop all services
      await this.serviceManager.stopAllServices();
      
      logger.info('✅ Graceful shutdown completed');
      process.exit(0);
      
    } catch (error) {
      logger.error('❌ Error during graceful shutdown', {
        error: error.message,
        stack: error.stack
      });
      process.exit(1);
    }
  }

  /**
   * Cleanup resources
   */
  async _cleanup() {
    try {
      if (this.httpServer) {
        this.httpServer.close();
      }
      
      this.errorRecovery.stopMonitoring();
      await this.serviceManager.stopAllServices();
      
    } catch (error) {
      logger.error('❌ Cleanup error', { error: error.message });
    }
  }

  /**
   * Generate unique request ID
   */
  _generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get server status
   */
  async getStatus() {
    const healthCheck = await this.serviceManager.getHealthCheck();
    const recoveryStatus = this.errorRecovery.getRecoveryStatus();
    
    return {
      server: {
        started: this.isStarted,
        uptime: this.startupTime ? Date.now() - this.startupTime.getTime() : 0,
        startupTime: this.startupTime?.toISOString()
      },
      services: healthCheck,
      recovery: recoveryStatus
    };
  }
}

// Create and start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith('unified-server-enhanced.js')) {
  logger.info('🎬 Initializing Enhanced Unified Server...');
  const server = new EnhancedUnifiedServer();
  
  logger.info('🚀 Calling server.start()...');
  server.start().catch((error) => {
    logger.error('💥 Server startup failed', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  });
} else {
  logger.info('📦 Enhanced Unified Server module loaded (not starting automatically)');
}

export default EnhancedUnifiedServer;