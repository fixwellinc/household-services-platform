import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Set the database URL for Railway
process.env.DATABASE_URL = "postgresql://postgres:LIroMVRIdUvmShOQezLZKVoLGoLHYa@postgres.railway.internal:5432/railway";

const prisma = new PrismaClient();

async function createAdminAccount() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('Admin account already exists:', existingAdmin.email);
      return;
    }

    // Create admin account
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@fixwell.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        phone: '+1-555-0000',
        address: '123 Admin Street',
        postalCode: 'V5H 1Z1'
      }
    });

    console.log('Admin account created successfully:');
    console.log('Email:', adminUser.email);
    console.log('Password: admin123');
    console.log('Role:', adminUser.role);
    
  } catch (error) {
    console.error('Error creating admin account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminAccount();
