import XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { auditService } from './auditService.js';
import { exportSecurityService } from './exportSecurityService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

class ExportService {
  constructor() {
    this.supportedFormats = ['csv', 'excel', 'json'];
    this.exportDir = path.join(__dirname, '../../exports');
    this.ensureExportDirectory();
  }

  async ensureExportDirectory() {
    try {
      await fs.access(this.exportDir);
    } catch {
      await fs.mkdir(this.exportDir, { recursive: true });
    }
  }

  /**
   * Get available export entities and their fields
   */
  getAvailableExports() {
    return {
      users: {
        name: 'Users',
        description: 'User accounts and profile information',
        fields: {
          id: { label: 'ID', type: 'string', sensitive: false },
          email: { label: 'Email', type: 'string', sensitive: true },
          name: { label: 'Name', type: 'string', sensitive: true },
          role: { label: 'Role', type: 'string', sensitive: false },
          phone: { label: 'Phone', type: 'string', sensitive: true },
          address: { label: 'Address', type: 'string', sensitive: true },
          postalCode: { label: 'Postal Code', type: 'string', sensitive: true },
          isActive: { label: 'Active Status', type: 'boolean', sensitive: false },
          createdAt: { label: 'Created Date', type: 'datetime', sensitive: false },
          updatedAt: { label: 'Updated Date', type: 'datetime', sensitive: false },
          suspendedAt: { label: 'Suspended Date', type: 'datetime', sensitive: false },
          suspensionReason: { label: 'Suspension Reason', type: 'string', sensitive: false }
        }
      },
      subscriptions: {
        name: 'Subscriptions',
        description: 'Subscription data and billing information',
        fields: {
          id: { label: 'ID', type: 'string', sensitive: false },
          userId: { label: 'User ID', type: 'string', sensitive: false },
          tier: { label: 'Tier', type: 'string', sensitive: false },
          status: { label: 'Status', type: 'string', sensitive: false },
          paymentFrequency: { label: 'Payment Frequency', type: 'string', sensitive: false },
          nextPaymentAmount: { label: 'Next Payment Amount', type: 'number', sensitive: false },
          isPaused: { label: 'Is Paused', type: 'boolean', sensitive: false },
          availableCredits: { label: 'Available Credits', type: 'number', sensitive: false },
          loyaltyPoints: { label: 'Loyalty Points', type: 'number', sensitive: false },
          churnRiskScore: { label: 'Churn Risk Score', type: 'number', sensitive: false },
          lifetimeValue: { label: 'Lifetime Value', type: 'number', sensitive: false },
          createdAt: { label: 'Created Date', type: 'datetime', sensitive: false },
          updatedAt: { label: 'Updated Date', type: 'datetime', sensitive: false },
          currentPeriodStart: { label: 'Current Period Start', type: 'datetime', sensitive: false },
          currentPeriodEnd: { label: 'Current Period End', type: 'datetime', sensitive: false }
        }
      },
      serviceRequests: {
        name: 'Service Requests',
        description: 'Customer service requests and work orders',
        fields: {
          id: { label: 'ID', type: 'string', sensitive: false },
          customerId: { label: 'Customer ID', type: 'string', sensitive: false },
          category: { label: 'Category', type: 'string', sensitive: false },
          description: { label: 'Description', type: 'string', sensitive: false },
          urgency: { label: 'Urgency', type: 'string', sensitive: false },
          status: { label: 'Status', type: 'string', sensitive: false },
          address: { label: 'Address', type: 'string', sensitive: true },
          preferredDate: { label: 'Preferred Date', type: 'datetime', sensitive: false },
          assignedTechnicianId: { label: 'Assigned Technician ID', type: 'string', sensitive: false },
          createdAt: { label: 'Created Date', type: 'datetime', sensitive: false },
          updatedAt: { label: 'Updated Date', type: 'datetime', sensitive: false }
        }
      },
      bookings: {
        name: 'Bookings',
        description: 'Service bookings and appointments',
        fields: {
          id: { label: 'ID', type: 'string', sensitive: false },
          customerId: { label: 'Customer ID', type: 'string', sensitive: false },
          serviceId: { label: 'Service ID', type: 'string', sensitive: false },
          scheduledDate: { label: 'Scheduled Date', type: 'datetime', sensitive: false },
          status: { label: 'Status', type: 'string', sensitive: false },
          totalAmount: { label: 'Total Amount', type: 'number', sensitive: false },
          discountAmount: { label: 'Discount Amount', type: 'number', sensitive: false },
          finalAmount: { label: 'Final Amount', type: 'number', sensitive: false },
          perkType: { label: 'Perk Type', type: 'string', sensitive: false },
          usedSubscriptionPerk: { label: 'Used Subscription Perk', type: 'boolean', sensitive: false },
          createdAt: { label: 'Created Date', type: 'datetime', sensitive: false },
          updatedAt: { label: 'Updated Date', type: 'datetime', sensitive: false }
        }
      },
      auditLogs: {
        name: 'Audit Logs',
        description: 'System audit trail and activity logs',
        fields: {
          id: { label: 'ID', type: 'string', sensitive: false },
          adminId: { label: 'Admin ID', type: 'string', sensitive: false },
          action: { label: 'Action', type: 'string', sensitive: false },
          entityType: { label: 'Entity Type', type: 'string', sensitive: false },
          entityId: { label: 'Entity ID', type: 'string', sensitive: false },
          changes: { label: 'Changes', type: 'json', sensitive: false },
          metadata: { label: 'Metadata', type: 'json', sensitive: false },
          severity: { label: 'Severity', type: 'string', sensitive: false },
          createdAt: { label: 'Created Date', type: 'datetime', sensitive: false }
        }
      }
    };
  }

  /**
   * Export data with customizable field selection
   */
  async exportData(options, requestMetadata = {}) {
    const {
      entity,
      format,
      fields = [],
      filters = {},
      limit = 10000,
      adminId,
      anonymize = false,
      customData = null
    } = options;

    try {
      // Security validation
      if (adminId && !customData) {
        const securityValidation = await exportSecurityService.validateExportRequest(
          adminId,
          { entity, fields, limit, anonymize },
          requestMetadata
        );

        if (!securityValidation.approved) {
          throw new Error('Export request denied by security validation');
        }

        // Check for suspicious activity
        const suspiciousActivity = await exportSecurityService.detectSuspiciousActivity(adminId);
        if (suspiciousActivity.suspicious) {
          throw new Error(`Export blocked: ${suspiciousActivity.reason}`);
        }
      }

      // Validate inputs
      this.validateExportOptions(options);

      // Get data based on entity type or use custom data
      const data = customData || await this.fetchEntityData(entity, fields, filters, limit);

      // Apply anonymization if requested or required by security
      const processedData = anonymize ? 
        exportSecurityService.anonymizeExportData(data, entity, fields) : 
        data;

      // Generate export file
      const exportResult = await this.generateExportFile(processedData, format, entity, fields);

      // Log the export operation
      await this.logExportOperation(adminId, entity, format, fields, processedData.length, anonymize);

      const result = {
        success: true,
        filePath: exportResult.filePath,
        fileName: exportResult.fileName,
        recordCount: processedData.length,
        format,
        entity,
        fields: fields.length > 0 ? fields : Object.keys(this.getAvailableExports()[entity].fields),
        anonymized: anonymize
      };

      // Log export completion for security audit
      if (adminId) {
        await exportSecurityService.logExportCompletion(adminId, result, requestMetadata);
      }

      return result;

    } catch (error) {
      console.error('Export error:', error);
      
      // Log failed export attempt
      if (adminId) {
        await this.logExportOperation(adminId, entity, format, fields, 0, anonymize, error.message);
      }

      throw new Error(`Export failed: ${error.message}`);
    }
  }

  /**
   * Validate export options
   */
  validateExportOptions(options) {
    const { entity, format, fields = [] } = options;
    const availableExports = this.getAvailableExports();

    if (!entity || !availableExports[entity]) {
      throw new Error(`Invalid entity: ${entity}. Available entities: ${Object.keys(availableExports).join(', ')}`);
    }

    if (!format || !this.supportedFormats.includes(format.toLowerCase())) {
      throw new Error(`Invalid format: ${format}. Supported formats: ${this.supportedFormats.join(', ')}`);
    }

    if (fields.length > 0) {
      const availableFields = Object.keys(availableExports[entity].fields);
      const invalidFields = fields.filter(field => !availableFields.includes(field));
      if (invalidFields.length > 0) {
        throw new Error(`Invalid fields for ${entity}: ${invalidFields.join(', ')}`);
      }
    }
  }

  /**
   * Fetch entity data from database
   */
  async fetchEntityData(entity, fields, filters, limit) {
    const selectFields = fields.length > 0 ? 
      fields.reduce((acc, field) => ({ ...acc, [field]: true }), {}) : 
      undefined;

    const queryOptions = {
      select: selectFields,
      take: limit,
      orderBy: { createdAt: 'desc' }
    };

    // Apply filters based on entity type
    if (Object.keys(filters).length > 0) {
      queryOptions.where = this.buildWhereClause(entity, filters);
    }

    switch (entity) {
      case 'users':
        return await prisma.user.findMany(queryOptions);
      
      case 'subscriptions':
        return await prisma.subscription.findMany({
          ...queryOptions,
          include: selectFields ? undefined : {
            user: {
              select: { email: true, name: true }
            }
          }
        });
      
      case 'serviceRequests':
        return await prisma.serviceRequest.findMany({
          ...queryOptions,
          include: selectFields ? undefined : {
            customer: {
              select: { email: true, name: true }
            },
            service: {
              select: { name: true, category: true }
            },
            assignedTechnician: {
              select: { name: true, email: true }
            }
          }
        });
      
      case 'bookings':
        return await prisma.booking.findMany(queryOptions);
      
      case 'auditLogs':
        return await prisma.auditLog.findMany({
          ...queryOptions,
          include: selectFields ? undefined : {
            admin: {
              select: { email: true, name: true }
            }
          }
        });
      
      default:
        throw new Error(`Unsupported entity: ${entity}`);
    }
  }

  /**
   * Build where clause for filtering
   */
  buildWhereClause(entity, filters) {
    const where = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value === null || value === undefined) return;

      // Handle different filter types
      if (key.endsWith('_from') || key.endsWith('_to')) {
        const fieldName = key.replace(/_from$|_to$/, '');
        if (!where[fieldName]) where[fieldName] = {};
        
        if (key.endsWith('_from')) {
          where[fieldName].gte = new Date(value);
        } else {
          where[fieldName].lte = new Date(value);
        }
      } else if (key.endsWith('_contains')) {
        const fieldName = key.replace(/_contains$/, '');
        where[fieldName] = { contains: value, mode: 'insensitive' };
      } else if (key.endsWith('_in')) {
        const fieldName = key.replace(/_in$/, '');
        where[fieldName] = { in: Array.isArray(value) ? value : [value] };
      } else {
        where[key] = value;
      }
    });

    return where;
  }

  /**
   * Anonymize sensitive data
   */
  anonymizeData(data, entity, fields) {
    const availableFields = this.getAvailableExports()[entity].fields;
    const sensitiveFields = Object.entries(availableFields)
      .filter(([_, config]) => config.sensitive)
      .map(([field, _]) => field);

    return data.map(record => {
      const anonymizedRecord = { ...record };
      
      sensitiveFields.forEach(field => {
        if (anonymizedRecord[field] && (fields.length === 0 || fields.includes(field))) {
          anonymizedRecord[field] = this.anonymizeField(anonymizedRecord[field], availableFields[field].type);
        }
      });

      return anonymizedRecord;
    });
  }

  /**
   * Anonymize individual field based on type
   */
  anonymizeField(value, type) {
    if (!value) return value;

    switch (type) {
      case 'string':
        if (value.includes('@')) {
          // Email anonymization
          const [local, domain] = value.split('@');
          return `${local.substring(0, 2)}***@${domain}`;
        } else if (value.match(/^\+?\d+$/)) {
          // Phone number anonymization
          return value.substring(0, 3) + '***' + value.substring(value.length - 2);
        } else {
          // General string anonymization
          return value.substring(0, 2) + '***';
        }
      default:
        return '[REDACTED]';
    }
  }

  /**
   * Generate export file in specified format
   */
  async generateExportFile(data, format, entity, fields) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${entity}_export_${timestamp}.${format}`;
    const filePath = path.join(this.exportDir, fileName);

    switch (format.toLowerCase()) {
      case 'csv':
        await this.generateCSV(data, filePath);
        break;
      case 'excel':
        await this.generateExcel(data, filePath, entity);
        break;
      case 'json':
        await this.generateJSON(data, filePath);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    return { filePath, fileName };
  }

  /**
   * Generate CSV file
   */
  async generateCSV(data, filePath) {
    if (data.length === 0) {
      await fs.writeFile(filePath, 'No data available\n');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    await fs.writeFile(filePath, csv);
  }

  /**
   * Generate Excel file
   */
  async generateExcel(data, filePath, entity) {
    const workbook = XLSX.utils.book_new();
    
    if (data.length === 0) {
      const emptySheet = XLSX.utils.aoa_to_sheet([['No data available']]);
      XLSX.utils.book_append_sheet(workbook, emptySheet, entity);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, entity);
    }

    XLSX.writeFile(workbook, filePath);
  }

  /**
   * Generate JSON file
   */
  async generateJSON(data, filePath) {
    const jsonData = {
      exportedAt: new Date().toISOString(),
      recordCount: data.length,
      data
    };
    
    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));
  }

  /**
   * Log export operation for audit trail
   */
  async logExportOperation(adminId, entity, format, fields, recordCount, anonymized, error = null) {
    try {
      await auditService.logAction({
        adminId,
        action: 'DATA_EXPORT',
        entityType: 'EXPORT',
        entityId: `${entity}_${format}`,
        changes: {
          entity,
          format,
          fields: fields.length > 0 ? fields : 'all',
          recordCount,
          anonymized,
          success: !error,
          error
        },
        metadata: {
          timestamp: new Date().toISOString(),
          exportType: 'manual'
        }
      });
    } catch (auditError) {
      console.error('Failed to log export operation:', auditError);
    }
  }

  /**
   * Clean up old export files
   */
  async cleanupOldExports(maxAgeHours = 24) {
    try {
      const files = await fs.readdir(this.exportDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.exportDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          console.log(`Cleaned up old export file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old exports:', error);
    }
  }

  /**
   * Get export file for download
   */
  async getExportFile(fileName) {
    const filePath = path.join(this.exportDir, fileName);
    
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      throw new Error('Export file not found or expired');
    }
  }
}

export const exportService = new ExportService();