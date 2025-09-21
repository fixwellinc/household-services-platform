/**
 * Admin Monitoring Routes
 * API endpoints for production monitoring and alerting
 */

import express from 'express';
import authMiddleware, { requireRole } from '../../middleware/auth.js';
import ProductionMonitoringService from '../../services/productionMonitoringService.js';
import ErrorTrackingService from '../../services/errorTrackingService.js';
import SecurityMonitoringService from '../../services/securityMonitoringService.js';

const router = express.Router();

// Initialize monitoring services
const productionMonitoring = new ProductionMonitoringService();
const errorTracking = new ErrorTrackingService();
const securityMonitoring = new SecurityMonitoringService();

// Middleware to ensure admin access
router.use(authMiddleware);
router.use(requireRole(['ADMIN']));

// Health and status endpoints
router.get('/health', async (req, res) => {
    try {
        const healthStatus = productionMonitoring.getHealthStatus();
        res.json({
            success: true,
            data: healthStatus
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get health status',
            details: error.message
        });
    }
});

router.get('/status', async (req, res) => {
    try {
        const [
            healthStatus,
            errorSummary,
            securitySummary
        ] = await Promise.all([
            productionMonitoring.getHealthStatus(),
            errorTracking.getErrorSummary(),
            securityMonitoring.getSecuritySummary()
        ]);

        res.json({
            success: true,
            data: {
                health: healthStatus,
                errors: errorSummary,
                security: securitySummary,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get system status',
            details: error.message
        });
    }
});

// Metrics endpoints
router.get('/metrics', async (req, res) => {
    try {
        const metrics = productionMonitoring.getAllMetrics();
        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get metrics',
            details: error.message
        });
    }
});

router.get('/metrics/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const metric = productionMonitoring.getMetric(category);
        
        if (!metric) {
            return res.status(404).json({
                success: false,
                error: 'Metric category not found'
            });
        }

        res.json({
            success: true,
            data: metric
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get metric',
            details: error.message
        });
    }
});

// Alert endpoints
router.get('/alerts', async (req, res) => {
    try {
        const alerts = productionMonitoring.getActiveAlerts();
        res.json({
            success: true,
            data: alerts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get alerts',
            details: error.message
        });
    }
});

router.post('/alerts/:alertId/acknowledge', async (req, res) => {
    try {
        const { alertId } = req.params;
        const acknowledged = productionMonitoring.acknowledgeAlert(alertId);
        
        if (!acknowledged) {
            return res.status(404).json({
                success: false,
                error: 'Alert not found'
            });
        }

        res.json({
            success: true,
            message: 'Alert acknowledged'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to acknowledge alert',
            details: error.message
        });
    }
});

router.post('/alerts/:alertId/resolve', async (req, res) => {
    try {
        const { alertId } = req.params;
        const resolved = productionMonitoring.resolveAlert(alertId);
        
        if (!resolved) {
            return res.status(404).json({
                success: false,
                error: 'Alert not found'
            });
        }

        res.json({
            success: true,
            message: 'Alert resolved'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to resolve alert',
            details: error.message
        });
    }
});

// Error tracking endpoints
router.get('/errors', async (req, res) => {
    try {
        const { search, limit = 50, offset = 0 } = req.query;
        
        let errors;
        if (search) {
            errors = errorTracking.searchErrors(search);
        } else {
            const errorSummary = errorTracking.getErrorSummary();
            errors = Array.from(errorTracking.errors.values())
                .sort((a, b) => new Date(b.lastOccurrence).getTime() - new Date(a.lastOccurrence).getTime())
                .slice(parseInt(offset), parseInt(offset) + parseInt(limit));
        }

        res.json({
            success: true,
            data: {
                errors,
                total: errorTracking.errors.size,
                summary: errorTracking.getErrorSummary()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get errors',
            details: error.message
        });
    }
});

router.get('/errors/:fingerprint', async (req, res) => {
    try {
        const { fingerprint } = req.params;
        const errorDetails = errorTracking.getErrorDetails(fingerprint);
        
        if (!errorDetails) {
            return res.status(404).json({
                success: false,
                error: 'Error not found'
            });
        }

        res.json({
            success: true,
            data: errorDetails
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get error details',
            details: error.message
        });
    }
});

router.get('/errors/analysis/patterns', async (req, res) => {
    try {
        const analysis = await errorTracking.analyzeErrorPatterns();
        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to analyze error patterns',
            details: error.message
        });
    }
});

// Security monitoring endpoints
router.get('/security', async (req, res) => {
    try {
        const securitySummary = securityMonitoring.getSecuritySummary();
        res.json({
            success: true,
            data: securitySummary
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get security summary',
            details: error.message
        });
    }
});

router.get('/security/events', async (req, res) => {
    try {
        const { limit = 50, offset = 0, severity } = req.query;
        
        let events = Array.from(securityMonitoring.securityEvents.values());
        
        if (severity) {
            events = events.filter(event => event.severity === severity);
        }
        
        events = events
            .sort((a, b) => new Date(b.lastOccurrence).getTime() - new Date(a.lastOccurrence).getTime())
            .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

        res.json({
            success: true,
            data: {
                events,
                total: securityMonitoring.securityEvents.size
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get security events',
            details: error.message
        });
    }
});

router.get('/security/threats', async (req, res) => {
    try {
        const threatPatterns = Array.from(securityMonitoring.threatPatterns.values());
        res.json({
            success: true,
            data: threatPatterns
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get threat patterns',
            details: error.message
        });
    }
});

router.get('/security/blocked-ips', async (req, res) => {
    try {
        const blockedIPs = Array.from(securityMonitoring.blockedIPs);
        res.json({
            success: true,
            data: blockedIPs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get blocked IPs',
            details: error.message
        });
    }
});

router.post('/security/unblock-ip', async (req, res) => {
    try {
        const { ip } = req.body;
        
        if (!ip) {
            return res.status(400).json({
                success: false,
                error: 'IP address is required'
            });
        }

        securityMonitoring.unblockIP(ip);
        
        res.json({
            success: true,
            message: `IP ${ip} has been unblocked`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to unblock IP',
            details: error.message
        });
    }
});

router.get('/security/analysis/audit-logs', async (req, res) => {
    try {
        const analysis = await securityMonitoring.analyzeAuditLogs();
        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to analyze audit logs',
            details: error.message
        });
    }
});

router.get('/security/analysis/patterns', async (req, res) => {
    try {
        const analysis = securityMonitoring.analyzeSecurityPatterns();
        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to analyze security patterns',
            details: error.message
        });
    }
});

// Performance optimization endpoints
router.get('/optimization/suggestions', async (req, res) => {
    try {
        const suggestions = productionMonitoring.getOptimizationSuggestions();
        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get optimization suggestions',
            details: error.message
        });
    }
});

// System information endpoints
router.get('/system/info', async (req, res) => {
    try {
        const systemInfo = {
            nodeVersion: process.version,
            platform: process.platform,
            architecture: process.arch,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage(),
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            data: systemInfo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get system information',
            details: error.message
        });
    }
});

// Export monitoring data
router.get('/export', async (req, res) => {
    try {
        const { type = 'all', format = 'json', startDate, endDate } = req.query;
        
        const exportData = {
            timestamp: new Date().toISOString(),
            type,
            dateRange: { startDate, endDate }
        };

        if (type === 'all' || type === 'metrics') {
            exportData.metrics = productionMonitoring.getAllMetrics();
        }

        if (type === 'all' || type === 'errors') {
            exportData.errors = errorTracking.getErrorSummary();
        }

        if (type === 'all' || type === 'security') {
            exportData.security = securityMonitoring.getSecuritySummary();
        }

        if (format === 'csv') {
            // Convert to CSV format
            const csv = this.convertToCSV(exportData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="monitoring-export-${Date.now()}.csv"`);
            res.send(csv);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="monitoring-export-${Date.now()}.json"`);
            res.json(exportData);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to export monitoring data',
            details: error.message
        });
    }
});

// Utility function to convert data to CSV
function convertToCSV(data) {
    // Simple CSV conversion - in production, use a proper CSV library
    const lines = [];
    lines.push('timestamp,type,category,value');
    
    if (data.metrics) {
        for (const [key, metric] of Object.entries(data.metrics)) {
            lines.push(`${metric.timestamp},metric,${key},"${JSON.stringify(metric.value)}"`);
        }
    }
    
    return lines.join('\n');
}

export default router;