/**
 * Error Tracking Service
 * Comprehensive error tracking, analysis, and alerting
 */

const winston = require('winston');
const fs = require('fs').promises;
const path = require('path');

class ErrorTrackingService {
    constructor() {
        this.errors = new Map();
        this.errorPatterns = new Map();
        this.alertThresholds = this.getDefaultAlertThresholds();
        this.logger = this.setupLogger();
        
        this.initializeErrorTracking();
    }

    setupLogger() {
        return winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'error-tracking' },
            transports: [
                new winston.transports.File({ 
                    filename: 'logs/error-tracking.log' 
                }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }

    getDefaultAlertThresholds() {
        return {
            errorRate: {
                warning: 5, // errors per minute
                critical: 20
            },
            uniqueErrors: {
                warning: 10, // unique errors per hour
                critical: 50
            },
            criticalErrors: {
                warning: 1, // critical errors per hour
                critical: 5
            },
            errorSpike: {
                multiplier: 3, // 3x normal rate
                timeWindow: 300000 // 5 minutes
            }
        };
    }

    initializeErrorTracking() {
        // Start periodic error analysis
        setInterval(() => {
            this.analyzeErrorPatterns();
        }, 60000); // Every minute

        setInterval(() => {
            this.cleanupOldErrors();
        }, 3600000); // Every hour

        this.logger.info('Error tracking service initialized');
    }

    trackError(error, context = {}) {
        const errorId = this.generateErrorId(error);
        const timestamp = new Date().toISOString();
        
        const errorData = {
            id: errorId,
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code,
            timestamp,
            context: {
                ...context,
                userAgent: context.userAgent,
                ip: context.ip,
                userId: context.userId,
                sessionId: context.sessionId,
                url: context.url,
                method: context.method,
                headers: this.sanitizeHeaders(context.headers),
                body: this.sanitizeBody(context.body)
            },
            severity: this.determineSeverity(error, context),
            fingerprint: this.generateFingerprint(error),
            environment: process.env.NODE_ENV || 'development'
        };

        // Store error
        this.storeError(errorData);

        // Update error patterns
        this.updateErrorPatterns(errorData);

        // Check for alerts
        this.checkErrorAlerts(errorData);

        // Log error
        this.logger.error('Error tracked', {
            errorId,
            message: error.message,
            severity: errorData.severity,
            context: errorData.context
        });

        return errorId;
    }

    generateErrorId(error) {
        const timestamp = Date.now();
        const hash = this.hashString(error.message + error.stack);
        return `err_${timestamp}_${hash.substring(0, 8)}`;
    }

    generateFingerprint(error) {
        // Create a fingerprint to group similar errors
        const key = `${error.name}:${error.message}:${this.getStackTrace(error)}`;
        return this.hashString(key);
    }

    getStackTrace(error) {
        if (!error.stack) return '';
        
        // Extract the first few lines of stack trace for fingerprinting
        const lines = error.stack.split('\n').slice(0, 3);
        return lines.join('\n');
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    determineSeverity(error, context) {
        // Determine error severity based on error type and context
        if (error.name === 'SecurityError' || context.security) {
            return 'critical';
        }
        
        if (error.name === 'DatabaseError' || error.code === 'ECONNREFUSED') {
            return 'critical';
        }
        
        if (error.name === 'ValidationError' || error.status === 400) {
            return 'low';
        }
        
        if (error.status >= 500) {
            return 'high';
        }
        
        if (error.status >= 400) {
            return 'medium';
        }
        
        return 'medium';
    }

    sanitizeHeaders(headers = {}) {
        const sanitized = { ...headers };
        
        // Remove sensitive headers
        const sensitiveHeaders = [
            'authorization',
            'cookie',
            'x-api-key',
            'x-auth-token'
        ];
        
        sensitiveHeaders.forEach(header => {
            if (sanitized[header]) {
                sanitized[header] = '[REDACTED]';
            }
        });
        
        return sanitized;
    }

    sanitizeBody(body) {
        if (!body) return body;
        
        const sanitized = { ...body };
        
        // Remove sensitive fields
        const sensitiveFields = [
            'password',
            'token',
            'secret',
            'key',
            'creditCard',
            'ssn'
        ];
        
        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });
        
        return sanitized;
    }

    storeError(errorData) {
        const fingerprint = errorData.fingerprint;
        
        if (this.errors.has(fingerprint)) {
            // Update existing error
            const existing = this.errors.get(fingerprint);
            existing.count = (existing.count || 1) + 1;
            existing.lastOccurrence = errorData.timestamp;
            existing.occurrences.push({
                timestamp: errorData.timestamp,
                context: errorData.context
            });
            
            // Keep only last 10 occurrences
            if (existing.occurrences.length > 10) {
                existing.occurrences = existing.occurrences.slice(-10);
            }
        } else {
            // Store new error
            this.errors.set(fingerprint, {
                ...errorData,
                count: 1,
                firstOccurrence: errorData.timestamp,
                lastOccurrence: errorData.timestamp,
                occurrences: [{
                    timestamp: errorData.timestamp,
                    context: errorData.context
                }]
            });
        }
    }

    updateErrorPatterns(errorData) {
        const pattern = this.identifyErrorPattern(errorData);
        
        if (pattern) {
            const patternKey = pattern.type;
            
            if (this.errorPatterns.has(patternKey)) {
                const existing = this.errorPatterns.get(patternKey);
                existing.count++;
                existing.lastSeen = errorData.timestamp;
                existing.errors.push(errorData.id);
            } else {
                this.errorPatterns.set(patternKey, {
                    type: pattern.type,
                    description: pattern.description,
                    count: 1,
                    firstSeen: errorData.timestamp,
                    lastSeen: errorData.timestamp,
                    errors: [errorData.id],
                    severity: pattern.severity
                });
            }
        }
    }

    identifyErrorPattern(errorData) {
        // Identify common error patterns
        const message = errorData.message.toLowerCase();
        const stack = errorData.stack?.toLowerCase() || '';
        
        if (message.includes('connection') && message.includes('refused')) {
            return {
                type: 'connection_refused',
                description: 'Database or service connection refused',
                severity: 'critical'
            };
        }
        
        if (message.includes('timeout')) {
            return {
                type: 'timeout',
                description: 'Request or operation timeout',
                severity: 'high'
            };
        }
        
        if (message.includes('validation') || message.includes('invalid')) {
            return {
                type: 'validation',
                description: 'Data validation errors',
                severity: 'medium'
            };
        }
        
        if (message.includes('permission') || message.includes('unauthorized')) {
            return {
                type: 'authorization',
                description: 'Authorization or permission errors',
                severity: 'high'
            };
        }
        
        if (stack.includes('prisma') || stack.includes('database')) {
            return {
                type: 'database',
                description: 'Database-related errors',
                severity: 'high'
            };
        }
        
        return null;
    }

    checkErrorAlerts(errorData) {
        // Check for various alert conditions
        this.checkErrorRateAlert();
        this.checkUniqueErrorsAlert();
        this.checkCriticalErrorsAlert();
        this.checkErrorSpikeAlert();
        this.checkSpecificErrorAlert(errorData);
    }

    checkErrorRateAlert() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        let recentErrors = 0;
        for (const [fingerprint, error] of this.errors.entries()) {
            const lastOccurrence = new Date(error.lastOccurrence).getTime();
            if (lastOccurrence > oneMinuteAgo) {
                recentErrors += error.count;
            }
        }
        
        if (recentErrors >= this.alertThresholds.errorRate.critical) {
            this.sendAlert('error_rate_critical', {
                message: `Critical error rate: ${recentErrors} errors in the last minute`,
                severity: 'critical',
                data: { errorRate: recentErrors, threshold: this.alertThresholds.errorRate.critical }
            });
        } else if (recentErrors >= this.alertThresholds.errorRate.warning) {
            this.sendAlert('error_rate_warning', {
                message: `High error rate: ${recentErrors} errors in the last minute`,
                severity: 'warning',
                data: { errorRate: recentErrors, threshold: this.alertThresholds.errorRate.warning }
            });
        }
    }

    checkUniqueErrorsAlert() {
        const now = Date.now();
        const oneHourAgo = now - 3600000;
        
        let uniqueErrors = 0;
        for (const [fingerprint, error] of this.errors.entries()) {
            const firstOccurrence = new Date(error.firstOccurrence).getTime();
            if (firstOccurrence > oneHourAgo) {
                uniqueErrors++;
            }
        }
        
        if (uniqueErrors >= this.alertThresholds.uniqueErrors.critical) {
            this.sendAlert('unique_errors_critical', {
                message: `Critical number of unique errors: ${uniqueErrors} in the last hour`,
                severity: 'critical',
                data: { uniqueErrors, threshold: this.alertThresholds.uniqueErrors.critical }
            });
        } else if (uniqueErrors >= this.alertThresholds.uniqueErrors.warning) {
            this.sendAlert('unique_errors_warning', {
                message: `High number of unique errors: ${uniqueErrors} in the last hour`,
                severity: 'warning',
                data: { uniqueErrors, threshold: this.alertThresholds.uniqueErrors.warning }
            });
        }
    }

    checkCriticalErrorsAlert() {
        const now = Date.now();
        const oneHourAgo = now - 3600000;
        
        let criticalErrors = 0;
        for (const [fingerprint, error] of this.errors.entries()) {
            if (error.severity === 'critical') {
                const lastOccurrence = new Date(error.lastOccurrence).getTime();
                if (lastOccurrence > oneHourAgo) {
                    criticalErrors += error.count;
                }
            }
        }
        
        if (criticalErrors >= this.alertThresholds.criticalErrors.critical) {
            this.sendAlert('critical_errors_critical', {
                message: `Too many critical errors: ${criticalErrors} in the last hour`,
                severity: 'critical',
                data: { criticalErrors, threshold: this.alertThresholds.criticalErrors.critical }
            });
        } else if (criticalErrors >= this.alertThresholds.criticalErrors.warning) {
            this.sendAlert('critical_errors_warning', {
                message: `Elevated critical errors: ${criticalErrors} in the last hour`,
                severity: 'warning',
                data: { criticalErrors, threshold: this.alertThresholds.criticalErrors.warning }
            });
        }
    }

    checkErrorSpikeAlert() {
        // Check for sudden spikes in error rate
        const now = Date.now();
        const timeWindow = this.alertThresholds.errorSpike.timeWindow;
        const currentWindowStart = now - timeWindow;
        const previousWindowStart = now - (timeWindow * 2);
        
        let currentWindowErrors = 0;
        let previousWindowErrors = 0;
        
        for (const [fingerprint, error] of this.errors.entries()) {
            for (const occurrence of error.occurrences) {
                const timestamp = new Date(occurrence.timestamp).getTime();
                
                if (timestamp > currentWindowStart) {
                    currentWindowErrors++;
                } else if (timestamp > previousWindowStart) {
                    previousWindowErrors++;
                }
            }
        }
        
        if (previousWindowErrors > 0) {
            const multiplier = currentWindowErrors / previousWindowErrors;
            
            if (multiplier >= this.alertThresholds.errorSpike.multiplier) {
                this.sendAlert('error_spike', {
                    message: `Error spike detected: ${multiplier.toFixed(1)}x increase in error rate`,
                    severity: 'warning',
                    data: { 
                        currentErrors: currentWindowErrors,
                        previousErrors: previousWindowErrors,
                        multiplier: multiplier.toFixed(1)
                    }
                });
            }
        }
    }

    checkSpecificErrorAlert(errorData) {
        // Check for specific error types that should always alert
        const criticalPatterns = [
            'database connection failed',
            'out of memory',
            'security violation',
            'authentication bypass',
            'data corruption'
        ];
        
        const message = errorData.message.toLowerCase();
        
        for (const pattern of criticalPatterns) {
            if (message.includes(pattern)) {
                this.sendAlert('critical_error_pattern', {
                    message: `Critical error pattern detected: ${pattern}`,
                    severity: 'critical',
                    data: { 
                        errorId: errorData.id,
                        pattern,
                        originalMessage: errorData.message
                    }
                });
                break;
            }
        }
    }

    sendAlert(type, alertData) {
        const alertId = `${type}_${Date.now()}`;
        
        this.logger.error('Error alert triggered', {
            alertId,
            type,
            ...alertData
        });
        
        // Send to external alerting systems
        this.sendToSlack(alertData);
        this.sendToEmail(alertData);
        
        if (alertData.severity === 'critical') {
            this.sendToSMS(alertData);
            this.sendToPagerDuty(alertData);
        }
    }

    async sendToSlack(alertData) {
        // Implementation would send to Slack webhook
        this.logger.info('Slack alert sent', { message: alertData.message });
    }

    async sendToEmail(alertData) {
        // Implementation would send email alert
        this.logger.info('Email alert sent', { message: alertData.message });
    }

    async sendToSMS(alertData) {
        // Implementation would send SMS for critical alerts
        this.logger.info('SMS alert sent', { message: alertData.message });
    }

    async sendToPagerDuty(alertData) {
        // Implementation would send to PagerDuty
        this.logger.info('PagerDuty alert sent', { message: alertData.message });
    }

    analyzeErrorPatterns() {
        const analysis = {
            timestamp: new Date().toISOString(),
            totalErrors: this.errors.size,
            patterns: [],
            trends: [],
            recommendations: []
        };
        
        // Analyze error patterns
        for (const [patternType, pattern] of this.errorPatterns.entries()) {
            analysis.patterns.push({
                type: patternType,
                description: pattern.description,
                count: pattern.count,
                severity: pattern.severity,
                trend: this.calculatePatternTrend(pattern)
            });
        }
        
        // Generate recommendations
        analysis.recommendations = this.generateRecommendations(analysis.patterns);
        
        this.logger.info('Error pattern analysis completed', {
            totalErrors: analysis.totalErrors,
            patterns: analysis.patterns.length
        });
        
        return analysis;
    }

    calculatePatternTrend(pattern) {
        // Calculate if pattern is increasing, decreasing, or stable
        const now = Date.now();
        const oneHourAgo = now - 3600000;
        const twoHoursAgo = now - 7200000;
        
        let recentCount = 0;
        let previousCount = 0;
        
        for (const errorId of pattern.errors) {
            const error = Array.from(this.errors.values()).find(e => e.id === errorId);
            if (error) {
                const timestamp = new Date(error.lastOccurrence).getTime();
                if (timestamp > oneHourAgo) {
                    recentCount++;
                } else if (timestamp > twoHoursAgo) {
                    previousCount++;
                }
            }
        }
        
        if (recentCount > previousCount * 1.5) {
            return 'increasing';
        } else if (recentCount < previousCount * 0.5) {
            return 'decreasing';
        } else {
            return 'stable';
        }
    }

    generateRecommendations(patterns) {
        const recommendations = [];
        
        for (const pattern of patterns) {
            if (pattern.type === 'database' && pattern.count > 10) {
                recommendations.push({
                    type: 'database',
                    priority: 'high',
                    message: 'High number of database errors detected. Consider checking database health and connection pool settings.'
                });
            }
            
            if (pattern.type === 'timeout' && pattern.count > 5) {
                recommendations.push({
                    type: 'performance',
                    priority: 'medium',
                    message: 'Multiple timeout errors detected. Consider optimizing slow operations or increasing timeout values.'
                });
            }
            
            if (pattern.type === 'validation' && pattern.count > 20) {
                recommendations.push({
                    type: 'validation',
                    priority: 'low',
                    message: 'High number of validation errors. Consider improving client-side validation or API documentation.'
                });
            }
        }
        
        return recommendations;
    }

    cleanupOldErrors() {
        const now = Date.now();
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
        
        let cleanedCount = 0;
        
        for (const [fingerprint, error] of this.errors.entries()) {
            const lastOccurrence = new Date(error.lastOccurrence).getTime();
            
            if (lastOccurrence < sevenDaysAgo) {
                this.errors.delete(fingerprint);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            this.logger.info(`Cleaned up ${cleanedCount} old errors`);
        }
    }

    getErrorSummary() {
        const now = Date.now();
        const oneHourAgo = now - 3600000;
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        
        let hourlyErrors = 0;
        let dailyErrors = 0;
        let criticalErrors = 0;
        
        for (const [fingerprint, error] of this.errors.entries()) {
            const lastOccurrence = new Date(error.lastOccurrence).getTime();
            
            if (lastOccurrence > oneHourAgo) {
                hourlyErrors += error.count;
            }
            
            if (lastOccurrence > oneDayAgo) {
                dailyErrors += error.count;
            }
            
            if (error.severity === 'critical') {
                criticalErrors += error.count;
            }
        }
        
        return {
            totalUniqueErrors: this.errors.size,
            hourlyErrors,
            dailyErrors,
            criticalErrors,
            patterns: Array.from(this.errorPatterns.values()),
            timestamp: new Date().toISOString()
        };
    }

    getErrorDetails(fingerprint) {
        return this.errors.get(fingerprint);
    }

    searchErrors(query) {
        const results = [];
        const searchTerm = query.toLowerCase();
        
        for (const [fingerprint, error] of this.errors.entries()) {
            if (error.message.toLowerCase().includes(searchTerm) ||
                error.stack?.toLowerCase().includes(searchTerm) ||
                error.name.toLowerCase().includes(searchTerm)) {
                results.push(error);
            }
        }
        
        return results.sort((a, b) => 
            new Date(b.lastOccurrence).getTime() - new Date(a.lastOccurrence).getTime()
        );
    }
}

module.exports = ErrorTrackingService;