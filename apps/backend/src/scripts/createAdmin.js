import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = 'admin@fixwell.ca';
    const password = 'FixwellAdmin2024!';
    
    console.log('🔧 Creating admin user...');
    
    // Check if user already exists
    const existing = await prisma.user.findUnique({ 
      where: { email } 
    });
    
    if (existing) {
      console.log('✅ Admin user already exists:', email);
      
      // Update password if needed
      const hashedPassword = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true
        }
      });
      
      console.log('🔄 Admin password updated');
      console.log('📧 Email:', email);
      console.log('🔑 Password:', password);
      return;
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const adminUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Fixwell Admin',
        role: 'ADMIN',
        isActive: true,
        phone: '+1-604-555-0001',
        address: '123 Admin Street, Vancouver, BC',
        postalCode: 'V6B 1A1'
      }
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Password:', password);
    console.log('👤 Role:', adminUser.role);
    console.log('🆔 ID:', adminUser.id);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdmin()
  .then(() => {
    console.log('🎉 Admin setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Admin setup failed:', error);
    process.exit(1);
  });