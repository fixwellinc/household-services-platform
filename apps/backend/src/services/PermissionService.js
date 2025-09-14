import prisma from '../config/database.js';

class PermissionService {
  /**
   * Initialize default permissions and roles
   */
  async initializeDefaultPermissions() {
    // Define default permissions
    const defaultPermissions = [
      // User Management
      { name: 'users.view', resource: 'users', action: 'view', description: 'View user information', category: 'user_management' },
      { name: 'users.create', resource: 'users', action: 'create', description: 'Create new users', category: 'user_management' },
      { name: 'users.update', resource: 'users', action: 'update', description: 'Update user information', category: 'user_management' },
      { name: 'users.delete', resource: 'users', action: 'delete', description: 'Delete users', category: 'user_management' },
      { name: 'users.suspend', resource: 'users', action: 'suspend', description: 'Suspend user accounts', category: 'user_management' },
      { name: 'users.impersonate', resource: 'users', action: 'impersonate', description: 'Impersonate other users', category: 'user_management' },
      
      // Role Management
      { name: 'roles.view', resource: 'roles', action: 'view', description: 'View roles and permissions', category: 'role_management' },
      { name: 'roles.create', resource: 'roles', action: 'create', description: 'Create new roles', category: 'role_management' },
      { name: 'roles.update', resource: 'roles', action: 'update', description: 'Update roles and permissions', category: 'role_management' },
      { name: 'roles.delete', resource: 'roles', action: 'delete', description: 'Delete roles', category: 'role_management' },
      { name: 'roles.assign', resource: 'roles', action: 'assign', description: 'Assign roles to users', category: 'role_management' },
      
      // Subscription Management
      { name: 'subscriptions.view', resource: 'subscriptions', action: 'view', description: 'View subscription information', category: 'subscription_management' },
      { name: 'subscriptions.update', resource: 'subscriptions', action: 'update', description: 'Update subscriptions', category: 'subscription_management' },
      { name: 'subscriptions.billing', resource: 'subscriptions', action: 'billing', description: 'Manage billing and payments', category: 'subscription_management' },
      
      // Booking Management
      { name: 'bookings.view', resource: 'bookings', action: 'view', description: 'View booking information', category: 'booking_management' },
      { name: 'bookings.update', resource: 'bookings', action: 'update', description: 'Update booking status', category: 'booking_management' },
      { name: 'bookings.cancel', resource: 'bookings', action: 'cancel', description: 'Cancel bookings', category: 'booking_management' },
      
      // Communication
      { name: 'communications.view', resource: 'communications', action: 'view', description: 'View communications', category: 'communication' },
      { name: 'communications.send', resource: 'communications', action: 'send', description: 'Send messages and emails', category: 'communication' },
      { name: 'communications.broadcast', resource: 'communications', action: 'broadcast', description: 'Send broadcast messages', category: 'communication' },
      
      // System Management
      { name: 'system.monitor', resource: 'system', action: 'monitor', description: 'Monitor system health', category: 'system_management' },
      { name: 'system.configure', resource: 'system', action: 'configure', description: 'Configure system settings', category: 'system_management' },
      { name: 'system.backup', resource: 'system', action: 'backup', description: 'Manage system backups', category: 'system_management' },
      
      // Audit and Reporting
      { name: 'audit.view', resource: 'audit', action: 'view', description: 'View audit logs', category: 'audit_reporting' },
      { name: 'reports.view', resource: 'reports', action: 'view', description: 'View reports', category: 'audit_reporting' },
      { name: 'reports.export', resource: 'reports', action: 'export', description: 'Export data and reports', category: 'audit_reporting' },
      
      // Dashboard
      { name: 'dashboard.view', resource: 'dashboard', action: 'view', description: 'View admin dashboard', category: 'dashboard' },
      { name: 'dashboard.customize', resource: 'dashboard', action: 'customize', description: 'Customize dashboard layout', category: 'dashboard' }
    ];

    // Create permissions if they don't exist
    for (const permission of defaultPermissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: permission,
        create: { ...permission, isSystem: true }
      });
    }

    // Define default roles
    const defaultRoles = [
      {
        name: 'Super Admin',
        description: 'Full system access with all permissions',
        permissions: defaultPermissions.map(p => p.name)
      },
      {
        name: 'Admin',
        description: 'Administrative access with most permissions',
        permissions: [
          'users.view', 'users.create', 'users.update', 'users.suspend',
          'subscriptions.view', 'subscriptions.update', 'subscriptions.billing',
          'bookings.view', 'bookings.update', 'bookings.cancel',
          'communications.view', 'communications.send',
          'audit.view', 'reports.view', 'reports.export',
          'dashboard.view', 'dashboard.customize'
        ]
      },
      {
        name: 'Support Manager',
        description: 'Customer support management access',
        permissions: [
          'users.view', 'users.update',
          'subscriptions.view', 'subscriptions.update',
          'bookings.view', 'bookings.update',
          'communications.view', 'communications.send',
          'dashboard.view'
        ]
      },
      {
        name: 'Support Agent',
        description: 'Basic customer support access',
        permissions: [
          'users.view',
          'subscriptions.view',
          'bookings.view', 'bookings.update',
          'communications.view', 'communications.send',
          'dashboard.view'
        ]
      },
      {
        name: 'Billing Manager',
        description: 'Billing and subscription management access',
        permissions: [
          'users.view',
          'subscriptions.view', 'subscriptions.update', 'subscriptions.billing',
          'reports.view', 'reports.export',
          'dashboard.view'
        ]
      },
      {
        name: 'Read Only',
        description: 'View-only access to most resources',
        permissions: [
          'users.view',
          'subscriptions.view',
          'bookings.view',
          'communications.view',
          'audit.view', 'reports.view',
          'dashboard.view'
        ]
      }
    ];

    // Create roles and assign permissions
    for (const roleData of defaultRoles) {
      const role = await prisma.role.upsert({
        where: { name: roleData.name },
        update: { description: roleData.description },
        create: {
          name: roleData.name,
          description: roleData.description,
          isSystem: true
        }
      });

      // Clear existing permissions for this role
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id }
      });

      // Add permissions to role
      for (const permissionName of roleData.permissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName }
        });

        if (permission) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id
            }
          });
        }
      }
    }
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(userId, permissionName, conditions = {}) {
    try {
      // Get user's active roles
      const userRoles = await prisma.userRole.findMany({
        where: {
          userId,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      });

      // Check if any role has the required permission
      for (const userRole of userRoles) {
        const rolePermission = userRole.role.rolePermissions.find(
          rp => rp.permission.name === permissionName
        );

        if (rolePermission) {
          // Check additional conditions if specified
          if (rolePermission.conditions && Object.keys(conditions).length > 0) {
            const conditionsMet = this.checkConditions(rolePermission.conditions, conditions);
            if (conditionsMet) return true;
          } else if (!rolePermission.conditions) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Check if conditions are met
   */
  checkConditions(roleConditions, userConditions) {
    // Simple condition checking - can be extended for complex logic
    for (const [key, value] of Object.entries(roleConditions)) {
      if (userConditions[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get user's permissions
   */
  async getUserPermissions(userId) {
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    const permissions = new Set();
    userRoles.forEach(userRole => {
      userRole.role.rolePermissions.forEach(rp => {
        permissions.add(rp.permission.name);
      });
    });

    return Array.from(permissions);
  }

  /**
   * Assign role to user
   */
  async assignRole(userId, roleId, assignedBy, expiresAt = null) {
    return await prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedBy,
        expiresAt
      }
    });
  }

  /**
   * Remove role from user
   */
  async removeRole(userId, roleId) {
    return await prisma.userRole.updateMany({
      where: { userId, roleId },
      data: { isActive: false }
    });
  }

  /**
   * Create impersonation session
   */
  async createImpersonationSession(adminId, targetUserId, reason, ipAddress, userAgent) {
    // End any existing active sessions for this admin
    await prisma.impersonationSession.updateMany({
      where: {
        adminId,
        isActive: true
      },
      data: {
        isActive: false,
        endedAt: new Date()
      }
    });

    // Create new session
    return await prisma.impersonationSession.create({
      data: {
        adminId,
        targetUserId,
        reason,
        ipAddress,
        userAgent
      }
    });
  }

  /**
   * End impersonation session
   */
  async endImpersonationSession(sessionId) {
    return await prisma.impersonationSession.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        endedAt: new Date()
      }
    });
  }

  /**
   * Get active impersonation session for admin
   */
  async getActiveImpersonationSession(adminId) {
    return await prisma.impersonationSession.findFirst({
      where: {
        adminId,
        isActive: true
      },
      include: {
        targetUser: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    });
  }
}

export default new PermissionService();