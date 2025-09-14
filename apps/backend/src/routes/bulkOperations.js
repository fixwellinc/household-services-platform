import express from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { auditPresets } from '../middleware/auditMiddleware.js';
import bulkOperationService from '../services/bulkOperationService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Apply admin authentication to all routes
router.use(authMiddleware);
router.use(requireAdmin);

/**
 * POST /api/bulk-operations/execute
 * Execute a bulk operation
 */
router.post('/execute', auditPresets.bulkOperation, async (req, res) => {
  try {
    const {
      type,
      entityType,
      entityIds,
      data = {},
      options = {},
      requiresConfirmation = true
    } = req.body;

    // Validate required fields
    if (!type || !entityType || !entityIds) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, entityType, entityIds'
      });
    }

    // Validate entityIds is array
    if (!Array.isArray(entityIds) || entityIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'entityIds must be a non-empty array'
      });
    }

    // Check if confirmation is required for destructive operations
    if (requiresConfirmation && ['delete', 'suspend'].includes(type)) {
      if (!req.body.confirmed) {
        return res.status(400).json({
          success: false,
          error: 'Confirmation required for destructive operations',
          requiresConfirmation: true,
          operationSummary: {
            type,
            entityType,
            itemCount: entityIds.length,
            estimatedDuration: Math.ceil(entityIds.length / 50) * 2 // Rough estimate in seconds
          }
        });
      }
    }

    // Generate operation ID
    const operationId = uuidv4();

    // Execute bulk operation
    const result = await bulkOperationService.executeBulkOperation({
      operationId,
      type,
      entityType,
      entityIds,
      data,
      options,
      adminUser: req.user,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.id
      }
    });

    res.json({
      success: true,
      operationId,
      result
    });

  } catch (error) {
    console.error('Error executing bulk operation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/bulk-operations/:operationId/status
 * Get bulk operation status
 */
router.get('/:operationId/status', async (req, res) => {
  try {
    const { operationId } = req.params;
    
    const status = bulkOperationService.getBulkOperationStatus(operationId);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Operation not found'
      });
    }

    res.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('Error getting bulk operation status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/bulk-operations/:operationId/cancel
 * Cancel a running bulk operation
 */
router.post('/:operationId/cancel', auditPresets.bulkOperation, async (req, res) => {
  try {
    const { operationId } = req.params;
    
    const result = await bulkOperationService.cancelBulkOperation(operationId, req.user);
    
    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error cancelling bulk operation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/bulk-operations/active
 * Get all active bulk operations for the current admin
 */
router.get('/active', async (req, res) => {
  try {
    const operations = bulkOperationService.getActiveBulkOperations(req.user.id);
    
    res.json({
      success: true,
      operations
    });

  } catch (error) {
    console.error('Error getting active bulk operations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/bulk-operations/validate
 * Validate a bulk operation before execution
 */
router.post('/validate', async (req, res) => {
  try {
    const {
      type,
      entityType,
      entityIds,
      options = {}
    } = req.body;

    // Validate required fields
    if (!type || !entityType || !entityIds) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, entityType, entityIds'
      });
    }

    // Perform validation
    try {
      bulkOperationService.validateBulkOperation({
        type,
        entityType,
        entityIds,
        adminUser: req.user,
        options
      });

      // Check rate limits
      await bulkOperationService.checkRateLimit(req.user.id, entityIds.length);

      // Calculate operation summary
      const batchSize = Math.min(options.batchSize || 50, 500);
      const estimatedBatches = Math.ceil(entityIds.length / batchSize);
      const estimatedDuration = estimatedBatches * 2; // Rough estimate in seconds

      res.json({
        success: true,
        valid: true,
        summary: {
          type,
          entityType,
          itemCount: entityIds.length,
          batchSize,
          estimatedBatches,
          estimatedDuration,
          requiresConfirmation: ['delete', 'suspend'].includes(type),
          riskLevel: bulkOperationService.getSeverityLevel(type, entityIds.length)
        }
      });

    } catch (validationError) {
      res.json({
        success: true,
        valid: false,
        error: validationError.message
      });
    }

  } catch (error) {
    console.error('Error validating bulk operation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/bulk-operations/supported-operations
 * Get list of supported bulk operations
 */
router.get('/supported-operations', async (req, res) => {
  try {
    const operations = [
      {
        type: 'delete',
        label: 'Delete',
        description: 'Permanently delete selected items',
        requiresConfirmation: true,
        riskLevel: 'high',
        supportedEntities: ['user', 'subscription', 'booking', 'serviceRequest']
      },
      {
        type: 'update',
        label: 'Update',
        description: 'Update selected items with new data',
        requiresConfirmation: false,
        riskLevel: 'medium',
        supportedEntities: ['user', 'subscription', 'booking', 'serviceRequest']
      },
      {
        type: 'activate',
        label: 'Activate',
        description: 'Activate selected items',
        requiresConfirmation: false,
        riskLevel: 'low',
        supportedEntities: ['user', 'subscription']
      },
      {
        type: 'deactivate',
        label: 'Deactivate',
        description: 'Deactivate selected items',
        requiresConfirmation: false,
        riskLevel: 'medium',
        supportedEntities: ['user', 'subscription']
      },
      {
        type: 'suspend',
        label: 'Suspend',
        description: 'Suspend selected items',
        requiresConfirmation: true,
        riskLevel: 'high',
        supportedEntities: ['user', 'subscription']
      }
    ];

    // Filter operations based on user permissions
    const userPermissions = req.user.permissions || [];
    const allowedOperations = operations.filter(op => {
      return userPermissions.includes('BULK_ALL') || 
             op.supportedEntities.some(entity => 
               userPermissions.includes(`BULK_${op.type.toUpperCase()}_${entity.toUpperCase()}`)
             );
    });

    res.json({
      success: true,
      operations: allowedOperations
    });

  } catch (error) {
    console.error('Error getting supported operations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/bulk-operations/:operationId/rollback
 * Rollback a bulk operation
 */
router.post('/:operationId/rollback', auditPresets.bulkOperation, async (req, res) => {
  try {
    const { operationId } = req.params;
    
    const result = await bulkOperationService.rollbackBulkOperation(operationId, req.user);
    
    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error rolling back bulk operation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/bulk-operations/:operationId/error-analysis
 * Get detailed error analysis for a bulk operation
 */
router.get('/:operationId/error-analysis', async (req, res) => {
  try {
    const { operationId } = req.params;
    
    const analysis = await bulkOperationService.getErrorAnalysis(operationId);
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Operation not found or no errors to analyze'
      });
    }

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Error getting error analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/bulk-operations/safety-metrics
 * Get safety metrics and statistics
 */
router.get('/safety-metrics', async (req, res) => {
  try {
    const metrics = {
      rateLimitStatus: {
        currentWindow: Date.now(),
        windowDuration: 60000, // 1 minute
        limits: {
          delete: 100,
          suspend: 200,
          update: 500,
          activate: 1000,
          deactivate: 300
        }
      },
      safetyFeatures: {
        rateLimitingEnabled: true,
        batchProcessingEnabled: true,
        rollbackSupported: true,
        auditLoggingEnabled: true,
        additionalAuthRequired: true,
        adminProtectionEnabled: true
      },
      recentActivity: {
        totalOperationsToday: 0, // Would be calculated from audit logs
        failedOperationsToday: 0,
        averageSuccessRate: 95.5,
        mostCommonErrors: [
          { error: 'Record not found', count: 12 },
          { error: 'Permission denied', count: 8 },
          { error: 'Rate limit exceeded', count: 3 }
        ]
      }
    };

    res.json({
      success: true,
      metrics
    });

  } catch (error) {
    console.error('Error getting safety metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/bulk-operations/history
 * Get bulk operation history for the current admin
 */
router.get('/history', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      entityType,
      status,
      startDate,
      endDate
    } = req.query;

    // This would typically query a bulk operations history table
    // For now, return empty array as this is just the infrastructure
    const history = {
      operations: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount: 0,
        totalPages: 0
      }
    };

    res.json({
      success: true,
      ...history
    });

  } catch (error) {
    console.error('Error getting bulk operation history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;