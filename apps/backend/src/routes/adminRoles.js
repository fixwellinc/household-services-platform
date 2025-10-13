import express from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { auditPresets } from '../middleware/auditMiddleware.js';
import prisma from '../config/database.js';

const router = express.Router();

// Apply admin role check
router.use(requireAdmin);

/**
 * GET /api/admin/roles
 * Get all roles
 */
router.get('/', async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      where: { isActive: true },
      include: {
        rolePermissions: {
          include: {
            permission: {
              select: {
                id: true,
                name: true,
                resource: true,
                action: true,
                description: true,
                category: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      roles
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
 * GET /api/admin/roles/:id
 * Get role by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: {
              select: {
                id: true,
                name: true,
                resource: true,
                action: true,
                description: true,
                category: true
              }
            }
          }
        }
      }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }

    res.json({
      success: true,
      role
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch role'
    });
  }
});

/**
 * POST /api/admin/roles
 * Create new role
 */
router.post('/', auditPresets.roleCreate, async (req, res) => {
  try {
    const { name, description, permissions = [] } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Role name is required'
      });
    }

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: { name }
    });

    if (existingRole) {
      return res.status(400).json({
        success: false,
        error: 'Role with this name already exists'
      });
    }

    // Create role with permissions
    const role = await prisma.role.create({
      data: {
        name,
        description,
        rolePermissions: {
          create: permissions.map(permissionId => ({
            permissionId
          }))
        }
      },
      include: {
        rolePermissions: {
          include: {
            permission: {
              select: {
                id: true,
                name: true,
                resource: true,
                action: true,
                description: true,
                category: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      role
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
 * PUT /api/admin/roles/:id
 * Update role
 */
router.put('/:id', auditPresets.roleUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions = [] } = req.body;

    const role = await prisma.role.findUnique({
      where: { id }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }

    // Check if name is being changed and if it conflicts
    if (name && name !== role.name) {
      const existingRole = await prisma.role.findUnique({
        where: { name }
      });

      if (existingRole) {
        return res.status(400).json({
          success: false,
          error: 'Role with this name already exists'
        });
      }
    }

    // Update role and permissions
    const updatedRole = await prisma.$transaction(async (tx) => {
      // Update role
      const role = await tx.role.update({
        where: { id },
        data: {
          name,
          description
        }
      });

      // Update permissions
      await tx.rolePermission.deleteMany({
        where: { roleId: id }
      });

      await tx.rolePermission.createMany({
        data: permissions.map(permissionId => ({
          roleId: id,
          permissionId
        }))
      });

      return role;
    });

    // Fetch updated role with permissions
    const roleWithPermissions = await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: {
              select: {
                id: true,
                name: true,
                resource: true,
                action: true,
                description: true,
                category: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      role: roleWithPermissions
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
 * DELETE /api/admin/roles/:id
 * Delete role (soft delete)
 */
router.delete('/:id', auditPresets.roleDelete, async (req, res) => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id }
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

    // Soft delete by setting isActive to false
    await prisma.role.update({
      where: { id },
      data: { isActive: false }
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

export default router;
