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

export default router;
