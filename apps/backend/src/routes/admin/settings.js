import express from 'express';
import { authMiddleware, requireAdmin } from '../../middleware/auth.js';
import { auditPresets } from '../../middleware/auditMiddleware.js';
import { auditService } from '../../services/auditService.js';

const router = express.Router();

// Apply admin role check
router.use(authMiddleware);
router.use(requireAdmin);

// Default settings
const DEFAULT_SETTINGS = {
  // General Settings
  siteName: 'FixWell Admin',
  siteDescription: 'Professional home maintenance services',
  siteUrl: 'https://fixwell.com',
  timezone: 'UTC',
  language: 'en',
  maintenanceMode: false,
  
  // Security Settings
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  passwordMinLength: 8,
  requireTwoFactor: false,
  allowedDomains: [],
  
  // Email Settings
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPassword: '',
  smtpSecure: true,
  fromEmail: 'noreply@fixwell.com',
  fromName: 'FixWell',
  
  // Notification Settings
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  notificationFrequency: 'immediate',
  
  // Payment Settings
  stripePublicKey: '',
  stripeSecretKey: '',
  stripeWebhookSecret: '',
  defaultCurrency: 'USD',
  taxRate: 0.0,
  
  // Database Settings
  dbHost: 'localhost',
  dbPort: 5432,
  dbName: 'fixwell',
  dbUser: 'postgres',
  dbPassword: '',
  dbSsl: false,
  
  // Monitoring Settings
  enableMonitoring: true,
  logLevel: 'info',
  enableAnalytics: true,
  enableErrorReporting: true
};

/**
 * GET /api/admin/settings
 * Get system settings
 */
router.get('/', async (req, res) => {
  try {
    // TODO: Load settings from database
    // For now, return default settings
    const settings = { ...DEFAULT_SETTINGS };
    
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings'
    });
  }
});

/**
 * PUT /api/admin/settings
 * Update system settings
 */
router.put('/', async (req, res) => {
  try {
    const settings = req.body;
    
    // Validate required fields
    const requiredFields = ['siteName', 'siteUrl', 'fromEmail'];
    for (const field of requiredFields) {
      if (!settings[field]) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
      }
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(settings.fromEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }
    
    // Validate URL format
    try {
      new URL(settings.siteUrl);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid site URL format'
      });
    }
    
    // TODO: Save settings to database
    // await settingsService.update(settings);
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'settings_update',
      entityType: 'settings',
      entityId: 'system',
      changes: {
        updatedFields: Object.keys(settings)
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'medium'
    });
    
    res.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
});

/**
 * POST /api/admin/settings/test-email
 * Test email configuration
 */
router.post('/test-email', async (req, res) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPassword, smtpSecure, fromEmail, fromName } = req.body;
    
    // TODO: Implement actual email test
    // For now, just validate the configuration
    
    if (!smtpHost || !smtpPort || !smtpUser || !fromEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing required email configuration'
      });
    }
    
    // Mock email test - in real implementation, use nodemailer or similar
    console.log('Testing email configuration:', {
      host: smtpHost,
      port: smtpPort,
      user: smtpUser,
      secure: smtpSecure,
      from: fromEmail,
      fromName: fromName
    });
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'email_test',
      entityType: 'settings',
      entityId: 'email',
      changes: {},
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'low'
    });
    
    res.json({
      success: true,
      message: 'Email configuration test successful'
    });
  } catch (error) {
    console.error('Error testing email configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test email configuration'
    });
  }
});

/**
 * POST /api/admin/settings/test-database
 * Test database configuration
 */
router.post('/test-database', async (req, res) => {
  try {
    const { dbHost, dbPort, dbName, dbUser, dbPassword, dbSsl } = req.body;
    
    // TODO: Implement actual database test
    // For now, just validate the configuration
    
    if (!dbHost || !dbPort || !dbName || !dbUser) {
      return res.status(400).json({
        success: false,
        error: 'Missing required database configuration'
      });
    }
    
    // Mock database test - in real implementation, test actual connection
    console.log('Testing database configuration:', {
      host: dbHost,
      port: dbPort,
      database: dbName,
      user: dbUser,
      ssl: dbSsl
    });
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'database_test',
      entityType: 'settings',
      entityId: 'database',
      changes: {},
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'low'
    });
    
    res.json({
      success: true,
      message: 'Database configuration test successful'
    });
  } catch (error) {
    console.error('Error testing database configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test database configuration'
    });
  }
});

/**
 * POST /api/admin/settings/reset
 * Reset settings to defaults
 */
router.post('/reset', async (req, res) => {
  try {
    // TODO: Reset settings to defaults in database
    // await settingsService.reset();
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'settings_reset',
      entityType: 'settings',
      entityId: 'system',
      changes: {
        resetToDefaults: true
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'high'
    });
    
    res.json({
      success: true,
      message: 'Settings reset to defaults successfully'
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset settings'
    });
  }
});

/**
 * GET /api/admin/settings/backup
 * Export settings as backup
 */
router.get('/backup', async (req, res) => {
  try {
    // TODO: Get current settings from database
    const settings = { ...DEFAULT_SETTINGS };
    
    const backup = {
      settings,
      exportedAt: new Date().toISOString(),
      exportedBy: req.user.email,
      version: '1.0.0'
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="settings-backup-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(backup);
  } catch (error) {
    console.error('Error creating settings backup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create settings backup'
    });
  }
});

/**
 * POST /api/admin/settings/restore
 * Restore settings from backup
 */
router.post('/restore', async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings) {
      return res.status(400).json({
        success: false,
        error: 'No settings data provided'
      });
    }
    
    // TODO: Restore settings to database
    // await settingsService.restore(settings);
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'settings_restore',
      entityType: 'settings',
      entityId: 'system',
      changes: {
        restoredFromBackup: true
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'high'
    });
    
    res.json({
      success: true,
      message: 'Settings restored successfully'
    });
  } catch (error) {
    console.error('Error restoring settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restore settings'
    });
  }
});

/**
 * GET /api/admin/settings/system
 * Get system configuration
 */
router.get('/system', async (req, res) => {
  try {
    const systemConfig = {
      siteName: DEFAULT_SETTINGS.siteName,
      siteDescription: DEFAULT_SETTINGS.siteDescription,
      siteUrl: DEFAULT_SETTINGS.siteUrl,
      timezone: DEFAULT_SETTINGS.timezone,
      language: DEFAULT_SETTINGS.language,
      dateFormat: 'MM/DD/YYYY',
      currency: 'USD',
      maintenanceMode: DEFAULT_SETTINGS.maintenanceMode,
      debugMode: false,
      adminEmail: DEFAULT_SETTINGS.fromEmail
    };
    
    res.json({
      success: true,
      config: systemConfig
    });
  } catch (error) {
    console.error('Error fetching system config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system configuration'
    });
  }
});

/**
 * PUT /api/admin/settings/system
 * Update system configuration
 */
router.put('/system', async (req, res) => {
  try {
    const config = req.body;
    
    // Validate required fields
    const requiredFields = ['siteName', 'siteUrl', 'adminEmail'];
    for (const field of requiredFields) {
      if (!config[field]) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
      }
    }
    
    // TODO: Save system configuration to database
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'system_config_update',
      entityType: 'settings',
      entityId: 'system',
      changes: config,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'medium'
    });
    
    res.json({
      success: true,
      message: 'System configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating system config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update system configuration'
    });
  }
});

/**
 * GET /api/admin/settings/security
 * Get security configuration
 */
router.get('/security', async (req, res) => {
  try {
    const securityConfig = {
      passwordPolicy: {
        minLength: DEFAULT_SETTINGS.passwordMinLength,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        preventReuse: 5,
        expirationDays: 90
      },
      sessionTimeout: DEFAULT_SETTINGS.sessionTimeout,
      maxLoginAttempts: DEFAULT_SETTINGS.maxLoginAttempts,
      twoFactorRequired: DEFAULT_SETTINGS.requireTwoFactor,
      ipWhitelist: DEFAULT_SETTINGS.allowedDomains,
      auditLogRetention: 365,
      requireHttps: true,
      corsOrigins: ['https://localhost:3000']
    };
    
    res.json({
      success: true,
      config: securityConfig
    });
  } catch (error) {
    console.error('Error fetching security config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security configuration'
    });
  }
});

/**
 * PUT /api/admin/settings/security
 * Update security configuration
 */
router.put('/security', async (req, res) => {
  try {
    const config = req.body;
    
    // TODO: Save security configuration to database
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'security_config_update',
      entityType: 'settings',
      entityId: 'security',
      changes: config,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'high'
    });
    
    res.json({
      success: true,
      message: 'Security configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating security config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update security configuration'
    });
  }
});

/**
 * POST /api/admin/settings/security/reset
 * Reset security settings to defaults
 */
router.post('/security/reset', async (req, res) => {
  try {
    // TODO: Reset security settings to defaults in database
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'security_settings_reset',
      entityType: 'settings',
      entityId: 'security',
      changes: { resetToDefaults: true },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'high'
    });
    
    res.json({
      success: true,
      message: 'Security settings reset to defaults successfully'
    });
  } catch (error) {
    console.error('Error resetting security settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset security settings'
    });
  }
});

/**
 * GET /api/admin/settings/notifications
 * Get notification configuration
 */
router.get('/notifications', async (req, res) => {
  try {
    const notificationConfig = {
      emailEnabled: DEFAULT_SETTINGS.emailNotifications,
      smsEnabled: DEFAULT_SETTINGS.smsNotifications,
      pushEnabled: DEFAULT_SETTINGS.pushNotifications,
      defaultSender: DEFAULT_SETTINGS.fromEmail,
      templates: [
        {
          id: '1',
          name: 'Welcome Email',
          type: 'email',
          template: 'Welcome {{customerName}}!',
          variables: ['customerName'],
          isActive: true
        }
      ]
    };
    
    res.json({
      success: true,
      config: notificationConfig
    });
  } catch (error) {
    console.error('Error fetching notification config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification configuration'
    });
  }
});

/**
 * PUT /api/admin/settings/notifications
 * Update notification configuration
 */
router.put('/notifications', async (req, res) => {
  try {
    const config = req.body;
    
    // TODO: Save notification configuration to database
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'notification_config_update',
      entityType: 'settings',
      entityId: 'notifications',
      changes: config,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'medium'
    });
    
    res.json({
      success: true,
      message: 'Notification configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification configuration'
    });
  }
});

/**
 * GET /api/admin/settings/appearance
 * Get appearance configuration
 */
router.get('/appearance', async (req, res) => {
  try {
    const appearanceConfig = {
      theme: 'light',
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      logoUrl: '/logo.png',
      faviconUrl: '/favicon.ico',
      customCss: ''
    };
    
    res.json({
      success: true,
      config: appearanceConfig
    });
  } catch (error) {
    console.error('Error fetching appearance config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appearance configuration'
    });
  }
});

/**
 * PUT /api/admin/settings/appearance
 * Update appearance configuration
 */
router.put('/appearance', async (req, res) => {
  try {
    const config = req.body;
    
    // TODO: Save appearance configuration to database
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'appearance_config_update',
      entityType: 'settings',
      entityId: 'appearance',
      changes: config,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'low'
    });
    
    res.json({
      success: true,
      message: 'Appearance configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating appearance config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update appearance configuration'
    });
  }
});

/**
 * GET /api/admin/settings/integrations
 * Get integration configuration
 */
router.get('/integrations', async (req, res) => {
  try {
    // Mock integration configuration - in real implementation, load from database
    const integrationConfig = {
      // API Management
      apiKeys: [
        {
          id: '1',
          name: 'Production API Key',
          key: 'sk_live_51234567890abcdef',
          permissions: ['read', 'write'],
          lastUsed: new Date('2024-01-15'),
          createdAt: new Date('2024-01-01'),
          expiresAt: new Date('2025-01-01'),
          isActive: true
        }
      ],
      webhooks: [
        {
          id: '1',
          name: 'Payment Webhook',
          url: 'https://api.example.com/webhooks/payments',
          events: ['payment.succeeded', 'payment.failed'],
          secret: 'whsec_1234567890abcdef',
          isActive: true,
          lastTriggered: new Date('2024-01-15'),
          successRate: 98.5
        }
      ],
      rateLimitEnabled: true,
      rateLimitRequests: 1000,
      rateLimitWindow: 60,
      
      // Service Integrations
      services: [
        {
          id: '1',
          name: 'Stripe Payments',
          type: 'payment',
          status: 'connected',
          config: { publicKey: 'pk_live_...', secretKey: 'sk_live_...' },
          lastSync: new Date('2024-01-15'),
          healthStatus: 'healthy'
        },
        {
          id: '2',
          name: 'SendGrid Email',
          type: 'email',
          status: 'connected',
          config: { apiKey: 'SG.abc123...' },
          lastSync: new Date('2024-01-15'),
          healthStatus: 'healthy'
        },
        {
          id: '3',
          name: 'Twilio SMS',
          type: 'sms',
          status: 'disconnected',
          config: {},
          healthStatus: 'error'
        }
      ],
      
      // Third-party Services
      stripeEnabled: true,
      stripePublicKey: 'pk_live_51234567890abcdef',
      stripeSecretKey: 'sk_live_51234567890abcdef',
      stripeWebhookSecret: 'whsec_1234567890abcdef',
      
      emailServiceEnabled: true,
      emailProvider: 'sendgrid',
      emailConfig: { apiKey: 'SG.abc123...' },
      
      smsServiceEnabled: false,
      smsProvider: 'twilio',
      smsConfig: {},
      
      analyticsEnabled: true,
      analyticsProvider: 'google',
      analyticsConfig: { trackingId: 'GA-123456789' },
      
      // Health Monitoring
      healthCheckEnabled: true,
      healthCheckInterval: 5,
      alertsEnabled: true,
      alertWebhookUrl: 'https://api.example.com/alerts'
    };
    
    res.json({
      success: true,
      config: integrationConfig
    });
  } catch (error) {
    console.error('Error fetching integration config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch integration configuration'
    });
  }
});

/**
 * PUT /api/admin/settings/integrations
 * Update integration configuration
 */
router.put('/integrations', async (req, res) => {
  try {
    const config = req.body;
    
    // TODO: Validate and save integration configuration to database
    // await integrationService.updateConfig(config);
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'integration_config_update',
      entityType: 'settings',
      entityId: 'integrations',
      changes: {
        updatedFields: Object.keys(config)
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'medium'
    });
    
    res.json({
      success: true,
      message: 'Integration configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating integration config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update integration configuration'
    });
  }
});

/**
 * POST /api/admin/api-keys
 * Generate new API key
 */
router.post('/api-keys', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'API key name is required'
      });
    }
    
    // Generate new API key
    const apiKey = {
      id: Date.now().toString(),
      name: name.trim(),
      key: `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      permissions: ['read'],
      createdAt: new Date(),
      isActive: true
    };
    
    // TODO: Save API key to database
    // await apiKeyService.create(apiKey);
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'api_key_create',
      entityType: 'api_key',
      entityId: apiKey.id,
      changes: {
        name: apiKey.name,
        permissions: apiKey.permissions
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'medium'
    });
    
    res.json({
      success: true,
      apiKey
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate API key'
    });
  }
});

/**
 * DELETE /api/admin/api-keys/:keyId
 * Revoke API key
 */
router.delete('/api-keys/:keyId', async (req, res) => {
  try {
    const { keyId } = req.params;
    
    // TODO: Revoke API key in database
    // await apiKeyService.revoke(keyId);
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'api_key_revoke',
      entityType: 'api_key',
      entityId: keyId,
      changes: {
        revoked: true
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'high'
    });
    
    res.json({
      success: true,
      message: 'API key revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke API key'
    });
  }
});

/**
 * POST /api/admin/webhooks
 * Add webhook endpoint
 */
router.post('/webhooks', async (req, res) => {
  try {
    const { name, url } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({
        success: false,
        error: 'Webhook name and URL are required'
      });
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook URL format'
      });
    }
    
    // Create new webhook
    const webhook = {
      id: Date.now().toString(),
      name: name.trim(),
      url: url.trim(),
      events: ['*'],
      secret: `whsec_${Math.random().toString(36).substring(2, 15)}`,
      isActive: true,
      successRate: 100
    };
    
    // TODO: Save webhook to database
    // await webhookService.create(webhook);
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'webhook_create',
      entityType: 'webhook',
      entityId: webhook.id,
      changes: {
        name: webhook.name,
        url: webhook.url
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'medium'
    });
    
    res.json({
      success: true,
      webhook
    });
  } catch (error) {
    console.error('Error creating webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create webhook'
    });
  }
});

/**
 * DELETE /api/admin/webhooks/:webhookId
 * Remove webhook endpoint
 */
router.delete('/webhooks/:webhookId', async (req, res) => {
  try {
    const { webhookId } = req.params;
    
    // TODO: Remove webhook from database
    // await webhookService.remove(webhookId);
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'webhook_remove',
      entityType: 'webhook',
      entityId: webhookId,
      changes: {
        removed: true
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'medium'
    });
    
    res.json({
      success: true,
      message: 'Webhook removed successfully'
    });
  } catch (error) {
    console.error('Error removing webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove webhook'
    });
  }
});

/**
 * POST /api/admin/integrations/:serviceId/test
 * Test service connection
 */
router.post('/integrations/:serviceId/test', async (req, res) => {
  try {
    const { serviceId } = req.params;
    
    // TODO: Implement actual service connection testing
    // For now, simulate a successful test
    
    // Log audit event
    await auditService.log({
      adminId: req.user.id,
      action: 'service_connection_test',
      entityType: 'integration',
      entityId: serviceId,
      changes: {},
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        sessionId: req.sessionID
      },
      severity: 'low'
    });
    
    res.json({
      success: true,
      message: 'Service connection test successful'
    });
  } catch (error) {
    console.error('Error testing service connection:', error);
    res.status(500).json({
      success: false,
      error: 'Service connection test failed'
    });
  }
});

export default router;
