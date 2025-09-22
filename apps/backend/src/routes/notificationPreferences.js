import express from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import notificationPreferenceService from '../services/notificationPreferenceService.js';
import notificationDeliveryService from '../services/notificationDeliveryService.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * Get current user's notification preferences
 */
router.get('/preferences', async (req, res) => {
  try {
    const preferences = await notificationPreferenceService.getUserPreferences(req.user.id);
    res.json({ preferences });
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({ error: 'Failed to get notification preferences' });
  }
});

/**
 * Update current user's notification preferences
 */
router.put('/preferences', async (req, res) => {
  try {
    const updates = req.body;
    const preferences = await notificationPreferenceService.updateUserPreferences(req.user.id, updates);
    res.json({ preferences });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    if (error.message.includes('must be')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update notification preferences' });
    }
  }
});

/**
 * Get delivery settings for current user
 */
router.get('/delivery-settings', async (req, res) => {
  try {
    const settings = await notificationPreferenceService.getDeliverySettings(req.user.id);
    res.json({ settings });
  } catch (error) {
    console.error('Error getting delivery settings:', error);
    res.status(500).json({ error: 'Failed to get delivery settings' });
  }
});

/**
 * Get notification delivery history for current user
 */
router.get('/delivery-history', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, channel, status } = req.query;
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      channel,
      status
    };

    const history = await notificationDeliveryService.getUserDeliveryHistory(req.user.id, options);
    res.json(history);
  } catch (error) {
    console.error('Error getting delivery history:', error);
    res.status(500).json({ error: 'Failed to get delivery history' });
  }
});

/**
 * Test notification delivery for current user
 */
router.post('/test', async (req, res) => {
  try {
    const { type = 'email', channel = 'test_notification' } = req.body;
    
    const testNotification = {
      userId: req.user.id,
      type,
      channel,
      recipient: type === 'email' ? req.user.email : req.user.phone,
      subject: 'Test Notification',
      content: 'This is a test notification to verify your notification settings are working correctly.',
      metadata: { isTest: true }
    };

    const delivery = await notificationDeliveryService.sendNotification(testNotification);
    
    if (delivery) {
      res.json({ 
        success: true, 
        message: 'Test notification sent successfully',
        deliveryId: delivery.id
      });
    } else {
      res.json({ 
        success: false, 
        message: 'Test notification was skipped due to your preferences' 
      });
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Admin-only routes
router.use(requireAdmin);

/**
 * Get notification statistics (Admin only)
 */
router.get('/admin/stats', async (req, res) => {
  try {
    const [preferenceStats, deliveryStats] = await Promise.all([
      notificationPreferenceService.getNotificationStats(),
      notificationDeliveryService.getDeliveryStats()
    ]);

    res.json({
      preferences: preferenceStats,
      delivery: deliveryStats
    });
  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json({ error: 'Failed to get notification statistics' });
  }
});

/**
 * Get admin notification preferences (Admin only)
 */
router.get('/admin/preferences', async (req, res) => {
  try {
    const adminPreferences = await notificationPreferenceService.getAdminPreferences();
    res.json({ adminPreferences });
  } catch (error) {
    console.error('Error getting admin preferences:', error);
    res.status(500).json({ error: 'Failed to get admin preferences' });
  }
});

/**
 * Update notification preferences for a specific user (Admin only)
 */
router.put('/admin/users/:userId/preferences', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    const preferences = await notificationPreferenceService.updateUserPreferences(userId, updates);
    res.json({ preferences });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    if (error.message.includes('must be')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update user preferences' });
    }
  }
});

/**
 * Bulk update notification preferences (Admin only)
 */
router.put('/admin/bulk-update', async (req, res) => {
  try {
    const { userUpdates } = req.body;
    
    if (!Array.isArray(userUpdates)) {
      return res.status(400).json({ error: 'userUpdates must be an array' });
    }

    const results = await notificationPreferenceService.bulkUpdatePreferences(userUpdates);
    res.json({ 
      success: true, 
      updatedCount: results.length,
      results 
    });
  } catch (error) {
    console.error('Error bulk updating preferences:', error);
    res.status(500).json({ error: 'Failed to bulk update preferences' });
  }
});

/**
 * Get delivery statistics with filters (Admin only)
 */
router.get('/admin/delivery-stats', async (req, res) => {
  try {
    const { startDate, endDate, type, channel } = req.query;
    const filters = {};
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (type) filters.type = type;
    if (channel) filters.channel = channel;

    const stats = await notificationDeliveryService.getDeliveryStats(filters);
    res.json({ stats });
  } catch (error) {
    console.error('Error getting delivery stats:', error);
    res.status(500).json({ error: 'Failed to get delivery statistics' });
  }
});

/**
 * Retry failed notifications (Admin only)
 */
router.post('/admin/retry-failed', async (req, res) => {
  try {
    const retriedCount = await notificationDeliveryService.retryFailedNotifications();
    res.json({ 
      success: true, 
      message: `Retried ${retriedCount} failed notifications`,
      retriedCount 
    });
  } catch (error) {
    console.error('Error retrying failed notifications:', error);
    res.status(500).json({ error: 'Failed to retry notifications' });
  }
});

/**
 * Send admin notification (Admin only)
 */
router.post('/admin/send', async (req, res) => {
  try {
    const { notificationType, data } = req.body;
    
    if (!notificationType) {
      return res.status(400).json({ error: 'notificationType is required' });
    }

    const deliveries = await notificationDeliveryService.sendAdminNotification(notificationType, data);
    res.json({ 
      success: true, 
      message: `Sent notification to ${deliveries.length} admins`,
      deliveries 
    });
  } catch (error) {
    console.error('Error sending admin notification:', error);
    res.status(500).json({ error: 'Failed to send admin notification' });
  }
});

/**
 * Get notification delivery history for any user (Admin only)
 */
router.get('/admin/users/:userId/delivery-history', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, type, channel, status } = req.query;
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      channel,
      status
    };

    const history = await notificationDeliveryService.getUserDeliveryHistory(userId, options);
    res.json(history);
  } catch (error) {
    console.error('Error getting user delivery history:', error);
    res.status(500).json({ error: 'Failed to get delivery history' });
  }
});

export default router;