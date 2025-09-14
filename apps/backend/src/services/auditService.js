import { PrismaClient } from '@prisma/client';
import winston from 'winston';

const prisma = new PrismaClient();

// Configure audit logger
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'audit' },
  transports: [
    new winston.transports.File({ filename: 'logs/audit.log' }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  auditLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

class AuditService {
  /**
   * Log an admin action
   * @param {Object} params - Audit log parameters
   * @param {string} params.adminId - ID of the admin performing the action
   * @param {string} params.action - Action being performed
   * @param {string} params.entityType - Type of entity being affected
   * @param {string} params.entityId - ID of the entity being affected
   * @param {Object} params.changes - Changes made (before/after values)
   * @param {Object} params.metadata - Additional metadata (IP, user agent, etc.)
   * @param {string} params.severity - Severity level of the action
   */
  async logAction({
    adminId,
    action,
    entityType,
    entityId,
    changes = {},
    metadata = {},
    severity = 'medium'
  }) {
    try {
      // Create audit log entry in database
      const auditLog = await prisma.auditLog.create({
        data: {
          adminId,
          action,
          entityType,
          entityId,
          changes: JSON.stringify(changes),
          metadata: JSON.stringify({
            ...metadata,
            timestamp: new Date().toISOString()
          }),
          severity,
          createdAt: new Date()
        }
      });

      // Log to file system
      auditLogger.info('Admin action logged', {
        auditLogId: auditLog.id,
        adminId,
        action,
        entityType,
        entityId,
        severity,
        metadata
      });

      return auditLog;
    } catch (error) {
      auditLogger.error('Failed to log audit action', {
        error: error.message,
        adminId,
        action,
        entityType,
        entityId
      });
      throw error;
    }
  }

  /**
   * Get audit logs with filtering and pagination
   * @param {Object} filters - Filter parameters
   * @param {string} filters.adminId - Filter by admin ID
   * @param {string} filters.action - Filter by action type
   * @param {string} filters.entityType - Filter by entity type
   * @param {string} filters.severity - Filter by severity level
   * @param {Date} filters.startDate - Filter by start date
   * @param {Date} filters.endDate - Filter by end date
   * @param {number} filters.page - Page number for pagination
   * @param {number} filters.limit - Number of items per page
   */
  async getAuditLogs(filters = {}) {
    try {
      const {
        adminId,
        action,
        entityType,
        severity,
        startDate,
        endDate,
        page = 1,
        limit = 50
      } = filters;

      const where = {};

      if (adminId) where.adminId = adminId;
      if (action) where.action = { contains: action, mode: 'insensitive' };
      if (entityType) where.entityType = entityType;
      if (severity) where.severity = severity;
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [auditLogs, totalCount] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            admin: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.auditLog.count({ where })
      ]);

      // Parse JSON fields
      const processedLogs = auditLogs.map(log => ({
        ...log,
        changes: log.changes ? JSON.parse(log.changes) : {},
        metadata: log.metadata ? JSON.parse(log.metadata) : {}
      }));

      return {
        auditLogs: processedLogs,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      auditLogger.error('Failed to retrieve audit logs', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Export audit logs in various formats
   * @param {Object} filters - Filter parameters
   * @param {string} format - Export format ('csv', 'json')
   */
  async exportAuditLogs(filters = {}, format = 'csv') {
    try {
      // Get all matching logs (no pagination for export)
      const { auditLogs } = await this.getAuditLogs({
        ...filters,
        limit: 10000 // Large limit for export
      });

      if (format === 'json') {
        return JSON.stringify(auditLogs, null, 2);
      }

      if (format === 'csv') {
        const headers = [
          'ID',
          'Admin Email',
          'Action',
          'Entity Type',
          'Entity ID',
          'Severity',
          'Timestamp',
          'IP Address',
          'User Agent'
        ];

        const rows = auditLogs.map(log => [
          log.id,
          log.admin?.email || 'Unknown',
          log.action,
          log.entityType,
          log.entityId,
          log.severity,
          log.createdAt.toISOString(),
          log.metadata?.ipAddress || 'Unknown',
          log.metadata?.userAgent || 'Unknown'
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(field => `"${field}"`).join(','))
        ].join('\n');

        return csvContent;
      }

      throw new Error(`Unsupported export format: ${format}`);
    } catch (error) {
      auditLogger.error('Failed to export audit logs', {
        error: error.message,
        filters,
        format
      });
      throw error;
    }
  }

  /**
   * Get audit statistics
   * @param {Object} filters - Filter parameters
   */
  async getAuditStats(filters = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        endDate = new Date()
      } = filters;

      const where = {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      };

      const [
        totalActions,
        actionsByType,
        actionsBySeverity,
        topAdmins
      ] = await Promise.all([
        prisma.auditLog.count({ where }),
        
        prisma.auditLog.groupBy({
          by: ['action'],
          where,
          _count: { action: true },
          orderBy: { _count: { action: 'desc' } },
          take: 10
        }),
        
        prisma.auditLog.groupBy({
          by: ['severity'],
          where,
          _count: { severity: true }
        }),
        
        prisma.auditLog.groupBy({
          by: ['adminId'],
          where,
          _count: { adminId: true },
          orderBy: { _count: { adminId: 'desc' } },
          take: 5
        })
      ]);

      return {
        totalActions,
        actionsByType,
        actionsBySeverity,
        topAdmins,
        dateRange: { startDate, endDate }
      };
    } catch (error) {
      auditLogger.error('Failed to get audit statistics', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Clean up old audit logs based on retention policy
   * @param {number} retentionDays - Number of days to retain logs
   */
  async cleanupOldLogs(retentionDays = 365) {
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      
      const deletedCount = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      });

      auditLogger.info('Audit log cleanup completed', {
        deletedCount: deletedCount.count,
        cutoffDate,
        retentionDays
      });

      return deletedCount.count;
    } catch (error) {
      auditLogger.error('Failed to cleanup old audit logs', {
        error: error.message,
        retentionDays
      });
      throw error;
    }
  }
}

export default new AuditService();