import crypto from 'crypto';
import { monitor } from '../config/performance.js';

// Data protection and privacy utilities
class DataProtectionService {
  constructor() {
    this.personalDataFields = [
      'email',
      'name',
      'phone',
      'address',
      'postalCode',
      'dateOfBirth',
      'ssn',
      'taxId'
    ];
    
    this.sensitiveDataFields = [
      'password',
      'paymentMethod',
      'bankAccount',
      'creditCard'
    ];
  }

  // Data anonymization for analytics
  anonymizeUserData(userData) {
    const startTime = monitor.startTimer('data_anonymization');
    
    try {
      const anonymized = { ...userData };
      
      // Remove or hash personal identifiers
      if (anonymized.email) {
        anonymized.email = this.hashEmail(anonymized.email);
      }
      
      if (anonymized.name) {
        anonymized.name = 'Anonymous User';
      }
      
      if (anonymized.phone) {
        anonymized.phone = this.maskPhoneNumber(anonymized.phone);
      }
      
      if (anonymized.address) {
        anonymized.address = this.generalizeAddress(anonymized.address);
      }
      
      // Keep only necessary fields for analytics
      const allowedFields = [
        'id', 'role', 'createdAt', 'subscriptionTier', 
        'paymentFrequency', 'lifetimeValue', 'churnRiskScore'
      ];
      
      const result = {};
      allowedFields.forEach(field => {
        if (anonymized[field] !== undefined) {
          result[field] = anonymized[field];
        }
      });
      
      monitor.endTimer('data_anonymization', startTime, { success: true });
      return result;
    } catch (error) {
      monitor.endTimer('data_anonymization', startTime, { success: false, error: error.message });
      throw error;
    }
  }

  // Hash email for analytics while preserving domain patterns
  hashEmail(email) {
    const [localPart, domain] = email.split('@');
    const hashedLocal = crypto.createHash('sha256').update(localPart).digest('hex').substring(0, 8);
    return `${hashedLocal}@${domain}`;
  }

  // Mask phone number
  maskPhoneNumber(phone) {
    if (phone.length <= 4) return '***';
    return `***-***-${phone.slice(-4)}`;
  }

  // Generalize address to city/state level
  generalizeAddress(address) {
    // Extract city and state, remove specific street address
    const parts = address.split(',');
    if (parts.length >= 2) {
      return parts.slice(-2).join(',').trim(); // Keep city, state
    }
    return 'City, State';
  }

  // Data retention management
  async checkDataRetention(userData, retentionPolicies) {
    const startTime = monitor.startTimer('data_retention_check');
    
    try {
      const now = new Date();
      const createdAt = new Date(userData.createdAt);
      const lastActivity = new Date(userData.lastActivity || userData.updatedAt);
      
      const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
      const daysSinceActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
      
      const actions = [];
      
      // Check inactive user policy
      if (daysSinceActivity > retentionPolicies.inactiveUserDays) {
        actions.push({
          action: 'ANONYMIZE',
          reason: 'User inactive beyond retention period',
          daysInactive: daysSinceActivity
        });
      }
      
      // Check cancelled subscription policy
      if (userData.subscriptionStatus === 'CANCELLED' && 
          daysSinceActivity > retentionPolicies.cancelledSubscriptionDays) {
        actions.push({
          action: 'DELETE_PERSONAL_DATA',
          reason: 'Cancelled subscription beyond retention period',
          daysSinceCancellation: daysSinceActivity
        });
      }
      
      // Check GDPR right to be forgotten requests
      if (userData.deletionRequested) {
        const requestDate = new Date(userData.deletionRequestedAt);
        const daysSinceRequest = Math.floor((now - requestDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceRequest >= retentionPolicies.gdprDeletionGraceDays) {
          actions.push({
            action: 'DELETE_ALL_DATA',
            reason: 'GDPR deletion request grace period expired',
            daysSinceRequest
          });
        }
      }
      
      monitor.endTimer('data_retention_check', startTime, { 
        userId: userData.id,
        actionsRequired: actions.length
      });
      
      return {
        userId: userData.id,
        daysSinceCreation,
        daysSinceActivity,
        actions
      };
    } catch (error) {
      monitor.endTimer('data_retention_check', startTime, { 
        error: error.message,
        userId: userData.id
      });
      throw error;
    }
  }

  // GDPR compliance utilities
  generateDataExport(userData, includeSubscriptionData = true) {
    const startTime = monitor.startTimer('gdpr_data_export');
    
    try {
      const exportData = {
        personalInformation: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          address: userData.address,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt
        },
        preferences: {
          notifications: userData.notifications,
          marketingConsent: userData.marketingConsent,
          dataProcessingConsent: userData.dataProcessingConsent
        }
      };
      
      if (includeSubscriptionData && userData.subscription) {
        exportData.subscriptionData = {
          tier: userData.subscription.tier,
          status: userData.subscription.status,
          paymentFrequency: userData.subscription.paymentFrequency,
          createdAt: userData.subscription.createdAt,
          // Exclude sensitive payment information
          billingHistory: userData.subscription.billingHistory?.map(bill => ({
            date: bill.date,
            amount: bill.amount,
            status: bill.status
            // Exclude payment method details
          }))
        };
      }
      
      // Add data processing activities
      exportData.dataProcessingActivities = [
        'Subscription management',
        'Payment processing',
        'Customer support',
        'Service delivery',
        'Analytics (anonymized)'
      ];
      
      // Add third-party data sharing
      exportData.dataSharing = [
        {
          party: 'Stripe',
          purpose: 'Payment processing',
          dataTypes: ['Payment information', 'Billing address']
        },
        {
          party: 'Email service provider',
          purpose: 'Transactional emails',
          dataTypes: ['Email address', 'Name']
        }
      ];
      
      monitor.endTimer('gdpr_data_export', startTime, { 
        userId: userData.id,
        includeSubscription: includeSubscriptionData
      });
      
      return {
        exportDate: new Date().toISOString(),
        userId: userData.id,
        data: exportData
      };
    } catch (error) {
      monitor.endTimer('gdpr_data_export', startTime, { 
        error: error.message,
        userId: userData.id
      });
      throw error;
    }
  }

  // Data minimization check
  validateDataMinimization(collectedData, purpose) {
    const violations = [];
    
    const purposeRequirements = {
      'subscription_management': ['email', 'name', 'paymentMethod'],
      'service_delivery': ['address', 'phone', 'servicePreferences'],
      'billing': ['email', 'name', 'billingAddress', 'paymentMethod'],
      'analytics': ['subscriptionTier', 'usageMetrics', 'churnRisk'],
      'marketing': ['email', 'marketingConsent', 'preferences']
    };
    
    const requiredFields = purposeRequirements[purpose] || [];
    const collectedFields = Object.keys(collectedData);
    
    // Check for unnecessary data collection
    const unnecessaryFields = collectedFields.filter(field => 
      !requiredFields.includes(field) && 
      !this.isAlwaysAllowed(field)
    );
    
    if (unnecessaryFields.length > 0) {
      violations.push({
        severity: 'MEDIUM',
        code: 'DATA_MINIMIZATION',
        message: `Unnecessary data collected for purpose '${purpose}': ${unnecessaryFields.join(', ')}`
      });
    }
    
    // Check for missing required data
    const missingFields = requiredFields.filter(field => 
      !collectedFields.includes(field)
    );
    
    if (missingFields.length > 0) {
      violations.push({
        severity: 'LOW',
        code: 'MISSING_REQUIRED_DATA',
        message: `Missing required data for purpose '${purpose}': ${missingFields.join(', ')}`
      });
    }
    
    return {
      compliant: violations.length === 0,
      violations,
      unnecessaryFields,
      missingFields
    };
  }

  isAlwaysAllowed(field) {
    const alwaysAllowed = ['id', 'createdAt', 'updatedAt', 'version'];
    return alwaysAllowed.includes(field);
  }

  // Consent management
  validateConsent(userData, processingPurpose) {
    const violations = [];
    
    const requiredConsents = {
      'marketing': 'marketingConsent',
      'analytics': 'analyticsConsent',
      'data_sharing': 'dataSharingConsent'
    };
    
    const requiredConsent = requiredConsents[processingPurpose];
    
    if (requiredConsent && !userData[requiredConsent]) {
      violations.push({
        severity: 'HIGH',
        code: 'MISSING_CONSENT',
        message: `Missing consent for ${processingPurpose}`
      });
    }
    
    // Check consent withdrawal
    if (userData.consentWithdrawn && userData.consentWithdrawn.includes(processingPurpose)) {
      violations.push({
        severity: 'HIGH',
        code: 'CONSENT_WITHDRAWN',
        message: `Consent withdrawn for ${processingPurpose}`
      });
    }
    
    return {
      hasConsent: violations.length === 0,
      violations
    };
  }

  // Data breach detection
  detectPotentialBreach(accessLog) {
    const suspiciousPatterns = [];
    
    // Check for unusual access patterns
    if (accessLog.accessCount > 100 && accessLog.timeSpan < 3600) { // 100 accesses in 1 hour
      suspiciousPatterns.push({
        type: 'EXCESSIVE_ACCESS',
        severity: 'HIGH',
        description: 'Unusually high access frequency detected'
      });
    }
    
    // Check for access from unusual locations
    if (accessLog.newLocation && accessLog.sensitiveDataAccessed) {
      suspiciousPatterns.push({
        type: 'UNUSUAL_LOCATION',
        severity: 'MEDIUM',
        description: 'Access to sensitive data from new location'
      });
    }
    
    // Check for bulk data access
    if (accessLog.recordsAccessed > 1000) {
      suspiciousPatterns.push({
        type: 'BULK_ACCESS',
        severity: 'HIGH',
        description: 'Large number of records accessed'
      });
    }
    
    // Check for off-hours access
    const accessHour = new Date(accessLog.timestamp).getHours();
    if ((accessHour < 6 || accessHour > 22) && accessLog.sensitiveDataAccessed) {
      suspiciousPatterns.push({
        type: 'OFF_HOURS_ACCESS',
        severity: 'MEDIUM',
        description: 'Sensitive data accessed during off-hours'
      });
    }
    
    return {
      suspicious: suspiciousPatterns.length > 0,
      patterns: suspiciousPatterns,
      riskScore: this.calculateRiskScore(suspiciousPatterns)
    };
  }

  calculateRiskScore(patterns) {
    const severityWeights = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return patterns.reduce((score, pattern) => 
      score + severityWeights[pattern.severity], 0
    );
  }
}

export default DataProtectionService;