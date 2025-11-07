import { logger } from '../utils/logger.js';
import express from 'express';

/**
 * Backend Service - Manages Express.js backend application
 */
class BackendService {
  constructor() {
    this.name = 'backend';
    this.app = null;
    this.isInitialized = false;
    this.routesLoaded = false;
  }

  async start() {
    logger.info('🚀 Starting backend service...');
    
    try {
      // Import the backend app with detailed error logging
      logger.info('📦 Importing backend app.js...');
      const appModule = await import('../app.js');
      console.log('📦 [BACKEND] App module imported:', Object.keys(appModule));
      
      const app = appModule.app || appModule.default;
      
      if (!app) {
        logger.error('❌ Backend app not found in module exports', {
          availableExports: Object.keys(appModule)
        });
        throw new Error('Backend app not available');
      }

      this.app = app;
      this.isInitialized = true;
      this.routesLoaded = true;
      
      logger.info('✅ Backend service started successfully');
      
    } catch (error) {
      console.error('💥 [BACKEND] Service startup failed:', error.message);
      console.error('💥 [BACKEND] Stack:', error.stack);
      logger.error('❌ Backend service startup failed', {
        error: error.message,
        stack: error.stack
      });
      
      throw error; // Backend is critical, so throw the error
    }
  }

  async stop() {
    logger.info('🛑 Stopping backend service...');
    
    try {
      // Express doesn't have a built-in stop method
      // The actual server stopping is handled by the unified server
      this.app = null;
      this.isInitialized = false;
      this.routesLoaded = false;
      
      logger.info('✅ Backend service stopped');
    } catch (error) {
      logger.error('❌ Error stopping backend service', { error: error.message });
      throw error;
    }
  }

  async getHealth() {
    try {
      if (!this.isInitialized || !this.app) {
        return {
          status: 'unhealthy',
          details: {
            initialized: false,
            routesLoaded: false,
            error: 'Backend not initialized'
          }
        };
      }

      // Check if app has the expected structure
      const hasRoutes = this.app._router && this.app._router.stack && this.app._router.stack.length > 0;

      return {
        status: 'healthy',
        details: {
          initialized: true,
          routesLoaded: hasRoutes,
          routeCount: hasRoutes ? this.app._router.stack.length : 0,
          environment: process.env.NODE_ENV || 'development'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          initialized: false,
          error: error.message
        }
      };
    }
  }

  /**
   * Get Express app instance
   */
  getApp() {
    if (!this.isInitialized || !this.app) {
      throw new Error('Backend not initialized');
    }
    return this.app;
  }

  /**
   * Handle HTTP requests
   */
  async handleRequest(req, res) {
    if (!this.isInitialized || !this.app) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Backend service not available',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    try {
      this.app(req, res);
    } catch (error) {
      logger.error('❌ Backend request handling error', {
        error: error.message,
        url: req.url,
        method: req.method
      });
      
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          error: 'Internal server error',
          timestamp: new Date().toISOString()
        }));
      }
    }
  }

  /**
   * Check if backend is available
   */
  isAvailable() {
    return this.isInitialized && !!this.app;
  }
}

export default BackendService;