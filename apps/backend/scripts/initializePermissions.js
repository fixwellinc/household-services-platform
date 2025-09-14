import PermissionService from '../src/services/PermissionService.js';
import prisma from '../src/config/database.js';

async function initializePermissions() {
  try {
    console.log('🔐 Initializing default permissions and roles...');
    
    // Initialize default permissions and roles
    await PermissionService.initializeDefaultPermissions();
    
    console.log('✅ Default permissions and roles initialized successfully');
    
    // Find existing admin users and assign Super Admin role
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    });
    
    if (adminUsers.length > 0) {
      console.log(`👤 Found ${adminUsers.length} admin user(s), assigning Super Admin role...`);
      
      const superAdminRole = await prisma.role.findUnique({
        where: { name: 'Super Admin' }
      });
      
      if (superAdminRole) {
        for (const admin of adminUsers) {
          // Check if user already has the role
          const existingUserRole = await prisma.userRole.findFirst({
            where: {
              userId: admin.id,
              roleId: superAdminRole.id,
              isActive: true
            }
          });
          
          if (!existingUserRole) {
            await PermissionService.assignRole(
              admin.id,
              superAdminRole.id,
              admin.id // Self-assigned for initial setup
            );
            console.log(`   ✅ Assigned Super Admin role to ${admin.email}`);
          } else {
            console.log(`   ℹ️  ${admin.email} already has Super Admin role`);
          }
        }
      }
    }
    
    console.log('🎉 Permission system initialization complete!');
    
  } catch (error) {
    console.error('❌ Error initializing permissions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initializePermissions();