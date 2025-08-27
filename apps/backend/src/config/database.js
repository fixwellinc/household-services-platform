import { PrismaClient } from '@prisma/client';

console.log('🔧 Database configuration loading...');
console.log('🔍 DATABASE_URL exists:', !!process.env.DATABASE_URL);

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL environment variable is not set!');
  console.warn('⚠️  Database features will not work properly');
  console.warn('⚠️  Please set DATABASE_URL in your Railway environment variables.');
  console.warn('⚠️  Example: postgresql://username:password@host:port/database');
  // Don't exit - let the app start and handle missing DB gracefully
}

// Create a single PrismaClient instance that can be shared throughout your app
const globalForPrisma = globalThis;

let prisma = null;

// Database connection retry logic
const initializePrisma = async (retries = 5, delay = 2000) => {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  Skipping Prisma client initialization (no DATABASE_URL)');
    return null;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔌 Attempting database connection (attempt ${attempt}/${retries})...`);
      
      prisma = globalForPrisma.prisma || new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        },
        // Add connection pool configuration for better stability
        __internal: {
          engine: {
            connectionLimit: 5,
            pool: {
              min: 0,
              max: 10
            }
          }
        }
      });

      // Test the connection
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Prisma client initialized and connected successfully');
      
      if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
      return prisma;
      
    } catch (error) {
      console.error(`❌ Database connection attempt ${attempt} failed:`, error.message);
      
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
        delay *= 1.5; // Exponential backoff
      } else {
        console.error('❌ All database connection attempts failed');
        return null;
      }
    }
  }
  
  return null;
};

// Initialize Prisma client
prisma = await initializePrisma();

// Graceful shutdown
process.on('beforeExit', async () => {
  if (prisma) await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  if (prisma) await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (prisma) await prisma.$disconnect();
  process.exit(0);
});

// Health check function
export const checkDatabaseConnection = async () => {
  if (!prisma) {
    return { 
      status: 'unhealthy', 
      error: 'Database not configured (no DATABASE_URL)', 
      timestamp: new Date().toISOString() 
    };
  }
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error.message, 
      timestamp: new Date().toISOString() 
    };
  }
};

// Database utilities
export const withTransaction = async (callback) => {
  if (!prisma) throw new Error('Database not configured');
  return await prisma.$transaction(callback);
};

export const disconnect = async () => {
  if (prisma) await prisma.$disconnect();
};

export default prisma; 