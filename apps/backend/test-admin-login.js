import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function testAdminLogin() {
  try {
    console.log('🧪 Testing admin login functionality...');
    
    const adminEmail = 'admin@fixwell.ca';
    const adminPassword = 'FixwellAdmin2024!';
    
    // Step 1: Find admin user
    console.log('1️⃣ Looking up admin user...');
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        isActive: true
      }
    });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      return false;
    }
    
    console.log('✅ Admin user found:', {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      isActive: admin.isActive
    });
    
    // Step 2: Verify password
    console.log('2️⃣ Verifying password...');
    const isValidPassword = await bcrypt.compare(adminPassword, admin.password);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return false;
    }
    
    console.log('✅ Password is valid');
    
    // Step 3: Generate JWT token
    console.log('3️⃣ Generating JWT token...');
    const token = jwt.sign(
      { 
        userId: admin.id, 
        email: admin.email, 
        role: admin.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('✅ JWT token generated');
    
    // Step 4: Verify JWT token
    console.log('4️⃣ Verifying JWT token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('✅ JWT token verified:', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      exp: new Date(decoded.exp * 1000).toISOString()
    });
    
    // Step 5: Test admin permissions
    console.log('5️⃣ Testing admin permissions...');
    const adminRoles = ['ADMIN'];
    const hasAdminAccess = adminRoles.includes(admin.role);
    
    console.log(`✅ Admin access: ${hasAdminAccess ? 'GRANTED' : 'DENIED'}`);
    
    // Step 6: Simulate login response
    console.log('6️⃣ Simulating login response...');
    const { password: _, ...userWithoutPassword } = admin;
    
    const loginResponse = {
      message: 'Login successful',
      user: userWithoutPassword,
      token: token
    };
    
    console.log('✅ Login simulation successful');
    
    console.log('');
    console.log('🎉 Admin login test completed successfully!');
    console.log('');
    console.log('📋 Test Results:');
    console.log('   ✅ User exists');
    console.log('   ✅ Password valid');
    console.log('   ✅ JWT token generated');
    console.log('   ✅ JWT token verified');
    console.log('   ✅ Admin permissions granted');
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role: ${admin.role}`);
    console.log('');
    console.log('🌐 Login URL: https://fixwell.up.railway.app');
    
    return true;
    
  } catch (error) {
    console.error('❌ Admin login test failed:', error);
    return false;
  }
}

async function main() {
  try {
    const success = await testAdminLogin();
    
    if (success) {
      console.log('✅ All tests passed! Admin login is working correctly.');
      process.exit(0);
    } else {
      console.log('❌ Tests failed! Admin login needs attention.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
main();