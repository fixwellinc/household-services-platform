import express from 'express';
import { exportService } from '../../services/exportService.js';
import { exportJobProcessor } from '../../services/exportJobProcessor.js';
import { exportSecurityService } from '../../services/exportSecurityService.js';
import queueService from '../../services/queueService.js';
import authMiddleware, { requireRole } from '../../middleware/auth.js';
import { rateLimit } from 'express-rate-limit';
import path from 'path';

const router = express.Router();

// Rate limiting for export operations
const exportRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 export requests per windowMs
  message: {
    error: 'Too many export requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply authentication and admin role requirement to all routes
router.use(authMiddleware);
router.use(requireRole(['ADMIN']));

/**
 * GET /api/admin/exports/entities
 * Get available export entities and their fields
 */
router.get('/entities', async (req, res) => {
  try {
    const entities = exportService.getAvailableExports();
    res.json({
      success: true,
      entities
    });
  } catch (error) {
    console.error('Error fetching export entities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch export entities'
    });
  }
});

/**
 * POST /api/admin/exports/create
 * Create a new data export (synchronous)
 */
router.post('/create', exportRateLimit, async (req, res) => {
  try {
    const {
      entity,
      format,
      fields = [],
      filters = {},
      limit = 10000,
      anonymize = false
    } = req.body;

    // Validate required fields
    if (!entity || !format) {
      return res.status(400).json({
        success: false,
        error: 'Entity and format are required'
      });
    }

    // Validate limit for synchronous exports
    if (limit > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Synchronous export limit cannot exceed 10,000 records. Use async export for larger datasets.'
      });
    }

    const requestMetadata = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };

    const exportResult = await exportService.exportData({
      entity,
      format: format.toLowerCase(),
      fields,
      filters,
      limit,
      adminId: req.user.id,
      anonymize
    }, requestMetadata);

    res.json({
      success: true,
      export: exportResult
    });

  } catch (error) {
    console.error('Export creation error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/exports/create-async
 * Create a new data export (asynchronous)
 */
router.post('/create-async', exportRateLimit, async (req, res) => {
  try {
    const {
      entity,
      format,
      fields = [],
      filters = {},
      limit = 50000,
      anonymize = false
    } = req.body;

    // Validate required fields
    if (!entity || !format) {
      return res.status(400).json({
        success: false,
        error: 'Entity and format are required'
      });
    }

    // Validate limit for async exports
    if (limit > 100000) {
      return res.status(400).json({
        success: false,
        error: 'Export limit cannot exceed 100,000 records'
      });
    }

    const requestMetadata = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };

    // Security validation for async exports
    const securityValidation = await exportSecurityService.validateExportRequest(
      req.user.id,
      { entity, fields, limit, anonymize },
      requestMetadata
    );

    if (!securityValidation.approved) {
      return res.status(403).json({
        success: false,
        error: 'Export request denied by security validation'
      });
    }

    // Add job to export queue
    const job = await queueService.addDataExportJob({
      entity,
      format: format.toLowerCase(),
      fields,
      filters,
      limit,
      adminId: req.user.id,
      anonymize,
      requestMetadata
    });

    res.json({
      success: true,
      jobId: job.id,
      message: 'Export job queued successfully',
      estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes estimate
    });

  } catch (error) {
    console.error('Async export creation error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/exports/download/:fileName
 * Download an export file
 */
router.get('/download/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    
    // Validate file name to prevent directory traversal
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file name'
      });
    }

    const filePath = await exportService.getExportFile(fileName);
    const fileExtension = path.extname(fileName).toLowerCase();
    
    // Set appropriate content type
    let contentType = 'application/octet-stream';
    switch (fileExtension) {
      case '.csv':
        contentType = 'text/csv';
        break;
      case '.xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case '.json':
        contentType = 'application/json';
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.sendFile(filePath);

  } catch (error) {
    console.error('Export download error:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/exports/preview
 * Preview export data without creating a file
 */
router.post('/preview', async (req, res) => {
  try {
    const {
      entity,
      fields = [],
      filters = {},
      limit = 10
    } = req.body;

    if (!entity) {
      return res.status(400).json({
        success: false,
        error: 'Entity is required'
      });
    }

    // Use a small limit for preview
    const previewLimit = Math.min(limit, 10);

    const exportResult = await exportService.exportData({
      entity,
      format: 'json', // Always use JSON for preview
      fields,
      filters,
      limit: previewLimit,
      adminId: req.user.id,
      anonymize: false
    });

    // Read the generated file and return its content
    const filePath = await exportService.getExportFile(exportResult.fileName);
    const fs = await import('fs/promises');
    const fileContent = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(fileContent);

    // Clean up the preview file
    await fs.unlink(filePath);

    res.json({
      success: true,
      preview: {
        recordCount: jsonData.recordCount,
        data: jsonData.data,
        fields: exportResult.fields
      }
    });

  } catch (error) {
    console.error('Export preview error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/exports/validate
 * Validate export parameters without executing
 */
router.post('/validate', async (req, res) => {
  try {
    const {
      entity,
      format,
      fields = [],
      filters = {}
    } = req.body;

    // Validate the export options
    exportService.validateExportOptions({
      entity,
      format,
      fields,
      filters
    });

    // Get estimated record count
    const testResult = await exportService.exportData({
      entity,
      format: 'json',
      fields: ['id'], // Only fetch ID for count
      filters,
      limit: 1,
      adminId: req.user.id,
      anonymize: false
    });

    // Clean up the test file
    const fs = await import('fs/promises');
    await fs.unlink(await exportService.getExportFile(testResult.fileName));

    // Get actual count by running query without limit
    const actualCount = await exportService.fetchEntityData(entity, ['id'], filters, 100000);

    res.json({
      success: true,
      validation: {
        valid: true,
        estimatedRecords: actualCount.length,
        entity,
        format,
        fields: fields.length > 0 ? fields : Object.keys(exportService.getAvailableExports()[entity].fields)
      }
    });

  } catch (error) {
    console.error('Export validation error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      validation: {
        valid: false
      }
    });
  }
});

/**
 * GET /api/admin/exports/jobs/:jobId
 * Get export job status
 */
router.get('/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const jobStatus = await exportJobProcessor.getJobStatus(jobId);

    res.json({
      success: true,
      job: jobStatus
    });

  } catch (error) {
    console.error('Job status error:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/admin/exports/jobs/:jobId
 * Cancel export job
 */
router.delete('/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const result = await exportJobProcessor.cancelJob(jobId);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Job cancellation error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/exports/jobs
 * Get export job history
 */
router.get('/jobs', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    // Get export queue stats
    const queueStats = await queueService.getQueueStats('exports');
    
    // Filter jobs by status if specified
    let jobs = [];
    if (status) {
      switch (status) {
        case 'waiting':
          jobs = queueStats.jobs.waiting || [];
          break;
        case 'active':
          jobs = queueStats.jobs.active || [];
          break;
        case 'failed':
          jobs = queueStats.jobs.failed || [];
          break;
        default:
          jobs = [...(queueStats.jobs.waiting || []), ...(queueStats.jobs.active || []), ...(queueStats.jobs.failed || [])];
      }
    } else {
      jobs = [...(queueStats.jobs.waiting || []), ...(queueStats.jobs.active || []), ...(queueStats.jobs.failed || [])];
    }

    // Paginate results
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedJobs = jobs.slice(startIndex, endIndex);

    res.json({
      success: true,
      jobs: paginatedJobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: jobs.length,
        pages: Math.ceil(jobs.length / parseInt(limit))
      },
      queueStats: queueStats.counts
    });

  } catch (error) {
    console.error('Job history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job history'
    });
  }
});

/**
 * GET /api/admin/exports/security/stats
 * Get export security statistics
 */
router.get('/security/stats', async (req, res) => {
  try {
    const stats = exportSecurityService.getSecurityStatistics();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Security stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security statistics'
    });
  }
});

/**
 * POST /api/admin/exports/security/validate
 * Validate export request for security compliance
 */
router.post('/security/validate', async (req, res) => {
  try {
    const {
      entity,
      fields = [],
      limit = 10000,
      anonymize = false
    } = req.body;

    const requestMetadata = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };

    const validation = await exportSecurityService.validateExportRequest(
      req.user.id,
      { entity, fields, limit, anonymize },
      requestMetadata
    );

    res.json({
      success: true,
      validation
    });

  } catch (error) {
    console.error('Security validation error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      validation: {
        approved: false,
        reason: error.message
      }
    });
  }
});

/**
 * POST /api/admin/exports/anonymize-preview
 * Preview anonymized data
 */
router.post('/anonymize-preview', async (req, res) => {
  try {
    const {
      entity,
      fields = [],
      filters = {},
      limit = 5
    } = req.body;

    if (!entity) {
      return res.status(400).json({
        success: false,
        error: 'Entity is required'
      });
    }

    // Get sample data
    const sampleData = await exportService.fetchEntityData(entity, fields, filters, limit);
    
    // Apply anonymization
    const anonymizedData = exportSecurityService.anonymizeExportData(sampleData, entity, fields);

    res.json({
      success: true,
      preview: {
        original: sampleData,
        anonymized: anonymizedData,
        sensitiveFields: exportSecurityService.identifySensitiveFields(entity, fields)
      }
    });

  } catch (error) {
    console.error('Anonymization preview error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;