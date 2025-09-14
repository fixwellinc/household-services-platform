import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PCIComplianceValidator, AccessControlValidator } from '../security/pciCompliance.js';
import DataProtectionService from '../security/dataProtection.js';

describe('Security and Compliance Tests', () => {
  let pciValidator;
  let accessValidator;
  let dataProtection;

  beforeEach(() => {
    pciValidator = new PCIComplianceValidator();
    accessValidator = new AccessControlValidator();
    dataProtection = new DataProtectionService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('PCI Compliance Validation', () => {
    it('should detect PCI violations in payment data', () => {
      const paymentData = {
        cardNumber: '4111111111111111',
        cvv: '123',
        expiryDate: '12/25',
        cardholderName: 'John Doe'
      };

      const validation = pciValidator.validatePaymentData(paymentData);
      
      expect(validation.compliant).toBe(false);
      expect(validation.violations).toHaveLength(2);
      expect(validation.violations[0].code).toBe('PCI_DSS_3.2');
      expect(validation.violations[1].code).toBe('PCI_DSS_3.4');
    });

    it('should pass validation for tokenized payment data', () => {
      const tokenizedData = {
        paymentMethodId: 'pm_1234567890abcdef12345678',
        customerId: 'cus_1234567890abcdef',
        encrypted: true
      };

      const validation = pciValidator.validatePaymentData(tokenizedData);
      expect(validation.compliant).toBe(true);
      expect(validation.violations).toHaveLength(0);
    });

    it('should correctly identify tokenized data', () => {
      expect(pciValidator.isTokenized('pm_1234567890abcdef12345678')).toBe(true);
      expect(pciValidator.isTokenized('tok_1234567890abcdef12345678')).toBe(true);
      expect(pciValidator.isTokenized('card_1234567890abcdef12345678')).toBe(true);
      expect(pciValidator.isTokenized('4111111111111111')).toBe(false);
      expect(pciValidator.isTokenized('invalid_token')).toBe(false);
    });

    it('should mask sensitive data correctly', () => {
      const sensitiveData = {
        cardNumber: '4111111111111111',
        cvv: '123',
        expiryDate: '12/25',
        cardholderName: 'John Doe',
        email: 'john@example.com'
      };

      const masked = pciValidator.maskSensitiveData(sensitiveData);
      
      expect(masked.cardNumber).toBe('****-****-****-1111');
      expect(masked.cvv).toBe('***');
      expect(masked.expiryDate).toBe('**/**');
      expect(masked.cardholderName).toBe('********');
      expect(masked.email).toBe('john@example.com'); // Not in sensitive fields
    });

    it('should validate secure transmission requirements', () => {
      const insecureReq = {
        secure: false,
        get: vi.fn().mockReturnValue(null)
      };

      const secureReq = {
        secure: true,
        get: vi.fn().mockReturnValue('1.2')
      };

      const insecureValidation = pciValidator.validateSecureTransmission(insecureReq);
      expect(insecureValidation.secure).toBe(false);
      expect(insecureValidation.violations[0].code).toBe('PCI_DSS_4.1');

      const secureValidation = pciValidator.validateSecureTransmission(secureReq);
      expect(secureValidation.secure).toBe(true);
      expect(secureValidation.violations).toHaveLength(0);
    });

    it('should validate data retention policies', () => {
      const oldData = {
        createdAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), // 400 days ago
        cvv: '123' // Should not be stored
      };

      const retentionPolicy = {
        maxRetentionDays: 365
      };

      const validation = pciValidator.validateDataRetention(oldData, retentionPolicy);
      
      expect(validation.compliant).toBe(false);
      expect(validation.violations).toHaveLength(2);
      expect(validation.ageInDays).toBeGreaterThan(365);
    });

    it('should generate audit logs for data access', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const auditEntry = pciValidator.auditDataAccess(
        'user_123',
        'READ',
        'PAYMENT_METHOD',
        { 
          paymentMethodId: 'pm_test123',
          ipAddress: '192.168.1.1',
          cardNumber: '4111111111111111'
        }
      );

      expect(auditEntry.userId).toBe('user_123');
      expect(auditEntry.action).toBe('READ');
      expect(auditEntry.dataType).toBe('PAYMENT_METHOD');
      expect(auditEntry.metadata.cardNumber).toBe('****-****-****-1111');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Access Control Validation', () => {
    it('should validate subscription access for customers', () => {
      const customer = {
        id: 'user_123',
        role: 'CUSTOMER',
        subscriptionId: 'sub_123'
      };

      const validation = accessValidator.validateSubscriptionAccess(
        customer,
        'sub_123',
        'read'
      );

      expect(validation.authorized).toBe(true);
      expect(validation.violations).toHaveLength(0);
    });

    it('should deny access to other customers\' subscriptions', () => {
      const customer = {
        id: 'user_123',
        role: 'CUSTOMER',
        subscriptionId: 'sub_123'
      };

      const validation = accessValidator.validateSubscriptionAccess(
        customer,
        'sub_456', // Different subscription
        'read'
      );

      expect(validation.authorized).toBe(false);
      expect(validation.violations[0].code).toBe('ACCESS_DENIED');
    });

    it('should allow admin access to all subscriptions', () => {
      const admin = {
        id: 'admin_123',
        role: 'ADMIN'
      };

      const validation = accessValidator.validateSubscriptionAccess(
        admin,
        'sub_456',
        'read'
      );

      expect(validation.authorized).toBe(true);
      expect(validation.violations).toHaveLength(0);
    });

    it('should prevent privilege escalation', () => {
      const customer = {
        id: 'user_123',
        role: 'CUSTOMER',
        subscriptionId: 'sub_123'
      };

      const validation = accessValidator.validateSubscriptionAccess(
        customer,
        'sub_123',
        'delete'
      );

      expect(validation.authorized).toBe(false);
      expect(validation.violations[0].code).toBe('PRIVILEGE_ESCALATION');
    });

    it('should validate family member access controls', () => {
      const customer = {
        id: 'user_123',
        role: 'CUSTOMER'
      };

      const familyMember = {
        id: 'user_456',
        role: 'FAMILY_MEMBER'
      };

      const customerValidation = accessValidator.validateFamilyMemberAccess(
        customer,
        'family_789',
        'create'
      );

      const familyValidation = accessValidator.validateFamilyMemberAccess(
        familyMember,
        'family_789',
        'delete'
      );

      expect(customerValidation.authorized).toBe(true);
      expect(familyValidation.authorized).toBe(false);
      expect(familyValidation.violations[0].code).toBe('INSUFFICIENT_PRIVILEGES');
    });

    it('should prevent credit manipulation', () => {
      const customer = {
        id: 'user_123',
        role: 'CUSTOMER'
      };

      const admin = {
        id: 'admin_123',
        role: 'ADMIN'
      };

      const invalidOperation = {
        type: 'manual_credit',
        amount: 100
      };

      const excessiveOperation = {
        type: 'earn_referral',
        amount: 1500 // Exceeds $1000 limit
      };

      const duplicateOperation = {
        type: 'earn_referral',
        amount: 50,
        isDuplicate: true
      };

      const customerValidation = accessValidator.validateCreditManipulation(
        customer,
        invalidOperation
      );

      const excessiveValidation = accessValidator.validateCreditManipulation(
        admin,
        excessiveOperation
      );

      const duplicateValidation = accessValidator.validateCreditManipulation(
        admin,
        duplicateOperation
      );

      expect(customerValidation.valid).toBe(false);
      expect(customerValidation.violations[0].code).toBe('UNAUTHORIZED_CREDIT_CREATION');

      expect(excessiveValidation.valid).toBe(false);
      expect(excessiveValidation.violations[0].code).toBe('EXCESSIVE_CREDIT_AMOUNT');

      expect(duplicateValidation.valid).toBe(false);
      expect(duplicateValidation.violations[0].code).toBe('DUPLICATE_CREDIT_OPERATION');
    });
  });

  describe('Data Protection Service', () => {
    it('should anonymize user data correctly', () => {
      const userData = {
        id: 'user_123',
        email: 'john.doe@example.com',
        name: 'John Doe',
        phone: '+1234567890',
        address: '123 Main St, Anytown, CA 90210',
        subscriptionTier: 'HOMECARE',
        paymentFrequency: 'MONTHLY',
        lifetimeValue: 500
      };

      const anonymized = dataProtection.anonymizeUserData(userData);

      expect(anonymized.name).toBe('Anonymous User');
      expect(anonymized.email).toMatch(/^[a-f0-9]{8}@example\.com$/);
      expect(anonymized.phone).toBe('***-***-7890');
      expect(anonymized.address).toBe('Anytown, CA 90210');
      expect(anonymized.subscriptionTier).toBe('HOMECARE');
      expect(anonymized.lifetimeValue).toBe(500);
    });

    it('should check data retention requirements', async () => {
      const inactiveUser = {
        id: 'user_123',
        createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
        lastActivity: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), // 400 days ago
        subscriptionStatus: 'ACTIVE'
      };

      const cancelledUser = {
        id: 'user_456',
        createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
        lastActivity: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
        subscriptionStatus: 'CANCELLED'
      };

      const retentionPolicies = {
        inactiveUserDays: 365,
        cancelledSubscriptionDays: 90
      };

      const inactiveCheck = await dataProtection.checkDataRetention(
        inactiveUser,
        retentionPolicies
      );

      const cancelledCheck = await dataProtection.checkDataRetention(
        cancelledUser,
        retentionPolicies
      );

      expect(inactiveCheck.actions).toHaveLength(1);
      expect(inactiveCheck.actions[0].action).toBe('ANONYMIZE');

      expect(cancelledCheck.actions).toHaveLength(1);
      expect(cancelledCheck.actions[0].action).toBe('DELETE_PERSONAL_DATA');
    });

    it('should generate GDPR data export', () => {
      const userData = {
        id: 'user_123',
        email: 'john@example.com',
        name: 'John Doe',
        phone: '+1234567890',
        address: '123 Main St',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-12-01'),
        notifications: { email: true, sms: false },
        marketingConsent: true,
        subscription: {
          tier: 'HOMECARE',
          status: 'ACTIVE',
          paymentFrequency: 'MONTHLY',
          createdAt: new Date('2023-01-01'),
          billingHistory: [
            { date: '2023-01-01', amount: 29.99, status: 'paid' }
          ]
        }
      };

      const exportData = dataProtection.generateDataExport(userData, true);

      expect(exportData.userId).toBe('user_123');
      expect(exportData.data.personalInformation.email).toBe('john@example.com');
      expect(exportData.data.subscriptionData.tier).toBe('HOMECARE');
      expect(exportData.data.dataProcessingActivities).toContain('Subscription management');
      expect(exportData.data.dataSharing).toHaveLength(2);
    });

    it('should validate data minimization', () => {
      const subscriptionData = {
        email: 'user@example.com',
        name: 'User Name',
        paymentMethod: 'pm_123',
        socialSecurityNumber: '123-45-6789', // Unnecessary for subscription
        favoriteColor: 'blue' // Unnecessary
      };

      const validation = dataProtection.validateDataMinimization(
        subscriptionData,
        'subscription_management'
      );

      expect(validation.compliant).toBe(false);
      expect(validation.unnecessaryFields).toContain('socialSecurityNumber');
      expect(validation.unnecessaryFields).toContain('favoriteColor');
    });

    it('should validate consent requirements', () => {
      const userWithConsent = {
        marketingConsent: true,
        analyticsConsent: true
      };

      const userWithoutConsent = {
        marketingConsent: false,
        consentWithdrawn: ['analytics']
      };

      const marketingValidation = dataProtection.validateConsent(
        userWithConsent,
        'marketing'
      );

      const analyticsValidation = dataProtection.validateConsent(
        userWithoutConsent,
        'analytics'
      );

      expect(marketingValidation.hasConsent).toBe(true);
      expect(analyticsValidation.hasConsent).toBe(false);
      expect(analyticsValidation.violations[0].code).toBe('CONSENT_WITHDRAWN');
    });

    it('should detect potential data breaches', () => {
      const suspiciousAccess = {
        accessCount: 150,
        timeSpan: 1800, // 30 minutes
        newLocation: true,
        sensitiveDataAccessed: true,
        recordsAccessed: 1500,
        timestamp: new Date('2023-12-01T02:00:00Z') // 2 AM
      };

      const detection = dataProtection.detectPotentialBreach(suspiciousAccess);

      expect(detection.suspicious).toBe(true);
      expect(detection.patterns).toHaveLength(4);
      expect(detection.patterns.map(p => p.type)).toContain('EXCESSIVE_ACCESS');
      expect(detection.patterns.map(p => p.type)).toContain('UNUSUAL_LOCATION');
      expect(detection.patterns.map(p => p.type)).toContain('BULK_ACCESS');
      expect(detection.patterns.map(p => p.type)).toContain('OFF_HOURS_ACCESS');
      expect(detection.riskScore).toBeGreaterThan(5);
    });
  });

  describe('Encryption and Decryption', () => {
    it('should encrypt and decrypt data correctly', () => {
      const sensitiveData = {
        cardNumber: '4111111111111111',
        cvv: '123'
      };

      const encrypted = pciValidator.encrypt(sensitiveData);
      expect(encrypted).toHaveProperty('encrypted');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');

      const decrypted = pciValidator.decrypt(encrypted);
      expect(decrypted).toEqual(sensitiveData);
    });

    it('should fail decryption with tampered data', () => {
      const sensitiveData = { test: 'data' };
      const encrypted = pciValidator.encrypt(sensitiveData);
      
      // Tamper with encrypted data
      encrypted.encrypted = encrypted.encrypted.slice(0, -2) + 'XX';

      expect(() => {
        pciValidator.decrypt(encrypted);
      }).toThrow('Decryption failed');
    });
  });

  describe('Security Token Generation', () => {
    it('should generate secure random tokens', () => {
      const token1 = pciValidator.generateSecureToken(32);
      const token2 = pciValidator.generateSecureToken(32);

      expect(token1).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2); // Should be unique
      expect(token1).toMatch(/^[a-f0-9]+$/); // Should be hex
    });
  });
});