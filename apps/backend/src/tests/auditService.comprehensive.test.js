import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuditService } from '../services/auditService.js';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
const mockPrisma = {
  auditLog: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    deleteMany: vi.fn()
  }
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma)
}));

describe('AuditService', () => {
  let auditService;

  beforeEach(() => {
    auditService = new AuditService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logAction', () => {
    it('should log an action successfully', async () => {
      const actionData = {
        adminId: 'admin-1',
        action: 'USER_UPDATED',
        entityType: 'USER',
        entityId: 'user-1',
        changes: { status: { from: 'ACTIVE', to: 'SUSPENDED' } },
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          sessionId: 'session-1'
        }
      };

      const mockAuditLog = {
        id: 'audit-1',
        ...actionData,
        timestamp: new Date(),
        severity: 'medium'
      };

      mockPrisma.auditLog.create.mockResolvedValue(mockAuditLog);

      const result = await auditService.logAction(actionData);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          adminId: 'admin-1',
          action: 'USER_UPDATED',
          entityType: 'USER',
          entityId: 'user-1',
          changes: actionData.changes,
          metadata: actionData.metadata,
          severity: 'medium'
        })
      });

      expect(result).toEqual(mockAuditLog);
    });

    it('should determine severity based on action type', async () => {
      const criticalAction = {
        adminId: 'admin-1',
        action: 'USER_DELETED',
        entityType: 'USER',
        entityId: 'user-1',
        metadata: { ipAddress: '192.168.1.1' }
      };

      mockPrisma.auditLog.create.mockResolvedValue({});

      await auditService.logAction(criticalAction);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          severity: 'critical'
        })
      });
    });

    it('should handle bulk operations', async () => {
      const bulkAction = {
        adminId: 'admin-1',
        action: 'BULK_USER_SUSPEND',
        entityType: 'USER',
        entityIds: ['user-1', 'user-2', 'user-3'],
        metadata: { ipAddress: '192.168.1.1' }
      };

      mockPrisma.auditLog.create.mockResolvedValue({});

      await auditService.logAction(bulkAction);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'BULK_USER_SUSPEND',
          entityType: 'USER',
          entityId: 'user-1,user-2,user-3',
          severity: 'high'
        })
      });
    });

    it('should throw error for invalid action data', async () => {
      const invalidAction = {
        adminId: '',
        action: 'INVALID_ACTION'
      };

      await expect(auditService.logAction(invalidAction))
        .rejects.toThrow('Invalid audit action data');
    });
  });

  describe('getAuditLogs', () => {
    it('should retrieve audit logs with filters', async () => {
      const filters = {
        adminId: 'admin-1',
        action: 'USER_UPDATED',
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        },
        page: 1,
        limit: 10
      };

      const mockLogs = [
        {
          id: 'audit-1',
          adminId: 'admin-1',
          action: 'USER_UPDATED',
          timestamp: new Date('2024-01-15')
        }
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      const result = await auditService.getAuditLogs(filters);

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          adminId: 'admin-1',
          action: 'USER_UPDATED',
          timestamp: {
            gte: filters.dateRange.start,
            lte: filters.dateRange.end
          }
        },
        orderBy: { timestamp: 'desc' },
        skip: 0,
        take: 10,
        include: {
          admin: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      expect(result).toEqual({
        logs: mockLogs,
        total: 1,
        page: 1,
        totalPages: 1
      });
    });

    it('should handle empty results', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      const result = await auditService.getAuditLogs({});

      expect(result).toEqual({
        logs: [],
        total: 0,
        page: 1,
        totalPages: 0
      });
    });

    it('should support entity type filtering', async () => {
      const filters = { entityType: 'SUBSCRIPTION' };

      await auditService.getAuditLogs(filters);

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entityType: 'SUBSCRIPTION'
          })
        })
      );
    });

    it('should support severity filtering', async () => {
      const filters = { severity: 'critical' };

      await auditService.getAuditLogs(filters);

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            severity: 'critical'
          })
        })
      );
    });
  });

  describe('exportAuditLogs', () => {
    it('should export audit logs as CSV', async () => {
      const mockLogs = [
        {
          id: 'audit-1',
          adminId: 'admin-1',
          action: 'USER_UPDATED',
          entityType: 'USER',
          entityId: 'user-1',
          timestamp: new Date('2024-01-15'),
          severity: 'medium',
          admin: { name: 'Admin User', email: 'admin@test.com' }
        }
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await auditService.exportAuditLogs({}, 'csv');

      expect(result).toContain('ID,Admin,Action,Entity Type,Entity ID,Timestamp,Severity');
      expect(result).toContain('audit-1,Admin User,USER_UPDATED,USER,user-1');
    });

    it('should export audit logs as JSON', async () => {
      const mockLogs = [
        {
          id: 'audit-1',
          adminId: 'admin-1',
          action: 'USER_UPDATED',
          timestamp: new Date('2024-01-15')
        }
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await auditService.exportAuditLogs({}, 'json');

      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('audit-1');
    });

    it('should handle large exports with streaming', async () => {
      const largeMockLogs = Array.from({ length: 10000 }, (_, i) => ({
        id: `audit-${i}`,
        action: 'USER_UPDATED',
        timestamp: new Date()
      }));

      mockPrisma.auditLog.findMany.mockResolvedValue(largeMockLogs);

      const result = await auditService.exportAuditLogs({}, 'csv');

      expect(result).toBeDefined();
      expect(result.split('\n')).toHaveLength(10001); // Header + 10000 rows
    });
  });

  describe('cleanupOldLogs', () => {
    it('should cleanup logs older than retention period', async () => {
      const retentionDays = 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      mockPrisma.auditLog.deleteMany.mockResolvedValue({ count: 150 });

      const result = await auditService.cleanupOldLogs(retentionDays);

      expect(mockPrisma.auditLog.deleteMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            lt: expect.any(Date)
          }
        }
      });

      expect(result.deletedCount).toBe(150);
    });

    it('should preserve critical logs regardless of age', async () => {
      const retentionDays = 30;

      await auditService.cleanupOldLogs(retentionDays, { preserveCritical: true });

      expect(mockPrisma.auditLog.deleteMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            lt: expect.any(Date)
          },
          severity: {
            not: 'critical'
          }
        }
      });
    });
  });

  describe('getAuditStatistics', () => {
    it('should return audit statistics', async () => {
      mockPrisma.auditLog.count.mockImplementation(({ where }) => {
        if (where?.severity === 'critical') return Promise.resolve(5);
        if (where?.severity === 'high') return Promise.resolve(15);
        if (where?.severity === 'medium') return Promise.resolve(50);
        if (where?.severity === 'low') return Promise.resolve(100);
        return Promise.resolve(170);
      });

      const result = await auditService.getAuditStatistics();

      expect(result).toEqual({
        total: 170,
        bySeverity: {
          critical: 5,
          high: 15,
          medium: 50,
          low: 100
        }
      });
    });
  });

  describe('searchAuditLogs', () => {
    it('should search audit logs by text', async () => {
      const searchTerm = 'user suspension';
      const mockLogs = [
        {
          id: 'audit-1',
          action: 'USER_SUSPENDED',
          changes: { reason: 'Policy violation' }
        }
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await auditService.searchAuditLogs(searchTerm);

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { action: { contains: searchTerm, mode: 'insensitive' } },
            { entityType: { contains: searchTerm, mode: 'insensitive' } },
            { changes: { path: ['$'], string_contains: searchTerm } }
          ]
        },
        orderBy: { timestamp: 'desc' },
        take: 100
      });

      expect(result).toEqual(mockLogs);
    });
  });
});