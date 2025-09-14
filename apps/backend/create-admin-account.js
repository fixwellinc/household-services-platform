import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminAccount() {
  try {
    console.log('🔧 Setting up admin account for Railway deployment...');
    
    const adminEmail = 'admin@fixwell.ca';
    const adminPassword = 'FixwellAdmin2024!'; // Strong default password
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({ 
      where: { email: adminEmail } 
    });
    
    if (existingAdmin) {
      console.log('✅ Admin account already exists:', adminEmail);
      console.log('📋 Admin details:');
      console.log(`   - ID: ${existingAdmin.id}`);
      console.log(`   - Email: ${existingAdmin.email}`);
      console.log(`   - Name: ${existingAdmin.name}`);
      console.log(`   - Role: ${existingAdmin.role}`);
      console.log(`   - Created: ${existingAdmin.createdAt}`);
      
      // Update role to ADMIN if it's not already
      if (existingAdmin.role !== 'ADMIN') {
        console.log('🔄 Updating user role to ADMIN...');
        const updatedUser = await prisma.user.update({
          where: { email: adminEmail },
          data: { role: 'ADMIN' }
        });
        console.log('✅ User role updated to ADMIN');
      }
      
      return existingAdmin;
    }
    
    // Hash the password
    console.log('🔐 Hashing admin password...');
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    // Create admin user
    console.log('👤 Creating admin account...');
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Fixwell Administrator',
        role: 'ADMIN',
        isActive: true
      }
    });
    
    console.log('✅ Admin account created successfully!');
    console.log('📋 Admin credentials:');
    console.log(`   - Email: ${adminEmail}`);
    console.log(`   - Password: ${adminPassword}`);
    console.log(`   - Role: ${adminUser.role}`);
    console.log(`   - ID: ${adminUser.id}`);
    
    console.log('');
    console.log('🚨 IMPORTANT SECURITY NOTES:');
    console.log('1. Please change the default password after first login');
    console.log('2. Store these credentials securely');
    console.log('3. Consider enabling 2FA for additional security');
    
    return adminUser;
    
  } catch (error) {
    console.error('❌ Failed to create admin account:', error);
    throw error;
  }
}

async function verifyAdminAccess() {
  try {
    console.log('🔍 Verifying admin account access...');
    
    const adminEmail = 'admin@fixwell.ca';
    
    // Test login process
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        isActive: true,
        createdAt: true
      }
    });
    
    if (!admin) {
      console.log('❌ Admin account not found');
      return false;
    }
    
    // Test password verification
    const testPassword = 'FixwellAdmin2024!';
    const isValidPassword = await bcrypt.compare(testPassword, admin.password);
    
    console.log('📊 Admin account verification:');
    console.log(`   - Account exists: ✅`);
    console.log(`   - Email: ${admin.email}`);
    console.log(`   - Role: ${admin.role}`);
    console.log(`   - Active: ${admin.isActive ? '✅' : '❌'}`);
    console.log(`   - Password valid: ${isValidPassword ? '✅' : '❌'}`);
    console.log(`   - Created: ${admin.createdAt}`);
    
    if (admin.role !== 'ADMIN') {
      console.log('⚠️  Warning: User role is not ADMIN');
      return false;
    }
    
    if (!admin.isActive) {
      console.log('⚠️  Warning: User account is not active');
      return false;
    }
    
    if (!isValidPassword) {
      console.log('⚠️  Warning: Default password does not match');
      return false;
    }
    
    console.log('✅ Admin account verification successful!');
    return true;
    
  } catch (error) {
    console.error('❌ Admin verification failed:', error);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Starting admin account setup for Fixwell...');
    console.log('');
    
    // Create or verify admin account
    await createAdminAccount();
    console.log('');
    
    // Verify admin access
    const isValid = await verifyAdminAccess();
    console.log('');
    
    if (isValid) {
      console.log('🎉 Admin account setup completed successfully!');
      console.log('');
      console.log('📝 Next steps:');
      console.log('1. Login at: https://fixwell.up.railway.app');
      console.log('2. Use email: admin@fixwell.ca');
      console.log('3. Use password: FixwellAdmin2024!');
      console.log('4. Change password after first login');
      console.log('5. Access admin features through the dashboard');
    } else {
      console.log('❌ Admin account setup failed verification');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Admin setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
main();