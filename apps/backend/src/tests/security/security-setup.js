import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Global test database instance
let testPrisma;

beforeAll(async () => {
  // Initialize test database
  testPrisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./test-security.db'
      }
    }
  });

  // Run database migrations for security tests
  try {
    await testPrisma.$executeRaw`PRAGMA foreign_keys = ON`;
    
    // Create test tables if they don't exist
    await testPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS User (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'CUSTOMER',
        password TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        lastLoginAt DATETIME,
        suspendedAt DATETIME,
        suspensionReason TEXT,
        credits INTEGER DEFAULT 0
      )
    `;

    await testPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS AuditLog (
        id TEXT PRIMARY KEY,
        adminId TEXT NOT NULL,
        action TEXT NOT NULL,
        entityType TEXT NOT NULL,
        entityId TEXT NOT NULL,
        changes TEXT,
        metadata TEXT,
        severity TEXT NOT NULL DEFAULT 'low',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (adminId) REFERENCES User(id)
      )
    `;

    await testPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS SystemAlert (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        severity TEXT NOT NULL,
        acknowledged BOOLEAN DEFAULT FALSE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await testPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS LoginAttempt (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        ipAddress TEXT NOT NULL,
        userAgent TEXT,
        success BOOLEAN NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

  } catch (error) {
    console.warn('Database setup warning:', error.message);
  }
});

afterAll(async () => {
  // Clean up test database
  if (testPrisma) {
    await testPrisma.$disconnect();
  }
});

beforeEach(async () => {
  // Clear test data before each test
  if (testPrisma) {
    try {
      await testPrisma.loginAttempt.deleteMany();
      await testPrisma.systemAlert.deleteMany();
      await testPrisma.auditLog.deleteMany();
      await testPrisma.user.deleteMany();
    } catch (error) {
      console.warn('Test cleanup warning:', error.message);
    }
  }
});

afterEach(async () => {
  // Additional cleanup after each test if needed
});

// Security test utilities
global.securityTestUtils = {
  // Generate test JWT tokens
  generateTestToken: (payload, secret = 'test-secret', options = {}) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(payload, secret, { expiresIn: '1h', ...options });
  },

  // Hash passwords for testing
  hashPassword: async (password) => {
    const bcrypt = require('bcryptjs');
    return await bcrypt.hash(password, 10);
  },

  // Create test users with different roles
  createTestUser: async (overrides = {}) => {
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');
    
    const defaultUser = {
      id: uuidv4(),
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      role: 'CUSTOMER',
      password: await bcrypt.hash('testpassword', 10),
      status: 'ACTIVE'
    };

    const userData = { ...defaultUser, ...overrides };
    
    if (testPrisma) {
      return await testPrisma.user.create({ data: userData });
    }
    
    return userData;
  },

  // Simulate rate limiting
  simulateRateLimit: async (endpoint, count = 100) => {
    const requests = [];
    for (let i = 0; i < count; i++) {
      requests.push(
        fetch(`http://localhost:3001${endpoint}`, {
          method: 'GET',
          headers: { 'Authorization': 'Bearer test-token' }
        }).catch(() => null)
      );
    }
    return await Promise.allSettled(requests);
  },

  // Check for common security headers
  checkSecurityHeaders: (response) => {
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security',
      'content-security-policy'
    ];

    const missingHeaders = requiredHeaders.filter(
      header => !response.headers[header]
    );

    return {
      hasAllHeaders: missingHeaders.length === 0,
      missingHeaders,
      headers: response.headers
    };
  },

  // Validate input sanitization
  validateSanitization: (input, output) => {
    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /style\s*=.*?expression\s*\(/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>/gi
    ];

    const foundPatterns = dangerousPatterns.filter(pattern => 
      pattern.test(output)
    );

    return {
      isSafe: foundPatterns.length === 0,
      foundPatterns,
      input,
      output
    };
  },

  // SQL injection detection
  detectSQLInjection: (query, params = []) => {
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      /(--|\/\*|\*\/)/g,
      /(\b(OR|AND)\b\s+\w+\s*=\s*\w+)/gi,
      /('|\"|;|\||&)/g
    ];

    const suspiciousParams = params.filter(param => 
      typeof param === 'string' && 
      sqlInjectionPatterns.some(pattern => pattern.test(param))
    );

    return {
      isSuspicious: suspiciousParams.length > 0,
      suspiciousParams,
      query,
      params
    };
  },

  // XSS detection
  detectXSS: (input) => {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<img[^>]*onerror[^>]*>/gi,
      /<[^>]*on\w+[^>]*>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /<iframe[^>]*>/gi
    ];

    const foundPatterns = xssPatterns.filter(pattern => pattern.test(input));

    return {
      isXSS: foundPatterns.length > 0,
      foundPatterns,
      input
    };
  },

  // CSRF token validation
  validateCSRFToken: (token, expectedToken) => {
    return {
      isValid: token === expectedToken,
      provided: token,
      expected: expectedToken
    };
  },

  // Timing attack detection
  measureResponseTime: async (requestFn, iterations = 10) => {
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      await requestFn();
      const end = process.hrtime.bigint();
      times.push(Number(end - start) / 1000000); // Convert to milliseconds
    }

    const average = times.reduce((a, b) => a + b, 0) / times.length;
    const variance = times.reduce((acc, time) => acc + Math.pow(time - average, 2), 0) / times.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      times,
      average,
      variance,
      standardDeviation,
      isConsistent: standardDeviation < (average * 0.1) // Less than 10% variance
    };
  }
};

// Mock external services for security testing
global.mockExternalServices = {
  // Mock email service
  emailService: {
    send: jest.fn().mockResolvedValue({ success: true }),
    sendBulk: jest.fn().mockResolvedValue({ success: true })
  },

  // Mock SMS service
  smsService: {
    send: jest.fn().mockResolvedValue({ success: true })
  },

  // Mock file storage service
  storageService: {
    upload: jest.fn().mockResolvedValue({ url: 'https://example.com/file.jpg' }),
    delete: jest.fn().mockResolvedValue({ success: true })
  },

  // Mock payment service
  paymentService: {
    charge: jest.fn().mockResolvedValue({ success: true, transactionId: 'test-123' }),
    refund: jest.fn().mockResolvedValue({ success: true })
  }
};

// Security test environment configuration
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-for-security-tests';
process.env.RATE_LIMIT_ENABLED = 'true';
process.env.SECURITY_HEADERS_ENABLED = 'true';
process.env.CSRF_PROTECTION_ENABLED = 'true';
process.env.SQL_INJECTION_PROTECTION_ENABLED = 'true';
process.env.XSS_PROTECTION_ENABLED = 'true';

// Disable console logs during security tests unless explicitly needed
if (!process.env.SECURITY_TEST_VERBOSE) {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
}

// Export test database instance for use in tests
global.testPrisma = testPrisma;