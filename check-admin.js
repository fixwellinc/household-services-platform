import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    console.log('🔍 Checking admin users...');
    
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    console.log('Found admin users:', admins);
    
    if (admins.length === 0) {
      console.log('❌ No admin users found!');
    } else {
      console.log(`✅ Found ${admins.length} admin user(s)`);
    }
    
  } catch (error) {
    console.error('❌ Error checking admin users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();