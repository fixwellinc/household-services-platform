import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('🔧 Resetting admin password...');
    
    const adminEmail = 'admin@fixwell.ca';
    const newPassword = 'FixwellAdmin2024!'; // You can change this
    
    // Check if admin exists
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (!admin) {
      console.log('❌ Admin account not found with email:', adminEmail);
      console.log('💡 Run create-admin-account.js first to create the admin account');
      process.exit(1);
    }
    
    console.log('✅ Admin account found:', adminEmail);
    
    // Hash new password
    console.log('🔐 Hashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    console.log('🔄 Updating admin password...');
    await prisma.user.update({
      where: { email: adminEmail },
      data: { 
        password: hashedPassword,
        role: 'ADMIN' // Ensure role is still ADMIN
      }
    });
    
    console.log('✅ Admin password reset successfully!');
    console.log('📋 Updated credentials:');
    console.log(`   - Email: ${adminEmail}`);
    console.log(`   - New Password: ${newPassword}`);
    console.log(`   - Role: ADMIN`);
    
    // Verify the new password works
    console.log('🔍 Verifying new password...');
    const updatedAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { password: true }
    });
    
    const isValid = await bcrypt.compare(newPassword, updatedAdmin.password);
    
    if (isValid) {
      console.log('✅ Password verification successful!');
      console.log('');
      console.log('🎉 Admin password reset completed!');
      console.log('');
      console.log('📝 You can now login with:');
      console.log(`   - Email: ${adminEmail}`);
      console.log(`   - Password: ${newPassword}`);
    } else {
      console.log('❌ Password verification failed!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Failed to reset admin password:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset
resetAdminPassword();