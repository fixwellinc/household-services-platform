import { exportService } from './exportService.js';
import { auditService } from './auditService.js';
import queueService from './queueService.js';
import winston from 'winston';

// Configure export job logger
const exportLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'export-processor' },
  transports: [
    new winston.transports.File({ filename: 'logs/export.log' }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  exportLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

class ExportJobProcessor {
  constructor() {
    this.setupProcessors();
  }

  setupProcessors() {
    const exportQueue = queueService.getQueue('exports');
    if (!exportQueue) {
      exportLogger.warn('Export queue not available - processors not set up');
      return;
    }

    // Process data export jobs
    exportQueue.process('data-export', 5, this.processDataExport.bind(this));
    
    // Process report generation jobs
    exportQueue.process('report-generation', 3, this.processReportGeneration.bind(this));
    
    // Process scheduled export jobs
    exportQueue.process('scheduled-export', 2, this.processScheduledExport.bind(this));

    exportLogger.info('Export job processors set up successfully');
  }

  /**
   * Process data export jobs
   */
  async processDataExport(job) {
    const { 
      entity, 
      format, 
      fields, 
      filters, 
      limit, 
      adminId, 
      anonymize,
      jobId 
    } = job.data;

    exportLogger.info(`Processing data export job ${job.id}`, { entity, format, adminId });

    try {
      // Update job progress
      await job.progress(10);

      // Validate export parameters
      exportService.validateExportOptions({
        entity,
        format,
        fields,
        filters
      });

      await job.progress(20);

      // Perform the export
      const exportResult = await exportService.exportData({
        entity,
        format,
        fields,
        filters,
        limit,
        adminId,
        anonymize
      });

      await job.progress(90);

      // Log successful export
      exportLogger.info(`Data export completed for job ${job.id}`, {
        entity,
        format,
        recordCount: exportResult.recordCount,
        fileName: exportResult.fileName
      });

      await job.progress(100);

      return {
        success: true,
        ...exportResult,
        jobId: job.id,
        completedAt: new Date().toISOString()
      };

    } catch (error) {
      exportLogger.error(`Data export failed for job ${job.id}:`, error);
      
      // Log failed export attempt
      if (adminId) {
        try {
          await auditService.logAction({
            adminId,
            action: 'DATA_EXPORT_FAILED',
            entityType: 'EXPORT',
            entityId: `${entity}_${format}`,
            changes: {
              entity,
              format,
              fields: fields.length > 0 ? fields : 'all',
              error: error.message,
              jobId: job.id
            },
            metadata: {
              timestamp: new Date().toISOString(),
              exportType: 'async'
            }
          });
        } catch (auditError) {
          exportLogger.error('Failed to log export failure:', auditError);
        }
      }

      throw error;
    }
  }

  /**
   * Process report generation jobs
   */
  async processReportGeneration(job) {
    const { 
      reportType, 
      parameters, 
      format, 
      adminId,
      scheduledBy 
    } = job.data;

    exportLogger.info(`Processing report generation job ${job.id}`, { reportType, format, adminId });

    try {
      await job.progress(10);

      // Generate report based on type
      const reportData = await this.generateReport(reportType, parameters);
      
      await job.progress(50);

      // Export the report data
      const exportResult = await exportService.exportData({
        entity: 'custom',
        format,
        fields: [],
        filters: {},
        limit: reportData.length,
        adminId,
        anonymize: false,
        customData: reportData
      });

      await job.progress(90);

      exportLogger.info(`Report generation completed for job ${job.id}`, {
        reportType,
        format,
        recordCount: reportData.length,
        fileName: exportResult.fileName
      });

      await job.progress(100);

      return {
        success: true,
        reportType,
        ...exportResult,
        jobId: job.id,
        completedAt: new Date().toISOString()
      };

    } catch (error) {
      exportLogger.error(`Report generation failed for job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Process scheduled export jobs
   */
  async processScheduledExport(job) {
    const { 
      scheduleId,
      exportConfig,
      adminId 
    } = job.data;

    exportLogger.info(`Processing scheduled export job ${job.id}`, { scheduleId, adminId });

    try {
      await job.progress(10);

      // Execute the scheduled export
      const exportResult = await exportService.exportData({
        ...exportConfig,
        adminId
      });

      await job.progress(80);

      // Handle delivery (email, etc.)
      if (exportConfig.deliveryMethod === 'email') {
        await this.deliverExportByEmail(exportResult, exportConfig.deliveryConfig);
      }

      await job.progress(100);

      exportLogger.info(`Scheduled export completed for job ${job.id}`, {
        scheduleId,
        fileName: exportResult.fileName,
        recordCount: exportResult.recordCount
      });

      return {
        success: true,
        scheduleId,
        ...exportResult,
        jobId: job.id,
        completedAt: new Date().toISOString()
      };

    } catch (error) {
      exportLogger.error(`Scheduled export failed for job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Generate report data based on report type
   */
  async generateReport(reportType, parameters) {
    switch (reportType) {
      case 'user-activity':
        return await this.generateUserActivityReport(parameters);
      
      case 'subscription-analytics':
        return await this.generateSubscriptionAnalyticsReport(parameters);
      
      case 'revenue-summary':
        return await this.generateRevenueSummaryReport(parameters);
      
      case 'service-performance':
        return await this.generateServicePerformanceReport(parameters);
      
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  /**
   * Generate user activity report
   */
  async generateUserActivityReport(parameters) {
    const { startDate, endDate, userType } = parameters;
    
    // Mock implementation - replace with actual data aggregation
    return [
      {
        date: startDate,
        activeUsers: 150,
        newRegistrations: 25,
        userType: userType || 'all'
      }
    ];
  }

  /**
   * Generate subscription analytics report
   */
  async generateSubscriptionAnalyticsReport(parameters) {
    const { startDate, endDate, tier } = parameters;
    
    // Mock implementation - replace with actual data aggregation
    return [
      {
        date: startDate,
        tier: tier || 'all',
        activeSubscriptions: 500,
        newSubscriptions: 45,
        churnedSubscriptions: 12,
        revenue: 25000
      }
    ];
  }

  /**
   * Generate revenue summary report
   */
  async generateRevenueSummaryReport(parameters) {
    const { startDate, endDate, breakdown } = parameters;
    
    // Mock implementation - replace with actual data aggregation
    return [
      {
        date: startDate,
        totalRevenue: 50000,
        subscriptionRevenue: 40000,
        serviceRevenue: 10000,
        breakdown: breakdown || 'daily'
      }
    ];
  }

  /**
   * Generate service performance report
   */
  async generateServicePerformanceReport(parameters) {
    const { startDate, endDate, serviceType } = parameters;
    
    // Mock implementation - replace with actual data aggregation
    return [
      {
        date: startDate,
        serviceType: serviceType || 'all',
        totalRequests: 200,
        completedRequests: 180,
        averageRating: 4.5,
        averageCompletionTime: 2.5
      }
    ];
  }

  /**
   * Deliver export by email
   */
  async deliverExportByEmail(exportResult, deliveryConfig) {
    const { recipients, subject, message } = deliveryConfig;
    
    try {
      // Add email job to queue
      await queueService.addEmailJob('export-delivery', {
        to: recipients,
        subject: subject || `Export Ready: ${exportResult.fileName}`,
        text: message || `Your requested export is ready for download.`,
        attachments: [{
          filename: exportResult.fileName,
          path: exportResult.filePath
        }]
      });

      exportLogger.info(`Export delivery email queued`, {
        fileName: exportResult.fileName,
        recipients: recipients.length
      });

    } catch (error) {
      exportLogger.error('Failed to queue export delivery email:', error);
      throw error;
    }
  }

  /**
   * Get export job status
   */
  async getJobStatus(jobId) {
    const exportQueue = queueService.getQueue('exports');
    if (!exportQueue) {
      throw new Error('Export queue not available');
    }

    const job = await exportQueue.getJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    return {
      id: job.id,
      data: job.data,
      progress: job.progress(),
      state: await job.getState(),
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : null,
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
      failedReason: job.failedReason,
      returnValue: job.returnvalue
    };
  }

  /**
   * Cancel export job
   */
  async cancelJob(jobId) {
    const exportQueue = queueService.getQueue('exports');
    if (!exportQueue) {
      throw new Error('Export queue not available');
    }

    const job = await exportQueue.getJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    const state = await job.getState();
    if (state === 'completed' || state === 'failed') {
      throw new Error(`Cannot cancel job in ${state} state`);
    }

    await job.remove();
    exportLogger.info(`Export job ${jobId} cancelled`);

    return { success: true, message: 'Job cancelled successfully' };
  }
}

export const exportJobProcessor = new ExportJobProcessor();