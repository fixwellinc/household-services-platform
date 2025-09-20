import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BulkOperationService } from '../services/bulkOperationService.js';
import { AuditService } from '../services/auditService.js';
import { PrismaClient } from '@prisma/client';

// Mock dependencies
const mockPrisma = {
  user: {
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
    findMany: vi.fn()
  },
  subscription: {
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
    findMany: vi.fn()
  },
  $transaction: vi.fn()
};

const mockAuditService = {
  logAction: vi.fn()
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma)
}));

vi.mock('../services/auditService.js', () => ({
  AuditService: vi.fn(() => mockAuditService)
}));

describe('BulkOperationService', () => {
  let bulkOperationService;

  beforeEach(() => {
    bulkOperationService = new BulkOperationService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('suspendUsers', () => {
    it('should suspend multiple users successfully', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      const adminId = 'admin-1';
      const reason = 'Policy violation';

      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-1', status: 'ACTIVE' },
        { id: 'user-2', status: 'ACTIVE' },
        { id: 'user-3', status: 'ACTIVE' }
      ]);

      mockPrisma.user.updateMany.mockResolvedValue({ count: 3 });
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma);
      });

      const result = await bulkOperationService.suspendUsers(userIds, adminId, reason);

      expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
        where: { id: { in: userIds } },
        data: {
          status: 'SUSPENDED',
          suspendedAt: expect.any(Date),
          suspensionReason: reason
        }
      });

      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        adminId,
        action: 'BULK_USER_SUSPEND',
        entityType: 'USER',
        entityIds: userIds,
        changes: { status: { from: 'ACTIVE', to: 'SUSPENDED' }, reason },
        metadata: expect.any(Object)
      });

      expect(result).toEqual({
        success: true,
        processed: 3,
        failed: 0,
        errors: []
      });
    });

    it('should handle partial failures', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      const adminId = 'admin-1';

      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-1', status: 'ACTIVE' },
        { id: 'user-2', status: 'SUSPENDED' }, // Already suspended
        { id: 'user-3', status: 'ACTIVE' }
      ]);

      mockPrisma.user.updateMany.mockResolvedValue({ count: 2 });

      const result = await bulkOperationService.suspendUsers(userIds, adminId);

      expect(result).toEqual({
        success: true,
        processed: 2,
        failed: 1,
        errors: [
          { id: 'user-2', error: 'User already suspended' }
        ]
      });
    });

    it('should enforce rate limiting', async () => {
      const userIds = Array.from({ length: 1000 }, (_, i) => `user-${i}`);
      const adminId = 'admin-1';

      await expect(bulkOperationService.suspendUsers(userIds, adminId))
        .rejects.toThrow('Bulk operation exceeds maximum limit of 500 items');
    });

    it('should validate user permissions', async () => {
      const userIds = ['user-1'];
      const adminId = 'admin-1';

      // Mock insufficient permissions
      bulkOperationService.hasPermission = vi.fn().mockReturnValue(false);

      await expect(bulkOperationService.suspendUsers(userIds, adminId))
        .rejects.toThrow('Insufficient permissions for bulk user suspension');
    });
  });

  describe('deleteUsers', () => {
    it('should delete multiple users with confirmation', async () => {
      const userIds = ['user-1', 'user-2'];
      const adminId = 'admin-1';
      const confirmation = 'DELETE_USERS_CONFIRMED';

      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-1', status: 'SUSPENDED' },
        { id: 'user-2', status: 'SUSPENDED' }
      ]);

      mockPrisma.user.deleteMany.mockResolvedValue({ count: 2 });

      const result = await bulkOperationService.deleteUsers(userIds, adminId, confirmation);

      expect(mockPrisma.user.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: userIds } }
      });

      expect(result).toEqual({
        success: true,
        processed: 2,
        failed: 0,
        errors: []
      });
    });

    it('should require confirmation for deletion', async () => {
      const userIds = ['user-1'];
      const adminId = 'admin-1';

      await expect(bulkOperationService.deleteUsers(userIds, adminId))
        .rejects.toThrow('Confirmation required for bulk user deletion');
    });

    it('should prevent deletion of active users', async () => {
      const userIds = ['user-1'];
      const adminId = 'admin-1';
      const confirmation = 'DELETE_USERS_CONFIRMED';

      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-1', status: 'ACTIVE' }
      ]);

      const result = await bulkOperationService.deleteUsers(userIds, adminId, confirmation);

      expect(result.failed).toBe(1);
      expect(result.errors[0].error).toBe('Cannot delete active user');
    });
  });

  describe('updateSubscriptions', () => {
    it('should update multiple subscriptions', async () => {
      const subscriptionIds = ['sub-1', 'sub-2'];
      const adminId = 'admin-1';
      const updates = { status: 'CANCELLED' };

      mockPrisma.subscription.findMany.mockResolvedValue([
        { id: 'sub-1', status: 'ACTIVE' },
        { id: 'sub-2', status: 'ACTIVE' }
      ]);

      mockPrisma.subscription.updateMany.mockResolvedValue({ count: 2 });

      const result = await bulkOperationService.updateSubscriptions(
        subscriptionIds, 
        adminId, 
        updates
      );

      expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith({
        where: { id: { in: subscriptionIds } },
        data: updates
      });

      expect(result.processed).toBe(2);
    });

    it('should validate subscription updates', async () => {
      const subscriptionIds = ['sub-1'];
      const adminId = 'admin-1';
      const invalidUpdates = { invalidField: 'value' };

      await expect(bulkOperationService.updateSubscriptions(
        subscriptionIds, 
        adminId, 
        invalidUpdates
      )).rejects.toThrow('Invalid subscription update fields');
    });
  });

  describe('processWithProgress', () => {
    it('should process items in batches with progress tracking', async () => {
      const items = Array.from({ length: 100 }, (_, i) => `item-${i}`);
      const processor = vi.fn().mockResolvedValue({ success: true });
      const progressCallback = vi.fn();

      const result = await bulkOperationService.processWithProgress(
        items,
        processor,
        { batchSize: 10, progressCallback }
      );

      expect(processor).toHaveBeenCalledTimes(10); // 100 items / 10 batch size
      expect(progressCallback).toHaveBeenCalledTimes(10);
      expect(result.processed).toBe(100);
    });

    it('should handle processing errors gracefully', async () => {
      const items = ['item-1', 'item-2', 'item-3'];
      const processor = vi.fn()
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('Processing failed'))
        .mockResolvedValueOnce({ success: true });

      const result = await bulkOperationService.processWithProgress(items, processor);

      expect(result.processed).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });

    it('should support cancellation', async () => {
      const items = Array.from({ length: 100 }, (_, i) => `item-${i}`);
      const processor = vi.fn().mockResolvedValue({ success: true });
      const cancellationToken = { cancelled: false };

      // Cancel after 3 batches
      setTimeout(() => {
        cancellationToken.cancelled = true;
      }, 30);

      const result = await bulkOperationService.processWithProgress(
        items,
        processor,
        { batchSize: 10, cancellationToken }
      );

      expect(result.cancelled).toBe(true);
      expect(result.processed).toBeLessThan(100);
    });
  });

  describe('validateBulkOperation', () => {
    it('should validate operation parameters', () => {
      const validOperation = {
        type: 'suspend_users',
        items: ['user-1', 'user-2'],
        adminId: 'admin-1'
      };

      expect(() => bulkOperationService.validateBulkOperation(validOperation))
        .not.toThrow();
    });

    it('should reject operations with too many items', () => {
      const invalidOperation = {
        type: 'suspend_users',
        items: Array.from({ length: 1000 }, (_, i) => `user-${i}`),
        adminId: 'admin-1'
      };

      expect(() => bulkOperationService.validateBulkOperation(invalidOperation))
        .toThrow('Bulk operation exceeds maximum limit');
    });

    it('should reject operations without admin ID', () => {
      const invalidOperation = {
        type: 'suspend_users',
        items: ['user-1']
      };

      expect(() => bulkOperationService.validateBulkOperation(invalidOperation))
        .toThrow('Admin ID is required');
    });
  });

  describe('getBulkOperationHistory', () => {
    it('should retrieve bulk operation history', async () => {
      const adminId = 'admin-1';
      const mockHistory = [
        {
          id: 'op-1',
          type: 'suspend_users',
          itemCount: 5,
          processed: 5,
          failed: 0,
          createdAt: new Date()
        }
      ];

      mockPrisma.bulkOperation = {
        findMany: vi.fn().mockResolvedValue(mockHistory)
      };

      const result = await bulkOperationService.getBulkOperationHistory(adminId);

      expect(result).toEqual(mockHistory);
    });
  });

  describe('rollbackBulkOperation', () => {
    it('should rollback a bulk operation', async () => {
      const operationId = 'op-1';
      const adminId = 'admin-1';

      const mockOperation = {
        id: 'op-1',
        type: 'suspend_users',
        items: ['user-1', 'user-2'],
        originalData: [
          { id: 'user-1', status: 'ACTIVE' },
          { id: 'user-2', status: 'ACTIVE' }
        ]
      };

      mockPrisma.bulkOperation = {
        findUnique: vi.fn().mockResolvedValue(mockOperation),
        update: vi.fn()
      };

      mockPrisma.user.updateMany.mockResolvedValue({ count: 2 });

      const result = await bulkOperationService.rollbackBulkOperation(operationId, adminId);

      expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['user-1', 'user-2'] } },
        data: { status: 'ACTIVE' }
      });

      expect(result.success).toBe(true);
    });

    it('should prevent rollback of non-reversible operations', async () => {
      const operationId = 'op-1';
      const adminId = 'admin-1';

      const mockOperation = {
        id: 'op-1',
        type: 'delete_users',
        reversible: false
      };

      mockPrisma.bulkOperation = {
        findUnique: vi.fn().mockResolvedValue(mockOperation)
      };

      await expect(bulkOperationService.rollbackBulkOperation(operationId, adminId))
        .rejects.toThrow('Operation is not reversible');
    });
  });
});