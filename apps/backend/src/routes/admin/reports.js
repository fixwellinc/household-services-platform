import express from 'express';
import { reportingService } from '../../services/reportingService.js';
import { exportService } from '../../services/exportService.js';
import authMiddleware, { requireRole } from '../../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for report operations
const reportRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 report requests per windowMs
  message: {
    error: 'Too many report requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply authentication and admin role requirement to all routes
router.use(authMiddleware);
router.use(requireRole(['ADMIN']));

/**
 * GET /api/admin/reports/templates
 * Get available report templates
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = reportingService.getReportTemplates();
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Error fetching report templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report templates'
    });
  }
});

/**
 * GET /api/admin/reports/templates/:templateId
 * Get specific report template
 */
router.get('/templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = reportingService.getReportTemplate(templateId);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Report template not found'
      });
    }

    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Error fetching report template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report template'
    });
  }
});

/**
 * POST /api/admin/reports/generate
 * Generate report from template
 */
router.post('/generate', reportRateLimit, async (req, res) => {
  try {
    const {
      templateId,
      parameters = {},
      format,
      anonymize = false
    } = req.body;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'Template ID is required'
      });
    }

    const reportResult = await reportingService.generateReport(
      templateId,
      parameters,
      req.user.id,
      { format, anonymize }
    );

    res.json({
      success: true,
      report: reportResult
    });

  } catch (error) {
    console.error('Report generation error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/reports/schedule
 * Schedule report generation
 */
router.post('/schedule', async (req, res) => {
  try {
    const scheduleConfig = req.body;

    if (!scheduleConfig.templateId || !scheduleConfig.schedule) {
      return res.status(400).json({
        success: false,
        error: 'Template ID and schedule are required'
      });
    }

    const result = await reportingService.scheduleReport(scheduleConfig, req.user.id);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Report scheduling error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/reports/schedules
 * Get scheduled reports
 */
router.get('/schedules', async (req, res) => {
  try {
    const schedules = reportingService.getScheduledReports();
    res.json({
      success: true,
      schedules
    });
  } catch (error) {
    console.error('Error fetching scheduled reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scheduled reports'
    });
  }
});

/**
 * PUT /api/admin/reports/schedules/:scheduleId
 * Update scheduled report
 */
router.put('/schedules/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const updates = req.body;

    const result = await reportingService.updateScheduledReport(
      scheduleId,
      updates,
      req.user.id
    );

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Report schedule update error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/admin/reports/schedules/:scheduleId
 * Delete scheduled report
 */
router.delete('/schedules/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const result = await reportingService.deleteScheduledReport(
      scheduleId,
      req.user.id
    );

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Report schedule deletion error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/reports/preview
 * Preview report data without generating file
 */
router.post('/preview', async (req, res) => {
  try {
    const {
      templateId,
      parameters = {}
    } = req.body;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'Template ID is required'
      });
    }

    const template = reportingService.getReportTemplate(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Report template not found'
      });
    }

    // Validate parameters
    reportingService.validateReportParameters(template, parameters);

    // Build query and get preview data (limited to 10 records)
    const queryConfig = reportingService.buildQueryFromTemplate(template, parameters);
    const previewData = await exportService.fetchEntityData(
      queryConfig.entity,
      queryConfig.fields,
      queryConfig.filters,
      10
    );

    res.json({
      success: true,
      preview: {
        templateName: template.name,
        recordCount: previewData.length,
        data: previewData,
        fields: queryConfig.fields
      }
    });

  } catch (error) {
    console.error('Report preview error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/reports
 * Get all custom reports
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0, createdBy } = req.query;
    
    // Mock reports data - in production, fetch from database
    const mockReports = [
      {
        id: '1',
        name: 'Monthly Service Report',
        description: 'Comprehensive monthly service statistics',
        config: {
          dataSource: 'services',
          filters: [
            { field: 'created_at', operator: 'greater_than', value: '2024-01-01' }
          ],
          columns: [
            { field: 'service_name', label: 'Service', type: 'string' },
            { field: 'count', label: 'Count', type: 'number', aggregation: 'count' }
          ]
        },
        isPublic: true,
        createdBy: req.user.id,
        createdAt: new Date('2024-01-01'),
        lastRun: new Date('2024-01-15')
      }
    ];
    
    let reports = [...mockReports];
    
    // Filter by creator if provided
    if (createdBy) {
      reports = reports.filter(report => report.createdBy === createdBy);
    }
    
    // Apply pagination
    const paginatedReports = reports.slice(
      parseInt(offset), 
      parseInt(offset) + parseInt(limit)
    );
    
    res.json({
      success: true,
      reports: paginatedReports,
      total: reports.length,
      hasMore: parseInt(offset) + parseInt(limit) < reports.length
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports'
    });
  }
});

/**
 * POST /api/admin/reports
 * Create custom report
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, config, isPublic = false } = req.body;
    
    if (!name || !config) {
      return res.status(400).json({
        success: false,
        error: 'Name and config are required'
      });
    }
    
    const newReport = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description?.trim(),
      config,
      isPublic,
      createdBy: req.user.id,
      createdAt: new Date()
    };
    
    // In production, save to database
    
    res.json({
      success: true,
      report: newReport
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create report'
    });
  }
});

/**
 * PUT /api/admin/reports/:reportId
 * Update custom report
 */
router.put('/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const updates = req.body;
    
    // In production, update in database
    const updatedReport = {
      id: reportId,
      ...updates,
      updatedAt: new Date()
    };
    
    res.json({
      success: true,
      report: updatedReport
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update report'
    });
  }
});

/**
 * DELETE /api/admin/reports/:reportId
 * Delete custom report
 */
router.delete('/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    
    // In production, delete from database
    
    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete report'
    });
  }
});

/**
 * POST /api/admin/reports/:reportId/export
 * Export report data
 */
router.post('/:reportId/export', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { format = 'csv' } = req.body;
    
    // In production, generate export file and return URL
    const exportUrl = `/api/admin/reports/${reportId}/download?format=${format}&token=${Date.now()}`;
    
    res.json({
      success: true,
      exportUrl,
      message: 'Export generated successfully'
    });
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export report'
    });
  }
});

/**
 * GET /api/admin/reports/stats
 * Get report statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Mock stats - in production, calculate from database
    const stats = {
      totalReports: 5,
      scheduledReports: 2,
      reportsRunToday: 3,
      averageExecutionTime: 2.5, // seconds
      categories: [
        { name: 'Financial', count: 2 },
        { name: 'Operations', count: 2 },
        { name: 'Customer', count: 1 }
      ]
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching report stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report statistics'
    });
  }
});

/**
 * GET /api/admin/reports/categories
 * Get report categories and statistics
 */
router.get('/categories', async (req, res) => {
  try {
    const templates = reportingService.getReportTemplates();
    const schedules = reportingService.getScheduledReports();

    // Group templates by category
    const categories = {};
    templates.forEach(template => {
      if (!categories[template.category]) {
        categories[template.category] = {
          name: template.category,
          templates: [],
          count: 0
        };
      }
      categories[template.category].templates.push(template);
      categories[template.category].count++;
    });

    // Add schedule statistics
    const scheduleStats = {
      total: schedules.length,
      active: schedules.filter(s => s.isActive).length,
      inactive: schedules.filter(s => !s.isActive).length
    };

    res.json({
      success: true,
      categories: Object.values(categories),
      scheduleStats,
      totalTemplates: templates.length
    });

  } catch (error) {
    console.error('Error fetching report categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report categories'
    });
  }
});

/**
 * POST /api/admin/reports/validate-schedule
 * Validate cron schedule expression
 */
router.post('/validate-schedule', async (req, res) => {
  try {
    const { schedule } = req.body;

    if (!schedule) {
      return res.status(400).json({
        success: false,
        error: 'Schedule expression is required'
      });
    }

    const cron = await import('node-cron');
    const isValid = cron.validate(schedule);

    if (isValid) {
      // Get next few run times for preview
      const nextRuns = [];
      // This is a simplified implementation
      // In production, use a proper cron parser to get actual next run times
      for (let i = 1; i <= 5; i++) {
        nextRuns.push(new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString());
      }

      res.json({
        success: true,
        valid: true,
        nextRuns
      });
    } else {
      res.json({
        success: true,
        valid: false,
        error: 'Invalid cron expression'
      });
    }

  } catch (error) {
    console.error('Schedule validation error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to validate schedule'
    });
  }
});

export default router;