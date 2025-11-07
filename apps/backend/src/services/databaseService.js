import { logger } from '../utils/logger.js';
import prisma, { checkDatabaseConnection } from '../config/database.js';

/**
 * Database Service - Manages database connections and health
 */
class DatabaseService {
  constructor() {
    this.name = 'database';
    this.isConnected = false;
    this.connectionAttempts = 0;
    // Increase retries for Railway deployments (database might take time to be ready)
    this.maxRetries = process.env.RAILWAY_ENVIRONMENT ? 10 : 5;
    // Start with longer delay for Railway
    this.retryDelay = process.env.RAILWAY_ENVIRONMENT ? 3000 : 2000;
  }

  async start() {
    logger.info('🗄️ Starting database service...');
    
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    // Test database connection with retries
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.connectionAttempts = attempt;
        
        logger.info(`🔌 Database connection attempt ${attempt}/${this.maxRetries}...`);
        
        // Test connection with timeout
        const connectionPromise = prisma.$queryRaw`SELECT 1`;
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 10000)
        );
        
        await Promise.race([connectionPromise, timeoutPromise]);
        
        // Check detailed connection status
        const connectionStatus = await checkDatabaseConnection();
        if (connectionStatus.status !== 'healthy') {
          throw new Error(`Database connection unhealthy: ${connectionStatus.error}`);
        }

        this.isConnected = true;
        logger.info(`✅ Database service started successfully after ${attempt} attempt(s)`);
        return;
        
      } catch (error) {
        const isLastAttempt = attempt === this.maxRetries;
        const errorMsg = error.message || 'Unknown error';
        
        logger.error(`❌ Database connection attempt ${attempt}/${this.maxRetries} failed`, {
          error: errorMsg,
          willRetry: !isLastAttempt,
          nextRetryIn: isLastAttempt ? 'N/A' : `${this.retryDelay * attempt}ms`
        });

        if (isLastAttempt) {
          logger.error('💥 Database connection failed after all retry attempts');
          logger.error('💡 Troubleshooting tips:');
          logger.error('   1. Verify DATABASE_URL is correct');
          logger.error('   2. Check if database service is running');
          logger.error('   3. Verify network connectivity');
          logger.error('   4. Check database credentials');
          throw new Error(`Database connection failed after ${this.maxRetries} attempts: ${errorMsg}`);
        }

        // Wait before retry with exponential backoff
        const delay = this.retryDelay * attempt;
        logger.info(`⏳ Waiting ${delay}ms before next retry...`);
        await this._delay(delay);
      }
    }
  }

  async stop() {
    logger.info('🛑 Stopping database service...');
    
    try {
      if (prisma) {
        await prisma.$disconnect();
      }
      this.isConnected = false;
      logger.info('✅ Database service stopped');
    } catch (error) {
      logger.error('❌ Error stopping database service', { error: error.message });
      throw error;
    }
  }

  async getHealth() {
    try {
      if (!this.isConnected || !prisma) {
        return {
          status: 'unhealthy',
          details: {
            connected: false,
            error: 'Database not connected'
          }
        };
      }

      // Quick health check
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;

      // Get detailed connection info
      const connectionStatus = await checkDatabaseConnection();

      return {
        status: connectionStatus.status === 'healthy' ? 'healthy' : 'unhealthy',
        details: {
          connected: this.isConnected,
          responseTime,
          connectionAttempts: this.connectionAttempts,
          ...connectionStatus
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
   * Get database connection instance
   */
  getConnection() {
    if (!this.isConnected || !prisma) {
      throw new Error('Database not connected');
    }
    return prisma;
  }

  /**
   * Check if database is available
   */
  isAvailable() {
    return this.isConnected && !!prisma;
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default DatabaseService;