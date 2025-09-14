import express from 'express';
import { requireAdmin, authMiddleware } from '../middleware/auth.js';
import notificationService from '../services/notificationService.js';
import SmartNotificationService from '../services/smartNotificationService.js';
import PaymentMethodService from '../services/paymentMethodService.js';
import smsService from '../services/sms.js';
import prisma from '../config/database.js';

const router = express.Router();

/**
 * Get notification settings (persistent)
 */
router.get('/settings', requireAdmin, async (req, res) => {
  try {
    // Try to load from DB first
    const keys = [
      'smsEnabled',
      'ownerPhone',
      'managerPhones',
      'notificationTypes'
    ];
    const settings = await prisma.setting.findMany({ where: { key: { in: keys } } });
    const map = Object.fromEntries(settings.map(s => [s.key, s.value]));

    // Fallbacks (env/defaults)
    const result = {
      smsEnabled: map.smsEnabled === undefined ? (process.env.ENABLE_SMS_NOTIFICATIONS === 'true') : map.smsEnabled === 'true',
      ownerPhone: map.ownerPhone || process.env.OWNER_PHONE_NUMBER || '',
      managerPhones: map.managerPhones || process.env.MANAGER_PHONE_NUMBERS || '',
      notificationTypes: map.notificationTypes ? map.notificationTypes.split(',') : (process.env.SMS_NOTIFICATION_TYPES ? process.env.SMS_NOTIFICATION_TYPES.split(',') : ['new_chat', 'urgent_chat'])
    };
    res.json({ success: true, settings: result });
  } catch (error) {
    console.error('Error getting notification settings:', error);
    res.status(500).json({ success: false, error: 'Failed to get settings' });
  }
});

/**
 * Update notification settings (persistent)
 */
router.post('/settings', requireAdmin, async (req, res) => {
  try {
    const { smsEnabled, ownerPhone, managerPhones, notificationTypes } = req.body;
    // Validate phone numbers
    if (smsEnabled) {
      if (ownerPhone && !smsService.validatePhoneNumber(ownerPhone)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid owner phone number format. Use E.164 format (e.g., +1234567890)' 
        });
      }
      if (managerPhones) {
        const phones = managerPhones.split(',').map(p => p.trim());
        for (const phone of phones) {
          if (phone && !smsService.validatePhoneNumber(phone)) {
            return res.status(400).json({ 
              success: false, 
              error: `Invalid manager phone number: ${phone}. Use E.164 format (e.g., +1234567890)` 
            });
          }
        }
      }
    }
    // Save settings to DB
    const upserts = [
      { key: 'smsEnabled', value: String(!!smsEnabled) },
      { key: 'ownerPhone', value: ownerPhone || '' },
      { key: 'managerPhones', value: managerPhones || '' },
      { key: 'notificationTypes', value: Array.isArray(notificationTypes) ? notificationTypes.join(',') : (notificationTypes || '') }
    ];
    for (const setting of upserts) {
      await prisma.setting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value }
      });
    }
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

/**
 * Test SMS notification
 */
router.post('/test', requireAdmin, async (req, res) => {
  console.log('Test notification request received:', {
    user: req.user,
    body: req.body,
    headers: req.headers,
    authHeader: req.headers.authorization
  });
  try {
    const { phoneNumber, type = 'new_chat' } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    if (!smsService.validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)' 
      });
    }

    const testData = {
      customerName: 'Test Customer',
      message: 'This is a test message to verify the SMS notification system is working correctly.',
      chatId: 'test-123',
      priority: 'NORMAL'
    };

    const result = await smsService.sendChatNotification(
      phoneNumber,
      testData.customerName,
      testData.message,
      testData.chatId
    );

    if (result.success) {
      res.json({ success: true, message: 'Test SMS sent successfully', sid: result.sid });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error sending test SMS:', error);
    res.status(500).json({ success: false, error: 'Failed to send test SMS' });
  }
});

/**
 * Test urgent notification
 */
router.post('/test-urgent', requireAdmin, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    if (!smsService.validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)' 
      });
    }

    const result = await smsService.sendUrgentNotification(
      phoneNumber,
      'Test Customer',
      'URGENT'
    );

    if (result.success) {
      res.json({ success: true, message: 'Urgent test SMS sent successfully', sid: result.sid });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error sending urgent test SMS:', error);
    res.status(500).json({ success: false, error: 'Failed to send urgent test SMS' });
  }
});

/**
 * Get notification log
 */
router.get('/log', requireAdmin, async (req, res) => {
  try {
    // In production, you'd fetch this from a database
    const log = [
      {
        id: '1',
        type: 'sms',
        recipient: '+1234567890',
        message: 'New chat from John Doe',
        status: 'sent',
        timestamp: new Date().toISOString()
      }
    ];
    
    res.json({ success: true, log });
  } catch (error) {
    console.error('Error getting notification log:', error);
    res.status(500).json({ success: false, error: 'Failed to get notification log' });
  }
});

// Initialize enhanced notification services
const smartNotificationService = new SmartNotificationService(prisma);
const paymentMethodService = new PaymentMethodService(prisma);

/**
 * Send payment reminder notification
 * POST /api/notifications/payment-reminder
 */
router.post('/payment-reminder', requireAdmin, async (req, res) => {
  try {
    const { userId, daysUntilDue, amount, dueDate } = req.body;

    if (!userId || daysUntilDue === undefined || !amount || !dueDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, daysUntilDue, amount, dueDate'
      });
    }

    const reminderData = {
      daysUntilDue: parseInt(daysUntilDue),
      amount: parseFloat(amount),
      dueDate: new Date(dueDate)
    };

    const result = await smartNotificationService.sendPaymentReminder(userId, reminderData);

    if (result.success) {
      res.json({
        success: true,
        message: 'Payment reminder sent successfully',
        emailSent: result.emailSent,
        smsSent: result.smsSent,
        urgency: result.urgency
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send payment reminder'
      });
    }
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Enhanced user notifications endpoint
 * GET /api/users/me/notifications
 */
router.get('/user/notifications', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0, type } = req.query;

    // Get user with subscription info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        subscription: true,
        subscriptionUsage: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Build notifications array (in production, this would come from a notifications table)
    const notifications = [];

    // Add subscription-related notifications
    if (user.subscription) {
      // Payment due notifications
      if (user.subscription.currentPeriodEnd) {
        const daysUntilDue = Math.ceil(
          (new Date(user.subscription.currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysUntilDue <= 7 && daysUntilDue > 0) {
          notifications.push({
            id: `payment-due-${user.subscription.id}`,
            type: 'PAYMENT_DUE',
            title: 'Payment Due Soon',
            message: `Your ${user.subscription.tier} subscription payment is due in ${daysUntilDue} days`,
            urgency: daysUntilDue <= 1 ? 'URGENT' : daysUntilDue <= 3 ? 'HIGH' : 'NORMAL',
            createdAt: new Date().toISOString(),
            isRead: false,
            actionUrl: '/dashboard/subscription/payment-methods'
          });
        }
      }

      // Usage-based upgrade suggestions
      if (user.subscriptionUsage) {
        const utilizationRate = _calculateUtilizationRate(user.subscriptionUsage, user.subscription.tier);
        if (utilizationRate > 0.8) {
          notifications.push({
            id: `upgrade-suggestion-${user.subscription.id}`,
            type: 'UPGRADE_SUGGESTION',
            title: 'Upgrade Recommendation',
            message: `You're using ${Math.round(utilizationRate * 100)}% of your plan. Consider upgrading for better value.`,
            urgency: 'NORMAL',
            createdAt: new Date().toISOString(),
            isRead: false,
            actionUrl: '/dashboard/subscription/upgrade'
          });
        }
      }

      // Subscription pause notifications
      if (user.subscription.isPaused) {
        notifications.push({
          id: `subscription-paused-${user.subscription.id}`,
          type: 'SUBSCRIPTION_PAUSED',
          title: 'Subscription Paused',
          message: user.subscription.pauseEndDate 
            ? `Your subscription is paused until ${new Date(user.subscription.pauseEndDate).toLocaleDateString()}`
            : 'Your subscription is currently paused',
          urgency: 'HIGH',
          createdAt: user.subscription.pauseStartDate || new Date().toISOString(),
          isRead: false,
          actionUrl: '/dashboard/subscription'
        });
      }
    }

    // Filter by type if specified
    const filteredNotifications = type 
      ? notifications.filter(n => n.type === type.toUpperCase())
      : notifications;

    // Apply pagination
    const paginatedNotifications = filteredNotifications
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      notifications: paginatedNotifications,
      total: filteredNotifications.length,
      unreadCount: filteredNotifications.filter(n => !n.isRead).length,
      hasMore: parseInt(offset) + parseInt(limit) < filteredNotifications.length
    });

  } catch (error) {
    console.error('Error getting user notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications'
    });
  }
});

/**
 * Update notification preferences
 * POST /api/notifications/update-preferences
 */
router.post('/update-preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      emailNotifications = true,
      smsNotifications = false,
      paymentReminders = true,
      upgradeSuggestions = true,
      engagementReminders = true,
      marketingEmails = false
    } = req.body;

    // Validate phone number if SMS is enabled
    if (smsNotifications && req.body.phone) {
      if (!smsService.validatePhoneNumber(req.body.phone)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)'
        });
      }
    }

    // Update user notification preferences
    const notificationPreferences = {
      email: emailNotifications,
      sms: smsNotifications,
      paymentReminders,
      upgradeSuggestions,
      engagementReminders,
      marketingEmails
    };

    const updateData = {
      notifications: notificationPreferences
    };

    // Update phone number if provided
    if (req.body.phone) {
      updateData.phone = req.body.phone;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        notifications: true
      }
    });

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences: updatedUser.notifications,
      phone: updatedUser.phone
    });

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences'
    });
  }
});

/**
 * Webhook endpoint for payment status updates
 * POST /api/notifications/webhook/payment-status
 */
router.post('/webhook/payment-status', async (req, res) => {
  try {
    const { type, data } = req.body;

    // Verify webhook signature in production
    // const signature = req.headers['stripe-signature'];
    // const isValid = verifyWebhookSignature(req.body, signature);
    // if (!isValid) return res.status(400).json({ error: 'Invalid signature' });

    switch (type) {
      case 'invoice.payment_failed':
        await handlePaymentFailure(data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(data.object);
        break;
      
      default:
        console.log(`Unhandled webhook event type: ${type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Error processing payment webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Send upgrade suggestion notification
 * POST /api/notifications/upgrade-suggestion (Admin only)
 */
router.post('/upgrade-suggestion', requireAdmin, async (req, res) => {
  try {
    const { userId, currentUsage, planLimit, suggestedTier, potentialSavings } = req.body;

    if (!userId || !suggestedTier) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, suggestedTier'
      });
    }

    const usageData = {
      currentUsage: parseInt(currentUsage) || 0,
      planLimit: parseInt(planLimit) || 10,
      utilizationRate: currentUsage && planLimit ? currentUsage / planLimit : 0,
      suggestedTier,
      potentialSavings: parseFloat(potentialSavings) || 0
    };

    const result = await smartNotificationService.sendUpgradeSuggestion(userId, usageData);

    if (result.success) {
      res.json({
        success: true,
        message: 'Upgrade suggestion sent successfully',
        suggestedTier: result.suggestedTier,
        potentialSavings: result.potentialSavings
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.reason || result.error || 'Failed to send upgrade suggestion'
      });
    }

  } catch (error) {
    console.error('Error sending upgrade suggestion:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Send engagement reminder notification
 * POST /api/notifications/engagement-reminder (Admin only)
 */
router.post('/engagement-reminder', requireAdmin, async (req, res) => {
  try {
    const { userId, daysSinceLastService, suggestedServices } = req.body;

    if (!userId || !daysSinceLastService) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, daysSinceLastService'
      });
    }

    const engagementData = {
      daysSinceLastService: parseInt(daysSinceLastService),
      suggestedServices: Array.isArray(suggestedServices) ? suggestedServices : [
        'General Maintenance Check',
        'Seasonal Preparation',
        'Safety Inspection'
      ],
      tier: req.body.tier || 'HOMECARE'
    };

    const result = await smartNotificationService.sendEngagementReminder(userId, engagementData);

    if (result.success) {
      res.json({
        success: true,
        message: 'Engagement reminder sent successfully',
        daysSinceLastService: result.daysSinceLastService
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send engagement reminder'
      });
    }

  } catch (error) {
    console.error('Error sending engagement reminder:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Helper functions for webhook processing
async function handlePaymentFailure(invoice) {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: invoice.subscription },
      include: { user: true }
    });

    if (subscription) {
      await smartNotificationService.handlePaymentFailure(subscription.userId, {
        attemptNumber: 1,
        lastFailureReason: 'Payment failed',
        nextRetryDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
    }
  } catch (error) {
    console.error('Error handling payment failure webhook:', error);
  }
}

async function handlePaymentSuccess(invoice) {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: invoice.subscription },
      include: { user: true }
    });

    if (subscription && subscription.isPaused) {
      // Resume subscription
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          isPaused: false,
          pauseStartDate: null,
          pauseEndDate: null
        }
      });

      // Send recovery notification
      await notificationService.sendPaymentRecoveryNotification(
        subscription.user.email,
        subscription.user.name,
        {
          recoveryDate: new Date(),
          tier: subscription.tier
        }
      );
    }
  } catch (error) {
    console.error('Error handling payment success webhook:', error);
  }
}

async function handleSubscriptionUpdate(subscription) {
  try {
    // Update local subscription data
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status.toUpperCase(),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });
  } catch (error) {
    console.error('Error handling subscription update webhook:', error);
  }
}

// Helper function to calculate utilization rate
function _calculateUtilizationRate(usage, tier) {
  // Simple calculation based on tier limits
  const tierLimits = {
    STARTER: { visits: 1, services: 2 },
    HOMECARE: { visits: 1, services: 4 },
    PRIORITY: { visits: 2, services: 8 }
  };

  const limits = tierLimits[tier] || tierLimits.HOMECARE;
  const usedVisits = usage.priorityBookingCount || 0;
  
  return Math.min(usedVisits / limits.visits, 1);
}

export default router; 