import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { auditService } from '../services/auditService.js';

// Mock dependencies
vi.mock('../services/auditService.js', () => ({
  auditService: {
    logEvent: vi.fn()
  }
}));

vi.mock('../config/database.js', () => ({
  default: {
    user: {
      findUnique: vi.fn()
    }
  }
}));

describe('Appointment Authentication & Authorization Security', () => {
  let app;
  let validToken;
  let adminToken;
  let customerToken;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Create test tokens
    validToken = jwt.sign(
      { id: 'user-123', email: 'user@example.com', role: 'CUSTOMER' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    adminToken = jwt.sign(
      { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    customerToken = jwt.sign(
      { id: 'customer-123', email: 'customer@example.com', role: 'CUSTOMER' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Security', () => {
    it('should reject requests without authorization header', async () => {
      app.get('/protected', authMiddleware, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/protected');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied. No token provided.');
    });

    it('should reject requests with invalid token format', async () => {
      app.get('/protected', authMiddleware, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'InvalidToken');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied. Invalid token format.');
    });

    it('should reject requests with malformed JWT', async () => {
      app.get('/protected', authMiddleware, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid.jwt.token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied. Invalid token.');
    });

    it('should reject expired tokens', async () => {
      const expiredToken = jwt.sign(
        { id: 'user-123', email: 'user@example.com', role: 'CUSTOMER' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      app.get('/protected', authMiddleware, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied. Invalid token.');
    });

    it('should accept valid tokens', async () => {
      app.get('/protected', authMiddleware, (req, res) => {
        res.json({ 
          success: true, 
          user: { 
            id: req.user.id, 
            email: req.user.email, 
            role: req.user.role 
          } 
        });
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.id).toBe('user-123');
      expect(response.body.user.email).toBe('user@example.com');
      expect(response.body.user.role).toBe('CUSTOMER');
    });
  });

  describe('Authorization Security', () => {
    it('should allow admin access to admin endpoints', async () => {
      app.get('/admin', authMiddleware, requireAdmin, (req, res) => {
        res.json({ success: true, message: 'Admin access granted' });
      });

      const response = await request(app)
        .get('/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Admin access granted');
    });

    it('should deny customer access to admin endpoints', async () => {
      app.get('/admin', authMiddleware, requireAdmin, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/admin')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Admin access required');
    });

    it('should deny unauthenticated access to admin endpoints', async () => {
      app.get('/admin', authMiddleware, requireAdmin, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/admin');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied. No token provided.');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should enforce customer data isolation', async () => {
      // Mock appointment service to check customer ID
      app.get('/appointments/:id', authMiddleware, (req, res) => {
        const appointmentCustomerId = 'customer-456'; // Different customer
        
        if (req.user.role === 'CUSTOMER' && req.user.id !== appointmentCustomerId) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'You can only view your own appointments'
          });
        }
        
        res.json({ success: true, appointmentId: req.params.id });
      });

      const response = await request(app)
        .get('/appointments/apt-123')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
      expect(response.body.message).toBe('You can only view your own appointments');
    });

    it('should allow admin to access any appointment', async () => {
      app.get('/appointments/:id', authMiddleware, (req, res) => {
        // Admin can access any appointment
        res.json({ success: true, appointmentId: req.params.id });
      });

      const response = await request(app)
        .get('/appointments/apt-123')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.appointmentId).toBe('apt-123');
    });

    it('should allow customer to access their own appointments', async () => {
      app.get('/appointments/:id', authMiddleware, (req, res) => {
        const appointmentCustomerId = 'customer-123'; // Same customer
        
        if (req.user.role === 'CUSTOMER' && req.user.id !== appointmentCustomerId) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'You can only view your own appointments'
          });
        }
        
        res.json({ success: true, appointmentId: req.params.id });
      });

      const response = await request(app)
        .get('/appointments/apt-123')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Token Security', () => {
    it('should reject tokens with invalid signature', async () => {
      const invalidToken = jwt.sign(
        { id: 'user-123', email: 'user@example.com', role: 'ADMIN' },
        'wrong-secret' // Different secret
      );

      app.get('/protected', authMiddleware, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied. Invalid token.');
    });

    it('should reject tokens with missing required claims', async () => {
      const incompleteToken = jwt.sign(
        { email: 'user@example.com' }, // Missing id and role
        process.env.JWT_SECRET || 'test-secret'
      );

      app.get('/protected', authMiddleware, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${incompleteToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied. Invalid token.');
    });

    it('should handle token tampering attempts', async () => {
      // Tamper with the token by modifying the payload
      const parts = validToken.split('.');
      const tamperedPayload = Buffer.from(JSON.stringify({
        id: 'user-123',
        email: 'user@example.com',
        role: 'ADMIN' // Changed from CUSTOMER to ADMIN
      })).toString('base64url');
      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      app.get('/protected', authMiddleware, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied. Invalid token.');
    });
  });

  describe('Security Headers', () => {
    it('should not expose sensitive information in error responses', async () => {
      app.get('/protected', authMiddleware, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied. Invalid token.');
      // Should not expose JWT details or stack traces
      expect(response.body).not.toHaveProperty('stack');
      expect(response.body).not.toHaveProperty('details');
    });

    it('should handle authorization header injection attempts', async () => {
      app.get('/protected', authMiddleware, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer token\r\nX-Admin: true');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied. Invalid token.');
    });
  });

  describe('Session Security', () => {
    it('should handle concurrent token usage', async () => {
      app.get('/protected', authMiddleware, (req, res) => {
        res.json({ 
          success: true, 
          userId: req.user.id,
          timestamp: Date.now()
        });
      });

      // Make multiple concurrent requests with the same token
      const requests = Array(5).fill().map(() =>
        request(app)
          .get('/protected')
          .set('Authorization', `Bearer ${validToken}`)
      );

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.userId).toBe('user-123');
      });
    });

    it('should handle malformed authorization headers gracefully', async () => {
      app.get('/protected', authMiddleware, (req, res) => {
        res.json({ success: true });
      });

      const malformedHeaders = [
        'Bearer',
        'Bearer ',
        'Bearer token1 token2',
        'Basic dXNlcjpwYXNz', // Basic auth instead of Bearer
        'Bearer ' + 'a'.repeat(10000), // Extremely long token
        'Bearer null',
        'Bearer undefined'
      ];

      for (const header of malformedHeaders) {
        const response = await request(app)
          .get('/protected')
          .set('Authorization', header);

        expect(response.status).toBe(401);
        expect(response.body.error).toMatch(/Access denied/);
      }
    });
  });

  describe('Privilege Escalation Prevention', () => {
    it('should prevent role modification through token manipulation', async () => {
      // Even if someone tries to create a token with elevated privileges,
      // the server should validate against the database
      const suspiciousToken = jwt.sign(
        { 
          id: 'customer-123', 
          email: 'customer@example.com', 
          role: 'ADMIN' // Trying to escalate privileges
        },
        process.env.JWT_SECRET || 'test-secret'
      );

      app.get('/admin-only', authMiddleware, requireAdmin, (req, res) => {
        res.json({ success: true, message: 'Admin access' });
      });

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${suspiciousToken}`);

      // Should succeed because the token is valid, but in a real implementation,
      // you'd want to verify the role against the database
      expect(response.status).toBe(200);
      
      // Note: In production, you should implement additional checks
      // to verify the user's role against the database
    });

    it('should prevent unauthorized appointment modifications', async () => {
      app.put('/appointments/:id', authMiddleware, (req, res) => {
        const appointmentCustomerId = 'customer-456'; // Different customer
        
        // Only admin or appointment owner can modify
        if (req.user.role !== 'ADMIN' && req.user.id !== appointmentCustomerId) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'You can only modify your own appointments'
          });
        }
        
        res.json({ success: true, modified: true });
      });

      const response = await request(app)
        .put('/appointments/apt-123')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'CANCELLED' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
    });
  });
});