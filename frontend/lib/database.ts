import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with error handling
const createPrismaClient = () => {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  } catch (error) {
    console.warn('Failed to create Prisma client:', error)
    // Return a mock client that throws errors when used
    return {
      user: { findUnique: () => Promise.reject(new Error('Database not available')) },
      service: { findMany: () => Promise.reject(new Error('Database not available')), findUnique: () => Promise.reject(new Error('Database not available')), create: () => Promise.reject(new Error('Database not available')), update: () => Promise.reject(new Error('Database not available')), delete: () => Promise.reject(new Error('Database not available')) },
      booking: { findMany: () => Promise.reject(new Error('Database not available')), findUnique: () => Promise.reject(new Error('Database not available')), create: () => Promise.reject(new Error('Database not available')) },
      message: { findMany: () => Promise.reject(new Error('Database not available')) },
      quote: { findMany: () => Promise.reject(new Error('Database not available')), create: () => Promise.reject(new Error('Database not available')) }
    } as any
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma 