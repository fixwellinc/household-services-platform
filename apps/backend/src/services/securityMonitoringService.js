/**
 * Security Monitoring Service
 * Comprehensive security monitoring and audit log analysis
 */

import winston from 'winston';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

class SecurityMonitoringService {
    constructor() {
        this.securityEvents = new Map();
        this.threatPatterns = new Map();
        this.blockedIPs = new Set();
        this.suspiciousActivities = new Map();
        this.securityThresholds = this.getDefaultSecurityThresholds();
        this.logger = this.setupLogger();
        
        this.initializeSecurityMonitoring();
    }

    setupLogger() {
        return winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'security-monitoring' },
            transports: [
                new winston.transports.File({ 
                    filename: 'logs/security.log' 
                }),
                new winston.transports.File({ 
                    filename: 'logs/security-alerts.log',
                    level: 'warn'
                }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }

    getDefaultSecurityThresholds() {
        return {
            failedLogins: {
                perIP: { warning: 5, critical: 10, timeWindow: 300000 }, // 5 minutes
                perUser: { warning: 3, critical: 5, timeWindow: 300000 },
                global: { warning: 20, critical: 50, timeWindow: 300000 }
            },
            bruteForce: {
                attempts: { warning: 10, critical: 25, timeWindow: 600000 }, // 10 minutes
                uniqueIPs: { warning: 5, critical: 15, timeWindow: 600000 }
            },
            sqlInjection: {
                attempts: { warning: 1, critical: 3, timeWindow: 300000 }
            },
            xss: {
                attempts: { warning: 1, critical: 5, timeWindow: 300000 }
            },
            privilegeEscalation: {
                attempts: { warning: 1, critical: 3, timeWindow: 600000 }
            },
            dataAccess: {
                unusualPatterns: { warning: 5, critical: 10, timeWindow: 3600000 }, // 1 hour
                bulkOperations: { warning: 100, critical: 500, timeWindow: 300000 }
            },
            apiAbuse: {
                requestRate: { warning: 1000, critical: 5000, timeWindow: 60000 }, // 1 minute
                errorRate: { warning: 50, critical: 200, timeWindow: 60000 }
            }
        };
    }

    initializeSecurityMonitoring() {
        // Start periodic security analysis
        setInterval(() => {
            this.analyzeSecurityPatterns();
        }, 60000); // Every minute

        setInterval(() => {
            this.analyzeAuditLogs();
        }, 300000); // Every 5 minutes

        setInterval(() => {
            this.cleanupOldEvents();
        }, 3600000); // Every hour

        this.logger.info('Security monitoring service initialized');
    }

    trackSecurityEvent(eventType, data) {
        const eventId = this.generateEventId();
        const timestamp = new Date().toISOString();
        
        const securityEvent = {
            id: eventId,
            type: eventType,
            timestamp,
            ip: data.ip,
            userAgent: data.userAgent,
            userId: data.userId,
            sessionId: data.sessionId,
            url: data.url,
            method: data.method,
            payload: this.sanitizePayload(data.payload),
            severity: this.determineSeverity(eventType, data),
            fingerprint: this.generateFingerprint(eventType, data),
            geolocation: data.geolocation,
            headers: this.sanitizeHeaders(data.headers)
        };

        // Store event
        this.storeSecurityEvent(securityEvent);

        // Update threat patterns
        this.updateThreatPatterns(securityEvent);

        // Check for immediate threats
        this.checkSecurityThresholds(securityEvent);

        // Log event
        this.logger.info('Security event tracked', {
            eventId,
            type: eventType,
            severity: securityEvent.severity,
            ip: data.ip,
            userId: data.userId
        });

        return eventId;
    }

    generateEventId() {
        return `sec_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }

    generateFingerprint(eventType, data) {
        const key = `${eventType}:${data.ip}:${data.userAgent}:${data.url}`;
        return crypto.createHash('sha256').update(key).digest('hex').substring(0, 16);
    }

    determineSeverity(eventType, data) {
        const criticalEvents = [
            'privilege_escalation',
            'data_breach_attempt',
            'sql_injection',
            'authentication_bypass',
            'unauthorized_admin_access'
        ];

        const highEvents = [
            'brute_force_attack',
            'xss_attempt',
            'suspicious_file_access',
            'unusual_data_access',
            'failed_admin_login'
        ];

        if (criticalEvents.includes(eventType)) {
            return 'critical';
        } else if (highEvents.includes(eventType)) {
            return 'high';
        } else if (eventType.includes('failed') || eventType.includes('suspicious')) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    sanitizePayload(payload) {
        if (!payload) return payload;
        
        const sanitized = { ...payload };
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'creditCard'];
        
        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });
        
        return sanitized;
    }

    sanitizeHeaders(headers = {}) {
        const sanitized = { ...headers };
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
        
        sensitiveHeaders.forEach(header => {
            if (sanitized[header]) {
                sanitized[header] = '[REDACTED]';
            }
        });
        
        return sanitized;
    }

    storeSecurityEvent(event) {
        const fingerprint = event.fingerprint;
        
        if (this.securityEvents.has(fingerprint)) {
            const existing = this.securityEvents.get(fingerprint);
            existing.count = (existing.count || 1) + 1;
            existing.lastOccurrence = event.timestamp;
            existing.occurrences.push({
                timestamp: event.timestamp,
                ip: event.ip,
                userId: event.userId
            });
            
            // Keep only last 20 occurrences
            if (existing.occurrences.length > 20) {
                existing.occurrences = existing.occurrences.slice(-20);
            }
        } else {
            this.securityEvents.set(fingerprint, {
                ...event,
                count: 1,
                firstOccurrence: event.timestamp,
                lastOccurrence: event.timestamp,
                occurrences: [{
                    timestamp: event.timestamp,
                    ip: event.ip,
                    userId: event.userId
                }]
            });
        }
    }

    updateThreatPatterns(event) {
        const pattern = this.identifyThreatPattern(event);
        
        if (pattern) {
            const patternKey = `${pattern.type}_${event.ip}`;
            
            if (this.threatPatterns.has(patternKey)) {
                const existing = this.threatPatterns.get(patternKey);
                existing.count++;
                existing.lastSeen = event.timestamp;
                existing.events.push(event.id);
            } else {
                this.threatPatterns.set(patternKey, {
                    type: pattern.type,
                    description: pattern.description,
                    ip: event.ip,
                    count: 1,
                    firstSeen: event.timestamp,
                    lastSeen: event.timestamp,
                    events: [event.id],
                    severity: pattern.severity,
                    riskScore: pattern.riskScore
                });
            }
        }
    }

    identifyThreatPattern(event) {
        const eventType = event.type.toLowerCase();
        const url = event.url?.toLowerCase() || '';
        const payload = JSON.stringify(event.payload || {}).toLowerCase();
        
        // SQL Injection patterns
        if (this.containsSQLInjectionPattern(payload) || this.containsSQLInjectionPattern(url)) {
            return {
                type: 'sql_injection',
                description: 'SQL injection attempt detected',
                severity: 'critical',
                riskScore: 95
            };
        }
        
        // XSS patterns
        if (this.containsXSSPattern(payload) || this.containsXSSPattern(url)) {
            return {
                type: 'xss_attempt',
                description: 'Cross-site scripting attempt detected',
                severity: 'high',
                riskScore: 80
            };
        }
        
        // Brute force patterns
        if (eventType.includes('failed_login') || eventType.includes('authentication_failed')) {
            return {
                type: 'brute_force',
                description: 'Potential brute force attack',
                severity: 'high',
                riskScore: 75
            };
        }
        
        // Directory traversal
        if (url.includes('../') || url.includes('..\\') || payload.includes('../')) {
            return {
                type: 'directory_traversal',
                description: 'Directory traversal attempt detected',
                severity: 'high',
                riskScore: 85
            };
        }
        
        // Command injection
        if (this.containsCommandInjectionPattern(payload)) {
            return {
                type: 'command_injection',
                description: 'Command injection attempt detected',
                severity: 'critical',
                riskScore: 90
            };
        }
        
        return null;
    }

    containsSQLInjectionPattern(input) {
        const sqlPatterns = [
            /union\s+select/i,
            /or\s+1\s*=\s*1/i,
            /and\s+1\s*=\s*1/i,
            /'\s*or\s*'/i,
            /'\s*;\s*drop\s+table/i,
            /'\s*;\s*delete\s+from/i,
            /'\s*;\s*insert\s+into/i,
            /'\s*;\s*update\s+/i,
            /benchmark\s*\(/i,
            /sleep\s*\(/i,
            /waitfor\s+delay/i
        ];
        
        return sqlPatterns.some(pattern => pattern.test(input));
    }

    containsXSSPattern(input) {
        const xssPatterns = [
            /<script[^>]*>/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /<iframe[^>]*>/i,
            /<object[^>]*>/i,
            /<embed[^>]*>/i,
            /eval\s*\(/i,
            /expression\s*\(/i
        ];
        
        return xssPatterns.some(pattern => pattern.test(input));
    }

    containsCommandInjectionPattern(input) {
        const commandPatterns = [
            /;\s*cat\s+/i,
            /;\s*ls\s+/i,
            /;\s*pwd/i,
            /;\s*whoami/i,
            /;\s*id/i,
            /\|\s*cat\s+/i,
            /\|\s*ls\s+/i,
            /`.*`/,
            /\$\(.*\)/
        ];
        
        return commandPatterns.some(pattern => pattern.test(input));
    }

    checkSecurityThresholds(event) {
        this.checkFailedLoginThresholds(event);
        this.checkBruteForceThresholds(event);
        this.checkInjectionThresholds(event);
        this.checkPrivilegeEscalationThresholds(event);
        this.checkAPIAbuseThresholds(event);
    }

    checkFailedLoginThresholds(event) {
        if (!event.type.includes('failed_login')) return;
        
        const now = Date.now();
        const timeWindow = this.securityThresholds.failedLogins.perIP.timeWindow;
        const windowStart = now - timeWindow;
        
        // Check per IP
        let ipFailures = 0;
        for (const [fingerprint, secEvent] of this.securityEvents.entries()) {
            if (secEvent.ip === event.ip && secEvent.type.includes('failed_login')) {
                const eventTime = new Date(secEvent.lastOccurrence).getTime();
                if (eventTime > windowStart) {
                    ipFailures += secEvent.count;
                }
            }
        }
        
        if (ipFailures >= this.securityThresholds.failedLogins.perIP.critical) {
            this.triggerSecurityAlert('failed_logins_critical', {
                message: `Critical: ${ipFailures} failed login attempts from IP ${event.ip}`,
                severity: 'critical',
                ip: event.ip,
                count: ipFailures,
                action: 'block_ip'
            });
            this.blockIP(event.ip, 'excessive_failed_logins');
        } else if (ipFailures >= this.securityThresholds.failedLogins.perIP.warning) {
            this.triggerSecurityAlert('failed_logins_warning', {
                message: `Warning: ${ipFailures} failed login attempts from IP ${event.ip}`,
                severity: 'warning',
                ip: event.ip,
                count: ipFailures
            });
        }
    }

    checkBruteForceThresholds(event) {
        const now = Date.now();
        const timeWindow = this.securityThresholds.bruteForce.attempts.timeWindow;
        const windowStart = now - timeWindow;
        
        let bruteForceAttempts = 0;
        const uniqueIPs = new Set();
        
        for (const [patternKey, pattern] of this.threatPatterns.entries()) {
            if (pattern.type === 'brute_force') {
                const lastSeen = new Date(pattern.lastSeen).getTime();
                if (lastSeen > windowStart) {
                    bruteForceAttempts += pattern.count;
                    uniqueIPs.add(pattern.ip);
                }
            }
        }
        
        if (bruteForceAttempts >= this.securityThresholds.bruteForce.attempts.critical) {
            this.triggerSecurityAlert('brute_force_critical', {
                message: `Critical: ${bruteForceAttempts} brute force attempts from ${uniqueIPs.size} IPs`,
                severity: 'critical',
                attempts: bruteForceAttempts,
                uniqueIPs: uniqueIPs.size,
                action: 'enable_rate_limiting'
            });
        }
    }

    checkInjectionThresholds(event) {
        if (!['sql_injection', 'xss_attempt', 'command_injection'].includes(event.type)) return;
        
        const now = Date.now();
        const timeWindow = this.securityThresholds.sqlInjection.attempts.timeWindow;
        const windowStart = now - timeWindow;
        
        let injectionAttempts = 0;
        for (const [patternKey, pattern] of this.threatPatterns.entries()) {
            if (['sql_injection', 'xss_attempt', 'command_injection'].includes(pattern.type)) {
                const lastSeen = new Date(pattern.lastSeen).getTime();
                if (lastSeen > windowStart && pattern.ip === event.ip) {
                    injectionAttempts += pattern.count;
                }
            }
        }
        
        if (injectionAttempts >= 1) {
            this.triggerSecurityAlert('injection_attempt', {
                message: `Injection attempt detected from IP ${event.ip}`,
                severity: 'critical',
                ip: event.ip,
                type: event.type,
                attempts: injectionAttempts,
                action: 'block_ip_immediately'
            });
            this.blockIP(event.ip, 'injection_attempt');
        }
    }

    checkPrivilegeEscalationThresholds(event) {
        if (!event.type.includes('privilege_escalation')) return;
        
        this.triggerSecurityAlert('privilege_escalation', {
            message: `Privilege escalation attempt detected`,
            severity: 'critical',
            ip: event.ip,
            userId: event.userId,
            action: 'immediate_investigation'
        });
    }

    checkAPIAbuseThresholds(event) {
        const now = Date.now();
        const timeWindow = this.securityThresholds.apiAbuse.requestRate.timeWindow;
        const windowStart = now - timeWindow;
        
        let requestCount = 0;
        for (const [fingerprint, secEvent] of this.securityEvents.entries()) {
            if (secEvent.ip === event.ip) {
                const eventTime = new Date(secEvent.lastOccurrence).getTime();
                if (eventTime > windowStart) {
                    requestCount += secEvent.count;
                }
            }
        }
        
        if (requestCount >= this.securityThresholds.apiAbuse.requestRate.critical) {
            this.triggerSecurityAlert('api_abuse_critical', {
                message: `Critical API abuse: ${requestCount} requests from IP ${event.ip}`,
                severity: 'critical',
                ip: event.ip,
                requestCount,
                action: 'rate_limit_ip'
            });
        }
    }

    blockIP(ip, reason) {
        this.blockedIPs.add(ip);
        
        this.logger.warn('IP blocked', {
            ip,
            reason,
            timestamp: new Date().toISOString()
        });
        
        // In production, this would integrate with firewall/load balancer
        // to actually block the IP
    }

    isIPBlocked(ip) {
        return this.blockedIPs.has(ip);
    }

    unblockIP(ip) {
        this.blockedIPs.delete(ip);
        this.logger.info('IP unblocked', { ip, timestamp: new Date().toISOString() });
    }

    triggerSecurityAlert(type, alertData) {
        const alertId = `sec_${type}_${Date.now()}`;
        
        this.logger.error('Security alert triggered', {
            alertId,
            type,
            ...alertData
        });
        
        // Send to external security systems
        this.sendToSecurityTeam(alertData);
        this.sendToSIEM(alertData);
        
        if (alertData.severity === 'critical') {
            this.sendToIncidentResponse(alertData);
        }
    }

    async sendToSecurityTeam(alertData) {
        // Implementation would send to security team channels
        this.logger.info('Security team notified', { message: alertData.message });
    }

    async sendToSIEM(alertData) {
        // Implementation would send to SIEM system
        this.logger.info('SIEM alert sent', { message: alertData.message });
    }

    async sendToIncidentResponse(alertData) {
        // Implementation would trigger incident response
        this.logger.info('Incident response triggered', { message: alertData.message });
    }

    async analyzeAuditLogs() {
        try {
            const auditLogPath = path.join(process.cwd(), 'logs/audit.log');
            
            if (await this.fileExists(auditLogPath)) {
                const logContent = await fs.readFile(auditLogPath, 'utf8');
                const logLines = logContent.split('\n').filter(line => line.trim());
                
                const analysis = {
                    timestamp: new Date().toISOString(),
                    totalEntries: logLines.length,
                    suspiciousPatterns: [],
                    anomalies: [],
                    recommendations: []
                };
                
                // Analyze recent log entries (last 1000 lines)
                const recentLines = logLines.slice(-1000);
                
                for (const line of recentLines) {
                    try {
                        const logEntry = JSON.parse(line);
                        this.analyzeLogEntry(logEntry, analysis);
                    } catch (parseError) {
                        // Skip malformed log entries
                        continue;
                    }
                }
                
                // Generate recommendations based on analysis
                this.generateSecurityRecommendations(analysis);
                
                this.logger.info('Audit log analysis completed', {
                    totalEntries: analysis.totalEntries,
                    suspiciousPatterns: analysis.suspiciousPatterns.length,
                    anomalies: analysis.anomalies.length
                });
                
                return analysis;
            }
        } catch (error) {
            this.logger.error('Failed to analyze audit logs', { error: error.message });
        }
    }

    analyzeLogEntry(logEntry, analysis) {
        // Check for suspicious patterns in audit logs
        
        // Multiple admin actions from same IP in short time
        if (logEntry.action && logEntry.adminId && logEntry.ipAddress) {
            const pattern = `admin_${logEntry.adminId}_${logEntry.ipAddress}`;
            
            if (!this.suspiciousActivities.has(pattern)) {
                this.suspiciousActivities.set(pattern, []);
            }
            
            this.suspiciousActivities.get(pattern).push(logEntry.timestamp);
            
            // Check if more than 10 actions in 5 minutes
            const fiveMinutesAgo = Date.now() - 300000;
            const recentActions = this.suspiciousActivities.get(pattern)
                .filter(timestamp => new Date(timestamp).getTime() > fiveMinutesAgo);
            
            if (recentActions.length > 10) {
                analysis.suspiciousPatterns.push({
                    type: 'rapid_admin_actions',
                    description: `Admin ${logEntry.adminId} performed ${recentActions.length} actions in 5 minutes`,
                    severity: 'medium',
                    data: { adminId: logEntry.adminId, ip: logEntry.ipAddress, actionCount: recentActions.length }
                });
            }
        }
        
        // Unusual data access patterns
        if (logEntry.action === 'data_export' && logEntry.entityCount > 1000) {
            analysis.anomalies.push({
                type: 'large_data_export',
                description: `Large data export: ${logEntry.entityCount} records`,
                severity: 'high',
                data: { adminId: logEntry.adminId, entityCount: logEntry.entityCount }
            });
        }
        
        // Failed authentication attempts
        if (logEntry.action === 'authentication_failed') {
            analysis.suspiciousPatterns.push({
                type: 'authentication_failure',
                description: 'Failed authentication attempt',
                severity: 'low',
                data: { ip: logEntry.ipAddress, timestamp: logEntry.timestamp }
            });
        }
        
        // Privilege changes
        if (logEntry.action === 'role_changed' || logEntry.action === 'permission_granted') {
            analysis.anomalies.push({
                type: 'privilege_change',
                description: 'User privilege modification',
                severity: 'medium',
                data: { adminId: logEntry.adminId, targetUser: logEntry.entityId, changes: logEntry.changes }
            });
        }
    }

    generateSecurityRecommendations(analysis) {
        // Generate recommendations based on analysis
        
        const rapidActionsCount = analysis.suspiciousPatterns
            .filter(p => p.type === 'rapid_admin_actions').length;
        
        if (rapidActionsCount > 0) {
            analysis.recommendations.push({
                type: 'access_control',
                priority: 'medium',
                message: 'Consider implementing additional rate limiting for admin actions'
            });
        }
        
        const largeExportsCount = analysis.anomalies
            .filter(a => a.type === 'large_data_export').length;
        
        if (largeExportsCount > 0) {
            analysis.recommendations.push({
                type: 'data_protection',
                priority: 'high',
                message: 'Review large data export activities and consider additional approval workflows'
            });
        }
        
        const authFailuresCount = analysis.suspiciousPatterns
            .filter(p => p.type === 'authentication_failure').length;
        
        if (authFailuresCount > 10) {
            analysis.recommendations.push({
                type: 'authentication',
                priority: 'high',
                message: 'High number of authentication failures detected. Consider implementing CAPTCHA or account lockout'
            });
        }
    }

    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    analyzeSecurityPatterns() {
        const analysis = {
            timestamp: new Date().toISOString(),
            totalEvents: this.securityEvents.size,
            threatPatterns: [],
            riskAssessment: {},
            blockedIPs: Array.from(this.blockedIPs)
        };
        
        // Analyze threat patterns
        for (const [patternKey, pattern] of this.threatPatterns.entries()) {
            analysis.threatPatterns.push({
                type: pattern.type,
                description: pattern.description,
                count: pattern.count,
                severity: pattern.severity,
                riskScore: pattern.riskScore,
                ip: pattern.ip
            });
        }
        
        // Calculate overall risk assessment
        analysis.riskAssessment = this.calculateRiskAssessment(analysis.threatPatterns);
        
        this.logger.info('Security pattern analysis completed', {
            totalEvents: analysis.totalEvents,
            threatPatterns: analysis.threatPatterns.length,
            overallRisk: analysis.riskAssessment.level
        });
        
        return analysis;
    }

    calculateRiskAssessment(threatPatterns) {
        let totalRiskScore = 0;
        let criticalThreats = 0;
        let highThreats = 0;
        
        for (const pattern of threatPatterns) {
            totalRiskScore += pattern.riskScore * pattern.count;
            
            if (pattern.severity === 'critical') {
                criticalThreats++;
            } else if (pattern.severity === 'high') {
                highThreats++;
            }
        }
        
        let riskLevel = 'low';
        if (criticalThreats > 0 || totalRiskScore > 500) {
            riskLevel = 'critical';
        } else if (highThreats > 2 || totalRiskScore > 200) {
            riskLevel = 'high';
        } else if (totalRiskScore > 50) {
            riskLevel = 'medium';
        }
        
        return {
            level: riskLevel,
            score: totalRiskScore,
            criticalThreats,
            highThreats,
            recommendations: this.getRiskRecommendations(riskLevel, criticalThreats, highThreats)
        };
    }

    getRiskRecommendations(riskLevel, criticalThreats, highThreats) {
        const recommendations = [];
        
        if (riskLevel === 'critical') {
            recommendations.push('Immediate security review required');
            recommendations.push('Consider enabling emergency security measures');
            recommendations.push('Review and update incident response procedures');
        } else if (riskLevel === 'high') {
            recommendations.push('Increase security monitoring frequency');
            recommendations.push('Review access controls and permissions');
            recommendations.push('Consider additional security training for staff');
        } else if (riskLevel === 'medium') {
            recommendations.push('Regular security review recommended');
            recommendations.push('Update security policies and procedures');
        }
        
        return recommendations;
    }

    cleanupOldEvents() {
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
        
        let cleanedEvents = 0;
        let cleanedPatterns = 0;
        
        // Clean up old security events
        for (const [fingerprint, event] of this.securityEvents.entries()) {
            const lastOccurrence = new Date(event.lastOccurrence).getTime();
            
            if (lastOccurrence < thirtyDaysAgo) {
                this.securityEvents.delete(fingerprint);
                cleanedEvents++;
            }
        }
        
        // Clean up old threat patterns
        for (const [patternKey, pattern] of this.threatPatterns.entries()) {
            const lastSeen = new Date(pattern.lastSeen).getTime();
            
            if (lastSeen < thirtyDaysAgo) {
                this.threatPatterns.delete(patternKey);
                cleanedPatterns++;
            }
        }
        
        if (cleanedEvents > 0 || cleanedPatterns > 0) {
            this.logger.info(`Cleaned up ${cleanedEvents} old security events and ${cleanedPatterns} old threat patterns`);
        }
    }

    getSecuritySummary() {
        const now = Date.now();
        const oneHourAgo = now - 3600000;
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        
        let hourlyEvents = 0;
        let dailyEvents = 0;
        let criticalEvents = 0;
        
        for (const [fingerprint, event] of this.securityEvents.entries()) {
            const lastOccurrence = new Date(event.lastOccurrence).getTime();
            
            if (lastOccurrence > oneHourAgo) {
                hourlyEvents += event.count;
            }
            
            if (lastOccurrence > oneDayAgo) {
                dailyEvents += event.count;
            }
            
            if (event.severity === 'critical') {
                criticalEvents += event.count;
            }
        }
        
        return {
            totalEvents: this.securityEvents.size,
            hourlyEvents,
            dailyEvents,
            criticalEvents,
            blockedIPs: this.blockedIPs.size,
            threatPatterns: this.threatPatterns.size,
            riskAssessment: this.calculateRiskAssessment(Array.from(this.threatPatterns.values())),
            timestamp: new Date().toISOString()
        };
    }
}

export default SecurityMonitoringService;