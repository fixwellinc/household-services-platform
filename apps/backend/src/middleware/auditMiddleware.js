import { auditService } from '../services/auditService.js';

/**
 * Middleware to automatically log admin actions
 */
export function auditMiddleware(options = {}) {
  const {
    action,
    entityType,
    getEntityId = (req) => req.params.id,
    getChanges = () => ({}),
    severity = 'medium',
    skipIf = () => false
  } = options;

  return async (req, res, next) => {
    // Skip audit logging if condition is met
    if (skipIf(req)) {
      return next();
    }

    // Store original response methods
    const originalSend = res.send;
    const originalJson = res.json;

    // Capture response data
    let responseData = null;
    let statusCode = null;

    // Override response methods to capture data
    res.send = function(data) {
      responseData = data;
      statusCode = res.statusCode;
      return originalSend.call(this, data);
    };

    res.json = function(data) {
      responseData = data;
      statusCode = res.statusCode;
      return originalJson.call(this, data);
    };

    // Continue with the request
    next();

    // Log the action after response is sent
    res.on('finish', async () => {
      try {
        // Only log successful operations (2xx status codes)
        if (statusCode >= 200 && statusCode < 300) {
          const adminId = req.user?.id;
          
          if (!adminId) {
            console.warn('Audit middleware: No admin ID found in request');
            return;
          }

          const entityId = getEntityId(req);
          const changes = getChanges(req, responseData);
          
          const metadata = {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            method: req.method,
            url: req.originalUrl,
            statusCode,
            requestBody: req.method !== 'GET' ? req.body : undefined,
            sessionId: req.sessionID
          };

          await auditService.logAction({
            adminId,
            action: action || `${req.method} ${req.route?.path || req.path}`,
            entityType: entityType || 'unknown',
            entityId: entityId || 'unknown',
            changes,
            metadata,
            severity
          });
        }
      } catch (error) {
        console.error('Audit middleware error:', error);
        // Don't throw error to avoid affecting the main request
      }
    });
  };
}

/**
 * Predefined audit middleware for common operations
 */
export const auditPresets = {
  userCreate: auditMiddleware({
    action: 'CREATE_USER',
    entityType: 'user',
    getEntityId: (req, responseData) => {
      try {
        const parsed = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        return parsed?.user?.id || 'unknown';
      } catch {
        return 'unknown';
      }
    },
    getChanges: (req) => ({
      created: req.body
    }),
    severity: 'medium'
  }),

  userUpdate: auditMiddleware({
    action: 'UPDATE_USER',
    entityType: 'user',
    getEntityId: (req) => req.params.id || req.params.userId,
    getChanges: (req) => ({
      updated: req.body
    }),
    severity: 'medium'
  }),

  userDelete: auditMiddleware({
    action: 'DELETE_USER',
    entityType: 'user',
    getEntityId: (req) => req.params.id || req.params.userId,
    severity: 'high'
  }),

  userSuspend: auditMiddleware({
    action: 'SUSPEND_USER',
    entityType: 'user',
    getEntityId: (req) => req.params.id || req.params.userId,
    getChanges: (req) => ({
      reason: req.body.reason
    }),
    severity: 'high'
  }),

  userActivate: auditMiddleware({
    action: 'ACTIVATE_USER',
    entityType: 'user',
    getEntityId: (req) => req.params.id || req.params.userId,
    getChanges: (req) => ({
      role: req.body.role,
      reason: req.body.reason
    }),
    severity: 'medium'
  }),

  userLock: auditMiddleware({
    action: 'LOCK_USER',
    entityType: 'user',
    getEntityId: (req) => req.params.id || req.params.userId,
    getChanges: (req) => ({
      reason: req.body.reason
    }),
    severity: 'high'
  }),

  userUnlock: auditMiddleware({
    action: 'UNLOCK_USER',
    entityType: 'user',
    getEntityId: (req) => req.params.id || req.params.userId,
    getChanges: (req) => ({
      reason: req.body.reason
    }),
    severity: 'medium'
  }),

  roleAssign: auditMiddleware({
    action: 'ASSIGN_ROLE',
    entityType: 'user_role',
    getEntityId: (req) => req.params.id || req.params.userId,
    getChanges: (req) => ({
      roleId: req.body.roleId,
      expiresAt: req.body.expiresAt
    }),
    severity: 'high'
  }),

  roleRemove: auditMiddleware({
    action: 'REMOVE_ROLE',
    entityType: 'user_role',
    getEntityId: (req) => req.params.id || req.params.userId,
    getChanges: (req) => ({
      roleId: req.params.roleId
    }),
    severity: 'high'
  }),

  roleCreate: auditMiddleware({
    action: 'CREATE_ROLE',
    entityType: 'role',
    getEntityId: (req, responseData) => {
      try {
        const parsed = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        return parsed?.role?.id || 'unknown';
      } catch {
        return 'unknown';
      }
    },
    getChanges: (req) => ({
      created: req.body
    }),
    severity: 'high'
  }),

  roleUpdate: auditMiddleware({
    action: 'UPDATE_ROLE',
    entityType: 'role',
    getEntityId: (req) => req.params.id,
    getChanges: (req) => ({
      updated: req.body
    }),
    severity: 'high'
  }),

  roleDelete: auditMiddleware({
    action: 'DELETE_ROLE',
    entityType: 'role',
    getEntityId: (req) => req.params.id,
    severity: 'high'
  }),

  subscriptionUpdate: auditMiddleware({
    action: 'UPDATE_SUBSCRIPTION',
    entityType: 'subscription',
    getEntityId: (req) => req.params.id || req.params.subscriptionId,
    getChanges: (req) => ({
      updated: req.body
    }),
    severity: 'medium'
  }),

  subscriptionCancel: auditMiddleware({
    action: 'CANCEL_SUBSCRIPTION',
    entityType: 'subscription',
    getEntityId: (req) => req.params.id || req.params.subscriptionId,
    getChanges: (req) => ({
      reason: req.body.reason
    }),
    severity: 'high'
  }),

  emailBlast: auditMiddleware({
    action: 'SEND_EMAIL_BLAST',
    entityType: 'email_campaign',
    getEntityId: () => Date.now().toString(), // Generate unique ID for email blast
    getChanges: (req) => ({
      subject: req.body.subject,
      recipientFilter: req.body.recipientFilter,
      template: req.body.template
    }),
    severity: 'medium'
  }),

  settingsUpdate: auditMiddleware({
    action: 'UPDATE_SETTINGS',
    entityType: 'system_settings',
    getEntityId: () => 'system',
    getChanges: (req) => ({
      updated: req.body
    }),
    severity: 'high'
  }),

  bulkOperation: auditMiddleware({
    action: 'BULK_OPERATION',
    entityType: 'bulk',
    getEntityId: (req) => `bulk_${Date.now()}`,
    getChanges: (req) => ({
      operation: req.body.operation,
      entityIds: req.body.entityIds,
      parameters: req.body.parameters
    }),
    severity: 'high'
  }),

  userSuspend: auditMiddleware({
    action: 'SUSPEND_USER',
    entityType: 'user',
    getEntityId: (req) => req.params.id,
    getChanges: (req) => ({
      reason: req.body.reason
    }),
    severity: 'high'
  }),

  userActivate: auditMiddleware({
    action: 'ACTIVATE_USER',
    entityType: 'user',
    getEntityId: (req) => req.params.id,
    getChanges: (req) => ({
      role: req.body.role
    }),
    severity: 'medium'
  }),

  userPasswordReset: auditMiddleware({
    action: 'RESET_USER_PASSWORD',
    entityType: 'user',
    getEntityId: (req) => req.params.id,
    severity: 'high'
  }),

  roleCreate: auditMiddleware({
    action: 'CREATE_ROLE',
    entityType: 'role',
    getEntityId: (req, responseData) => {
      try {
        const parsed = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        return parsed?.role?.id || 'unknown';
      } catch {
        return 'unknown';
      }
    },
    getChanges: (req) => ({
      created: req.body
    }),
    severity: 'medium'
  }),

  roleUpdate: auditMiddleware({
    action: 'UPDATE_ROLE',
    entityType: 'role',
    getEntityId: (req) => req.params.id || req.params.roleId,
    getChanges: (req) => ({
      updated: req.body
    }),
    severity: 'medium'
  }),

  roleDelete: auditMiddleware({
    action: 'DELETE_ROLE',
    entityType: 'role',
    getEntityId: (req) => req.params.id || req.params.roleId,
    severity: 'high'
  }),

  permissionAssign: auditMiddleware({
    action: 'ASSIGN_PERMISSION',
    entityType: 'permission',
    getEntityId: (req) => req.params.id || req.params.userId,
    getChanges: (req) => ({
      permissions: req.body.permissions || req.body.roleIds
    }),
    severity: 'medium'
  }),

  impersonationStart: auditMiddleware({
    action: 'START_IMPERSONATION',
    entityType: 'impersonation',
    getEntityId: (req) => req.params.userId || req.body.userId,
    getChanges: (req) => ({
      targetUserId: req.params.userId || req.body.userId,
      reason: req.body.reason
    }),
    severity: 'high'
  }),

  impersonationEnd: auditMiddleware({
    action: 'END_IMPERSONATION',
    entityType: 'impersonation',
    getEntityId: (req) => req.params.sessionId || req.body.sessionId,
    severity: 'medium'
  }),

  roleAssign: auditMiddleware({
    action: 'ASSIGN_ROLE',
    entityType: 'user_role',
    getEntityId: (req) => req.params.userId,
    getChanges: (req) => ({
      roleId: req.body.roleId,
      expiresAt: req.body.expiresAt
    }),
    severity: 'medium'
  }),

  roleRevoke: auditMiddleware({
    action: 'REVOKE_ROLE',
    entityType: 'user_role',
    getEntityId: (req) => req.params.userId,
    getChanges: (req) => ({
      roleId: req.params.roleId || req.body.roleId
    }),
    severity: 'medium'
  }),

  roleRemove: auditMiddleware({
    action: 'REMOVE_ROLE',
    entityType: 'user_role',
    getEntityId: (req) => req.params.userId,
    getChanges: (req) => ({
      roleId: req.params.roleId
    }),
    severity: 'medium'
  }),

  billingUpdate: auditMiddleware({
    action: 'BILLING_ADJUSTMENT',
    entityType: 'billing_adjustment',
    getEntityId: (req) => req.params.subscriptionId || req.params.adjustmentId,
    getChanges: (req) => ({
      adjustmentData: req.body
    }),
    severity: 'high'
  })
};

/**
 * Manual audit logging function for custom use cases
 */
export async function logAuditAction(req, options) {
  try {
    const adminId = req.user?.id;
    
    if (!adminId) {
      throw new Error('No admin ID found in request');
    }

    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.originalUrl,
      sessionId: req.sessionID,
      ...options.metadata
    };

    return await auditService.logAction({
      adminId,
      ...options,
      metadata
    });
  } catch (error) {
    console.error('Manual audit logging error:', error);
    throw error;
  }
}