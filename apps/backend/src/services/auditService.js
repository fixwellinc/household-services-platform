/**
 * Audit Service
 * Handles audit logging and compliance tracking
 */

import { logger } from '../utils/logger.js';

class AuditService {
    constructor() {
        this.auditLogs = new Map();
        this.retentionPeriod = 90 * 24 * 60 * 60 * 1000; // 90 days
    }

    /**
     * Log an audit event
     */
    logEvent(event) {
        const auditEntry = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            userId: event.userId,
            userEmail: event.userEmail,
            action: event.action,
            resource: event.resource,
            resourceId: event.resourceId,
            details: event.details || {},
            ipAddress: event.ipAddress,
            userAgent: event.userAgent,
            sessionId: event.sessionId,
            success: event.success !== false, // Default to true
            errorMessage: event.errorMessage
        };

        this.auditLogs.set(auditEntry.id, auditEntry);
        
        // Log to winston for persistence
        logger.info('Audit event', auditEntry);

        return auditEntry.id;
    }

    /**
     * Get audit logs with filtering
     */
    getLogs(filters = {}) {
        let logs = Array.from(this.auditLogs.values());

        // Apply filters
        if (filters.userId) {
            logs = logs.filter(log => log.userId === filters.userId);
        }

        if (filters.action) {
            logs = logs.filter(log => log.action === filters.action);
        }

        if (filters.resource) {
            logs = logs.filter(log => log.resource === filters.resource);
        }

        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            logs = logs.filter(log => new Date(log.timestamp) >= startDate);
        }

        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            logs = logs.filter(log => new Date(log.timestamp) <= endDate);
        }

        // Sort by timestamp (newest first)
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Apply pagination
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 50;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        return {
            logs: logs.slice(startIndex, endIndex),
            total: logs.length,
            page,
            limit,
            totalPages: Math.ceil(logs.length / limit)
        };
    }

    /**
     * Get audit statistics
     */
    getStatistics(timeframe = '24h') {
        const now = Date.now();
        let timeframeMs;

        switch (timeframe) {
            case '1h':
                timeframeMs = 60 * 60 * 1000;
                break;
            case '24h':
                timeframeMs = 24 * 60 * 60 * 1000;
                break;
            case '7d':
                timeframeMs = 7 * 24 * 60 * 60 * 1000;
                break;
            case '30d':
                timeframeMs = 30 * 24 * 60 * 60 * 1000;
                break;
            default:
                timeframeMs = 24 * 60 * 60 * 1000;
        }

        const cutoffTime = now - timeframeMs;
        const recentLogs = Array.from(this.auditLogs.values())
            .filter(log => new Date(log.timestamp).getTime() > cutoffTime);

        const stats = {
            totalEvents: recentLogs.length,
            successfulEvents: recentLogs.filter(log => log.success).length,
            failedEvents: recentLogs.filter(log => !log.success).length,
            uniqueUsers: new Set(recentLogs.map(log => log.userId)).size,
            topActions: this.getTopActions(recentLogs),
            topResources: this.getTopResources(recentLogs),
            timeframe
        };

        return stats;
    }

    /**
     * Get top actions by frequency
     */
    getTopActions(logs) {
        const actionCounts = {};
        logs.forEach(log => {
            actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
        });

        return Object.entries(actionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([action, count]) => ({ action, count }));
    }

    /**
     * Get top resources by frequency
     */
    getTopResources(logs) {
        const resourceCounts = {};
        logs.forEach(log => {
            resourceCounts[log.resource] = (resourceCounts[log.resource] || 0) + 1;
        });

        return Object.entries(resourceCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([resource, count]) => ({ resource, count }));
    }

    /**
     * Export audit logs for compliance
     */
    exportLogs(filters = {}, format = 'json') {
        const { logs } = this.getLogs(filters);
        
        if (format === 'csv') {
            return this.convertToCSV(logs);
        }
        
        return logs;
    }

    /**
     * Convert logs to CSV format
     */
    convertToCSV(logs) {
        if (logs.length === 0) return '';

        const headers = [
            'timestamp',
            'userId',
            'userEmail',
            'action',
            'resource',
            'resourceId',
            'success',
            'ipAddress',
            'details'
        ];

        const csvRows = [headers.join(',')];
        
        logs.forEach(log => {
            const row = headers.map(header => {
                let value = log[header];
                if (header === 'details') {
                    value = JSON.stringify(value || {});
                }
                // Escape commas and quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    value = `"${value.replace(/"/g, '""')}"`;
                }
                return value || '';
            });
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    /**
     * Clean up old audit logs
     */
    cleanup() {
        const cutoffTime = Date.now() - this.retentionPeriod;
        let cleanedCount = 0;

        for (const [id, log] of this.auditLogs.entries()) {
            if (new Date(log.timestamp).getTime() < cutoffTime) {
                this.auditLogs.delete(id);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            logger.info(`Cleaned up ${cleanedCount} old audit logs`);
        }

        return cleanedCount;
    }

    /**
     * Generate unique ID for audit entries
     */
    generateId() {
        return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Search audit logs
     */
    searchLogs(query, filters = {}) {
        const { logs } = this.getLogs(filters);
        const searchTerm = query.toLowerCase();

        const matchingLogs = logs.filter(log => {
            return (
                log.action.toLowerCase().includes(searchTerm) ||
                log.resource.toLowerCase().includes(searchTerm) ||
                log.userEmail?.toLowerCase().includes(searchTerm) ||
                JSON.stringify(log.details).toLowerCase().includes(searchTerm)
            );
        });

        return {
            logs: matchingLogs,
            total: matchingLogs.length,
            query
        };
    }

    /**
     * Log an action (alias for logEvent for backward compatibility)
     */
    async logAction(actionData) {
        // Map the action data format to event format
        const event = {
            userId: actionData.adminId || actionData.userId,
            userEmail: actionData.userEmail,
            action: actionData.action,
            resource: actionData.entityType || actionData.resource,
            resourceId: actionData.entityId || actionData.resourceId,
            details: {
                changes: actionData.changes,
                metadata: actionData.metadata,
                severity: actionData.severity,
                ...actionData.details
            },
            ipAddress: actionData.ipAddress,
            userAgent: actionData.userAgent,
            sessionId: actionData.sessionId,
            success: actionData.success !== false,
            errorMessage: actionData.errorMessage
        };

        return this.logEvent(event);
    }
}

// Create singleton instance
const auditService = new AuditService();

// Clean up old logs every hour
setInterval(() => {
    auditService.cleanup();
}, 60 * 60 * 1000);

export { auditService };