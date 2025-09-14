import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock services first
vi.mock('../config/database.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    setting: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('../services/smartNotificationService.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    sendPaymentReminder: vi.fn(),
    sendUpgradeSuggestion: vi.fn(),
    sendEngagementReminder: vi.fn(),
    handlePaymentFailure: vi.fn(),
  })),
}));

vi.mock('../services/paymentMethodService.js', () => ({
  default: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('../services/notificationService.js', () => ({
  default: {
    sendPaymentRecoveryNotification: vi.fn(),
  },
}));

vi.mock('../services/sms.js', () => ({
  default: {
    validatePhoneNumber: vi.fn(),
    sendChatNotification: vi.fn(),
    sendUrgentNotification: vi.fn(),
  },
}));

// Mock auth middleware
vi.mock('../middleware/auth.js', () => ({
  requireAdmin: (req, res, next) => {
    req.user = { id: 'admin-1', role: 'ADMIN' };
    next();
  },
  authMiddleware: (req, res, next) => {
    req.user = { id: 'user-1', role: 'CUSTOMER' };
    next();
  },
}));

describe('Enhanced Notification Routes', () => {
  let app;
  let mockSmartNotificationService;
  let mockSmsService;
  let mockPrisma;
  let notificationRoutes;

  beforeEach(async () => {
    // Import mocked services
    const database = await import('../config/database.js');
    const SmartNotificationService = await import('../services/smartNotificationService.js');
    const smsService = await import('../services/sms.js');
    const routes = await import('../routes/notifications.js');
    
    mockPrisma = database.default;
    mockSmartNotificationService = new SmartNotificationService.default();
    mockSmsService = smsService.default;
    notificationRoutes = routes.default;

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/notifications', notificationRoutes);

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /payment-reminder', () => {
    const validReminderData = {
      userId: 'user-1',
      daysUntilDue: 3,
      amount: 59.99,
      dueDate: '2024-01-15T00:00:00.000Z'
    };

    it('should send payment reminder successfully', async () => {
      mockSmartNotificationService.sendPaymentReminder.mockResolvedValue({
        success: true,
        emailSent: true,
        smsSent: false,
        urgency: 'NORMAL'
      });

      const response = await request(app)
        .post('/api/notifications/payment-reminder')
        .send(validReminderData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.emailSent).toBe(true);
      expect(response.body.urgency).toBe('NORMAL');
      expect(mockSmartNotificationService.sendPaymentReminder).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          daysUntilDue: 3,
          amount: 59.99,
          dueDate: expect.any(Date)
        })
      );
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/notifications/payment-reminder')
        .send({ userId: 'user-1' }); // Missing other required fields

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should handle service errors', async () => {
      mockSmartNotificationService.sendPaymentReminder.mockResolvedValue({
        success: false,
        error: 'User not found'
      });

      const response = await request(app)
        .post('/api/notifications/payment-reminder')
        .send(validReminderData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('GET /user/notifications', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      subscription: {
        id: 'sub-1',
        tier: 'HOMECARE',
        isPaused: false,
        currentPeriodEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      },
      subscriptionUsage: {
        priorityBookingCount: 8,
      },
    };

    it('should return user notifications successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/notifications/user/notifications');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.notifications).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThanOrEqual(0);
      expect(response.body.unreadCount).toBeGreaterThanOrEqual(0);
    });

    it('should include payment due notification for upcoming payments', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/notifications/user/notifications');

      expect(response.status).toBe(200);
      const paymentNotification = response.body.notifications.find(
        n => n.type === 'PAYMENT_DUE'
      );
      expect(paymentNotification).toBeDefined();
      expect(paymentNotification.title).toContain('Payment Due Soon');
    });

    it('should include upgrade suggestion for high usage', async () => {
      const highUsageUser = {
        ...mockUser,
        subscriptionUsage: {
          priorityBookingCount: 9, // High usage
        },
      };
      mockPrisma.user.findUnique.mockResolvedValue(highUsageUser);

      const response = await request(app)
        .get('/api/notifications/user/notifications');

      expect(response.status).toBe(200);
      const upgradeNotification = response.body.notifications.find(
        n => n.type === 'UPGRADE_SUGGESTION'
      );
      expect(upgradeNotification).toBeDefined();
      expect(upgradeNotification.title).toContain('Upgrade Recommendation');
    });

    it('should include subscription paused notification', async () => {
      const pausedUser = {
        ...mockUser,
        subscription: {
          ...mockUser.subscription,
          isPaused: true,
          pauseStartDate: new Date(),
          pauseEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      };
      mockPrisma.user.findUnique.mockResolvedValue(pausedUser);

      const response = await request(app)
        .get('/api/notifications/user/notifications');

      expect(response.status).toBe(200);
      const pauseNotification = response.body.notifications.find(
        n => n.type === 'SUBSCRIPTION_PAUSED'
      );
      expect(pauseNotification).toBeDefined();
      expect(pauseNotification.title).toContain('Subscription Paused');
    });

    it('should filter notifications by type', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/notifications/user/notifications?type=PAYMENT_DUE');

      expect(response.status).toBe(200);
      expect(response.body.notifications.every(n => n.type === 'PAYMENT_DUE')).toBe(true);
    });

    it('should handle pagination', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/notifications/user/notifications?limit=1&offset=0');

      expect(response.status).toBe(200);
      expect(response.body.notifications.length).toBeLessThanOrEqual(1);
    });

    it('should return 404 for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/notifications/user/notifications');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('POST /update-preferences', () => {
    const validPreferences = {
      emailNotifications: true,
      smsNotifications: true,
      paymentReminders: true,
      upgradeSuggestions: false,
      engagementReminders: true,
      marketingEmails: false,
      phone: '+1234567890'
    };

    it('should update notification preferences successfully', async () => {
      mockSmsService.validatePhoneNumber.mockReturnValue(true);
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        phone: '+1234567890',
        notifications: {
          email: true,
          sms: true,
          paymentReminders: true,
          upgradeSuggestions: false,
          engagementReminders: true,
          marketingEmails: false
        }
      });

      const response = await request(app)
        .post('/api/notifications/update-preferences')
        .send(validPreferences);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.preferences.email).toBe(true);
      expect(response.body.preferences.sms).toBe(true);
      expect(response.body.phone).toBe('+1234567890');
    });

    it('should validate phone number format', async () => {
      mockSmsService.validatePhoneNumber.mockReturnValue(false);

      const response = await request(app)
        .post('/api/notifications/update-preferences')
        .send({
          ...validPreferences,
          phone: 'invalid-phone'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid phone number format');
    });

    it('should handle database errors', async () => {
      mockSmsService.validatePhoneNumber.mockReturnValue(true);
      mockPrisma.user.update.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/notifications/update-preferences')
        .send(validPreferences);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /upgrade-suggestion', () => {
    const validSuggestionData = {
      userId: 'user-1',
      currentUsage: 8,
      planLimit: 10,
      suggestedTier: 'PRIORITY',
      potentialSavings: 15.99
    };

    it('should send upgrade suggestion successfully', async () => {
      mockSmartNotificationService.sendUpgradeSuggestion.mockResolvedValue({
        success: true,
        suggestedTier: 'PRIORITY',
        potentialSavings: 15.99
      });

      const response = await request(app)
        .post('/api/notifications/upgrade-suggestion')
        .send(validSuggestionData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.suggestedTier).toBe('PRIORITY');
      expect(response.body.potentialSavings).toBe(15.99);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/notifications/upgrade-suggestion')
        .send({ userId: 'user-1' }); // Missing suggestedTier

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should handle service rejection', async () => {
      mockSmartNotificationService.sendUpgradeSuggestion.mockResolvedValue({
        success: false,
        reason: 'Upgrade not recommended based on usage'
      });

      const response = await request(app)
        .post('/api/notifications/upgrade-suggestion')
        .send(validSuggestionData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Upgrade not recommended');
    });
  });

  describe('POST /engagement-reminder', () => {
    const validEngagementData = {
      userId: 'user-1',
      daysSinceLastService: 45,
      suggestedServices: ['Gutter Cleaning', 'HVAC Check'],
      tier: 'HOMECARE'
    };

    it('should send engagement reminder successfully', async () => {
      mockSmartNotificationService.sendEngagementReminder.mockResolvedValue({
        success: true,
        daysSinceLastService: 45
      });

      const response = await request(app)
        .post('/api/notifications/engagement-reminder')
        .send(validEngagementData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.daysSinceLastService).toBe(45);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/notifications/engagement-reminder')
        .send({ userId: 'user-1' }); // Missing daysSinceLastService

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should use default suggested services if not provided', async () => {
      mockSmartNotificationService.sendEngagementReminder.mockResolvedValue({
        success: true,
        daysSinceLastService: 45
      });

      const response = await request(app)
        .post('/api/notifications/engagement-reminder')
        .send({
          userId: 'user-1',
          daysSinceLastService: 45
        });

      expect(response.status).toBe(200);
      expect(mockSmartNotificationService.sendEngagementReminder).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          suggestedServices: expect.arrayContaining(['General Maintenance Check'])
        })
      );
    });
  });

  describe('POST /webhook/payment-status', () => {
    it('should handle payment failure webhook', async () => {
      const webhookData = {
        type: 'invoice.payment_failed',
        data: {
          object: {
            subscription: 'sub_stripe123',
            customer: 'cus_stripe123'
          }
        }
      };

      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
        stripeSubscriptionId: 'sub_stripe123',
        user: { id: 'user-1', email: 'test@example.com' }
      });

      mockSmartNotificationService.handlePaymentFailure.mockResolvedValue({
        success: true
      });

      const response = await request(app)
        .post('/api/notifications/webhook/payment-status')
        .send(webhookData);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
      expect(mockSmartNotificationService.handlePaymentFailure).toHaveBeenCalled();
    });

    it('should handle payment success webhook', async () => {
      const webhookData = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            subscription: 'sub_stripe123',
            customer: 'cus_stripe123'
          }
        }
      };

      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
        stripeSubscriptionId: 'sub_stripe123',
        isPaused: true,
        user: { id: 'user-1', email: 'test@example.com', name: 'Test User' }
      });

      mockPrisma.subscription.update.mockResolvedValue({});

      const response = await request(app)
        .post('/api/notifications/webhook/payment-status')
        .send(webhookData);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: {
          status: 'ACTIVE',
          isPaused: false,
          pauseStartDate: null,
          pauseEndDate: null
        }
      });
    });

    it('should handle subscription update webhook', async () => {
      const webhookData = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_stripe123',
            status: 'active',
            current_period_start: 1640995200, // Unix timestamp
            current_period_end: 1643673600
          }
        }
      };

      mockPrisma.subscription.updateMany.mockResolvedValue({});

      const response = await request(app)
        .post('/api/notifications/webhook/payment-status')
        .send(webhookData);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
      expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_stripe123' },
        data: {
          status: 'ACTIVE',
          currentPeriodStart: expect.any(Date),
          currentPeriodEnd: expect.any(Date)
        }
      });
    });

    it('should handle unknown webhook types gracefully', async () => {
      const webhookData = {
        type: 'unknown.event.type',
        data: { object: {} }
      };

      const response = await request(app)
        .post('/api/notifications/webhook/payment-status')
        .send(webhookData);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });
  });
});