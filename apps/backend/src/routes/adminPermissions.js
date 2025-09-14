import express from 'express';
import { enhancedAuthMiddleware, requirePermission } from '../middleware/permissionMiddleware.js';
import { auditPresets } from '../middleware/auditMiddleware.js';
import PermissionService from '../services/PermissionService.js';
import prisma from '../config/database.js';

const router = express.Router();

// Apply enhanced authentication to all routes
router.use(enhancedAuthMiddleware);

/**
 * GET /api/admin/permissions
 * Get all permissions grouped by category
 */
router.get('/', requirePermission('roles.view'), async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    // Group permissions by category
    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {});

    res.json({
      success: true,
      permissions: groupedPermissions
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch permissions'
    });
  }
});

/**
 * GET /api/admin/permissions/roles
 * Get all roles with their permissions
 */
router.get('/roles', requirePermission('roles.view'), async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      where: { isActive: true },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        },
        userRoles: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Format roles with permission names and user count
    const formattedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.rolePermissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action,
        description: rp.permission.description,
        category: rp.permission.category,
        conditions: rp.conditions
      })),
      userCount: role.userRoles.length,
      users: role.userRoles.map(ur => ur.user)
    }));

    res.json({
      success: true,
      roles: formattedRoles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch roles'
    });
  }
});

/**
 * POST /api/admin/permissions/roles
 * Create a new role
 */
router.post('/roles', requirePermission('roles.create'), auditPresets.roleCreate, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Role name is required'
      });
    }

    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name }
    });

    if (existingRole) {
      return res.status(400).json({
        success: false,
        error: 'Role name already exists'
      });
    }

    // Create role
    const role = await prisma.role.create({
      data: {
        name,
        description,
        isSystem: false
      }
    });

    // Add permissions to role
    if (permissions && permissions.length > 0) {
      const rolePermissions = permissions.map(permissionId => ({
        roleId: role.id,
        permissionId
      }));

      await prisma.rolePermission.createMany({
        data: rolePermissions
      });
    }

    // Fetch the created role with permissions
    const createdRole = await prisma.role.findUnique({
      where: { id: role.id },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      role: {
        ...createdRole,
        permissions: createdRole.rolePermissions.map(rp => rp.permission)
      }
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create role'
    });
  }
});

/**
 * PUT /api/admin/permissions/roles/:id
 * Update a role
 */
router.put('/roles/:id', requirePermission('roles.update'), auditPresets.roleUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    // Check if role exists and is not system role
    const existingRole = await prisma.role.findUnique({
      where: { id }
    });

    if (!existingRole) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }

    if (existingRole.isSystem) {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify system roles'
      });
    }

    // Check if new name conflicts with existing role
    if (name && name !== existingRole.name) {
      const nameConflict = await prisma.role.findFirst({
        where: {
          name,
          id: { not: id }
        }
      });

      if (nameConflict) {
        return res.status(400).json({
          success: false,
          error: 'Role name already exists'
        });
      }
    }

    // Update role
    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        name,
        description
      }
    });

    // Update permissions if provided
    if (permissions) {
      // Remove existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: id }
      });

      // Add new permissions
      if (permissions.length > 0) {
        const rolePermissions = permissions.map(permissionId => ({
          roleId: id,
          permissionId
        }));

        await prisma.rolePermission.createMany({
          data: rolePermissions
        });
      }
    }

    // Fetch updated role with permissions
    const roleWithPermissions = await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    res.json({
      success: true,
      role: {
        ...roleWithPermissions,
        permissions: roleWithPermissions.rolePermissions.map(rp => rp.permission)
      }
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update role'
    });
  }
});

/**
 * DELETE /api/admin/permissions/roles/:id
 * Delete a role
 */
router.delete('/roles/:id', requirePermission('roles.delete'), auditPresets.roleDelete, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if role exists and is not system role
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        userRoles: {
          where: { isActive: true }
        }
      }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }

    if (role.isSystem) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete system roles'
      });
    }

    if (role.userRoles.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete role that is assigned to users'
      });
    }

    // Delete role (cascade will handle permissions)
    await prisma.role.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete role'
    });
  }
});

/**
 * GET /api/admin/permissions/users/:userId/roles
 * Get user's roles and permissions
 */
router.get('/users/:userId/roles', requirePermission('users.view'), async (req, res) => {
  try {
    const { userId } = req.params;

    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        isActive: true
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
        },
        assignedByUser: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    // Get all permissions for the user
    const permissions = await PermissionService.getUserPermissions(userId);

    res.json({
      success: true,
      userRoles: userRoles.map(ur => ({
        id: ur.id,
        assignedAt: ur.assignedAt,
        expiresAt: ur.expiresAt,
        assignedBy: ur.assignedByUser,
        role: {
          id: ur.role.id,
          name: ur.role.name,
          description: ur.role.description,
          permissions: ur.role.rolePermissions.map(rp => rp.permission)
        }
      })),
      permissions
    });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user roles'
    });
  }
});

/**
 * POST /api/admin/permissions/users/:userId/roles
 * Assign role to user
 */
router.post('/users/:userId/roles', requirePermission('roles.assign'), auditPresets.roleAssign, async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleId, expiresAt } = req.body;

    if (!roleId) {
      return res.status(400).json({
        success: false,
        error: 'Role ID is required'
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }

    // Check if user already has this role
    const existingUserRole = await prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
        isActive: true
      }
    });

    if (existingUserRole) {
      return res.status(400).json({
        success: false,
        error: 'User already has this role'
      });
    }

    // Assign role
    const userRole = await PermissionService.assignRole(
      userId,
      roleId,
      req.user.id,
      expiresAt ? new Date(expiresAt) : null
    );

    res.status(201).json({
      success: true,
      userRole
    });
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign role'
    });
  }
});

/**
 * DELETE /api/admin/permissions/users/:userId/roles/:roleId
 * Remove role from user
 */
router.delete('/users/:userId/roles/:roleId', requirePermission('roles.assign'), auditPresets.roleRemove, async (req, res) => {
  try {
    const { userId, roleId } = req.params;

    // Prevent admin from removing their own admin roles
    if (userId === req.user.id) {
      const role = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (role && (role.name === 'Super Admin' || role.name === 'Admin')) {
        return res.status(400).json({
          success: false,
          error: 'Cannot remove your own admin role'
        });
      }
    }

    await PermissionService.removeRole(userId, roleId);

    res.json({
      success: true,
      message: 'Role removed successfully'
    });
  } catch (error) {
    console.error('Error removing role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove role'
    });
  }
});

/**
 * POST /api/admin/permissions/initialize
 * Initialize default permissions and roles (admin only)
 */
router.post('/initialize', requirePermission('system.configure'), async (req, res) => {
  try {
    await PermissionService.initializeDefaultPermissions();

    res.json({
      success: true,
      message: 'Default permissions and roles initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize permissions'
    });
  }
});

export default router;