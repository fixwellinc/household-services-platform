import crypto from 'crypto';
import { auditService } from './auditService.js';
import winston from 'winston';

// Configure security logger
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'export-security' },
  transports: [
    new winston.transports.File({ filename: 'logs/security.log' }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  securityLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

class ExportSecurityService {
  constructor() {
    this.sensitiveDataPatterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^[\+]?[1-9][\d]{0,15}$/,
      ssn: /^\d{3}-?\d{2}-?\d{4}$/,
      creditCard: /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/,
      ipAddress: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/
    };

    this.exportLimits = {
      maxRecordsPerExport: 100000,
      maxExportsPerHour: 10,
      maxExportsPerDay: 50,
      sensitiveDataMaxRecords: 10000
    };

    this.userExportHistory = new Map(); // In production, use Redis or database
  }

  /**
   * Validate export request security
   */
  async validateExportRequest(adminId, exportOptions, requestMetadata) {
    const { entity, fields, limit, anonymize } = exportOptions;
    const { ipAddress, userAgent } = requestMetadata;

    securityLogger.info('Validating export request', {
      adminId,
      entity,
      fieldsCount: fields.length,
      limit,
      anonymize,
      ipAddress
    });

    // Check rate limits
    await this.checkRateLimits(adminId);

    // Validate export size
    this.validateExportSize(limit, fields, entity);

    // Check for sensitive data access
    const sensitiveFields = this.identifySensitiveFields(entity, fields);
    if (sensitiveFields.length > 0) {
      await this.validateSensitiveDataAccess(adminId, entity, sensitiveFields, limit, anonymize);
    }

    // Validate IP restrictions (if configured)
    await this.validateIPRestrictions(adminId, ipAddress);

    // Log security validation
    await auditService.logAction({
      adminId,
      action: 'EXPORT_SECURITY_VALIDATION',
      entityType: 'EXPORT_SECURITY',
      entityId: `${entity}_validation`,
      changes: {
        entity,
        fieldsCount: fields.length,
        sensitiveFieldsCount: sensitiveFields.length,
        limit,
        anonymize,
        passed: true
      },
      metadata: {
        ipAddress,
        userAgent,
        timestamp: new Date().toISOString()
      },
      severity: sensitiveFields.length > 0 ? 'high' : 'medium'
    });

    return {
      approved: true,
      sensitiveFields,
      requiresAdditionalAuth: sensitiveFields.length > 0 && limit > 1000,
      warnings: this.generateSecurityWarnings(sensitiveFields, limit, anonymize)
    };
  }

  /**
   * Check rate limits for user
   */
  async checkRateLimits(adminId) {
    const now = Date.now();
    const userHistory = this.userExportHistory.get(adminId) || {
      hourlyExports: [],
      dailyExports: []
    };

    // Clean old entries
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    userHistory.hourlyExports = userHistory.hourlyExports.filter(time => time > oneHourAgo);
    userHistory.dailyExports = userHistory.dailyExports.filter(time => time > oneDayAgo);

    // Check limits
    if (userHistory.hourlyExports.length >= this.exportLimits.maxExportsPerHour) {
      securityLogger.warn('Hourly export limit exceeded', { adminId });
      throw new Error('Hourly export limit exceeded. Please try again later.');
    }

    if (userHistory.dailyExports.length >= this.exportLimits.maxExportsPerDay) {
      securityLogger.warn('Daily export limit exceeded', { adminId });
      throw new Error('Daily export limit exceeded. Please contact administrator.');
    }

    // Record this request
    userHistory.hourlyExports.push(now);
    userHistory.dailyExports.push(now);
    this.userExportHistory.set(adminId, userHistory);
  }

  /**
   * Validate export size limits
   */
  validateExportSize(limit, fields, entity) {
    if (limit > this.exportLimits.maxRecordsPerExport) {
      throw new Error(`Export limit cannot exceed ${this.exportLimits.maxRecordsPerExport} records`);
    }

    // Additional validation for specific entities
    const entityLimits = {
      users: 50000,
      auditLogs: 25000,
      subscriptions: 75000
    };

    const entityLimit = entityLimits[entity];
    if (entityLimit && limit > entityLimit) {
      throw new Error(`Export limit for ${entity} cannot exceed ${entityLimit} records`);
    }
  }

  /**
   * Identify sensitive fields in export
   */
  identifySensitiveFields(entity, fields) {
    const sensitiveFieldsByEntity = {
      users: ['email', 'phone', 'address', 'postalCode'],
      subscriptions: ['stripeCustomerId', 'stripeSubscriptionId'],
      serviceRequests: ['address'],
      auditLogs: ['metadata', 'changes'],
      bookings: ['notes']
    };

    const entitySensitiveFields = sensitiveFieldsByEntity[entity] || [];
    return fields.filter(field => entitySensitiveFields.includes(field));
  }

  /**
   * Validate access to sensitive data
   */
  async validateSensitiveDataAccess(adminId, entity, sensitiveFields, limit, anonymize) {
    securityLogger.info('Validating sensitive data access', {
      adminId,
      entity,
      sensitiveFields,
      limit,
      anonymize
    });

    // Check if limit exceeds sensitive data threshold
    if (limit > this.exportLimits.sensitiveDataMaxRecords && !anonymize) {
      throw new Error(
        `Exports containing sensitive data are limited to ${this.exportLimits.sensitiveDataMaxRecords} records unless anonymized`
      );
    }

    // Log sensitive data access attempt
    await auditService.logAction({
      adminId,
      action: 'SENSITIVE_DATA_EXPORT_ATTEMPT',
      entityType: 'EXPORT_SECURITY',
      entityId: `${entity}_sensitive`,
      changes: {
        entity,
        sensitiveFields,
        limit,
        anonymize
      },
      metadata: {
        timestamp: new Date().toISOString(),
        riskLevel: this.calculateRiskLevel(sensitiveFields, limit, anonymize)
      },
      severity: 'high'
    });
  }

  /**
   * Validate IP restrictions
   */
  async validateIPRestrictions(adminId, ipAddress) {
    // In production, this would check against configured IP whitelist/blacklist
    const allowedIPs = process.env.ADMIN_ALLOWED_IPS?.split(',') || [];
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(ipAddress)) {
      securityLogger.warn('Export attempt from unauthorized IP', { adminId, ipAddress });
      
      await auditService.logAction({
        adminId,
        action: 'UNAUTHORIZED_IP_EXPORT_ATTEMPT',
        entityType: 'EXPORT_SECURITY',
        entityId: 'ip_restriction',
        changes: {
          attemptedIP: ipAddress,
          allowedIPs: allowedIPs.length
        },
        metadata: {
          timestamp: new Date().toISOString()
        },
        severity: 'critical'
      });

      throw new Error('Export not allowed from this IP address');
    }
  }

  /**
   * Generate security warnings
   */
  generateSecurityWarnings(sensitiveFields, limit, anonymize) {
    const warnings = [];

    if (sensitiveFields.length > 0 && !anonymize) {
      warnings.push({
        type: 'sensitive_data',
        message: `Export contains ${sensitiveFields.length} sensitive field(s): ${sensitiveFields.join(', ')}`,
        severity: 'high'
      });
    }

    if (limit > 10000) {
      warnings.push({
        type: 'large_export',
        message: `Large export requested (${limit} records). Consider using filters to reduce size.`,
        severity: 'medium'
      });
    }

    if (sensitiveFields.length > 0 && limit > 5000 && !anonymize) {
      warnings.push({
        type: 'high_risk',
        message: 'High-risk export: Large dataset with sensitive data. Consider anonymization.',
        severity: 'critical'
      });
    }

    return warnings;
  }

  /**
   * Calculate risk level for export
   */
  calculateRiskLevel(sensitiveFields, limit, anonymize) {
    let riskScore = 0;

    // Sensitive fields increase risk
    riskScore += sensitiveFields.length * 2;

    // Large exports increase risk
    if (limit > 10000) riskScore += 3;
    if (limit > 50000) riskScore += 5;

    // Anonymization reduces risk
    if (anonymize) riskScore = Math.max(0, riskScore - 3);

    if (riskScore >= 8) return 'critical';
    if (riskScore >= 5) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  }

  /**
   * Apply data anonymization
   */
  anonymizeExportData(data, entity, fields) {
    const sensitiveFields = this.identifySensitiveFields(entity, fields);
    
    return data.map(record => {
      const anonymizedRecord = { ...record };
      
      sensitiveFields.forEach(field => {
        if (anonymizedRecord[field]) {
          anonymizedRecord[field] = this.anonymizeValue(anonymizedRecord[field], field);
        }
      });

      return anonymizedRecord;
    });
  }

  /**
   * Anonymize individual value
   */
  anonymizeValue(value, fieldType) {
    if (!value) return value;

    const stringValue = String(value);

    // Email anonymization
    if (this.sensitiveDataPatterns.email.test(stringValue)) {
      const [local, domain] = stringValue.split('@');
      return `${local.substring(0, 2)}***@${domain}`;
    }

    // Phone anonymization
    if (this.sensitiveDataPatterns.phone.test(stringValue.replace(/\D/g, ''))) {
      const digits = stringValue.replace(/\D/g, '');
      return digits.substring(0, 3) + '***' + digits.substring(digits.length - 2);
    }

    // Address anonymization
    if (fieldType === 'address') {
      const words = stringValue.split(' ');
      return words.map((word, index) => 
        index < 2 ? word : '***'
      ).join(' ');
    }

    // Generic string anonymization
    if (stringValue.length > 3) {
      return stringValue.substring(0, 2) + '***' + stringValue.substring(stringValue.length - 1);
    }

    return '***';
  }

  /**
   * Generate secure export token
   */
  generateExportToken(adminId, exportConfig) {
    const tokenData = {
      adminId,
      exportConfig: {
        entity: exportConfig.entity,
        fields: exportConfig.fields,
        limit: exportConfig.limit
      },
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };

    const token = crypto.createHash('sha256')
      .update(JSON.stringify(tokenData) + process.env.JWT_SECRET)
      .digest('hex');

    return {
      token,
      expiresAt: tokenData.expiresAt
    };
  }

  /**
   * Validate export token
   */
  validateExportToken(token, adminId, exportConfig) {
    try {
      const expectedToken = this.generateExportToken(adminId, exportConfig);
      return token === expectedToken.token && Date.now() < expectedToken.expiresAt;
    } catch (error) {
      securityLogger.error('Export token validation failed', error);
      return false;
    }
  }

  /**
   * Log export completion
   */
  async logExportCompletion(adminId, exportResult, requestMetadata) {
    const { ipAddress, userAgent } = requestMetadata;

    await auditService.logAction({
      adminId,
      action: 'EXPORT_COMPLETED',
      entityType: 'EXPORT_SECURITY',
      entityId: exportResult.fileName || 'unknown',
      changes: {
        entity: exportResult.entity,
        format: exportResult.format,
        recordCount: exportResult.recordCount,
        fileName: exportResult.fileName,
        anonymized: exportResult.anonymized || false
      },
      metadata: {
        ipAddress,
        userAgent,
        timestamp: new Date().toISOString(),
        fileSize: exportResult.fileSize || 0
      },
      severity: exportResult.recordCount > 10000 ? 'high' : 'medium'
    });

    securityLogger.info('Export completed successfully', {
      adminId,
      fileName: exportResult.fileName,
      recordCount: exportResult.recordCount,
      ipAddress
    });
  }

  /**
   * Detect suspicious export patterns
   */
  async detectSuspiciousActivity(adminId) {
    const userHistory = this.userExportHistory.get(adminId) || { hourlyExports: [], dailyExports: [] };
    const now = Date.now();
    const recentExports = userHistory.hourlyExports.filter(time => time > (now - 30 * 60 * 1000)); // Last 30 minutes

    // Check for rapid successive exports
    if (recentExports.length >= 5) {
      securityLogger.warn('Suspicious export activity detected', {
        adminId,
        recentExportsCount: recentExports.length
      });

      await auditService.logAction({
        adminId,
        action: 'SUSPICIOUS_EXPORT_ACTIVITY',
        entityType: 'EXPORT_SECURITY',
        entityId: 'activity_detection',
        changes: {
          recentExportsCount: recentExports.length,
          timeWindow: '30 minutes'
        },
        metadata: {
          timestamp: new Date().toISOString()
        },
        severity: 'critical'
      });

      return {
        suspicious: true,
        reason: 'Rapid successive exports detected',
        recommendedAction: 'Require additional authentication'
      };
    }

    return { suspicious: false };
  }

  /**
   * Get export security statistics
   */
  getSecurityStatistics() {
    const totalUsers = this.userExportHistory.size;
    let totalExportsToday = 0;
    let totalExportsThisHour = 0;

    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneHourAgo = now - (60 * 60 * 1000);

    for (const [userId, history] of this.userExportHistory.entries()) {
      totalExportsToday += history.dailyExports.filter(time => time > oneDayAgo).length;
      totalExportsThisHour += history.hourlyExports.filter(time => time > oneHourAgo).length;
    }

    return {
      activeUsers: totalUsers,
      exportsToday: totalExportsToday,
      exportsThisHour: totalExportsThisHour,
      rateLimits: this.exportLimits
    };
  }
}

export const exportSecurityService = new ExportSecurityService();