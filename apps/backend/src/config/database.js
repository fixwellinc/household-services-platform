import { PrismaClient } from '@prisma/client';

console.log('🔧 Database configuration loading...');
console.log('🔍 DATABASE_URL exists:', !!process.env.DATABASE_URL);

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL environment variable is not set!');
  console.warn('⚠️  Database features will not work properly');
  console.warn('⚠️  Please set DATABASE_URL in your Railway environment variables.');
  console.warn('⚠️  Example: postgresql://username:password@host:port/database');
}

// Create a single PrismaClient instance that can be shared throughout your app
const globalForPrisma = globalThis;

let prisma = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

// Database connection retry logic with better error handling
const initializePrisma = async (retries = 3, delay = 1000) => {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  Skipping Prisma client initialization (no DATABASE_URL)');
    return null;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔌 Attempting database connection (attempt ${attempt}/${retries})...`);
      
      // Disconnect existing client if any
      if (prisma) {
        try {
          await prisma.$disconnect();
        } catch (e) {
          console.warn('Warning disconnecting previous client:', e.message);
        }
      }
      
      prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        },
        // Optimized connection pool settings for Railway
        __internal: {
          engine: {
            connectionLimit: 3, // Reduced from 5
            pool: {
              min: 0,
              max: 5, // Reduced from 10
              acquireTimeoutMillis: 10000,
              createTimeoutMillis: 10000,
              destroyTimeoutMillis: 5000,
              idleTimeoutMillis: 30000,
              reapIntervalMillis: 1000,
              createRetryIntervalMillis: 200
            }
          }
        }
      });

      // Test the connection with timeout
      const connectionTest = prisma.$queryRaw`SELECT 1`;
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      );
      
      await Promise.race([connectionTest, timeout]);
      console.log('✅ Prisma client initialized and connected successfully');
      
      connectionAttempts = 0; // Reset on success
      if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
      return prisma;
      
    } catch (error) {
      console.error(`❌ Database connection attempt ${attempt} failed:`, error.message);
      connectionAttempts++;
      
      if (prisma) {
        try {
          await prisma.$disconnect();
        } catch (disconnectError) {
          console.error('❌ Error disconnecting Prisma client:', disconnectError.message);
        }
        prisma = null;
      }
      
      if (attempt < retries) {
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.2; // Smaller exponential backoff
      } else {
        console.error('❌ All database connection attempts failed');
        
        // If we've failed too many times, wait longer before next attempt
        if (connectionAttempts > MAX_CONNECTION_ATTEMPTS) {
          console.log('⏸️  Too many failed attempts, entering cooldown mode');
          await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second cooldown
          connectionAttempts = 0;
        }
        
        return null;
      }
    }
  }
  
  return null;
};

// Initialize Prisma client
try {
  prisma = await initializePrisma();
} catch (error) {
  console.error('❌ Failed to initialize Prisma client:', error.message);
  console.log('⚠️  Running in mock database mode');
  prisma = null;
}

// Enhanced graceful shutdown with proper cleanup
const gracefulShutdown = async (signal) => {
  console.log(`📴 Received ${signal}, starting graceful shutdown...`);
  
  try {
    if (prisma) {
      console.log('🔌 Disconnecting from database...');
      await Promise.race([
        prisma.$disconnect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Disconnect timeout')), 5000))
      ]);
      console.log('✅ Database disconnected successfully');
    }
  } catch (error) {
    console.error('❌ Error during database disconnect:', error.message);
  }
  
  process.exit(0);
};

// Handle various shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('beforeExit', async () => {
  if (prisma) {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error('❌ Error in beforeExit:', error.message);
    }
  }
});

// Handle unhandled promise rejections (common cause of crashes)
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  
  // Don't exit immediately, log and continue
  if (reason && reason.message && reason.message.includes('database')) {
    console.log('🔄 Database-related error detected, attempting reconnection...');
    // Attempt to reinitialize database connection
    setTimeout(async () => {
      try {
        prisma = await initializePrisma();
      } catch (error) {
        console.error('❌ Failed to reinitialize database:', error.message);
      }
    }, 5000);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  
  // Log the error but don't crash immediately
  if (error.message && !error.message.includes('ECONNRESET')) {
    console.log('🔄 Non-network error, attempting graceful recovery...');
    setTimeout(() => {
      console.log('🔄 Recovery attempt completed');
    }, 1000);
  }
});

// Health check function with better error handling
export const checkDatabaseConnection = async () => {
  if (!prisma) {
    // Attempt to reconnect if no connection
    try {
      prisma = await initializePrisma();
    } catch (error) {
      console.error('❌ Failed to reconnect during health check:', error.message);
    }
    
    if (!prisma) {
      return { 
        status: 'unhealthy', 
        error: 'Database not configured or connection failed', 
        timestamp: new Date().toISOString(),
        reconnectAttempted: true
      };
    }
  }
  
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), 3000))
    ]);
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('❌ Database health check failed:', error.message);
    
    // Attempt to reconnect on health check failure
    try {
      prisma = await initializePrisma();
      return { 
        status: 'recovering', 
        error: error.message, 
        timestamp: new Date().toISOString(),
        reconnectAttempted: true
      };
    } catch (reconnectError) {
      return { 
        status: 'unhealthy', 
        error: error.message, 
        timestamp: new Date().toISOString(),
        reconnectFailed: reconnectError.message
      };
    }
  }
};

// Database utilities with better error handling
export const withTransaction = async (callback) => {
  if (!prisma) {
    throw new Error('Database not configured');
  }
  
  try {
    return await prisma.$transaction(callback, {
      timeout: 10000, // 10 second timeout
      maxWait: 5000,  // 5 second max wait
    });
  } catch (error) {
    console.error('❌ Transaction failed:', error.message);
    throw error;
  }
};

export const disconnect = async () => {
  if (prisma) {
    try {
      await Promise.race([
        prisma.$disconnect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Disconnect timeout')), 5000))
      ]);
    } catch (error) {
      console.error('❌ Error during manual disconnect:', error.message);
    }
  }
};

// Periodic connection health check (every 5 minutes instead of 15)
setInterval(async () => {
  try {
    const health = await checkDatabaseConnection();
    if (health.status !== 'healthy') {
      console.log('⚠️  Database health check failed:', health);
    }
  } catch (error) {
    console.error('❌ Error during periodic health check:', error.message);
  }
}, 5 * 60 * 1000); // 5 minutes

export default prisma;
