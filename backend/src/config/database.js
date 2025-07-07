import { PrismaClient } from '@prisma/client';

console.log('🔧 Database configuration loading...');
console.log('🔍 DATABASE_URL exists:', !!process.env.DATABASE_URL);

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL environment variable is not set!');
  console.warn('⚠️  Database features will not work properly');
  console.warn('⚠️  Please set DATABASE_URL in your Railway environment variables.');
  console.warn('⚠️  Example: mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority');
  // Don't exit - let the app start and handle missing DB gracefully
}

// Create a single PrismaClient instance that can be shared throughout your app
const globalForPrisma = globalThis;

let prisma = null;

if (process.env.DATABASE_URL) {
  try {
    prisma = globalForPrisma.prisma || new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    console.log('✅ Prisma client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Prisma client:', error.message);
    prisma = null;
  }
} else {
  console.log('⚠️  Skipping Prisma client initialization (no DATABASE_URL)');
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

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