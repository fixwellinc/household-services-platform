import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

// Create .env file if it doesn't exist
const envPath = path.join(process.cwd(), '.env');
const envContent = `# Database Configuration
DATABASE_URL="mongodb+srv://fixwellinc:cSbodtzmEscXmMo2@fixwell.09bziew.mongodb.net/household_services?retryWrites=true&w=majority"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=5000
NODE_ENV="development"

# CORS Configuration
FRONTEND_URL="http://localhost:3000"
CORS_ORIGINS="http://localhost:3000,http://localhost:3001"

# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_stripe_webhook_secret"

# Email Configuration (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_SECURE="false"

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL="info"

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,application/pdf"

# Redis Configuration (Optional)
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""

# Monitoring
SENTRY_DSN=""

# Feature Flags
ENABLE_EMAIL_NOTIFICATIONS="true"
ENABLE_FILE_UPLOAD="true"
ENABLE_REALTIME_NOTIFICATIONS="false"
ENABLE_ANALYTICS="false"
`;

async function setupDatabase() {
  try {
    console.log('🔧 Setting up MongoDB connection...');
    
    // Create .env file if it doesn't exist
    if (!fs.existsSync(envPath)) {
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Created .env file with MongoDB configuration');
    } else {
      console.log('ℹ️  .env file already exists');
    }
    
    // Regenerate Prisma client
    console.log('🔄 Regenerating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client regenerated');
    
    // Test database connection
    console.log('🔍 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Seed the database
    console.log('🌱 Seeding database...');
    await seedDatabase();
    console.log('✅ Database seeded successfully!');
    
    console.log('\n🎉 Setup complete! You can now run:');
    console.log('npm run dev');
    console.log('\nTest credentials:');
    console.log('Admin: admin@example.com / test1234');
    console.log('Customer: customer@example.com / test1234');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedDatabase() {
  const password = 'test1234';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: hashedPassword,
      name: 'Customer User',
      role: 'CUSTOMER',
    },
  });

  // Create services
  const cleaningService = await prisma.service.upsert({
    where: { name: 'House Cleaning' },
    update: {},
    create: {
      name: 'House Cleaning',
      description: 'Full house cleaning service including kitchen, bathrooms, and bedrooms',
      category: 'CLEANING',
      complexity: 'SIMPLE',
      basePrice: 120,
      isActive: true,
    },
  });

  const plumbingService = await prisma.service.upsert({
    where: { name: 'Plumbing Repair' },
    update: {},
    create: {
      name: 'Plumbing Repair',
      description: 'Expert plumbing services for leaks, clogs, and fixture installations',
      category: 'REPAIR',
      complexity: 'COMPLEX',
      basePrice: 180,
      isActive: true,
    },
  });

  const organizationService = await prisma.service.upsert({
    where: { name: 'Home Organization' },
    update: {},
    create: {
      name: 'Home Organization',
      description: 'Professional decluttering and organization of closets, garages, and living spaces',
      category: 'ORGANIZATION',
      complexity: 'MODERATE',
      basePrice: 100,
      isActive: true,
    },
  });

  // Create a booking (check if it exists first)
  const existingBooking = await prisma.booking.findFirst({
    where: {
      customerId: customer.id,
      serviceId: cleaningService.id
    }
  });

  if (!existingBooking) {
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
  }

  // Create a quote (check if it exists first)
  const existingQuote = await prisma.quote.findFirst({
    where: {
      email: customer.email,
      serviceId: cleaningService.id
    }
  });

  if (!existingQuote) {
    await prisma.quote.create({
      data: {
        userId: customer.id,
        email: customer.email,
        serviceId: cleaningService.id,
        message: 'Can I get a quote for deep cleaning of a 3-bedroom house?',
        status: 'PENDING',
      },
    });
  }
}

setupDatabase(); 