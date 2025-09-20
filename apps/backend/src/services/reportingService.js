import { PrismaClient } from '@prisma/client';
import { exportService } from './exportService.js';
import queueService from './queueService.js';
import { auditService } from './auditService.js';
import cron from 'node-cron';
import winston from 'winston';

const prisma = new PrismaClient();

// Configure reporting logger
const reportingLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'reporting' },
  transports: [
    new winston.transports.File({ filename: 'logs/reporting.log' }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  reportingLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

class ReportingService {
  constructor() {
    this.scheduledJobs = new Map();
    this.reportTemplates = this.getBuiltInTemplates();
    this.initializeScheduler();
  }

  /**
   * Get built-in report templates
   */
  getBuiltInTemplates() {
    return {
      'user-activity-summary': {
        id: 'user-activity-summary',
        name: 'User Activity Summary',
        description: 'Summary of user registrations, activity, and engagement metrics',
        category: 'users',
        parameters: {
          dateRange: { type: 'dateRange', required: true, default: 'last30days' },
          userType: { type: 'select', options: ['all', 'customers', 'employees'], default: 'all' },
          includeInactive: { type: 'boolean', default: false }
        },
        query: {
          entity: 'users',
          fields: ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt', 'isActive'],
          aggregations: [
            { field: 'id', operation: 'count', alias: 'totalUsers' },
            { field: 'createdAt', operation: 'date_trunc', interval: 'day', alias: 'registrationDate' }
          ]
        },
        format: 'excel',
        schedule: null
      },

      'subscription-analytics': {
        id: 'subscription-analytics',
        name: 'Subscription Analytics Report',
        description: 'Comprehensive subscription metrics including revenue, churn, and growth',
        category: 'subscriptions',
        parameters: {
          dateRange: { type: 'dateRange', required: true, default: 'last30days' },
          tier: { type: 'select', options: ['all', 'STARTER', 'HOMECARE', 'PRIORITY'], default: 'all' },
          includeChurnPrediction: { type: 'boolean', default: true }
        },
        query: {
          entity: 'subscriptions',
          fields: ['id', 'userId', 'tier', 'status', 'paymentFrequency', 'lifetimeValue', 'churnRiskScore', 'createdAt'],
          aggregations: [
            { field: 'id', operation: 'count', alias: 'totalSubscriptions' },
            { field: 'lifetimeValue', operation: 'sum', alias: 'totalRevenue' },
            { field: 'churnRiskScore', operation: 'avg', alias: 'avgChurnRisk' }
          ]
        },
        format: 'excel',
        schedule: null
      },

      'service-performance': {
        id: 'service-performance',
        name: 'Service Performance Report',
        description: 'Service request completion rates, customer satisfaction, and operational metrics',
        category: 'operations',
        parameters: {
          dateRange: { type: 'dateRange', required: true, default: 'last30days' },
          serviceCategory: { type: 'text', required: false },
          urgencyLevel: { type: 'select', options: ['all', 'LOW', 'NORMAL', 'HIGH', 'EMERGENCY'], default: 'all' }
        },
        query: {
          entity: 'serviceRequests',
          fields: ['id', 'category', 'urgency', 'status', 'createdAt', 'updatedAt'],
          aggregations: [
            { field: 'id', operation: 'count', alias: 'totalRequests' },
            { field: 'status', operation: 'count_by_value', alias: 'statusBreakdown' }
          ]
        },
        format: 'pdf',
        schedule: null
      },

      'financial-summary': {
        id: 'financial-summary',
        name: 'Financial Summary Report',
        description: 'Revenue breakdown, payment processing, and financial KPIs',
        category: 'finance',
        parameters: {
          dateRange: { type: 'dateRange', required: true, default: 'last30days' },
          breakdown: { type: 'select', options: ['daily', 'weekly', 'monthly'], default: 'monthly' },
          includeForecasting: { type: 'boolean', default: false }
        },
        query: {
          entity: 'subscriptions',
          fields: ['id', 'tier', 'lifetimeValue', 'nextPaymentAmount', 'createdAt'],
          aggregations: [
            { field: 'lifetimeValue', operation: 'sum', alias: 'totalRevenue' },
            { field: 'nextPaymentAmount', operation: 'sum', alias: 'projectedRevenue' }
          ]
        },
        format: 'excel',
        schedule: null
      },

      'audit-compliance': {
        id: 'audit-compliance',
        name: 'Audit & Compliance Report',
        description: 'System audit logs, security events, and compliance metrics',
        category: 'security',
        parameters: {
          dateRange: { type: 'dateRange', required: true, default: 'last7days' },
          severity: { type: 'select', options: ['all', 'low', 'medium', 'high', 'critical'], default: 'all' },
          actionType: { type: 'text', required: false }
        },
        query: {
          entity: 'auditLogs',
          fields: ['id', 'adminId', 'action', 'entityType', 'severity', 'createdAt'],
          aggregations: [
            { field: 'id', operation: 'count', alias: 'totalActions' },
            { field: 'severity', operation: 'count_by_value', alias: 'severityBreakdown' }
          ]
        },
        format: 'pdf',
        schedule: null
      }
    };
  }

  /**
   * Get all available report templates
   */
  getReportTemplates() {
    return Object.values(this.reportTemplates);
  }

  /**
   * Get specific report template
   */
  getReportTemplate(templateId) {
    return this.reportTemplates[templateId];
  }

  /**
   * Generate report from template
   */
  async generateReport(templateId, parameters, adminId, options = {}) {
    const template = this.getReportTemplate(templateId);
    if (!template) {
      throw new Error(`Report template not found: ${templateId}`);
    }

    reportingLogger.info(`Generating report from template ${templateId}`, { adminId, parameters });

    try {
      // Validate parameters
      this.validateReportParameters(template, parameters);

      // Build query based on template and parameters
      const queryConfig = this.buildQueryFromTemplate(template, parameters);

      // Generate report data
      const reportData = await this.executeReportQuery(queryConfig);

      // Apply post-processing
      const processedData = this.processReportData(reportData, template, parameters);

      // Create export
      const exportResult = await exportService.exportData({
        entity: 'custom',
        format: options.format || template.format,
        fields: [],
        filters: {},
        limit: processedData.length,
        adminId,
        anonymize: options.anonymize || false,
        customData: processedData
      });

      // Log report generation
      await auditService.logAction({
        adminId,
        action: 'REPORT_GENERATED',
        entityType: 'REPORT',
        entityId: templateId,
        changes: {
          templateId,
          parameters,
          recordCount: processedData.length,
          format: options.format || template.format
        },
        metadata: {
          timestamp: new Date().toISOString(),
          reportType: 'template'
        }
      });

      reportingLogger.info(`Report generated successfully`, {
        templateId,
        recordCount: processedData.length,
        fileName: exportResult.fileName
      });

      return {
        success: true,
        templateId,
        templateName: template.name,
        ...exportResult,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      reportingLogger.error(`Report generation failed for template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Schedule report generation
   */
  async scheduleReport(scheduleConfig, adminId) {
    const {
      templateId,
      parameters,
      schedule, // cron expression
      name,
      description,
      deliveryMethod = 'download',
      deliveryConfig = {},
      isActive = true
    } = scheduleConfig;

    // Validate template
    const template = this.getReportTemplate(templateId);
    if (!template) {
      throw new Error(`Report template not found: ${templateId}`);
    }

    // Validate cron expression
    if (!cron.validate(schedule)) {
      throw new Error('Invalid cron schedule expression');
    }

    // Create schedule record (in a real implementation, store in database)
    const scheduleId = `schedule_${Date.now()}`;
    const scheduleRecord = {
      id: scheduleId,
      templateId,
      parameters,
      schedule,
      name: name || `${template.name} - Scheduled`,
      description,
      deliveryMethod,
      deliveryConfig,
      isActive,
      createdBy: adminId,
      createdAt: new Date(),
      lastRun: null,
      nextRun: this.getNextRunTime(schedule)
    };

    // Set up cron job
    if (isActive) {
      const cronJob = cron.schedule(schedule, async () => {
        await this.executeScheduledReport(scheduleId);
      }, {
        scheduled: false,
        timezone: 'UTC'
      });

      this.scheduledJobs.set(scheduleId, {
        cronJob,
        config: scheduleRecord
      });

      cronJob.start();
    }

    // Log schedule creation
    await auditService.logAction({
      adminId,
      action: 'REPORT_SCHEDULED',
      entityType: 'REPORT_SCHEDULE',
      entityId: scheduleId,
      changes: {
        templateId,
        schedule,
        deliveryMethod,
        isActive
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    });

    reportingLogger.info(`Report scheduled successfully`, {
      scheduleId,
      templateId,
      schedule,
      adminId
    });

    return {
      success: true,
      scheduleId,
      schedule: scheduleRecord
    };
  }

  /**
   * Execute scheduled report
   */
  async executeScheduledReport(scheduleId) {
    const scheduledJob = this.scheduledJobs.get(scheduleId);
    if (!scheduledJob) {
      reportingLogger.error(`Scheduled job not found: ${scheduleId}`);
      return;
    }

    const { config } = scheduledJob;
    reportingLogger.info(`Executing scheduled report ${scheduleId}`, { templateId: config.templateId });

    try {
      // Add to export queue for processing
      await queueService.addReportGenerationJob({
        reportType: 'scheduled',
        scheduleId,
        templateId: config.templateId,
        parameters: config.parameters,
        format: config.deliveryConfig.format || 'excel',
        adminId: config.createdBy,
        deliveryMethod: config.deliveryMethod,
        deliveryConfig: config.deliveryConfig
      });

      // Update last run time
      config.lastRun = new Date();
      config.nextRun = this.getNextRunTime(config.schedule);

      reportingLogger.info(`Scheduled report queued successfully`, { scheduleId });

    } catch (error) {
      reportingLogger.error(`Failed to execute scheduled report ${scheduleId}:`, error);
    }
  }

  /**
   * Get scheduled reports
   */
  getScheduledReports() {
    return Array.from(this.scheduledJobs.values()).map(job => job.config);
  }

  /**
   * Update scheduled report
   */
  async updateScheduledReport(scheduleId, updates, adminId) {
    const scheduledJob = this.scheduledJobs.get(scheduleId);
    if (!scheduledJob) {
      throw new Error(`Scheduled report not found: ${scheduleId}`);
    }

    const { cronJob, config } = scheduledJob;

    // Stop current job
    cronJob.stop();

    // Update configuration
    Object.assign(config, updates, { updatedAt: new Date() });

    // Restart job if active and schedule changed
    if (config.isActive && updates.schedule) {
      if (!cron.validate(updates.schedule)) {
        throw new Error('Invalid cron schedule expression');
      }

      const newCronJob = cron.schedule(updates.schedule, async () => {
        await this.executeScheduledReport(scheduleId);
      }, {
        scheduled: true,
        timezone: 'UTC'
      });

      this.scheduledJobs.set(scheduleId, {
        cronJob: newCronJob,
        config
      });
    } else if (config.isActive) {
      cronJob.start();
    }

    // Log update
    await auditService.logAction({
      adminId,
      action: 'REPORT_SCHEDULE_UPDATED',
      entityType: 'REPORT_SCHEDULE',
      entityId: scheduleId,
      changes: updates,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });

    return { success: true, schedule: config };
  }

  /**
   * Delete scheduled report
   */
  async deleteScheduledReport(scheduleId, adminId) {
    const scheduledJob = this.scheduledJobs.get(scheduleId);
    if (!scheduledJob) {
      throw new Error(`Scheduled report not found: ${scheduleId}`);
    }

    // Stop and remove cron job
    scheduledJob.cronJob.stop();
    this.scheduledJobs.delete(scheduleId);

    // Log deletion
    await auditService.logAction({
      adminId,
      action: 'REPORT_SCHEDULE_DELETED',
      entityType: 'REPORT_SCHEDULE',
      entityId: scheduleId,
      changes: { deleted: true },
      metadata: {
        timestamp: new Date().toISOString()
      }
    });

    reportingLogger.info(`Scheduled report deleted`, { scheduleId, adminId });

    return { success: true, message: 'Scheduled report deleted successfully' };
  }

  /**
   * Validate report parameters against template
   */
  validateReportParameters(template, parameters) {
    for (const [paramName, paramConfig] of Object.entries(template.parameters)) {
      const value = parameters[paramName];

      if (paramConfig.required && (value === undefined || value === null)) {
        throw new Error(`Required parameter missing: ${paramName}`);
      }

      if (value !== undefined && paramConfig.type === 'select' && paramConfig.options) {
        if (!paramConfig.options.includes(value)) {
          throw new Error(`Invalid value for parameter ${paramName}: ${value}`);
        }
      }
    }
  }

  /**
   * Build query configuration from template and parameters
   */
  buildQueryFromTemplate(template, parameters) {
    const queryConfig = { ...template.query };

    // Apply parameter-based filters
    const filters = {};

    // Handle date range parameter
    if (parameters.dateRange) {
      const dateRange = this.parseDateRange(parameters.dateRange);
      filters.createdAt_from = dateRange.start;
      filters.createdAt_to = dateRange.end;
    }

    // Handle other parameters
    Object.entries(parameters).forEach(([key, value]) => {
      if (key !== 'dateRange' && value !== 'all' && value !== undefined) {
        // Map parameter to filter field
        const filterField = this.mapParameterToField(template, key);
        if (filterField) {
          filters[filterField] = value;
        }
      }
    });

    queryConfig.filters = filters;
    return queryConfig;
  }

  /**
   * Execute report query
   */
  async executeReportQuery(queryConfig) {
    const { entity, fields, filters, aggregations } = queryConfig;

    // For now, use the export service to fetch data
    // In a real implementation, this would handle aggregations and complex queries
    const data = await exportService.fetchEntityData(entity, fields, filters, 100000);

    return data;
  }

  /**
   * Process report data with aggregations and formatting
   */
  processReportData(data, template, parameters) {
    // Apply any post-processing based on template configuration
    // This is a simplified implementation
    return data.map(record => ({
      ...record,
      reportGeneratedAt: new Date().toISOString(),
      reportTemplate: template.name
    }));
  }

  /**
   * Parse date range parameter
   */
  parseDateRange(dateRange) {
    const now = new Date();
    let start, end;

    switch (dateRange) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'yesterday':
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'last7days':
        end = now;
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30days':
        end = now;
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      default:
        // Assume custom date range format: "YYYY-MM-DD,YYYY-MM-DD"
        if (dateRange.includes(',')) {
          const [startStr, endStr] = dateRange.split(',');
          start = new Date(startStr);
          end = new Date(endStr);
        } else {
          throw new Error(`Invalid date range: ${dateRange}`);
        }
    }

    return { start, end };
  }

  /**
   * Map parameter name to database field
   */
  mapParameterToField(template, parameterName) {
    const fieldMappings = {
      userType: 'role',
      tier: 'tier',
      serviceCategory: 'category',
      urgencyLevel: 'urgency',
      severity: 'severity',
      actionType: 'action'
    };

    return fieldMappings[parameterName];
  }

  /**
   * Get next run time for cron schedule
   */
  getNextRunTime(cronExpression) {
    // Simple implementation - in production, use a proper cron parser
    const now = new Date();
    return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Next day as placeholder
  }

  /**
   * Initialize scheduler
   */
  initializeScheduler() {
    reportingLogger.info('Report scheduler initialized');
    
    // Clean up old export files daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        await exportService.cleanupOldExports(24);
        reportingLogger.info('Daily export cleanup completed');
      } catch (error) {
        reportingLogger.error('Daily export cleanup failed:', error);
      }
    });
  }
}

export const reportingService = new ReportingService();