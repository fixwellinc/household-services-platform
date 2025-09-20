import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Admin Panel Security Tests', () => {
  let adminToken, customerToken, employeeToken;
  let testAdmin, testCustomer, testEmployee;

  beforeAll(async () => {
    // Create test users with different roles
    const hashedPassword = await bcrypt.hash('testpassword', 10);

    testAdmin = await prisma.user.create({
      data: {
        email: 'security-admin@test.com',
        name: 'Security Test Admin',
        role: 'ADMIN',
        password: hashedPassword,
        status: 'ACTIVE'
      }
    });

    testCustomer = await prisma.user.create({
      data: {
        email: 'security-customer@test.com',
        name: 'Security Test Customer',
        role: 'CUSTOMER',
        password: hashedPassword,
        status: 'ACTIVE'
      }
    });

    testEmployee = await prisma.user.create({
      data: {
        email: 'security-employee@test.com',
        name: 'Security Test Employee',
        role: 'EMPLOYEE',
        password: hashedPassword,
        status: 'ACTIVE'
      }
    });

    // Generate tokens
    adminToken = jwt.sign(
      { userId: testAdmin.id, role: 'ADMIN' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    customerToken = jwt.sign(
      { userId: testCustomer.id, role: 'CUSTOMER' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    employeeToken = jwt.sign(
      { userId: testEmployee.id, role: 'EMPLOYEE' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { contains: 'security-' }
      }
    });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Security', () => {
    it('should reject requests without authentication token', async () => {
      await request(app)
        .get('/api/admin/users')
        .expect(401);

      await request(app)
        .post('/api/admin/bulk/suspend-users')
        .send({ userIds: ['user-1'], reason: 'test' })
        .expect(401);
    });

    it('should reject invalid JWT tokens', async () => {
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid')
        .expect(401);
    });

    it('should reject expired JWT tokens', async () => {
      const expiredToken = jwt.sign(
        { userId: testAdmin.id, role: 'ADMIN' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should reject tokens with tampered payload', async () => {
      const tamperedToken = jwt.sign(
        { userId: testCustomer.id, role: 'ADMIN' }, // Customer trying to be admin
        'wrong-secret',
        { expiresIn: '1h' }
      );

      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);
    });
  });

  describe('Authorization Security', () => {
    it('should enforce admin-only access to admin endpoints', async () => {
      const adminEndpoints = [
        '/api/admin/users',
        '/api/admin/subscriptions',
        '/api/admin/audit-logs',
        '/api/admin/system/health',
        '/api/admin/dashboard/metrics'
      ];

      for (const endpoint of adminEndpoints) {
        // Customer should be denied
        await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${customerToken}`)
          .expect(403);

        // Employee should be denied (unless specifically allowed)
        await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${employeeToken}`)
          .expect(403);

        // Admin should be allowed
        await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      }
    });

    it('should prevent privilege escalation', async () => {
      // Customer trying to update their own role to admin
      await request(app)
        .put(`/api/admin/users/${testCustomer.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ role: 'ADMIN' })
        .expect(403);

      // Employee trying to access admin functions
      await request(app)
        .post('/api/admin/bulk/suspend-users')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ userIds: [testCustomer.id], reason: 'test' })
        .expect(403);
    });

    it('should prevent horizontal privilege escalation', async () => {
      // Create another customer
      const otherCustomer = await prisma.user.create({
        data: {
          email: 'other-customer@test.com',
          name: 'Other Customer',
          role: 'CUSTOMER',
          password: await bcrypt.hash('password', 10)
        }
      });

      const otherCustomerToken = jwt.sign(
        { userId: otherCustomer.id, role: 'CUSTOMER' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      // Customer should not be able to access other customer's data
      await request(app)
        .get(`/api/users/${testCustomer.id}`)
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .expect(403);

      // Cleanup
      await prisma.user.delete({ where: { id: otherCustomer.id } });
    });

    it('should validate resource ownership', async () => {
      // Admin trying to modify their own permissions should require additional confirmation
      await request(app)
        .put(`/api/admin/users/${testAdmin.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'CUSTOMER' })
        .expect(400); // Should require confirmation

      // Admin should not be able to delete themselves
      await request(app)
        .delete(`/api/admin/users/${testAdmin.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('Input Validation Security', () => {
    it('should prevent SQL injection attacks', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; UPDATE users SET role='ADMIN' WHERE id='1'; --",
        "' UNION SELECT * FROM users WHERE role='ADMIN' --"
      ];

      for (const payload of sqlInjectionPayloads) {
        await request(app)
          .get('/api/admin/users/search')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ q: payload })
          .expect(200); // Should not crash, should sanitize input

        await request(app)
          .put(`/api/admin/users/${testCustomer.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: payload })
          .expect(200); // Should sanitize input
      }
    });

    it('should prevent XSS attacks', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '"><script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')">'
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .put(`/api/admin/users/${testCustomer.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: payload })
          .expect(200);

        // Response should not contain unescaped script tags
        expect(response.body.name).not.toContain('<script>');
        expect(response.body.name).not.toContain('javascript:');
      }
    });

    it('should validate input lengths and formats', async () => {
      // Test extremely long inputs
      const longString = 'a'.repeat(10000);
      
      await request(app)
        .put(`/api/admin/users/${testCustomer.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: longString })
        .expect(400);

      // Test invalid email formats
      const invalidEmails = [
        'invalid-email',
        '@invalid.com',
        'test@',
        'test..test@example.com'
      ];

      for (const email of invalidEmails) {
        await request(app)
          .put(`/api/admin/users/${testCustomer.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ email })
          .expect(400);
      }
    });

    it('should prevent mass assignment vulnerabilities', async () => {
      // Try to set internal fields that shouldn't be modifiable
      const response = await request(app)
        .put(`/api/admin/users/${testCustomer.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
          id: 'different-id', // Should be ignored
          createdAt: new Date(), // Should be ignored
          password: 'new-password' // Should require special handling
        })
        .expect(200);

      expect(response.body.id).toBe(testCustomer.id); // ID should not change
      expect(response.body.name).toBe('Updated Name'); // Name should update
    });
  });

  describe('Rate Limiting Security', () => {
    it('should enforce rate limits on sensitive endpoints', async () => {
      const sensitiveEndpoints = [
        '/api/admin/bulk/suspend-users',
        '/api/admin/bulk/delete-users',
        '/api/admin/users/search'
      ];

      for (const endpoint of sensitiveEndpoints) {
        // Make many rapid requests
        const requests = Array.from({ length: 50 }, () =>
          request(app)
            .post(endpoint)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ userIds: [testCustomer.id], reason: 'rate limit test' })
        );

        const responses = await Promise.allSettled(requests);
        const rateLimitedResponses = responses.filter(
          result => result.status === 'fulfilled' && result.value.status === 429
        );

        expect(rateLimitedResponses.length).toBeGreaterThan(0);
      }
    });

    it('should implement progressive delays for repeated failures', async () => {
      const startTime = Date.now();
      
      // Make multiple failed authentication attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@test.com',
            password: 'wrongpassword'
          })
          .expect(401);
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should take longer due to progressive delays
      expect(totalTime).toBeGreaterThan(1000); // At least 1 second
    });
  });

  describe('Session Security', () => {
    it('should invalidate sessions on role changes', async () => {
      // Create a test user and get their token
      const testUser = await prisma.user.create({
        data: {
          email: 'session-test@test.com',
          name: 'Session Test User',
          role: 'EMPLOYEE',
          password: await bcrypt.hash('password', 10)
        }
      });

      const userToken = jwt.sign(
        { userId: testUser.id, role: 'EMPLOYEE' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      // User should be able to access employee endpoints
      await request(app)
        .get('/api/employee/dashboard')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Admin changes user role
      await request(app)
        .put(`/api/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'CUSTOMER' })
        .expect(200);

      // Old token should be invalidated
      await request(app)
        .get('/api/employee/dashboard')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(401);

      // Cleanup
      await prisma.user.delete({ where: { id: testUser.id } });
    });

    it('should enforce session timeouts', async () => {
      // Create token with very short expiration
      const shortToken = jwt.sign(
        { userId: testAdmin.id, role: 'ADMIN' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1s' }
      );

      // Token should work initially
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${shortToken}`)
        .expect(200);

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Token should be expired
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${shortToken}`)
        .expect(401);
    });
  });

  describe('Data Protection Security', () => {
    it('should not expose sensitive data in responses', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Check that passwords are not included
      response.body.users.forEach(user => {
        expect(user).not.toHaveProperty('password');
        expect(user).not.toHaveProperty('passwordHash');
      });
    });

    it('should mask sensitive data in audit logs', async () => {
      // Perform an action that should be audited
      await request(app)
        .put(`/api/admin/users/${testCustomer.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      // Check audit logs
      const auditResponse = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Audit logs should not contain sensitive information
      auditResponse.body.logs.forEach(log => {
        if (log.changes) {
          expect(JSON.stringify(log.changes)).not.toContain('password');
          expect(JSON.stringify(log.changes)).not.toContain('ssn');
          expect(JSON.stringify(log.changes)).not.toContain('creditCard');
        }
      });
    });

    it('should implement proper data encryption for exports', async () => {
      const response = await request(app)
        .get('/api/admin/users/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ format: 'csv' })
        .expect(200);

      // Exported data should not contain raw sensitive information
      expect(response.text).not.toContain('password');
      expect(response.text).not.toContain('ssn');
    });
  });

  describe('CSRF Protection', () => {
    it('should require CSRF tokens for state-changing operations', async () => {
      // Attempt bulk operation without CSRF token
      await request(app)
        .post('/api/admin/bulk/suspend-users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Origin', 'https://malicious-site.com')
        .send({ userIds: [testCustomer.id], reason: 'test' })
        .expect(403); // Should be blocked by CSRF protection
    });

    it('should validate origin headers', async () => {
      const maliciousOrigins = [
        'https://evil.com',
        'http://localhost:3001', // Different port
        'https://admin-panel.evil.com'
      ];

      for (const origin of maliciousOrigins) {
        await request(app)
          .post('/api/admin/bulk/suspend-users')
          .set('Authorization', `Bearer ${adminToken}`)
          .set('Origin', origin)
          .send({ userIds: [testCustomer.id], reason: 'test' })
          .expect(403);
      }
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
      expect(response.headers['strict-transport-security']).toBeDefined();
    });

    it('should set appropriate content security policy', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });
  });

  describe('Audit Trail Security', () => {
    it('should log all administrative actions', async () => {
      const initialAuditCount = await prisma.auditLog.count();

      // Perform various admin actions
      await request(app)
        .put(`/api/admin/users/${testCustomer.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Audit Test Name' })
        .expect(200);

      await request(app)
        .post('/api/admin/bulk/suspend-users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userIds: [testCustomer.id], reason: 'audit test' })
        .expect(200);

      const finalAuditCount = await prisma.auditLog.count();
      expect(finalAuditCount).toBeGreaterThan(initialAuditCount);
    });

    it('should prevent audit log tampering', async () => {
      // Try to delete audit logs (should be forbidden)
      await request(app)
        .delete('/api/admin/audit-logs/some-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      // Try to modify audit logs (should be forbidden)
      await request(app)
        .put('/api/admin/audit-logs/some-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'MODIFIED_ACTION' })
        .expect(403);
    });
  });
});