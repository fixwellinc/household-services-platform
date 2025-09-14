import PermissionService from '../services/PermissionService.js';
import prisma from '../config/database.js';

/**
 * Middleware to check if user has specific permission
 */
export const requirePermission = (permissionName, conditions = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if user has the required permission
      const hasPermission = await PermissionService.hasPermission(
        req.user.id,
        permissionName,
        conditions
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: permissionName
        });
      }

      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

/**
 * Middleware to check if user has any of the specified permissions
 */
export const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if user has any of the required permissions
      for (const permission of permissions) {
        const hasPermission = await PermissionService.hasPermission(
          req.user.id,
          permission
        );
        if (hasPermission) {
          return next();
        }
      }

      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permissions
      });
    } catch (error) {
      console.error('Permission middleware error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

/**
 * Middleware to handle impersonation
 */
export const handleImpersonation = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    // Check if user is currently impersonating someone
    const impersonationSession = await PermissionService.getActiveImpersonationSession(req.user.id);
    
    if (impersonationSession) {
      // Store original admin user
      req.originalUser = req.user;
      
      // Replace req.user with impersonated user
      req.user = impersonationSession.targetUser;
      req.impersonationSession = impersonationSession;
      
      // Add impersonation flag
      req.isImpersonating = true;
    }

    next();
  } catch (error) {
    console.error('Impersonation middleware error:', error);
    next(); // Continue without impersonation on error
  }
};

/**
 * Enhanced auth middleware that includes permission loading
 */
export const enhancedAuthMiddleware = async (req, res, next) => {
  try {
    // First run the basic auth middleware logic
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = req.cookies?.auth_token;
    }
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
    
    // Get user with roles and permissions
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        address: true,
        postalCode: true,
        createdAt: true,
        userRoles: {
          where: {
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
        }
      }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Add permissions to user object
    const permissions = new Set();
    user.userRoles.forEach(userRole => {
      userRole.role.rolePermissions.forEach(rp => {
        permissions.add(rp.permission.name);
      });
    });
    
    user.permissions = Array.from(permissions);
    req.user = user;
    
    // Handle impersonation
    await handleImpersonation(req, res, next);
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    console.error('Enhanced auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

/**
 * Utility function to check permissions in route handlers
 */
export const checkPermission = async (userId, permissionName, conditions = {}) => {
  return await PermissionService.hasPermission(userId, permissionName, conditions);
};

export default {
  requirePermission,
  requireAnyPermission,
  handleImpersonation,
  enhancedAuthMiddleware,
  checkPermission
};