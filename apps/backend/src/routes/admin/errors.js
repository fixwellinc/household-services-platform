import express from 'express';
import { authMiddleware, requireAdmin } from '../../middleware/auth.js';
import { auditPresets } from '../../middleware/auditMiddleware.js';
import { auditService } from '../../services/auditService.js';

const router = express.Router();

// Apply admin role check
router.use(authMiddleware);
router.use(requireAdmin);

/**
 * POST /api/admin/errors
 * Report client-side errors for monitoring and debugging
 */
router.post('/', async (req, res) => {
  try {
    const {
      errorId,
      message,
      stack,
      componentStack,
      context,
      timestamp,
      userAgent,
      url
    } = req.body;

    // Validate required fields
    if (!errorId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: errorId and message'
      });
    }

    // Log error details
    console.error('Client Error Report:', {
      errorId,
      message,
      stack,
      componentStack,
      context,
      timestamp,
      userAgent,
      url,
      adminId: req.user.id,
      adminEmail: req.user.email
    });

    // Store error in database (you can implement this based on your database setup)
    const errorReport = {
      id: errorId,
      message,
      stack,
      componentStack,
      context: context || 'Unknown',
      timestamp: timestamp || new Date().toISOString(),
      userAgent,
      url,
      adminId: req.user.id,
      adminEmail: req.user.email,
      severity: determineSeverity(message, stack),
      status: 'new',
      createdAt: new Date()
    };

    // TODO: Save to database
    // await errorReportService.create(errorReport);

    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'error_report',
      entityType: 'error',
      entityId: errorId,
      changes: {
        context,
        severity: errorReport.severity
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'medium'
    });

    res.json({
      success: true,
      message: 'Error report received',
      errorId
    });

  } catch (error) {
    console.error('Error processing error report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process error report'
    });
  }
});

/**
 * GET /api/admin/errors
 * Get error reports with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      severity,
      context,
      status = 'new',
      startDate,
      endDate
    } = req.query;

    // TODO: Implement database query
    // const errors = await errorReportService.find({
    //   page: parseInt(page),
    //   limit: parseInt(limit),
    //   severity,
    //   context,
    //   status,
    //   startDate,
    //   endDate
    // });

    // Mock response for now
    const errors = {
      reports: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount: 0,
        totalPages: 0
      }
    };

    res.json({
      success: true,
      ...errors
    });

  } catch (error) {
    console.error('Error fetching error reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch error reports'
    });
  }
});

/**
 * PUT /api/admin/errors/:errorId/status
 * Update error report status
 */
router.put('/:errorId/status', async (req, res) => {
  try {
    const { errorId } = req.params;
    const { status, notes } = req.body;

    if (!status || !['new', 'investigating', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: new, investigating, resolved, dismissed'
      });
    }

    // TODO: Update error report in database
    // await errorReportService.updateStatus(errorId, status, notes, req.user.id);

    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'error_status_update',
      entityType: 'error',
      entityId: errorId,
      changes: {
        status: { from: 'unknown', to: status },
        notes
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'low'
    });

    res.json({
      success: true,
      message: 'Error status updated'
    });

  } catch (error) {
    console.error('Error updating error status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update error status'
    });
  }
});

/**
 * Helper function to determine error severity
 */
function determineSeverity(message, stack) {
  const criticalKeywords = ['security', 'authentication', 'authorization', 'database', 'payment'];
  const highKeywords = ['api', 'network', 'timeout', 'connection'];
  const mediumKeywords = ['validation', 'format', 'parsing'];
  
  const errorText = (message + ' ' + (stack || '')).toLowerCase();
  
  if (criticalKeywords.some(keyword => errorText.includes(keyword))) {
    return 'critical';
  } else if (highKeywords.some(keyword => errorText.includes(keyword))) {
    return 'high';
  } else if (mediumKeywords.some(keyword => errorText.includes(keyword))) {
    return 'medium';
  } else {
    return 'low';
  }
}

export default router;
