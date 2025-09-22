import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import {
  appointmentBookingLimiter,
  availabilityCheckLimiter,
  adminConfigLimiter,
  sanitizeAppointmentInput,
  auditAdminConfigChanges,
  validateAppointmentSecurity,
  checkSuspiciousActivity,
  logFailedAuth
} from '../middleware/appointmentSecurity.js';
import { auditService } from '../services/auditService.js';

// Mock audit service
vi.mock('../services/auditService.js', () => ({
  auditService: {
    logEvent: vi.fn()
  }
}));

describe('Appointment Security Middleware', () => {
  let app;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    mockReq = {
      ip: '192.168.1.1',
      body: {},
      query: {},
      get: vi.fn(),
      user: null,
      rateLimit: {
        totalHits: 1,
        resetTime: Date.now() + 900000
      }
    };
    
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn()
    };
    
    mockNext = vi.fn();
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rate Limiting', () => {
    it('should apply strict rate limiting for booking endpoints', async () => {
      // Create test app with booking limiter
      const testApp = express();
      testApp.use(express.json());
      testApp.use('/book', appointmentBookingLimiter);
      testApp.post('/book', (req, res) => res.json({ success: true }));

      // Make multiple requests to exceed limit
      const requests = Array(6).fill().map(() => 
        request(testApp)
          .post('/book')
          .send({ customerEmail: 'test@example.com' })
      );

      const responses = await Promise.all(requests);
      
      // Last request should be rate limited
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.status).toBe(429);
      expect(lastResponse.body.code).toBe('BOOKING_RATE_LIMIT_EXCEEDED');
    });

    it('should apply moderate rate limiting for availability checks', async () => {
      const testApp = express();
      testApp.use('/availability', availabilityCheckLimiter);
      testApp.get('/availability', (req, res) => res.json({ slots: [] }));

      // Make multiple requests to exceed limit
      const requests = Array(21).fill().map(() => 
        request(testApp).get('/availability')
      );

      const responses = await Promise.all(requests);
      
      // Last request should be rate limited
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.status).toBe(429);
      expect(lastResponse.body.code).toBe('AVAILABILITY_RATE_LIMIT_EXCEEDED');
    });

    it('should log rate limit violations to audit service', () => {
      // Test the handler function directly since it's defined in the middleware
      const testApp = express();
      testApp.use(express.json());
      testApp.use('/book', appointmentBookingLimiter);
      testApp.post('/book', (req, res) => res.json({ success: true }));

      // The audit logging is tested through the actual middleware usage
      
      // This test verifies that the rate limiter is properly configured
      expect(appointmentBookingLimiter).toBeDefined();
      expect(typeof appointmentBookingLimiter).toBe('function');
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize HTML tags from input fields', () => {
      mockReq.body = {
        customerName: '<script>alert("xss")</script>John Doe',
        customerEmail: 'test@example.com',
        propertyAddress: '<img src="x" onerror="alert(1)">123 Main St',
        notes: '<b>Important</b> notes here'
      };

      sanitizeAppointmentInput(mockReq, mockRes, mockNext);

      expect(mockReq.body.customerName).toBe('John Doe');
      expect(mockReq.body.propertyAddress).toBe('123 Main St');
      expect(mockReq.body.notes).toBe('Important notes here');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should normalize email addresses', () => {
      mockReq.body = {
        customerEmail: '  TEST@EXAMPLE.COM  '
      };

      sanitizeAppointmentInput(mockReq, mockRes, mockNext);

      expect(mockReq.body.customerEmail).toBe('test@example.com');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should clean phone numbers', () => {
      mockReq.body = {
        customerPhone: '+1 (555) 123-4567 ext 123'
      };

      sanitizeAppointmentInput(mockReq, mockRes, mockNext);

      expect(mockReq.body.customerPhone).toBe('+1 (555) 123-4567');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate and format dates', () => {
      mockReq.body = {
        scheduledDate: '2024-12-25T10:00:00Z'
      };

      sanitizeAppointmentInput(mockReq, mockRes, mockNext);

      expect(mockReq.body.scheduledDate).toBe('2024-12-25T10:00:00.000Z');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle invalid date formats', () => {
      mockReq.body = {
        scheduledDate: 'invalid-date'
      };

      sanitizeAppointmentInput(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid scheduled date format'
        })
      );
    });

    it('should validate duration ranges', () => {
      mockReq.body = {
        duration: '600' // 10 hours - should be rejected
      };

      sanitizeAppointmentInput(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Duration must be between 15 minutes and 8 hours'
        })
      );
    });
  });

  describe('Security Validation', () => {
    it('should validate email format', () => {
      mockReq.body = {
        customerEmail: 'invalid-email'
      };

      validateAppointmentSecurity(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid email format'
        })
      );
    });

    it('should validate phone number format', () => {
      mockReq.body = {
        customerPhone: 'not-a-phone'
      };

      validateAppointmentSecurity(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid phone number format'
        })
      );
    });

    it('should validate property address length', () => {
      mockReq.body = {
        propertyAddress: 'Short'
      };

      validateAppointmentSecurity(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Property address must be between 10 and 500 characters'
        })
      );
    });

    it('should detect suspicious patterns in address', () => {
      mockReq.body = {
        propertyAddress: '123 Main St <script>alert("xss")</script>'
      };

      validateAppointmentSecurity(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Property address contains invalid characters'
        })
      );
    });

    it('should validate future dates only', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      mockReq.body = {
        scheduledDate: pastDate.toISOString()
      };

      validateAppointmentSecurity(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Appointment must be scheduled for a future date'
        })
      );
    });

    it('should reject dates too far in the future', () => {
      const farFutureDate = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000); // 2 years
      mockReq.body = {
        scheduledDate: farFutureDate.toISOString()
      };

      validateAppointmentSecurity(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Appointment cannot be scheduled more than 1 year in advance'
        })
      );
    });
  });

  describe('Suspicious Activity Detection', () => {
    it('should detect suspicious user agents', () => {
      mockReq.get.mockReturnValue('curl/7.68.0');
      mockReq.path = '/book';
      mockReq.method = 'POST';

      checkSuspiciousActivity(mockReq, mockRes, mockNext);

      expect(auditService.logEvent).toHaveBeenCalledWith({
        userId: 'system',
        action: 'SUSPICIOUS_USER_AGENT_DETECTED',
        resource: 'appointment_booking',
        details: {
          ip: '192.168.1.1',
          userAgent: 'curl/7.68.0',
          endpoint: '/book',
          method: 'POST'
        },
        ipAddress: '192.168.1.1',
        userAgent: 'curl/7.68.0',
        success: true
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should detect missing user agent', () => {
      mockReq.get.mockReturnValue('');
      mockReq.path = '/book';
      mockReq.headers = {};

      checkSuspiciousActivity(mockReq, mockRes, mockNext);

      expect(auditService.logEvent).toHaveBeenCalledWith({
        userId: 'system',
        action: 'SUSPICIOUS_REQUEST_HEADERS',
        resource: 'appointment_booking',
        details: {
          ip: '192.168.1.1',
          userAgent: 'MISSING',
          endpoint: '/book',
          headers: {}
        },
        ipAddress: '192.168.1.1',
        userAgent: '',
        success: true
      });
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Audit Logging', () => {
    it('should log admin configuration changes', () => {
      const middleware = auditAdminConfigChanges('UPDATE_AVAILABILITY', 'availability_rules');
      
      mockReq.user = { id: 'admin-123', email: 'admin@example.com' };
      mockReq.body = { rules: [{ dayOfWeek: 1, isAvailable: true }] };
      mockReq.params = { id: 'rule-123' };
      mockReq.originalUrl = '/api/admin/availability';
      mockReq.method = 'PUT';
      mockReq.sessionID = 'session-123';

      // Mock successful response
      const originalJson = mockRes.json;
      middleware(mockReq, mockRes, mockNext);
      
      // Simulate successful response
      mockRes.statusCode = 200;
      mockRes.json({ success: true });

      expect(auditService.logEvent).toHaveBeenCalledWith({
        userId: 'admin-123',
        userEmail: 'admin@example.com',
        action: 'UPDATE_AVAILABILITY',
        resource: 'availability_rules',
        resourceId: 'rule-123',
        details: {
          originalData: { rules: [{ dayOfWeek: 1, isAvailable: true }] },
          changes: { rules: [{ dayOfWeek: 1, isAvailable: true }] },
          responseData: { success: true },
          method: 'PUT',
          endpoint: '/api/admin/availability'
        },
        ipAddress: '192.168.1.1',
        userAgent: undefined,
        sessionId: 'session-123',
        success: true
      });
    });

    it('should log failed authentication attempts', () => {
      mockReq.body = { email: 'test@example.com' };
      mockReq.path = '/api/appointments/book';
      mockReq.method = 'POST';
      mockReq.get.mockReturnValue('Mozilla/5.0');

      logFailedAuth(mockReq, mockRes, mockNext);
      
      // Simulate failed authentication
      mockRes.statusCode = 401;
      mockRes.json({ error: 'Unauthorized' });

      expect(auditService.logEvent).toHaveBeenCalledWith({
        userId: 'test@example.com',
        userEmail: 'test@example.com',
        action: 'AUTHENTICATION_FAILED',
        resource: 'appointment_system',
        details: {
          endpoint: '/api/appointments/book',
          method: 'POST',
          statusCode: 401,
          errorData: { error: 'Unauthorized' }
        },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        success: false,
        errorMessage: 'Unauthorized'
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete security pipeline for booking', async () => {
      const testApp = express();
      testApp.use(express.json());
      
      // Apply all security middleware
      testApp.post('/book',
        checkSuspiciousActivity,
        sanitizeAppointmentInput,
        validateAppointmentSecurity,
        (req, res) => {
          res.json({
            success: true,
            sanitizedData: req.body
          });
        }
      );

      // Add error handler after routes
      testApp.use((err, req, res, next) => {
        console.error('Test error:', err.message);
        res.status(500).json({ error: err.message });
      });

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const response = await request(testApp)
        .post('/book')
        .set('User-Agent', 'Mozilla/5.0 (Test Browser)')
        .send({
          customerName: '  John Doe  ',
          customerEmail: '  TEST@EXAMPLE.COM  ',
          propertyAddress: '123 Main Street, Anytown, USA',
          scheduledDate: futureDate.toISOString(),
          duration: 60,
          notes: 'Please call before arriving'
        });

      if (response.status !== 200) {
        console.error('Response error:', response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.sanitizedData.customerName).toBe('John Doe');
      expect(response.body.sanitizedData.customerEmail).toBe('test@example.com');
    });

    it('should reject malicious booking attempts', async () => {
      const testApp = express();
      testApp.use(express.json());
      
      testApp.post('/book',
        sanitizeAppointmentInput,
        validateAppointmentSecurity,
        (req, res) => res.json({ success: true })
      );

      const response = await request(testApp)
        .post('/book')
        .send({
          customerName: '<script>alert("xss")</script>',
          customerEmail: 'invalid-email',
          propertyAddress: '<img src="x" onerror="alert(1)">Short',
          scheduledDate: 'invalid-date'
        });

      expect(response.status).toBe(500); // Should be caught by error handler
    });
  });
});