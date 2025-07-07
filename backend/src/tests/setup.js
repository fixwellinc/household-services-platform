import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Create test database client
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

// Test utilities
export const setupTestDatabase = async () => {
  // Clean up test database
  await testPrisma.booking.deleteMany();
  await testPrisma.service.deleteMany();
  await testPrisma.user.deleteMany();
  await testPrisma.quote.deleteMany();
  await testPrisma.setting.deleteMany();
};

export const createTestUser = async (userData = {}) => {
  const defaultUser = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    role: 'CUSTOMER',
    ...userData
  };
  
  // Hash password
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.hash(defaultUser.password, 12);
  
  return await testPrisma.user.create({
    data: {
      ...defaultUser,
      password: hashedPassword
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true
    }
  });
};

export const createTestService = async (serviceData = {}) => {
  const defaultService = {
    name: 'Test Service',
    description: 'A test service for testing purposes',
    category: 'CLEANING',
    complexity: 'SIMPLE',
    basePrice: 100.0,
    isActive: true,
    ...serviceData
  };
  
  return await testPrisma.service.create({
    data: defaultService
  });
};

export const createTestBooking = async (bookingData = {}) => {
  const defaultBooking = {
    customerId: bookingData.customerId || (await createTestUser()).id,
    serviceId: bookingData.serviceId || (await createTestService()).id,
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    status: 'PENDING',
    totalAmount: 100.0,
    discountAmount: 0,
    finalAmount: 100.0,
    notes: 'Test booking',
    ...bookingData
  };
  
  return await testPrisma.booking.create({
    data: defaultBooking
  });
};

export const cleanupTestDatabase = async () => {
  await testPrisma.$disconnect();
};

export default testPrisma; 