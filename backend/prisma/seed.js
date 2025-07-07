import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.booking.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();

  const password = 'test1234';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      password: hashedPassword,
      name: 'Customer User',
      role: 'CUSTOMER',
    },
  });

  // Create services (managed by admin)
  const cleaningService = await prisma.service.create({
    data: {
      name: 'House Cleaning',
      description: 'Full house cleaning service including kitchen, bathrooms, and bedrooms',
      category: 'CLEANING',
      complexity: 'SIMPLE',
      basePrice: 120,
      isActive: true,
    },
  });

  const plumbingService = await prisma.service.create({
    data: {
      name: 'Plumbing Repair',
      description: 'Expert plumbing services for leaks, clogs, and fixture installations',
      category: 'REPAIR',
      complexity: 'COMPLEX',
      basePrice: 150,
      isActive: true,
    },
  });

  const organizationService = await prisma.service.create({
    data: {
      name: 'Home Organization',
      description: 'Professional decluttering and organization of closets, garages, and living spaces',
      category: 'ORGANIZATION',
      complexity: 'MODERATE',
      basePrice: 95,
      isActive: true,
    },
  });

  // Create a booking
  await prisma.booking.create({
    data: {
      customerId: customer.id,
      serviceId: cleaningService.id,
      scheduledDate: new Date(Date.now() + 86400000),
      status: 'PENDING',
      totalAmount: 120,
      discountAmount: 0,
      finalAmount: 120,
    },
  });

  // Create a quote
  await prisma.quote.create({
    data: {
      userId: customer.id,
      email: customer.email,
      serviceId: cleaningService.id,
      message: 'Can I get a quote for deep cleaning of a 3-bedroom house?',
      status: 'PENDING',
    },
  });

  console.log('Seed data created! Password for all users: test1234');
  console.log('Admin: admin@example.com');
  console.log('Customer: customer@example.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 