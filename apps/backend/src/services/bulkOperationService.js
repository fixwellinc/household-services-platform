import { PrismaClient } from '@prisma/client';
import auditService from './auditService.js';
import queueService from './queueService.js';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * Bulk Operation Service
 * Handles bulk operations with safety controls, progress tracking, and audit logging
 */
class BulkOperationService {
  constructor() {
    this.activeOperations = new Map();
    this.rateLimits = new Map();
    this.RATE_LIMIT_WINDOW = 60000; // 1 minute
    this.DEFAULT_BATCH_SIZE = 50;
    this.MAX_BATCH_SIZE = 500;
  }

  /**
   * Execute a bulk operation with safety controls
   * @param {Object} params - Operation parameters
   * @param {string} params.operationId - Unique operation identifier
   * @param {string} params.type - Operation type (delete, update, etc.)
   * @param {string} params.entityType - Entity type being operated on
   * @param {Array} params.entityIds - Array of entity IDs
   * @param {Object} params.data - Data for update operations
   * @param {Object} params.options - Operation options
   * @param {Object} params.adminUser - Admin user performing the operation
   * @param {Object} params.metadata - Additional metadata
   * @returns {Promise<Object>} Operation result
   */
  async executeBulkOperation({
    operationId,
    type,
    entityType,
    entityIds,
    data = {},
    options = {},
    adminUser,
    metadata = {}
  }) {
    try {
      // Validate operation
      this.validateBulkOperation({ type, entityType, entityIds, adminUser, options });

      // Check rate limits with operation type
      await this.checkRateLimit(adminUser.id, entityIds.length, type);

      // Initialize operation tracking
      const operation = {
        id: operationId,
        type,
        entityType,
        totalItems: entityIds.length,
        processedItems: 0,
        failedItems: 0,
        errors: [],
        status: 'running',
        startTime: new Date(),
        adminUser,
        metadata,
        cancelled: false
      };

      this.activeOperations.set(operationId, operation);

      // Log operation start
      await auditService.logAction({
        adminId: adminUser.id,
        action: `BULK_${type.toUpperCase()}_START`,
        entityType,
        entityId: `bulk-${operationId}`,
        changes: {
          operationType: type,
          entityCount: entityIds.length,
          batchSize: options.batchSize || this.DEFAULT_BATCH_SIZE
        },
        metadata: {
          ...metadata,
          operationId,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent
        },
        severity: this.getSeverityLevel(type, entityIds.length)
      });

      // Process in batches
      const batchSize = Math.min(options.batchSize || this.DEFAULT_BATCH_SIZE, this.MAX_BATCH_SIZE);
      const batches = this.createBatches(entityIds, batchSize);
      
      let totalProcessed = 0;
      let totalFailed = 0;
      const allErrors = [];

      for (let i = 0; i < batches.length; i++) {
        // Check if operation was cancelled
        if (operation.cancelled) {
          break;
        }

        const batch = batches[i];
        const batchResult = await this.processBatch({
          operationId,
          type,
          entityType,
          entityIds: batch,
          data,
          options,
          batchIndex: i,
          totalBatches: batches.length
        });

        totalProcessed += batchResult.processed;
        totalFailed += batchResult.failed;
        allErrors.push(...batchResult.errors);

        // Update operation progress
        operation.processedItems = totalProcessed + totalFailed;
        operation.failedItems = totalFailed;
        operation.errors = allErrors;

        // Emit progress update
        this.emitProgressUpdate(operationId, {
          processed: totalProcessed,
          failed: totalFailed,
          total: entityIds.length,
          currentBatch: i + 1,
          totalBatches: batches.length,
          errors: allErrors
        });

        // Add delay between batches to prevent system overload
        if (i < batches.length - 1) {
          await this.delay(options.batchDelay || 100);
        }
      }

      // Finalize operation
      operation.status = operation.cancelled ? 'cancelled' : 'completed';
      operation.endTime = new Date();
      operation.duration = operation.endTime - operation.startTime;

      const result = {
        operationId,
        success: !operation.cancelled && totalFailed < entityIds.length,
        processed: totalProcessed,
        failed: totalFailed,
        total: entityIds.length,
        errors: allErrors,
        duration: operation.duration,
        status: operation.status
      };

      // Log operation completion
      await auditService.logAction({
        adminId: adminUser.id,
        action: `BULK_${type.toUpperCase()}_${operation.status.toUpperCase()}`,
        entityType,
        entityId: `bulk-${operationId}`,
        changes: {
          result,
          duration: operation.duration
        },
        metadata: {
          ...metadata,
          operationId
        },
        severity: this.getSeverityLevel(type, totalFailed)
      });

      // Clean up operation tracking after delay
      setTimeout(() => {
        this.activeOperations.delete(operationId);
      }, 300000); // Keep for 5 minutes

      return result;

    } catch (error) {
      // Handle operation error
      const operation = this.activeOperations.get(operationId);
      if (operation) {
        operation.status = 'error';
        operation.error = error.message;
      }

      await auditService.logAction({
        adminId: adminUser.id,
        action: `BULK_${type.toUpperCase()}_ERROR`,
        entityType,
        entityId: `bulk-${operationId}`,
        changes: {
          error: error.message,
          stack: error.stack
        },
        metadata: {
          ...metadata,
          operationId
        },
        severity: 'high'
      });

      throw error;
    }
  }

  /**
   * Process a single batch of entities
   */
  async processBatch({ operationId, type, entityType, entityIds, data, options, batchIndex, totalBatches }) {
    const batchResult = {
      processed: 0,
      failed: 0,
      errors: []
    };

    try {
      switch (type) {
        case 'delete':
          return await this.processBatchDelete(entityType, entityIds, batchResult);
        case 'update':
          return await this.processBatchUpdate(entityType, entityIds, data, batchResult);
        case 'activate':
          return await this.processBatchStatusUpdate(entityType, entityIds, { status: 'ACTIVE' }, batchResult);
        case 'deactivate':
          return await this.processBatchStatusUpdate(entityType, entityIds, { status: 'INACTIVE' }, batchResult);
        case 'suspend':
          return await this.processBatchStatusUpdate(entityType, entityIds, { status: 'SUSPENDED' }, batchResult);
        default:
          throw new Error(`Unsupported bulk operation type: ${type}`);
      }
    } catch (error) {
      // If entire batch fails, mark all items as failed
      batchResult.failed = entityIds.length;
      batchResult.errors = entityIds.map(id => ({
        id,
        error: error.message
      }));
      return batchResult;
    }
  }

  /**
   * Process batch delete operation with enhanced safety and rollback
   */
  async processBatchDelete(entityType, entityIds, batchResult) {
    const rollbackData = [];
    
    try {
      const modelName = this.getModelName(entityType);
      
      // Use transaction for batch delete with rollback capability
      await prisma.$transaction(async (tx) => {
        for (const id of entityIds) {
          try {
            // First, backup the record for potential rollback
            const existingRecord = await tx[modelName].findUnique({
              where: { id }
            });
            
            if (!existingRecord) {
              batchResult.failed++;
              batchResult.errors.push({
                id,
                error: 'Record not found',
                errorCode: 'NOT_FOUND',
                timestamp: new Date().toISOString()
              });
              continue;
            }

            // Additional safety check for admin users
            if (entityType === 'user' && existingRecord.role === 'ADMIN') {
              batchResult.failed++;
              batchResult.errors.push({
                id,
                error: 'Cannot delete admin users via bulk operations',
                errorCode: 'ADMIN_PROTECTION',
                timestamp: new Date().toISOString()
              });
              continue;
            }

            // Store rollback data
            rollbackData.push({
              id,
              data: existingRecord,
              operation: 'delete'
            });

            // Perform the delete
            await tx[modelName].delete({
              where: { id }
            });
            
            batchResult.processed++;
          } catch (error) {
            batchResult.failed++;
            batchResult.errors.push({
              id,
              error: error.message,
              errorCode: error.code || 'UNKNOWN_ERROR',
              timestamp: new Date().toISOString(),
              stack: error.stack
            });
          }
        }
      });

      // Store rollback data for potential recovery
      if (rollbackData.length > 0) {
        batchResult.rollbackData = rollbackData;
      }

      return batchResult;
    } catch (error) {
      throw new Error(`Batch delete failed: ${error.message}`);
    }
  }

  /**
   * Process batch update operation with enhanced safety and rollback
   */
  async processBatchUpdate(entityType, entityIds, data, batchResult) {
    const rollbackData = [];
    
    try {
      const modelName = this.getModelName(entityType);
      
      // Validate update data
      this.validateUpdateData(entityType, data);
      
      // Use transaction for batch update with rollback capability
      await prisma.$transaction(async (tx) => {
        for (const id of entityIds) {
          try {
            // First, backup the original record for rollback
            const originalRecord = await tx[modelName].findUnique({
              where: { id }
            });
            
            if (!originalRecord) {
              batchResult.failed++;
              batchResult.errors.push({
                id,
                error: 'Record not found',
                errorCode: 'NOT_FOUND',
                timestamp: new Date().toISOString()
              });
              continue;
            }

            // Additional safety checks
            if (entityType === 'user' && originalRecord.role === 'ADMIN') {
              // Prevent certain admin modifications
              const restrictedFields = ['role', 'permissions', 'isActive'];
              const hasRestrictedChanges = restrictedFields.some(field => data.hasOwnProperty(field));
              
              if (hasRestrictedChanges) {
                batchResult.failed++;
                batchResult.errors.push({
                  id,
                  error: 'Cannot modify critical admin fields via bulk operations',
                  errorCode: 'ADMIN_PROTECTION',
                  timestamp: new Date().toISOString()
                });
                continue;
              }
            }

            // Store rollback data
            rollbackData.push({
              id,
              originalData: originalRecord,
              newData: data,
              operation: 'update'
            });

            // Perform the update
            const updatedRecord = await tx[modelName].update({
              where: { id },
              data: {
                ...data,
                updatedAt: new Date()
              }
            });
            
            batchResult.processed++;
          } catch (error) {
            batchResult.failed++;
            batchResult.errors.push({
              id,
              error: error.message,
              errorCode: error.code || 'UNKNOWN_ERROR',
              timestamp: new Date().toISOString(),
              stack: error.stack
            });
          }
        }
      });

      // Store rollback data for potential recovery
      if (rollbackData.length > 0) {
        batchResult.rollbackData = rollbackData;
      }

      return batchResult;
    } catch (error) {
      throw new Error(`Batch update failed: ${error.message}`);
    }
  }

  /**
   * Process batch status update operation
   */
  async processBatchStatusUpdate(entityType, entityIds, statusData, batchResult) {
    try {
      const modelName = this.getModelName(entityType);
      
      // Use transaction for batch status update
      await prisma.$transaction(async (tx) => {
        for (const id of entityIds) {
          try {
            await tx[modelName].update({
              where: { id },
              data: {
                ...statusData,
                updatedAt: new Date()
              }
            });
            batchResult.processed++;
          } catch (error) {
            batchResult.failed++;
            batchResult.errors.push({
              id,
              error: error.message
            });
          }
        }
      });

      return batchResult;
    } catch (error) {
      throw new Error(`Batch status update failed: ${error.message}`);
    }
  }

  /**
   * Cancel a running bulk operation
   */
  async cancelBulkOperation(operationId, adminUser) {
    const operation = this.activeOperations.get(operationId);
    
    if (!operation) {
      throw new Error('Operation not found or already completed');
    }

    if (operation.adminUser.id !== adminUser.id && !adminUser.permissions?.includes('CANCEL_ANY_BULK_OPERATION')) {
      throw new Error('Insufficient permissions to cancel this operation');
    }

    operation.cancelled = true;
    operation.status = 'cancelling';

    // Log cancellation
    await auditService.logAction({
      adminId: adminUser.id,
      action: 'BULK_OPERATION_CANCELLED',
      entityType: operation.entityType,
      entityId: `bulk-${operationId}`,
      changes: {
        originalAdminId: operation.adminUser.id,
        processedItems: operation.processedItems,
        totalItems: operation.totalItems
      },
      metadata: {
        operationId,
        cancelledBy: adminUser.id
      },
      severity: 'medium'
    });

    return {
      success: true,
      message: 'Operation cancellation requested'
    };
  }

  /**
   * Get bulk operation status
   */
  getBulkOperationStatus(operationId) {
    const operation = this.activeOperations.get(operationId);
    
    if (!operation) {
      return null;
    }

    return {
      id: operation.id,
      type: operation.type,
      entityType: operation.entityType,
      status: operation.status,
      progress: {
        total: operation.totalItems,
        processed: operation.processedItems,
        failed: operation.failedItems,
        percentage: Math.round((operation.processedItems / operation.totalItems) * 100)
      },
      errors: operation.errors,
      startTime: operation.startTime,
      duration: operation.endTime ? operation.endTime - operation.startTime : Date.now() - operation.startTime
    };
  }

  /**
   * Get all active bulk operations for an admin
   */
  getActiveBulkOperations(adminId) {
    const operations = [];
    
    for (const [id, operation] of this.activeOperations) {
      if (operation.adminUser.id === adminId || operation.adminUser.permissions?.includes('VIEW_ALL_BULK_OPERATIONS')) {
        operations.push(this.getBulkOperationStatus(id));
      }
    }

    return operations;
  }

  /**
   * Validate bulk operation parameters with enhanced safety checks
   */
  validateBulkOperation({ type, entityType, entityIds, adminUser, options, additionalAuth }) {
    if (!type || !entityType || !entityIds || !adminUser) {
      throw new Error('Missing required parameters for bulk operation');
    }

    if (!Array.isArray(entityIds) || entityIds.length === 0) {
      throw new Error('Entity IDs must be a non-empty array');
    }

    if (entityIds.length > this.MAX_BATCH_SIZE * 10) { // Max 5000 items
      throw new Error(`Bulk operation exceeds maximum allowed items (${this.MAX_BATCH_SIZE * 10})`);
    }

    // Check permissions
    const requiredPermission = `BULK_${type.toUpperCase()}_${entityType.toUpperCase()}`;
    if (!adminUser.permissions?.includes(requiredPermission) && !adminUser.permissions?.includes('BULK_ALL')) {
      throw new Error(`Insufficient permissions for bulk ${type} on ${entityType}`);
    }

    // Additional authentication required for critical operations
    const criticalOperations = ['delete', 'suspend'];
    const largeBulkThreshold = 100;
    
    if (criticalOperations.includes(type) || entityIds.length > largeBulkThreshold) {
      if (!additionalAuth?.confirmed) {
        throw new Error('Additional authentication required for critical bulk operations');
      }
      
      // Check if admin has elevated permissions for critical operations
      if (criticalOperations.includes(type) && !adminUser.permissions?.includes('CRITICAL_BULK_OPERATIONS')) {
        throw new Error('Elevated permissions required for critical bulk operations');
      }
    }

    // Validate entity type
    const supportedEntities = ['user', 'subscription', 'booking', 'serviceRequest'];
    if (!supportedEntities.includes(entityType)) {
      throw new Error(`Unsupported entity type: ${entityType}`);
    }

    // Validate operation type
    const supportedOperations = ['delete', 'update', 'activate', 'deactivate', 'suspend'];
    if (!supportedOperations.includes(type)) {
      throw new Error(`Unsupported operation type: ${type}`);
    }

    // Additional safety checks for delete operations
    if (type === 'delete') {
      if (entityIds.length > 50 && !adminUser.permissions?.includes('BULK_DELETE_LARGE')) {
        throw new Error('Large bulk delete operations require special permissions');
      }
      
      // Prevent deletion of admin users
      if (entityType === 'user' && !options.allowAdminDeletion) {
        throw new Error('Bulk deletion of users requires explicit admin deletion flag');
      }
    }
  }

  /**
   * Check rate limits for bulk operations with enhanced safety
   */
  async checkRateLimit(adminId, itemCount, operationType = 'general') {
    const now = Date.now();
    const windowStart = now - this.RATE_LIMIT_WINDOW;
    
    if (!this.rateLimits.has(adminId)) {
      this.rateLimits.set(adminId, []);
    }

    const userLimits = this.rateLimits.get(adminId);
    
    // Clean old entries
    const validEntries = userLimits.filter(entry => entry.timestamp > windowStart);
    this.rateLimits.set(adminId, validEntries);

    // Calculate current usage
    const currentUsage = validEntries.reduce((sum, entry) => sum + entry.itemCount, 0);
    
    // Different limits based on operation type and risk level
    const rateLimits = {
      delete: 100,      // Very restrictive for delete operations
      suspend: 200,     // Restrictive for suspend operations
      update: 500,      // Moderate for update operations
      activate: 1000,   // Less restrictive for activate operations
      deactivate: 300,  // Moderate for deactivate operations
      general: 1000     // Default limit
    };

    const maxItemsPerWindow = rateLimits[operationType] || rateLimits.general;

    if (currentUsage + itemCount > maxItemsPerWindow) {
      throw new Error(
        `Rate limit exceeded for ${operationType} operations. ` +
        `Maximum ${maxItemsPerWindow} items per minute allowed. ` +
        `Current usage: ${currentUsage}, Requested: ${itemCount}`
      );
    }

    // Add current operation to rate limit tracking
    validEntries.push({
      timestamp: now,
      itemCount,
      operationType
    });

    // Log rate limit usage for monitoring
    await auditService.logAction({
      adminId,
      action: 'RATE_LIMIT_CHECK',
      entityType: 'system',
      entityId: 'rate_limiter',
      changes: {
        operationType,
        itemCount,
        currentUsage,
        maxAllowed: maxItemsPerWindow,
        utilizationPercentage: Math.round(((currentUsage + itemCount) / maxItemsPerWindow) * 100)
      },
      metadata: {
        timestamp: now,
        windowStart
      },
      severity: 'low'
    });
  }

  /**
   * Create batches from entity IDs
   */
  createBatches(entityIds, batchSize) {
    const batches = [];
    for (let i = 0; i < entityIds.length; i += batchSize) {
      batches.push(entityIds.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Get severity level based on operation type and count
   */
  getSeverityLevel(type, count) {
    if (type === 'delete' && count > 100) return 'high';
    if (type === 'delete' && count > 10) return 'medium';
    if (count > 500) return 'medium';
    return 'low';
  }

  /**
   * Get Prisma model name from entity type
   */
  getModelName(entityType) {
    const modelMap = {
      user: 'user',
      subscription: 'subscription',
      booking: 'booking',
      serviceRequest: 'serviceRequest'
    };

    const modelName = modelMap[entityType];
    if (!modelName) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    return modelName;
  }

  /**
   * Emit progress update via Socket.IO
   */
  emitProgressUpdate(operationId, progress) {
    // This will be implemented when we integrate with socketService
    // For now, just store the progress
    const operation = this.activeOperations.get(operationId);
    if (operation) {
      operation.lastProgress = progress;
      operation.lastProgressTime = new Date();
    }
  }

  /**
   * Validate update data for safety
   */
  validateUpdateData(entityType, data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Update data must be a valid object');
    }

    // Prevent updating critical system fields
    const protectedFields = ['id', 'createdAt'];
    const hasProtectedFields = protectedFields.some(field => data.hasOwnProperty(field));
    
    if (hasProtectedFields) {
      throw new Error('Cannot update protected system fields');
    }

    // Entity-specific validations
    if (entityType === 'user') {
      // Prevent bulk role changes to admin
      if (data.role === 'ADMIN') {
        throw new Error('Cannot bulk assign admin role for security reasons');
      }
      
      // Validate email format if provided
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        throw new Error('Invalid email format provided');
      }
    }

    if (entityType === 'subscription') {
      // Validate subscription status changes
      const validStatuses = ['ACTIVE', 'INACTIVE', 'CANCELLED', 'SUSPENDED'];
      if (data.status && !validStatuses.includes(data.status)) {
        throw new Error(`Invalid subscription status: ${data.status}`);
      }
    }
  }

  /**
   * Rollback a failed bulk operation
   */
  async rollbackBulkOperation(operationId, adminUser) {
    try {
      // This would typically retrieve rollback data from a persistent store
      // For now, we'll return a placeholder response
      await auditService.logAction({
        adminId: adminUser.id,
        action: 'BULK_OPERATION_ROLLBACK_REQUESTED',
        entityType: 'bulk',
        entityId: `bulk-${operationId}`,
        changes: {
          operationId,
          requestedBy: adminUser.id
        },
        metadata: {
          timestamp: new Date().toISOString()
        },
        severity: 'high'
      });

      return {
        success: true,
        message: 'Rollback functionality is available but requires implementation of persistent rollback data storage'
      };
    } catch (error) {
      throw new Error(`Rollback failed: ${error.message}`);
    }
  }

  /**
   * Get detailed error analysis for a bulk operation
   */
  async getErrorAnalysis(operationId) {
    const operation = this.activeOperations.get(operationId);
    
    if (!operation || !operation.errors) {
      return null;
    }

    const errorAnalysis = {
      totalErrors: operation.errors.length,
      errorsByType: {},
      errorsByCode: {},
      commonPatterns: [],
      recommendations: []
    };

    // Analyze error patterns
    operation.errors.forEach(error => {
      // Group by error message
      const errorType = error.error.split(':')[0] || 'Unknown';
      errorAnalysis.errorsByType[errorType] = (errorAnalysis.errorsByType[errorType] || 0) + 1;
      
      // Group by error code if available
      if (error.errorCode) {
        errorAnalysis.errorsByCode[error.errorCode] = (errorAnalysis.errorsByCode[error.errorCode] || 0) + 1;
      }
    });

    // Generate recommendations based on error patterns
    if (errorAnalysis.errorsByCode['NOT_FOUND'] > 0) {
      errorAnalysis.recommendations.push('Some records may have been deleted by another process. Consider refreshing the data before retrying.');
    }
    
    if (errorAnalysis.errorsByCode['ADMIN_PROTECTION'] > 0) {
      errorAnalysis.recommendations.push('Admin records are protected from bulk operations. Remove admin users from selection.');
    }

    return errorAnalysis;
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up completed operations (called periodically)
   */
  cleanupCompletedOperations() {
    const now = Date.now();
    const maxAge = 300000; // 5 minutes

    for (const [id, operation] of this.activeOperations) {
      if (operation.status !== 'running' && operation.status !== 'cancelling') {
        const age = now - (operation.endTime || operation.startTime);
        if (age > maxAge) {
          this.activeOperations.delete(id);
        }
      }
    }
  }
}

// Create singleton instance
const bulkOperationService = new BulkOperationService();

// Set up periodic cleanup
setInterval(() => {
  bulkOperationService.cleanupCompletedOperations();
}, 60000); // Clean up every minute

export default bulkOperationService;