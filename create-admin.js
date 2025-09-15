import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔧 Creating admin user...');
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@fixwell.ca',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        phone: '+1-604-555-0001',
        address: '123 Admin Street, Vancouver, BC',
        postalCode: 'V6B 1A1'
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@fixwell.ca');
    console.log('🔑 Password: admin123');
    console.log('🆔 User ID:', admin.id);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();