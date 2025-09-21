import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { auditService } from './auditService.js';

const prisma = new PrismaClient();

describe('AuditService', () => {
  let testAdminId;
  let testAuditLogId;

  beforeEach(async () => {
    // Create a test admin user
    const testAdmin = await prisma.user.create({
      data: {
        email: 'test-admin@example.com',
        password: 'hashedpassword',
        name: 'Test Admin',
        role: 'ADMIN'
      }
    });
    testAdminId = testAdmin.id;
  });

  afterEach(async () => {
    // Clean up test data
    if (testAuditLogId) {
      await prisma.auditLog.deleteMany({
        where: { id: testAuditLogId }
      });
    }
    
    await prisma.user.deleteMany({
      where: { email: 'test-admin@example.com' }
    });
  });

  it('should log an audit action successfully', async () => {
    const auditData = {
      adminId: testAdminId,
      action: 'TEST_ACTION',
      entityType: 'user',
      entityId: 'test-entity-123',
      changes: { field: 'value' },
      metadata: { ipAddress: '127.0.0.1' },
      severity: 'low'
    };

    const result = await auditService.logAction(auditData);
    testAuditLogId = result.id;

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.adminId).toBe(testAdminId);
    expect(result.action).toBe('TEST_ACTION');
  });

  it('should retrieve audit logs with filters', async () => {
    // First create a test audit log
    const auditData = {
      adminId: testAdminId,
      action: 'TEST_RETRIEVE',
      entityType: 'user',
      entityId: 'test-entity-456',
      changes: {},
      metadata: {},
      severity: 'medium'
    };

    const createdLog = await auditService.logAction(auditData);
    testAuditLogId = createdLog.id;

    // Now retrieve it
    const result = await auditService.getAuditLogs({
      adminId: testAdminId,
      action: 'TEST_RETRIEVE'
    });

    expect(result.auditLogs).toBeDefined();
    expect(result.auditLogs.length).toBeGreaterThan(0);
    expect(result.auditLogs[0].action).toBe('TEST_RETRIEVE');
  });

  it('should export audit logs in CSV format', async () => {
    // Create a test audit log
    const auditData = {
      adminId: testAdminId,
      action: 'TEST_EXPORT',
      entityType: 'user',
      entityId: 'test-entity-789',
      changes: {},
      metadata: { ipAddress: '192.168.1.1' },
      severity: 'high'
    };

    const createdLog = await auditService.logAction(auditData);
    testAuditLogId = createdLog.id;

    const csvData = await auditService.exportAuditLogs({
      adminId: testAdminId
    }, 'csv');

    expect(csvData).toBeDefined();
    expect(typeof csvData).toBe('string');
    expect(csvData).toContain('TEST_EXPORT');
  });
});