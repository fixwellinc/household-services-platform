import crypto from 'crypto';
import { monitor } from '../config/performance.js';

// PCI DSS Compliance utilities
class PCIComplianceValidator {
  constructor() {
    this.sensitiveFields = [
      'cardNumber',
      'cvv',
      'expiryDate',
      'cardholderName',
      'bankAccount',
      'routingNumber',
      'ssn',
      'taxId'
    ];
    
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateEncryptionKey();
    this.algorithm = 'aes-256-gcm';
  }

  generateEncryptionKey() {
    // In production, this should be loaded from a secure key management service
    return crypto.randomBytes(32);
  }

  // Encrypt sensitive data
  encrypt(data) {
    const startTime = monitor.startTimer('pci_encrypt');
    
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
      cipher.setAAD(Buffer.from('pci-data'));
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      const result = {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
      
      monitor.endTimer('pci_encrypt', startTime, { success: true });
      return result;
    } catch (error) {
      monitor.endTimer('pci_encrypt', startTime, { success: false, error: error.message });
      throw new Error('Encryption failed');
    }
  }

  // Decrypt sensitive data
  decrypt(encryptedData) {
    const startTime = monitor.startTimer('pci_decrypt');
    
    try {
      const { encrypted, iv, authTag } = encryptedData;
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      
      decipher.setAAD(Buffer.from('pci-data'));
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      const result = JSON.parse(decrypted);
      monitor.endTimer('pci_decrypt', startTime, { success: true });
      return result;
    } catch (error) {
      monitor.endTimer('pci_decrypt', startTime, { success: false, error: error.message });
      throw new Error('Decryption failed');
    }
  }

  // Mask sensitive data for logging
  maskSensitiveData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const masked = { ...data };
    
    for (const field of this.sensitiveFields) {
      if (masked[field]) {
        if (field === 'cardNumber') {
          // Show only last 4 digits
          masked[field] = `****-****-****-${masked[field].slice(-4)}`;
        } else if (field === 'cvv') {
          masked[field] = '***';
        } else if (field === 'expiryDate') {
          masked[field] = '**/**';
        } else {
          masked[field] = '*'.repeat(Math.min(masked[field].length, 8));
        }
      }
    }

    return masked;
  }

  // Validate PCI compliance for payment data
  validatePaymentData(paymentData) {
    const violations = [];
    
    // Check for prohibited storage of sensitive authentication data
    if (paymentData.cvv) {
      violations.push({
        severity: 'HIGH',
        code: 'PCI_DSS_3.2',
        message: 'CVV must not be stored after authorization'
      });
    }

    if (paymentData.cardNumber && !this.isTokenized(paymentData.cardNumber)) {
      violations.push({
        severity: 'HIGH',
        code: 'PCI_DSS_3.4',
        message: 'Primary Account Number (PAN) must be masked or tokenized'
      });
    }

    // Check encryption requirements
    if (paymentData.cardholderData && !paymentData.encrypted) {
      violations.push({
        severity: 'MEDIUM',
        code: 'PCI_DSS_4.1',
        message: 'Cardholder data must be encrypted during transmission'
      });
    }

    return {
      compliant: violations.length === 0,
      violations
    };
  }

  // Check if data is tokenized (Stripe token format)
  isTokenized(data) {
    if (typeof data !== 'string') return false;
    
    // Stripe token patterns
    const tokenPatterns = [
      /^tok_[a-zA-Z0-9]{24}$/, // Payment method token
      /^pm_[a-zA-Z0-9]{24}$/,  // Payment method
      /^card_[a-zA-Z0-9]{24}$/, // Card token
      /^src_[a-zA-Z0-9]{24}$/   // Source token
    ];

    return tokenPatterns.some(pattern => pattern.test(data));
  }

  // Audit payment data access
  auditDataAccess(userId, action, dataType, metadata = {}) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      userId,
      action, // 'READ', 'WRITE', 'DELETE', 'ENCRYPT', 'DECRYPT'
      dataType, // 'PAYMENT_METHOD', 'SUBSCRIPTION', 'BILLING_INFO'
      metadata: this.maskSensitiveData(metadata),
      ipAddress: metadata.ipAddress || 'unknown',
      userAgent: metadata.userAgent || 'unknown'
    };

    // In production, this should be sent to a secure audit log service
    console.log('🔒 PCI Audit Log:', JSON.stringify(auditEntry));
    
    return auditEntry;
  }

  // Generate secure random tokens
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Validate secure transmission
  validateSecureTransmission(req) {
    const violations = [];

    // Check HTTPS
    if (!req.secure && req.get('X-Forwarded-Proto') !== 'https') {
      violations.push({
        severity: 'HIGH',
        code: 'PCI_DSS_4.1',
        message: 'Payment data must be transmitted over HTTPS'
      });
    }

    // Check TLS version (if available in headers)
    const tlsVersion = req.get('X-TLS-Version');
    if (tlsVersion && parseFloat(tlsVersion) < 1.2) {
      violations.push({
        severity: 'HIGH',
        code: 'PCI_DSS_4.1',
        message: 'TLS version must be 1.2 or higher'
      });
    }

    return {
      secure: violations.length === 0,
      violations
    };
  }

  // Data retention compliance
  validateDataRetention(data, retentionPolicy) {
    const now = new Date();
    const createdAt = new Date(data.createdAt);
    const ageInDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

    const violations = [];

    if (ageInDays > retentionPolicy.maxRetentionDays) {
      violations.push({
        severity: 'MEDIUM',
        code: 'PCI_DSS_3.1',
        message: `Data exceeds retention policy (${ageInDays} days > ${retentionPolicy.maxRetentionDays} days)`
      });
    }

    // Check for unnecessary data storage
    if (data.cvv || data.pin || data.magneticStripeData) {
      violations.push({
        severity: 'HIGH',
        code: 'PCI_DSS_3.2',
        message: 'Sensitive authentication data must not be stored'
      });
    }

    return {
      compliant: violations.length === 0,
      violations,
      ageInDays
    };
  }
}

// Access control validation
class AccessControlValidator {
  constructor() {
    this.rolePermissions = {
      'CUSTOMER': ['read:own_subscription', 'update:own_payment_method'],
      'ADMIN': ['read:all_subscriptions', 'update:all_subscriptions', 'delete:subscriptions'],
      'SUPPORT': ['read:customer_data', 'update:customer_subscription'],
      'BILLING': ['read:billing_data', 'process:payments', 'refund:payments']
    };
  }

  // Validate user access to subscription data
  validateSubscriptionAccess(user, subscriptionId, action) {
    const startTime = monitor.startTimer('access_control_validation');
    
    try {
      const violations = [];

      // Check if user has required role
      const requiredPermission = `${action}:subscriptions`;
      const userPermissions = this.rolePermissions[user.role] || [];

      if (!userPermissions.some(perm => 
        perm === requiredPermission || 
        perm === `${action}:all_subscriptions` ||
        (perm === `${action}:own_subscription` && user.subscriptionId === subscriptionId)
      )) {
        violations.push({
          severity: 'HIGH',
          code: 'ACCESS_DENIED',
          message: `User ${user.id} does not have permission for ${action} on subscription ${subscriptionId}`
        });
      }

      // Check for privilege escalation attempts
      if (action === 'delete' && user.role === 'CUSTOMER') {
        violations.push({
          severity: 'HIGH',
          code: 'PRIVILEGE_ESCALATION',
          message: 'Customer role cannot perform delete operations'
        });
      }

      const result = {
        authorized: violations.length === 0,
        violations
      };

      monitor.endTimer('access_control_validation', startTime, { 
        authorized: result.authorized,
        userId: user.id,
        action,
        subscriptionId
      });

      return result;
    } catch (error) {
      monitor.endTimer('access_control_validation', startTime, { 
        error: error.message,
        userId: user.id,
        action
      });
      throw error;
    }
  }

  // Validate family member access
  validateFamilyMemberAccess(user, familyMemberId, action) {
    // Family members can only access their own data or data they're authorized for
    const violations = [];

    if (action === 'create' && user.role !== 'CUSTOMER') {
      violations.push({
        severity: 'MEDIUM',
        code: 'INVALID_ROLE',
        message: 'Only customers can add family members'
      });
    }

    if (action === 'delete' && user.role === 'FAMILY_MEMBER') {
      violations.push({
        severity: 'MEDIUM',
        code: 'INSUFFICIENT_PRIVILEGES',
        message: 'Family members cannot remove other family members'
      });
    }

    return {
      authorized: violations.length === 0,
      violations
    };
  }

  // Validate credit manipulation prevention
  validateCreditManipulation(user, creditOperation) {
    const violations = [];

    // Only allow legitimate credit operations
    const allowedOperations = ['earn_referral', 'earn_loyalty', 'redeem_billing', 'expire_unused'];
    
    if (!allowedOperations.includes(creditOperation.type)) {
      violations.push({
        severity: 'HIGH',
        code: 'INVALID_CREDIT_OPERATION',
        message: `Invalid credit operation: ${creditOperation.type}`
      });
    }

    // Prevent manual credit creation by non-admin users
    if (creditOperation.type === 'manual_credit' && user.role !== 'ADMIN') {
      violations.push({
        severity: 'HIGH',
        code: 'UNAUTHORIZED_CREDIT_CREATION',
        message: 'Only admins can create manual credits'
      });
    }

    // Validate credit amounts
    if (creditOperation.amount > 1000) { // $1000 limit
      violations.push({
        severity: 'MEDIUM',
        code: 'EXCESSIVE_CREDIT_AMOUNT',
        message: 'Credit amount exceeds maximum allowed limit'
      });
    }

    // Check for duplicate credit operations
    if (creditOperation.isDuplicate) {
      violations.push({
        severity: 'HIGH',
        code: 'DUPLICATE_CREDIT_OPERATION',
        message: 'Duplicate credit operation detected'
      });
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }
}

// Security middleware
export const pciComplianceMiddleware = (req, res, next) => {
  const pciValidator = new PCIComplianceValidator();
  
  // Validate secure transmission for payment-related endpoints
  if (req.path.includes('/payment') || req.path.includes('/subscription')) {
    const transmissionValidation = pciValidator.validateSecureTransmission(req);
    
    if (!transmissionValidation.secure) {
      return res.status(400).json({
        error: 'Security violation',
        violations: transmissionValidation.violations
      });
    }
  }

  // Add PCI utilities to request
  req.pciValidator = pciValidator;
  next();
};

export const accessControlMiddleware = (requiredAction) => {
  return (req, res, next) => {
    const accessValidator = new AccessControlValidator();
    
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Add access validator to request
    req.accessValidator = accessValidator;
    req.requiredAction = requiredAction;
    
    next();
  };
};

export { PCIComplianceValidator, AccessControlValidator };