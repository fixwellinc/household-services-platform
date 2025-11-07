import { logger } from '../utils/logger.js';
import { Server as SocketIOServer } from 'socket.io';

/**
 * Socket.IO Service - Manages WebSocket connections with graceful degradation
 */
class SocketIOService {
  constructor() {
    this.name = 'socketio';
    this.io = null;
    this.server = null;
    this.isInitialized = false;
    this.connectionCount = 0;
    this.fallbackMode = false;
  }

  async start(httpServer) {
    logger.info('🔌 Starting Socket.IO service...');
    
    try {
      if (!httpServer) {
        throw new Error('HTTP server required for Socket.IO initialization');
      }

      this.server = httpServer;
      
      // Create Socket.IO server with CORS configuration
      this.io = new SocketIOServer(httpServer, {
        cors: {
          origin: process.env.FRONTEND_URL || process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
          methods: ['GET', 'POST'],
          credentials: true,
        },
        // Add connection timeout and other resilience settings
        pingTimeout: 60000,
        pingInterval: 25000,
        connectTimeout: 45000,
        transports: ['websocket', 'polling']
      });

      // Set up event handlers
      this._setupEventHandlers();
      
      this.isInitialized = true;
      this.fallbackMode = false;
      
      logger.info('✅ Socket.IO service started successfully');
      
    } catch (error) {
      logger.error('❌ Socket.IO service startup failed', {
        error: error.message,
        stack: error.stack
      });
      
      // Enable fallback mode - HTTP-only operation
      this.fallbackMode = true;
      this.isInitialized = false;
      
      logger.warn('⚠️ Socket.IO service failed - enabling HTTP-only fallback mode');
      
      // Don't throw error for non-critical service
      return;
    }
  }

  async stop() {
    logger.info('🛑 Stopping Socket.IO service...');
    
    try {
      if (this.io) {
        // Disconnect all clients gracefully
        this.io.disconnectSockets(true);
        
        // Close the server
        this.io.close();
      }
      
      this.io = null;
      this.server = null;
      this.isInitialized = false;
      this.connectionCount = 0;
      this.fallbackMode = false;
      
      logger.info('✅ Socket.IO service stopped');
    } catch (error) {
      logger.error('❌ Error stopping Socket.IO service', { error: error.message });
      // Don't throw error for non-critical service
    }
  }

  async getHealth() {
    try {
      if (this.fallbackMode) {
        return {
          status: 'degraded',
          details: {
            initialized: false,
            fallbackMode: true,
            connectionCount: 0,
            message: 'HTTP-only mode - real-time features disabled'
          }
        };
      }

      if (!this.isInitialized || !this.io) {
        return {
          status: 'unhealthy',
          details: {
            initialized: false,
            fallbackMode: false,
            connectionCount: 0,
            error: 'Socket.IO not initialized'
          }
        };
      }

      return {
        status: 'healthy',
        details: {
          initialized: true,
          fallbackMode: false,
          connectionCount: this.connectionCount,
          engine: this.io.engine ? {
            clientsCount: this.io.engine.clientsCount,
            upgradeTimeout: this.io.engine.upgradeTimeout,
            pingTimeout: this.io.engine.pingTimeout,
            pingInterval: this.io.engine.pingInterval
          } : null
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          initialized: false,
          error: error.message,
          connectionCount: this.connectionCount
        }
      };
    }
  }

  /**
   * Get Socket.IO instance
   */
  getIO() {
    if (this.fallbackMode) {
      // Return a mock object that doesn't break the application
      return this._createFallbackIO();
    }
    
    if (!this.isInitialized || !this.io) {
      throw new Error('Socket.IO not initialized');
    }
    
    return this.io;
  }

  /**
   * Check if Socket.IO is available
   */
  isAvailable() {
    return this.isInitialized && !this.fallbackMode;
  }

  /**
   * Check if using fallback mode
   */
  isFallbackMode() {
    return this.fallbackMode;
  }

  /**
   * Set up Socket.IO event handlers
   */
  _setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      this.connectionCount++;
      logger.debug(`Socket.IO client connected: ${socket.id} (total: ${this.connectionCount})`);

      socket.on('disconnect', (reason) => {
        this.connectionCount = Math.max(0, this.connectionCount - 1);
        logger.debug(`Socket.IO client disconnected: ${socket.id} (reason: ${reason}, total: ${this.connectionCount})`);
      });

      socket.on('error', (error) => {
        logger.error('Socket.IO client error', {
          socketId: socket.id,
          error: error.message
        });
      });

      // Add ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });

    this.io.on('error', (error) => {
      logger.error('Socket.IO server error', {
        error: error.message,
        stack: error.stack
      });
    });

    // Log engine events for debugging
    if (this.io.engine) {
      this.io.engine.on('connection_error', (err) => {
        logger.warn('Socket.IO connection error', {
          code: err.code,
          message: err.message,
          context: err.context,
          type: err.type
        });
      });
    }
  }

  /**
   * Create a fallback IO object that doesn't break the application
   */
  _createFallbackIO() {
    const noop = () => {};
    const mockSocket = {
      emit: noop,
      on: noop,
      off: noop,
      join: noop,
      leave: noop,
      disconnect: noop
    };

    return {
      emit: (...args) => {
        logger.debug('Socket.IO fallback: emit called but ignored', { args: args.slice(0, 2) });
      },
      to: () => mockSocket,
      in: () => mockSocket,
      on: noop,
      off: noop,
      use: noop,
      close: noop,
      disconnectSockets: noop,
      sockets: {
        emit: (...args) => {
          logger.debug('Socket.IO fallback: broadcast emit called but ignored', { args: args.slice(0, 2) });
        }
      },
      engine: {
        clientsCount: 0
      }
    };
  }
}

export default SocketIOService;