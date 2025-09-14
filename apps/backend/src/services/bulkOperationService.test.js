import { describe, it, expect, beforeEach, vi } from 'vitest';
import bulkOperationService from './bulkOperationService.js';

// Mock dependencies
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    $transaction: vi.fn(),
    user: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      update: vi.fn()
    }
  }))
}));

vi.mock('./auditService.js', () => ({
  default: {
    logAction: vi.fn()
  }
}));

describe('BulkOperationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateBulkOperation', () => {
    it('should validate required parameters', () => {
      expect(() => {
        bulkOperationService.validateBulkOperation({});
      }).toThrow('Missing required parameters for bulk operation');
    });

    it('should validate entity IDs array', () => {
      expect(() => {
        bulkOperationService.validateBulkOperation({
          type: 'update',
          entityType: 'user',
          entityIds: [],
          adminUser: { id: '1', permissions: ['BULK_ALL'] }
        });
      }).toThrow('Entity IDs must be a non-empty array');
    });

    it('should validate permissions', () => {
      expect(() => {
        bulkOperationService.validateBulkOperation({
          type: 'delete',
          entityType: 'user',
          entityIds: ['1', '2'],
          adminUser: { id: '1', permissions: [] }
        });
      }).toThrow('Insufficient permissions for bulk delete on user');
    });

    it('should validate supported entity types', () => {
      expect(() => {
        bulkOperationService.validateBulkOperation({
          type: 'update',
          entityType: 'invalid',
          entityIds: ['1', '2'],
          adminUser: { id: '1', permissions: ['BULK_ALL'] }
        });
      }).toThrow('Unsupported entity type: invalid');
    });

    it('should validate supported operation types', () => {
      expect(() => {
        bulkOperationService.validateBulkOperation({
          type: 'invalid',
          entityType: 'user',
          entityIds: ['1', '2'],
          adminUser: { id: '1', permissions: ['BULK_ALL'] }
        });
      }).toThrow('Unsupported operation type: invalid');
    });

    it('should pass validation for valid parameters', () => {
      expect(() => {
        bulkOperationService.validateBulkOperation({
          type: 'update',
          entityType: 'user',
          entityIds: ['1', '2'],
          adminUser: { id: '1', permissions: ['BULK_ALL'] }
        });
      }).not.toThrow();
    });
  });

  describe('validateUpdateData', () => {
    it('should reject invalid data types', () => {
      expect(() => {
        bulkOperationService.validateUpdateData('user', null);
      }).toThrow('Update data must be a valid object');
    });

    it('should reject protected fields', () => {
      expect(() => {
        bulkOperationService.validateUpdateData('user', { id: '123' });
      }).toThrow('Cannot update protected system fields');
    });

    it('should reject bulk admin role assignment', () => {
      expect(() => {
        bulkOperationService.validateUpdateData('user', { role: 'ADMIN' });
      }).toThrow('Cannot bulk assign admin role for security reasons');
    });

    it('should validate email format', () => {
      expect(() => {
        bulkOperationService.validateUpdateData('user', { email: 'invalid-email' });
      }).toThrow('Invalid email format provided');
    });

    it('should pass validation for valid data', () => {
      expect(() => {
        bulkOperationService.validateUpdateData('user', { 
          name: 'John Doe',
          email: 'john@example.com'
        });
      }).not.toThrow();
    });
  });

  describe('getSeverityLevel', () => {
    it('should return high severity for large delete operations', () => {
      const severity = bulkOperationService.getSeverityLevel('delete', 150);
      expect(severity).toBe('high');
    });

    it('should return medium severity for medium delete operations', () => {
      const severity = bulkOperationService.getSeverityLevel('delete', 50);
      expect(severity).toBe('medium');
    });

    it('should return low severity for small operations', () => {
      const severity = bulkOperationService.getSeverityLevel('update', 5);
      expect(severity).toBe('low');
    });
  });

  describe('createBatches', () => {
    it('should create correct batches', () => {
      const entityIds = ['1', '2', '3', '4', '5'];
      const batches = bulkOperationService.createBatches(entityIds, 2);
      
      expect(batches).toEqual([
        ['1', '2'],
        ['3', '4'],
        ['5']
      ]);
    });

    it('should handle empty arrays', () => {
      const batches = bulkOperationService.createBatches([], 2);
      expect(batches).toEqual([]);
    });
  });

  describe('getModelName', () => {
    it('should return correct model names', () => {
      expect(bulkOperationService.getModelName('user')).toBe('user');
      expect(bulkOperationService.getModelName('subscription')).toBe('subscription');
    });

    it('should throw error for unknown entity types', () => {
      expect(() => {
        bulkOperationService.getModelName('unknown');
      }).toThrow('Unknown entity type: unknown');
    });
  });
});