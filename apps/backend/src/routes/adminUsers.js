import express from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { auditPresets } from '../middleware/auditMiddleware.js';
import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Apply admin role check (auth already applied globally)
router.use(requireAdmin);

/**
 * GET /api/admin/users/stats
 * Get user statistics for dashboard
 */
router.get('/stats', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      lockedUsers,
      adminUsers,
      employeeUsers,
      technicianUsers,
      salesmanUsers,
      recentUsers,
      inactiveUsers,
      usersWithFailedLogins
    ] = await Promise.all([
      // Total users (excluding CUSTOMER)
      prisma.user.count({
        where: { role: { not: 'CUSTOMER' } }
      }),
      
      // Active users (not suspended, not locked, not deleted)
      prisma.user.count({
        where: { 
          role: { notIn: ['CUSTOMER', 'SUSPENDED', 'DELETED'] },
          isLocked: { not: true }
        }
      }),
      
      // Suspended users
      prisma.user.count({
        where: { role: 'SUSPENDED' }
      }),
      
      // Locked users
      prisma.user.count({
        where: { isLocked: true }
      }),
      
      // Admin users
      prisma.user.count({
        where: { role: 'ADMIN' }
      }),
      
      // Employee users
      prisma.user.count({
        where: { role: 'EMPLOYEE' }
      }),
      
      // Technician users
      prisma.user.count({
        where: { role: 'TECHNICIAN' }
      }),
      
      // Salesman users
      prisma.user.count({
        where: { role: 'SALESMAN' }
      }),
      
      // Recent users (last 7 days)
      prisma.user.count({
        where: { 
          createdAt: { gte: sevenDaysAgo },
          role: { not: 'CUSTOMER' }
        }
      }),
      
      // Inactive users (no login in 30+ days)
      prisma.user.count({
        where: {
          OR: [
            { lastLoginAt: { lt: thirtyDaysAgo } },
            { lastLoginAt: null }
          ],
          role: { not: 'CUSTOMER' }
        }
      }),
      
      // Users with failed login attempts
      prisma.user.count({
        where: { 
          failedLoginAttempts: { gt: 0 },
          role: { not: 'CUSTOMER' }
        }
      })
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        lockedUsers,
        adminUsers,
        employeeUsers,
        technicianUsers,
        salesmanUsers,
        recentUsers,
        inactiveUsers,
        usersWithFailedLogins
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics'
    });
  }
});

/**
 * GET /api/admin/users
 * Get all users with advanced filtering and search
 */
router.get('/', async (req, res) => {
  try {
    const {
      search,
      role,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    
    // Default filter: exclude CUSTOMER role users unless explicitly requested
    if (!role) {
      where.role = { not: 'CUSTOMER' };
    } else if (role) {
      where.role = role;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          address: true,
          postalCode: true,
          createdAt: true,
          updatedAt: true,
          subscriptionId: true,
          // Don't include password
        }
      }),
      prisma.user.count({ where })
    ]);

    // Get subscription info for users who have subscriptions (batch to avoid N+1)
    const subscriptionIds = users.map(u => u.subscriptionId).filter(Boolean);
    let subscriptionsById = {};
    if (subscriptionIds.length > 0) {
      const subscriptions = await prisma.subscription.findMany({
        where: { id: { in: subscriptionIds } },
        select: {
          id: true,
          tier: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true
        }
      });
      subscriptionsById = Object.fromEntries(subscriptions.map(s => [s.id, s]));
    }

    const usersWithSubscriptions = users.map(user => (
      user.subscriptionId
        ? { ...user, subscription: subscriptionsById[user.subscriptionId] || null }
        : user
    ));

    const totalPages = Math.ceil(totalCount / take);

    res.json({
      success: true,
      users: usersWithSubscriptions,
      pagination: {
        page: parseInt(page),
        limit: take,
        totalCount,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

/**
 * GET /api/admin/users/search
 * Search users for salesman assignment (supports multiple roles)
 */
router.get('/search', async (req, res) => {
  try {
    const { q: query, roles } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Parse roles parameter
    let roleFilter = ['CUSTOMER', 'EMPLOYEE']; // Default eligible roles
    if (roles) {
      roleFilter = roles.split(',').map(role => role.trim());
    }

    // Build search where clause
    const where = {
      AND: [
        {
          role: {
            in: roleFilter
          }
        },
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } }
          ]
        }
      ]
    };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true
      },
      orderBy: { name: 'asc' },
      take: 20 // Limit results for performance
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users'
    });
  }
});

/**
 * GET /api/admin/users/:id
 * Get detailed user information including activity timeline
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        postalCode: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        subscriptionId: true,
        serviceIds: true,
        bookingIds: true,
        messageIds: true,
        quoteIds: true,
        suspendedAt: true,
        suspendedBy: true,
        suspensionReason: true,
        activatedAt: true,
        activatedBy: true,
        activationReason: true,
        lastLoginAt: true,
        passwordChangedAt: true,
        isLocked: true,
        lockedAt: true,
        lockedBy: true,
        lockReason: true,
        forcePasswordChange: true,
        failedLoginAttempts: true,
        lastFailedLoginAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get subscription details
    let subscription = null;
    if (user.subscriptionId) {
      subscription = await prisma.subscription.findUnique({
        where: { id: user.subscriptionId }
      });
    }

    // Get bookings
    const bookings = await prisma.booking.findMany({
      where: { customerId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get quotes
    const quotes = await prisma.quote.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get recent messages
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: user.id },
          { receiverId: user.id }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get audit logs for this user
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { entityType: 'user', entityId: user.id },
          { adminId: user.id } // If user is admin
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    // Get role assignments
    const roleAssignments = await prisma.userRole.findMany({
      where: { userId: user.id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        assignedByUser: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    });

    // Get impersonation sessions
    const impersonationSessions = await prisma.impersonationSession.findMany({
      where: {
        OR: [
          { adminId: user.id },
          { targetUserId: user.id }
        ]
      },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        targetUser: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: { startedAt: 'desc' },
      take: 10
    });

    // Build activity timeline
    const activities = [
      ...bookings.map(booking => ({
        type: 'booking',
        action: `Booking ${booking.status.toLowerCase()}`,
        timestamp: booking.createdAt,
        data: booking
      })),
      ...quotes.map(quote => ({
        type: 'quote',
        action: `Quote ${quote.status.toLowerCase()}`,
        timestamp: quote.createdAt,
        data: quote
      })),
      ...messages.map(message => ({
        type: 'message',
        action: message.senderId === user.id ? 'Sent message' : 'Received message',
        timestamp: message.createdAt,
        data: message
      })),
      ...auditLogs.map(log => ({
        type: 'audit',
        action: log.action,
        timestamp: log.createdAt,
        data: log,
        actor: log.admin
      })),
      ...roleAssignments.map(assignment => ({
        type: 'role_change',
        action: `Role assigned: ${assignment.role.name}`,
        timestamp: assignment.assignedAt,
        data: assignment,
        actor: assignment.assignedByUser
      })),
      ...impersonationSessions.map(session => ({
        type: 'impersonation',
        action: session.adminId === user.id ? 
          `Impersonated ${session.targetUser.email}` : 
          `Impersonated by ${session.admin.email}`,
        timestamp: session.startedAt,
        data: session,
        actor: session.adminId === user.id ? session.admin : session.targetUser
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      user: {
        ...user,
        subscription
      },
      activities: activities.slice(0, 50), // Limit to 50 most recent activities
      roleAssignments,
      impersonationSessions,
      stats: {
        totalBookings: bookings.length,
        totalQuotes: quotes.length,
        totalMessages: messages.length,
        totalRoleAssignments: roleAssignments.length,
        totalImpersonationSessions: impersonationSessions.length,
        failedLoginAttempts: user.failedLoginAttempts || 0,
        isLocked: user.isLocked || false,
        lastLoginAt: user.lastLoginAt,
        passwordChangedAt: user.passwordChangedAt
      }
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user details'
    });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update user information
 */
router.put('/:id', auditPresets.userUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, postalCode, role } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          id: { not: id }
        }
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: 'Email is already taken'
        });
      }
    }

    // Enhanced self-modification protection
    const isSelfModification = req.user.id === id;
    
    if (isSelfModification) {
      // Prevent admin from changing their own role to non-admin
      if (role && role !== 'ADMIN' && existingUser.role === 'ADMIN') {
        return res.status(400).json({
          success: false,
          error: 'Cannot change your own admin role to prevent system lockout'
        });
      }
      
      // Log self-modification attempts for security audit
      req.auditMetadata = {
        ...req.auditMetadata,
        isSelfModification: true,
        modifiedFields: Object.keys(req.body),
        securityNote: 'Admin modified their own account'
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        address,
        postalCode,
        role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        postalCode: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
});

/**
 * POST /api/admin/users
 * Create new user
 */
router.post('/', auditPresets.userCreate, async (req, res) => {
  try {
    const { name, email, password, phone, address, postalCode, role = 'EMPLOYEE' } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email is already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        address,
        postalCode,
        role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        postalCode: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json({
      success: true,
      user: newUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete user (soft delete by changing role to DELETED)
 */
router.delete('/:id', auditPresets.userDelete, async (req, res) => {
  try {
    const { id } = req.params;

    // Enhanced self-deletion protection
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account to prevent system lockout. Please have another admin perform this action.'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Soft delete by updating role
    await prisma.user.update({
      where: { id },
      data: {
        role: 'DELETED',
        email: `deleted_${Date.now()}_${user.email}` // Prevent email conflicts
      }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
});

/**
 * POST /api/admin/users/:id/suspend
 * Suspend user account with reason tracking
 */
router.post('/:id/suspend', auditPresets.userSuspend, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Suspension reason is required'
      });
    }

    // Allow admin to suspend themselves with additional confirmation
    // This is handled by the frontend confirmation dialog

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.role === 'SUSPENDED') {
      return res.status(400).json({
        success: false,
        error: 'User is already suspended'
      });
    }

    // Store the previous role for potential restoration
    const previousRole = user.role;

    await prisma.user.update({
      where: { id },
      data: {
        role: 'SUSPENDED',
        suspendedAt: new Date(),
        suspendedBy: req.user.id,
        suspensionReason: reason.trim(),
        // Clear activation fields if previously activated
        activatedAt: null,
        activatedBy: null,
        activationReason: null
      }
    });

    // Store the previous role in audit metadata for restoration
    req.auditMetadata = {
      ...req.auditMetadata,
      previousRole,
      suspensionReason: reason.trim(),
      isSelfSuspension: req.user.id === id
    };

    res.json({
      success: true,
      message: 'User suspended successfully',
      data: {
        suspendedAt: new Date().toISOString(),
        suspendedBy: req.user.id,
        reason: reason.trim()
      }
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suspend user'
    });
  }
});

/**
 * POST /api/admin/users/:id/activate
 * Activate suspended user account with reason tracking
 */
router.post('/:id/activate', auditPresets.userActivate, async (req, res) => {
  try {
    const { id } = req.params;
    const { role = 'CUSTOMER', reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Activation reason is required'
      });
    }

    const validRoles = ['CUSTOMER', 'EMPLOYEE', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role specified'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.role !== 'SUSPENDED') {
      return res.status(400).json({
        success: false,
        error: 'User is not suspended'
      });
    }

    await prisma.user.update({
      where: { id },
      data: {
        role,
        activatedAt: new Date(),
        activatedBy: req.user.id,
        activationReason: reason.trim()
        // Keep suspension history for audit trail
      }
    });

    // Store activation details in audit metadata
    req.auditMetadata = {
      ...req.auditMetadata,
      newRole: role,
      activationReason: reason.trim(),
      isSelfActivation: req.user.id === id
    };

    res.json({
      success: true,
      message: 'User activated successfully',
      data: {
        activatedAt: new Date().toISOString(),
        activatedBy: req.user.id,
        newRole: role,
        reason: reason.trim()
      }
    });
  } catch (error) {
    console.error('Error activating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate user'
    });
  }
});

/**
 * POST /api/admin/users/:id/lock
 * Lock user account
 */
router.post('/:id/lock', auditPresets.userLock, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Lock reason is required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.isLocked) {
      return res.status(400).json({
        success: false,
        error: 'User is already locked'
      });
    }

    await prisma.user.update({
      where: { id },
      data: {
        isLocked: true,
        lockedAt: new Date(),
        lockedBy: req.user.id,
        lockReason: reason.trim()
      }
    });

    res.json({
      success: true,
      message: 'User account locked successfully'
    });
  } catch (error) {
    console.error('Error locking user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to lock user account'
    });
  }
});

/**
 * POST /api/admin/users/:id/unlock
 * Unlock user account
 */
router.post('/:id/unlock', auditPresets.userUnlock, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Unlock reason is required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.isLocked) {
      return res.status(400).json({
        success: false,
        error: 'User is not locked'
      });
    }

    await prisma.user.update({
      where: { id },
      data: {
        isLocked: false,
        lockedAt: null,
        lockedBy: null,
        lockReason: null,
        failedLoginAttempts: 0 // Reset failed attempts
      }
    });

    res.json({
      success: true,
      message: 'User account unlocked successfully'
    });
  } catch (error) {
    console.error('Error unlocking user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlock user account'
    });
  }
});

/**
 * GET /api/admin/users/:id/roles
 * Get user's role assignments
 */
router.get('/:id/roles', async (req, res) => {
  try {
    const { id } = req.params;

    const userRoles = await prisma.userRole.findMany({
      where: { userId: id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            isSystem: true
          }
        },
        assignedByUser: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    });

    res.json({
      success: true,
      roles: userRoles
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
 * POST /api/admin/users/:id/roles
 * Assign role to user
 */
router.post('/:id/roles', auditPresets.roleAssign, async (req, res) => {
  try {
    const { id } = req.params;
    const { roleId, expiresAt } = req.body;

    if (!roleId) {
      return res.status(400).json({
        success: false,
        error: 'Role ID is required'
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
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

    // Check if role is already assigned
    const existingAssignment = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: id,
          roleId: roleId
        }
      }
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        error: 'Role is already assigned to this user'
      });
    }

    // Create role assignment
    const userRole = await prisma.userRole.create({
      data: {
        userId: id,
        roleId: roleId,
        assignedBy: req.user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            isSystem: true
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

    res.json({
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
 * DELETE /api/admin/users/:id/roles/:roleId
 * Remove role assignment from user
 */
router.delete('/:id/roles/:roleId', auditPresets.roleRemove, async (req, res) => {
  try {
    const { id, roleId } = req.params;

    const userRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: id,
          roleId: roleId
        }
      }
    });

    if (!userRole) {
      return res.status(404).json({
        success: false,
        error: 'Role assignment not found'
      });
    }

    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId: id,
          roleId: roleId
        }
      }
    });

    res.json({
      success: true,
      message: 'Role assignment removed successfully'
    });
  } catch (error) {
    console.error('Error removing role assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove role assignment'
    });
  }
});

/**
 * POST /api/admin/users/:id/reset-password
 * Reset user password
 */
router.post('/:id/reset-password', auditPresets.userPasswordReset, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password is required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword
      }
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    });
  }
});

export default router;