import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Test admin user
const testAdmin = {
  id: 'test-admin-1',
  email: 'admin@test.com',
  name: 'Test Admin',
  role: 'ADMIN',
  password: 'hashedpassword'
};

// Generate test JWT token
const generateTestToken = (userId, role = 'ADMIN') => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

describe('Admin API Integration Tests', () => {
  let adminToken;

  beforeAll(async () => {
    // Create test admin user
    await prisma.user.upsert({
      where: { email: testAdmin.email },
      update: testAdmin,
      create: testAdmin
    });

    adminToken = generateTestToken(testAdmin.id, testAdmin.role);
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'test.com' } }
    });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('User Management API', () => {
    it('should get all users with pagination', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('should search users by query', async () => {
      const response = await request(app)
        .get('/api/admin/users/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ q: 'admin' })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should get user details by ID', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testAdmin.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testAdmin.id);
      expect(response.body).toHaveProperty('email', testAdmin.email);
      expect(response.body).toHaveProperty('name', testAdmin.name);
    });

    it('should update user details', async () => {
      const updateData = {
        name: 'Updated Admin Name',
        status: 'ACTIVE'
      };

      const response = await request(app)
        .put(`/api/admin/users/${testAdmin.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('name', updateData.name);
      expect(response.body).toHaveProperty('status', updateData.status);
    });

    it('should suspend user', async () => {
      // Create test user to suspend
      const testUser = await prisma.user.create({
        data: {
          email: 'suspend-test@test.com',
          name: 'Suspend Test User',
          role: 'CUSTOMER',
          status: 'ACTIVE'
        }
      });

      const response = await request(app)
        .post(`/api/admin/users/${testUser.id}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test suspension' })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'SUSPENDED');
      expect(response.body).toHaveProperty('suspensionReason', 'Test suspension');

      // Cleanup
      await prisma.user.delete({ where: { id: testUser.id } });
    });

    it('should require admin authentication', async () => {
      await request(app)
        .get('/api/admin/users')
        .expect(401);
    });

    it('should reject non-admin users', async () => {
      const customerToken = generateTestToken('customer-1', 'CUSTOMER');

      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('Bulk Operations API', () => {
    let testUsers;

    beforeEach(async () => {
      // Create test users for bulk operations
      testUsers = await Promise.all([
        prisma.user.create({
          data: {
            email: 'bulk1@test.com',
            name: 'Bulk Test User 1',
            role: 'CUSTOMER',
            status: 'ACTIVE'
          }
        }),
        prisma.user.create({
          data: {
            email: 'bulk2@test.com',
            name: 'Bulk Test User 2',
            role: 'CUSTOMER',
            status: 'ACTIVE'
          }
        })
      ]);
    });

    afterEach(async () => {
      // Cleanup test users
      if (testUsers) {
        await prisma.user.deleteMany({
          where: {
            id: { in: testUsers.map(u => u.id) }
          }
        });
      }
    });

    it('should suspend multiple users', async () => {
      const userIds = testUsers.map(u => u.id);

      const response = await request(app)
        .post('/api/admin/bulk/suspend-users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userIds,
          reason: 'Bulk test suspension'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('processed', 2);
      expect(response.body).toHaveProperty('failed', 0);

      // Verify users are suspended
      const suspendedUsers = await prisma.user.findMany({
        where: { id: { in: userIds } }
      });

      suspendedUsers.forEach(user => {
        expect(user.status).toBe('SUSPENDED');
        expect(user.suspensionReason).toBe('Bulk test suspension');
      });
    });

    it('should validate bulk operation limits', async () => {
      const tooManyIds = Array.from({ length: 1000 }, (_, i) => `user-${i}`);

      await request(app)
        .post('/api/admin/bulk/suspend-users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userIds: tooManyIds,
          reason: 'Test'
        })
        .expect(400);
    });

    it('should handle partial failures in bulk operations', async () => {
      const userIds = [...testUsers.map(u => u.id), 'non-existent-id'];

      const response = await request(app)
        .post('/api/admin/bulk/suspend-users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userIds,
          reason: 'Bulk test with failure'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('processed', 2);
      expect(response.body).toHaveProperty('failed', 1);
      expect(response.body.errors).toHaveLength(1);
    });
  });

  describe('Search API', () => {
    it('should perform global search', async () => {
      const response = await request(app)
        .get('/api/admin/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ q: 'admin' })
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('subscriptions');
      expect(response.body).toHaveProperty('serviceRequests');
    });

    it('should get search suggestions', async () => {
      const response = await request(app)
        .get('/api/admin/search/suggestions')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ q: 'adm' })
        .expect(200);

      expect(response.body).toHaveProperty('suggestions');
      expect(Array.isArray(response.body.suggestions)).toBe(true);
    });

    it('should filter search by entity type', async () => {
      const response = await request(app)
        .get('/api/admin/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ q: 'admin', entityTypes: 'users' })
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).not.toHaveProperty('subscriptions');
    });
  });

  describe('Audit Logs API', () => {
    it('should get audit logs with pagination', async () => {
      const response = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('logs');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(Array.isArray(response.body.logs)).toBe(true);
    });

    it('should filter audit logs by date range', async () => {
      const startDate = new Date('2024-01-01').toISOString();
      const endDate = new Date('2024-12-31').toISOString();

      const response = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ startDate, endDate })
        .expect(200);

      expect(response.body).toHaveProperty('logs');
    });

    it('should filter audit logs by admin user', async () => {
      const response = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ adminId: testAdmin.id })
        .expect(200);

      expect(response.body).toHaveProperty('logs');
    });

    it('should export audit logs', async () => {
      const response = await request(app)
        .get('/api/admin/audit-logs/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ format: 'csv' })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
    });
  });

  describe('Dashboard API', () => {
    it('should get dashboard metrics', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('subscriptions');
      expect(response.body).toHaveProperty('revenue');
      expect(response.body).toHaveProperty('systemHealth');
    });

    it('should get dashboard widgets configuration', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/widgets')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('widgets');
      expect(Array.isArray(response.body.widgets)).toBe(true);
    });

    it('should update dashboard layout', async () => {
      const layout = [
        { id: 'widget-1', x: 0, y: 0, w: 4, h: 2 },
        { id: 'widget-2', x: 4, y: 0, w: 8, h: 4 }
      ];

      const response = await request(app)
        .put('/api/admin/dashboard/layout')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ layout })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('System Monitoring API', () => {
    it('should get system health metrics', async () => {
      const response = await request(app)
        .get('/api/admin/system/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('api');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('cpu');
    });

    it('should get system alerts', async () => {
      const response = await request(app)
        .get('/api/admin/system/alerts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('alerts');
      expect(Array.isArray(response.body.alerts)).toBe(true);
    });

    it('should acknowledge system alert', async () => {
      // First create a test alert
      const alert = await prisma.systemAlert.create({
        data: {
          type: 'warning',
          title: 'Test Alert',
          message: 'Test alert message',
          severity: 'medium',
          acknowledged: false
        }
      });

      const response = await request(app)
        .post(`/api/admin/system/alerts/${alert.id}/acknowledge`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('acknowledged', true);

      // Cleanup
      await prisma.systemAlert.delete({ where: { id: alert.id } });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent resources', async () => {
      await request(app)
        .get('/api/admin/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalid-email',
          name: ''
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });

    it('should handle server errors gracefully', async () => {
      // Mock a database error
      vi.spyOn(prisma.user, 'findMany').mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on admin endpoints', async () => {
      // Make multiple rapid requests
      const requests = Array.from({ length: 100 }, () =>
        request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${adminToken}`)
      );

      const responses = await Promise.allSettled(requests);
      const rateLimitedResponses = responses.filter(
        result => result.status === 'fulfilled' && result.value.status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});