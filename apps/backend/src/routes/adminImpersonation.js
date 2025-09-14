import express from 'express';
import { enhancedAuthMiddleware, requirePermission } from '../middleware/permissionMiddleware.js';
import { auditPresets } from '../middleware/auditMiddleware.js';
import PermissionService from '../services/PermissionService.js';
import prisma from '../config/database.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Apply enhanced authentication to all routes
router.use(enhancedAuthMiddleware);

/**
 * POST /api/admin/impersonation/start
 * Start impersonating a user
 */
router.post('/start', requirePermission('users.impersonate'), auditPresets.impersonationStart, async (req, res) => {
  try {
    const { targetUserId, reason } = req.body;

    if (!targetUserId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Target user ID and reason are required'
      });
    }

    // Prevent self-impersonation
    if (targetUserId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot impersonate yourself'
      });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'Target user not found'
      });
    }

    // Prevent impersonating other admins (unless super admin)
    const adminId = req.originalUser?.id || req.user.id;
    const adminPermissions = await PermissionService.getUserPermissions(adminId);
    
    if (targetUser.role === 'ADMIN' && !adminPermissions.includes('system.configure')) {
      return res.status(403).json({
        success: false,
        error: 'Cannot impersonate other administrators'
      });
    }

    // Get client info
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Create impersonation session
    const session = await PermissionService.createImpersonationSession(
      adminId,
      targetUserId,
      reason,
      ipAddress,
      userAgent
    );

    // Generate new JWT token for the impersonated user
    const impersonationToken = jwt.sign(
      { 
        userId: targetUserId,
        impersonationSessionId: session.id,
        originalAdminId: adminId
      },
      process.env.JWT_SECRET,
      { expiresIn: '4h' } // Shorter expiry for impersonation
    );

    res.json({
      success: true,
      session: {
        id: session.id,
        targetUser,
        startedAt: session.startedAt,
        reason: session.reason
      },
      impersonationToken
    });
  } catch (error) {
    console.error('Error starting impersonation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start impersonation'
    });
  }
});

/**
 * POST /api/admin/impersonation/end
 * End current impersonation session
 */
router.post('/end', auditPresets.impersonationEnd, async (req, res) => {
  try {
    const adminId = req.originalUser?.id || req.user.id;

    // Get active impersonation session
    const session = await PermissionService.getActiveImpersonationSession(adminId);

    if (!session) {
      return res.status(400).json({
        success: false,
        error: 'No active impersonation session found'
      });
    }

    // End the session
    await PermissionService.endImpersonationSession(session.id);

    // Generate new token for the original admin
    const originalToken = jwt.sign(
      { userId: adminId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Impersonation session ended',
      originalToken
    });
  } catch (error) {
    console.error('Error ending impersonation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end impersonation'
    });
  }
});

/**
 * GET /api/admin/impersonation/status
 * Get current impersonation status
 */
router.get('/status', async (req, res) => {
  try {
    const adminId = req.originalUser?.id || req.user.id;
    
    if (req.isImpersonating) {
      res.json({
        success: true,
        isImpersonating: true,
        session: {
          id: req.impersonationSession.id,
          targetUser: req.impersonationSession.targetUser,
          startedAt: req.impersonationSession.startedAt,
          reason: req.impersonationSession.reason
        },
        originalAdmin: req.originalUser
      });
    } else {
      res.json({
        success: true,
        isImpersonating: false
      });
    }
  } catch (error) {
    console.error('Error getting impersonation status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get impersonation status'
    });
  }
});

/**
 * GET /api/admin/impersonation/history
 * Get impersonation history
 */
router.get('/history', requirePermission('audit.view'), async (req, res) => {
  try {
    const { page = 1, limit = 50, adminId, targetUserId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (adminId) where.adminId = adminId;
    if (targetUserId) where.targetUserId = targetUserId;

    const [sessions, totalCount] = await Promise.all([
      prisma.impersonationSession.findMany({
        where,
        skip,
        take,
        orderBy: { startedAt: 'desc' },
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
        }
      }),
      prisma.impersonationSession.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / take);

    res.json({
      success: true,
      sessions,
      pagination: {
        page: parseInt(page),
        limit: take,
        totalCount,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching impersonation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch impersonation history'
    });
  }
});

/**
 * GET /api/admin/impersonation/active
 * Get all active impersonation sessions
 */
router.get('/active', requirePermission('audit.view'), async (req, res) => {
  try {
    const activeSessions = await prisma.impersonationSession.findMany({
      where: { isActive: true },
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
      orderBy: { startedAt: 'desc' }
    });

    res.json({
      success: true,
      activeSessions
    });
  } catch (error) {
    console.error('Error fetching active impersonation sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active sessions'
    });
  }
});

export default router;