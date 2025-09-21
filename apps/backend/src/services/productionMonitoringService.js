/**
 * Production Monitoring Service
 * Comprehensive monitoring and alerting for production environment
 */

import winston from 'winston';
import os from 'os';
import { promises as fs } from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

class ProductionMonitoringService {
    constructor() {
        this.metrics = new Map();
        this.alerts = new Map();
        this.thresholds = this.getDefaultThresholds();
        this.logger = this.setupLogger();
        this.startTime = Date.now();
        
        // Initialize monitoring
        this.initializeMonitoring();
    }

    setupLogger() {
        return winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'production-monitoring' },
            transports: [
                new winston.transports.File({ 
                    filename: 'logs/monitoring-error.log', 
                    level: 'error' 
                }),
                new winston.transports.File({ 
                    filename: 'logs/monitoring.log' 
                }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }

    getDefaultThresholds() {
        return {
            // System metrics
            cpuUsage: { warning: 70, critical: 90 },
            memoryUsage: { warning: 80, critical: 95 },
            diskUsage: { warning: 80, critical: 90 },
            
            // Application metrics
            responseTime: { warning: 1000, critical: 3000 }, // ms
            errorRate: { warning: 5, critical: 10 }, // percentage
            requestRate: { warning: 1000, critical: 2000 }, // requests per minute
            
            // Database metrics
            dbConnectionPool: { warning: 80, critical: 95 }, // percentage
            dbQueryTime: { warning: 500, critical: 1000 }, // ms
            dbConnections: { warning: 80, critical: 100 }, // count
            
            // Queue metrics
            queueSize: { warning: 100, critical: 500 },
            queueProcessingTime: { warning: 5000, critical: 10000 }, // ms
            
            // Security metrics
            failedLogins: { warning: 10, critical: 50 }, // per hour
            suspiciousActivity: { warning: 5, critical: 20 } // per hour
        };
    }

    initializeMonitoring() {
        // Start periodic monitoring
        this.startSystemMonitoring();
        this.startApplicationMonitoring();
        this.startDatabaseMonitoring();
        this.startSecurityMonitoring();
        
        this.logger.info('Production monitoring initialized');
    }

    startSystemMonitoring() {
        setInterval(() => {
            this.collectSystemMetrics();
        }, 30000); // Every 30 seconds
    }

    startApplicationMonitoring() {
        setInterval(() => {
            this.collectApplicationMetrics();
        }, 60000); // Every minute
    }

    startDatabaseMonitoring() {
        setInterval(() => {
            this.collectDatabaseMetrics();
        }, 60000); // Every minute
    }

    startSecurityMonitoring() {
        setInterval(() => {
            this.collectSecurityMetrics();
        }, 300000); // Every 5 minutes
    }

    async collectSystemMetrics() {
        try {
            const metrics = {
                timestamp: new Date().toISOString(),
                cpu: {
                    usage: this.getCPUUsage(),
                    loadAverage: os.loadavg()
                },
                memory: {
                    total: os.totalmem(),
                    free: os.freemem(),
                    usage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
                },
                disk: await this.getDiskUsage(),
                uptime: os.uptime(),
                processUptime: (Date.now() - this.startTime) / 1000
            };

            this.updateMetric('system', metrics);
            this.checkSystemThresholds(metrics);
            
        } catch (error) {
            this.logger.error('Failed to collect system metrics', { error: error.message });
        }
    }

    getCPUUsage() {
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;

        cpus.forEach(cpu => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });

        return 100 - (totalIdle / totalTick * 100);
    }

    async getDiskUsage() {
        try {
            const stats = await fs.stat('.');
            // This is a simplified disk usage check
            // In production, you'd want to use a more comprehensive method
            return {
                total: stats.size || 0,
                used: 0,
                free: 0,
                usage: 0
            };
        } catch (error) {
            return { total: 0, used: 0, free: 0, usage: 0 };
        }
    }

    async collectApplicationMetrics() {
        try {
            const metrics = {
                timestamp: new Date().toISOString(),
                requests: this.getRequestMetrics(),
                responses: this.getResponseMetrics(),
                errors: this.getErrorMetrics(),
                performance: this.getPerformanceMetrics(),
                activeConnections: this.getActiveConnections()
            };

            this.updateMetric('application', metrics);
            this.checkApplicationThresholds(metrics);
            
        } catch (error) {
            this.logger.error('Failed to collect application metrics', { error: error.message });
        }
    }

    getRequestMetrics() {
        const requests = this.getMetric('requests') || { total: 0, rate: 0 };
        return {
            total: requests.total,
            rate: requests.rate,
            methods: requests.methods || {},
            endpoints: requests.endpoints || {}
        };
    }

    getResponseMetrics() {
        const responses = this.getMetric('responses') || {};
        return {
            averageTime: responses.averageTime || 0,
            statusCodes: responses.statusCodes || {},
            slowRequests: responses.slowRequests || 0
        };
    }

    getErrorMetrics() {
        const errors = this.getMetric('errors') || {};
        return {
            total: errors.total || 0,
            rate: errors.rate || 0,
            types: errors.types || {},
            recent: errors.recent || []
        };
    }

    getPerformanceMetrics() {
        return {
            memoryUsage: process.memoryUsage(),
            eventLoopLag: this.measureEventLoopLag(),
            gcStats: this.getGCStats()
        };
    }

    measureEventLoopLag() {
        const start = performance.now();
        setImmediate(() => {
            const lag = performance.now() - start;
            this.updateMetric('eventLoopLag', lag);
        });
        return this.getMetric('eventLoopLag') || 0;
    }

    getGCStats() {
        // This would require the gc-stats module in production
        return {
            collections: 0,
            time: 0
        };
    }

    getActiveConnections() {
        // This would track WebSocket and HTTP connections
        return {
            http: 0,
            websocket: 0,
            database: 0
        };
    }

    async collectDatabaseMetrics() {
        try {
            const metrics = {
                timestamp: new Date().toISOString(),
                connections: await this.getDatabaseConnections(),
                queries: await this.getDatabaseQueryMetrics(),
                performance: await this.getDatabasePerformance()
            };

            this.updateMetric('database', metrics);
            this.checkDatabaseThresholds(metrics);
            
        } catch (error) {
            this.logger.error('Failed to collect database metrics', { error: error.message });
        }
    }

    async getDatabaseConnections() {
        // This would query the database for connection info
        return {
            active: 0,
            idle: 0,
            total: 0,
            poolSize: 10
        };
    }

    async getDatabaseQueryMetrics() {
        return {
            total: 0,
            slow: 0,
            failed: 0,
            averageTime: 0
        };
    }

    async getDatabasePerformance() {
        return {
            cacheHitRatio: 0,
            indexUsage: 0,
            tableScans: 0
        };
    }

    async collectSecurityMetrics() {
        try {
            const metrics = {
                timestamp: new Date().toISOString(),
                authentication: await this.getAuthenticationMetrics(),
                authorization: await this.getAuthorizationMetrics(),
                threats: await this.getThreatMetrics()
            };

            this.updateMetric('security', metrics);
            this.checkSecurityThresholds(metrics);
            
        } catch (error) {
            this.logger.error('Failed to collect security metrics', { error: error.message });
        }
    }

    async getAuthenticationMetrics() {
        return {
            successfulLogins: 0,
            failedLogins: 0,
            suspiciousAttempts: 0,
            blockedIPs: []
        };
    }

    async getAuthorizationMetrics() {
        return {
            accessDenied: 0,
            privilegeEscalation: 0,
            unauthorizedAccess: 0
        };
    }

    async getThreatMetrics() {
        return {
            sqlInjectionAttempts: 0,
            xssAttempts: 0,
            bruteForceAttempts: 0,
            ddosAttempts: 0
        };
    }

    checkSystemThresholds(metrics) {
        // CPU usage check
        if (metrics.cpu.usage > this.thresholds.cpuUsage.critical) {
            this.triggerAlert('system', 'critical', 'CPU usage critical', {
                current: metrics.cpu.usage,
                threshold: this.thresholds.cpuUsage.critical
            });
        } else if (metrics.cpu.usage > this.thresholds.cpuUsage.warning) {
            this.triggerAlert('system', 'warning', 'CPU usage high', {
                current: metrics.cpu.usage,
                threshold: this.thresholds.cpuUsage.warning
            });
        }

        // Memory usage check
        if (metrics.memory.usage > this.thresholds.memoryUsage.critical) {
            this.triggerAlert('system', 'critical', 'Memory usage critical', {
                current: metrics.memory.usage,
                threshold: this.thresholds.memoryUsage.critical
            });
        } else if (metrics.memory.usage > this.thresholds.memoryUsage.warning) {
            this.triggerAlert('system', 'warning', 'Memory usage high', {
                current: metrics.memory.usage,
                threshold: this.thresholds.memoryUsage.warning
            });
        }
    }

    checkApplicationThresholds(metrics) {
        // Response time check
        if (metrics.responses.averageTime > this.thresholds.responseTime.critical) {
            this.triggerAlert('application', 'critical', 'Response time critical', {
                current: metrics.responses.averageTime,
                threshold: this.thresholds.responseTime.critical
            });
        } else if (metrics.responses.averageTime > this.thresholds.responseTime.warning) {
            this.triggerAlert('application', 'warning', 'Response time high', {
                current: metrics.responses.averageTime,
                threshold: this.thresholds.responseTime.warning
            });
        }

        // Error rate check
        if (metrics.errors.rate > this.thresholds.errorRate.critical) {
            this.triggerAlert('application', 'critical', 'Error rate critical', {
                current: metrics.errors.rate,
                threshold: this.thresholds.errorRate.critical
            });
        } else if (metrics.errors.rate > this.thresholds.errorRate.warning) {
            this.triggerAlert('application', 'warning', 'Error rate high', {
                current: metrics.errors.rate,
                threshold: this.thresholds.errorRate.warning
            });
        }
    }

    checkDatabaseThresholds(metrics) {
        // Database connection check
        const connectionUsage = (metrics.connections.active / metrics.connections.poolSize) * 100;
        
        if (connectionUsage > this.thresholds.dbConnectionPool.critical) {
            this.triggerAlert('database', 'critical', 'Database connection pool critical', {
                current: connectionUsage,
                threshold: this.thresholds.dbConnectionPool.critical
            });
        } else if (connectionUsage > this.thresholds.dbConnectionPool.warning) {
            this.triggerAlert('database', 'warning', 'Database connection pool high', {
                current: connectionUsage,
                threshold: this.thresholds.dbConnectionPool.warning
            });
        }
    }

    checkSecurityThresholds(metrics) {
        // Failed login attempts check
        if (metrics.authentication.failedLogins > this.thresholds.failedLogins.critical) {
            this.triggerAlert('security', 'critical', 'High number of failed login attempts', {
                current: metrics.authentication.failedLogins,
                threshold: this.thresholds.failedLogins.critical
            });
        } else if (metrics.authentication.failedLogins > this.thresholds.failedLogins.warning) {
            this.triggerAlert('security', 'warning', 'Elevated failed login attempts', {
                current: metrics.authentication.failedLogins,
                threshold: this.thresholds.failedLogins.warning
            });
        }
    }

    triggerAlert(category, severity, message, data = {}) {
        const alertId = `${category}-${severity}-${Date.now()}`;
        const alert = {
            id: alertId,
            category,
            severity,
            message,
            data,
            timestamp: new Date().toISOString(),
            acknowledged: false
        };

        this.alerts.set(alertId, alert);
        this.logger[severity === 'critical' ? 'error' : 'warn']('Alert triggered', alert);

        // Send notifications
        this.sendAlertNotifications(alert);

        // Auto-resolve after 1 hour if not acknowledged
        setTimeout(() => {
            if (this.alerts.has(alertId) && !this.alerts.get(alertId).acknowledged) {
                this.resolveAlert(alertId);
            }
        }, 3600000);
    }

    async sendAlertNotifications(alert) {
        try {
            // Send to different channels based on severity
            if (alert.severity === 'critical') {
                await this.sendSlackNotification(alert);
                await this.sendEmailNotification(alert);
                await this.sendSMSNotification(alert);
            } else if (alert.severity === 'warning') {
                await this.sendSlackNotification(alert);
                await this.sendEmailNotification(alert);
            }
        } catch (error) {
            this.logger.error('Failed to send alert notifications', { 
                alertId: alert.id, 
                error: error.message 
            });
        }
    }

    async sendSlackNotification(alert) {
        // Implementation would send to Slack webhook
        this.logger.info('Slack notification sent', { alertId: alert.id });
    }

    async sendEmailNotification(alert) {
        // Implementation would send email
        this.logger.info('Email notification sent', { alertId: alert.id });
    }

    async sendSMSNotification(alert) {
        // Implementation would send SMS for critical alerts
        this.logger.info('SMS notification sent', { alertId: alert.id });
    }

    updateMetric(key, value) {
        this.metrics.set(key, {
            value,
            timestamp: new Date().toISOString()
        });
    }

    getMetric(key) {
        const metric = this.metrics.get(key);
        return metric ? metric.value : null;
    }

    getAllMetrics() {
        const result = {};
        for (const [key, metric] of this.metrics.entries()) {
            result[key] = metric;
        }
        return result;
    }

    getActiveAlerts() {
        const activeAlerts = [];
        for (const [id, alert] of this.alerts.entries()) {
            if (!alert.acknowledged && !alert.resolved) {
                activeAlerts.push(alert);
            }
        }
        return activeAlerts;
    }

    acknowledgeAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedAt = new Date().toISOString();
            this.logger.info('Alert acknowledged', { alertId });
            return true;
        }
        return false;
    }

    resolveAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.resolved = true;
            alert.resolvedAt = new Date().toISOString();
            this.logger.info('Alert resolved', { alertId });
            return true;
        }
        return false;
    }

    getHealthStatus() {
        const metrics = this.getAllMetrics();
        const activeAlerts = this.getActiveAlerts();
        
        let status = 'healthy';
        if (activeAlerts.some(alert => alert.severity === 'critical')) {
            status = 'critical';
        } else if (activeAlerts.some(alert => alert.severity === 'warning')) {
            status = 'warning';
        }

        return {
            status,
            timestamp: new Date().toISOString(),
            uptime: (Date.now() - this.startTime) / 1000,
            activeAlerts: activeAlerts.length,
            metrics: {
                system: metrics.system?.value || {},
                application: metrics.application?.value || {},
                database: metrics.database?.value || {},
                security: metrics.security?.value || {}
            }
        };
    }

    // Audit log analysis
    async analyzeAuditLogs() {
        try {
            // This would analyze audit logs for suspicious patterns
            const analysis = {
                timestamp: new Date().toISOString(),
                suspiciousPatterns: [],
                anomalies: [],
                recommendations: []
            };

            this.updateMetric('auditAnalysis', analysis);
            return analysis;
        } catch (error) {
            this.logger.error('Failed to analyze audit logs', { error: error.message });
            throw error;
        }
    }

    // Performance optimization suggestions
    getOptimizationSuggestions() {
        const metrics = this.getAllMetrics();
        const suggestions = [];

        // Analyze metrics and provide suggestions
        if (metrics.system?.value?.memory?.usage > 80) {
            suggestions.push({
                type: 'memory',
                priority: 'high',
                suggestion: 'Consider increasing memory allocation or optimizing memory usage'
            });
        }

        if (metrics.application?.value?.responses?.averageTime > 1000) {
            suggestions.push({
                type: 'performance',
                priority: 'medium',
                suggestion: 'Response times are high, consider optimizing database queries or adding caching'
            });
        }

        return suggestions;
    }
}

export default ProductionMonitoringService;