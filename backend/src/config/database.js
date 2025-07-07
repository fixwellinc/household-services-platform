import { PrismaClient } from '@prisma/client';

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('Please set DATABASE_URL in your Railway environment variables.');
  console.error('Example: mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority');
  process.exit(1);
}

// Create a single PrismaClient instance that can be shared throughout your app
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Health check function
export const checkDatabaseConnection = async () => {
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
  return await prisma.$transaction(callback);
};

export const disconnect = async () => {
  await prisma.$disconnect();
};

export default prisma; 