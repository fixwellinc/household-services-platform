import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import prisma from '../../config/database.js';
import jwt from 'jsonwebtoken';

// Mock notification services
vi.mock('../../services/emailService.js', () => ({
  default: {
    sendEmail: vi.fn(),
    sendSubscriptionConfirmation: vi.fn(),
    sendPaymentFailureNotification: vi.fn(),
    sendPaymentRecoveredNotification: vi.fn(),
    sendFrequencyChangeConfirmation: vi.fn(),
    sendPlanChangeConfirmation: vi.fn(),
    sendAdditionalPropertyConfirmation: vi.fn(),
    sendReferralRewardNotification: vi.fn(),
    sendCreditApplicationNotification: vi.fn(),
    sendPaymentErrorNotification: vi.fn(),
    sendPaymentReminderNotification: vi.fn(),
    sendUpgradeRecommendation: vi.fn(),
    sendEngagementReminder: vi.fn()
  }
}));

vi.mock('../../services/sms.js', () => ({
  default: {
    sendSMS: vi.fn(),
    sendPaymentReminder: vi.fn(),
    sendPaymentFailureAlert: vi.fn(),
    sendPaymentRecoveredAlert: vi.fn(),
    sendServiceReminder: vi.fn()
  }
}));

vi.mock('nodemailer', () => ({
  createTransport: vi.fn(() => ({
    sendMail: vi.fn()
  }))
}));

vi.mock('twilio', () => ({
  default: vi.fn(() => ({
    messages: {
      create: vi.fn()
    }
  }))
}));

describe('Notification Delivery Integration Tests', () => {
  let testUser;
  let testSubscription;
  let authToken;
  let mockEmailService;
  let mockSmsService;

  beforeEach(async () => {
    // Clean up test data
    await prisma.paymentFrequency.deleteMany({});
    await prisma.subscriptionPause.deleteMany({});
    await prisma.additionalProperty.deleteMany({});
    await prisma.rewardCredit.deleteMany({});
    await prisma.subscriptionUsage.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user with notification preferences
    testUser = await prisma.user.create({
      data: {
        email: 'notification-test@example.com',
        password: 'hashedpassword',
        name: 'Notification Test User',
        role: 'CUSTOMER',
        phone: '+1234567890',
        notifications: {
          email: true,
          sms: true,
          paymentReminders: true,
          serviceReminders: true,
          promotions: false
        }
      }
    });

    // Create test subscription
    testSubscription = await prisma.subscription.create({
      data: {
        userId: testUser.id,
        tier: 'HOMECARE',
        status: 'ACTIVE',
        paymentFrequency: 'MONTHLY',
        stripeCustomerId: 'cus_notification123',
        stripeSubscriptionId: 'sub_notification123'
      }
    });

    // Generate auth token
    authToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Get mocked services
    const emailService = await import('../../services/emailService.js');
    mockEmailService = emailService.default;
    
    const smsService = await import('../../services/sms.js');
    mockSmsService = smsService.default;

    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.paymentFrequency.deleteMany({});
    await prisma.subscriptionPause.deleteMany({});
    await prisma.additionalProperty.deleteMany({});
    await prisma.rewardCredit.deleteMany({});
    await prisma.subscriptionUsage.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.user.deleteMany({});
    
    vi.clearAllMocks();
  });

  describe('Email Notification Delivery', () => {
    it('should send payment reminder emails', async () => {
      mockEmailService.sendPaymentReminderNotification.mockResolvedValue({
        success: true,
        messageId: 'email_123'
      });

      const response = await request(app)
        .post('/api/notifications/payment-reminder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subscriptionId: testSubscription.id,
          daysUntilDue: 7
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(mockEmailService.sendPaymentReminderNotification).toHaveBeenCalledWith(
        testUser.email,
        expect.objectContaining({
          userName: testUser.name,
          daysUntilDue: 7,
          subscriptionTier: 'HOMECARE',
          paymentAmount: expect.any(Number)
        })
      );
    });

    it('should send payment failure notifications', async () => {
      mockEmailService.sendPaymentFailureNotification.mockResolvedValue({
        success: true,
        messageId: 'email_failure_123'
      });

      const response = await request(app)
        .post('/api/notifications/payment-failure')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subscriptionId: testSubscription.id,
          failureReason: 'Insufficient funds',
          gracePeriodDays: 7
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(mockEmailService.sendPaymentFailureNotification).toHaveBeenCalledWith(
        testUser.email,
        expect.objectContaining({
          userName: testUser.name,
          failureReason: 'Insufficient funds',
          gracePeriodDays: 7,
          subscriptionTier: 'HOMECARE'
        })
      );
    });

    it('should send subscription confirmation emails', async () => {
      mockEmailService.sendSubscriptionConfirmation.mockResolvedValue({
        success: true,
        messageId: 'email_confirmation_123'
      });

      const response = await request(app)
        .post('/api/notifications/subscription-confirmation')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subscriptionId: testSubscription.id
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(mockEmailService.sendSubscriptionConfirmation).toHaveBeenCalledWith(
        testUser.email,
        expect.objectContaining({
          userName: testUser.name,
          subscriptionTier: 'HOMECARE',
          paymentFrequency: 'MONTHLY'
        })
      );
    });

    it('should handle email delivery failures gracefully', async () => {
      mockEmailService.sendPaymentReminderNotification.mockRejectedValue(
        new Error('SMTP server unavailable')
      );

      const response = await request(app)
        .post('/api/notifications/payment-reminder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subscriptionId: testSubscription.id,
          daysUntilDue: 7
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('SMTP server unavailable');
    });

    it('should respect user email preferences', async () => {
      // Update user to disable email notifications
      await prisma.user.update({
        where: { id: testUser.id },
        data: {
          notifications: {
            email: false,
            sms: true,
            paymentReminders: true,
            serviceReminders: true,
            promotions: false
          }
        }
      });

      const response = await request(app)
        .post('/api/notifications/payment-reminder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subscriptionId: testSubscription.id,
          daysUntilDue: 7
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Email notifications disabled');
      expect(mockEmailService.sendPaymentReminderNotification).not.toHaveBeenCalled();
    });
  });

  describe('SMS Notification Delivery', () => {
    it('should send payment reminder SMS', async () => {
      mockSmsService.sendPaymentReminder.mockResolvedValue({
        success: true,
        sid: 'sms_123'
      });

      const response = await request(app)
        .post('/api/notifications/sms-payment-reminder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subscriptionId: testSubscription.id,
          daysUntilDue: 3
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(mockSmsService.sendPaymentReminder).toHaveBeenCalledWith(
        testUser.phone,
        expect.objectContaining({
          userName: testUser.name,
          daysUntilDue: 3,
          paymentAmount: expect.any(Number)
        })
      );
    });

    it('should send payment failure SMS alerts', async () => {
      mockSmsService.sendPaymentFailureAlert.mockResolvedValue({
        success: true,
        sid: 'sms_failure_123'
      });

      const response = await request(app)
        .post('/api/notifications/sms-payment-failure')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subscriptionId: testSubscription.id,
          gracePeriodDays: 7
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(mockSmsService.sendPaymentFailureAlert).toHaveBeenCalledWith(
        testUser.phone,
        expect.objectContaining({
          gracePeriodDays: 7
        })
      );
    });

    it('should send service reminder SMS', async () => {
      mockSmsService.sendServiceReminder.mockResolvedValue({
        success: true,
        sid: 'sms_service_123'
      });

      const response = await request(app)
        .post('/api/notifications/sms-service-reminder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subscriptionId: testSubscription.id,
          serviceDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(mockSmsService.sendServiceReminder).toHaveBeenCalledWith(
        testUser.phone,
        expect.objectContaining({
          userName: testUser.name,
          serviceDate: expect.any(String)
        })
      );
    });

    it('should handle SMS delivery failures gracefully', async () => {
      mockSmsService.sendPaymentReminder.mockRejectedValue(
        new Error('Invalid phone number')
      );

      const response = await request(app)
        .post('/api/notifications/sms-payment-reminder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subscriptionId: testSubscription.id,
          daysUntilDue: 3
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Invalid phone number');
    });

    it('should respect user SMS preferences', async () => {
      // Update user to disable SMS notifications
      await prisma.user.update({
        where: { id: testUser.id },
        data: {
          notifications: {
            email: true,
            sms: false,
            paymentReminders: true,
            serviceReminders: true,
            promotions: false
          }
        }
      });

      const response = await request(app)
        .post('/api/notifications/sms-payment-reminder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subscriptionId: testSubscription.id,
          daysUntilDue: 3
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('SMS notifications disabled');
      expect(mockSmsService.sendPaymentReminder).not.toHaveBeenCalled();
    });

    it('should validate phone numbers before sending SMS', async () => {
      // Update user with invalid phone number
      await prisma.user.update({
        where: { id: testUser.id },
        data: { phone: 'invalid-phone' }
      });

      const response = await request(app)
        .post('/api/notifications/sms-payment-reminder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subscriptionId: testSubscription.id,
          daysUntilDue: 3
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid phone number');
      expect(mockSmsService.sendPaymentReminder).not.toHaveBeenCalled();
    });
  });

  describe('Multi-Channel Notification Delivery', () => {
    it('should send notifications via both email and SMS', async () => {
      mockEmailService.sendPaymentReminderNotification.mockResolvedValue({
        success: true,
        messageId: 'email_123'
      });

      mockSmsService.sendPaymentReminder.mockResolvedValue({
        success: true,
        sid: 'sms_123'
      });

      const response = await request(app)
        .post('/api/notifications/multi-channel-reminder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subscriptionId: testSubscription.id,
          daysUntilDue: 7,
          channels: ['email', 'sms']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results.email.success).toBe(true);
      expect(response.body.results.sms.success).toBe(true);

      expect(mockEmailService.sendPaymentReminderNotification).toHaveBeenCalled();
      expect(mockSmsService.sendPaymentReminder).toHaveBeenCalled();
    });

    it('should handle partial delivery failures in multi-channel notifications', async () => {
      mockEmailService.sendPaymentReminderNotification.mockResolvedValue({
        success: true,
        messageId: 'email_123'
      });

      mockSmsService.sendPaymentReminder.mockRejectedValue(
        new Error('SMS service unavailable')
      );

      const response = await request(app)
        .post('/api/notifications/multi-channel-reminder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subscriptionId: testSubscription.id,
          daysUntilDue: 7,
          channels: ['email', 'sms']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results.email.success).toBe(true);
      expect(response.body.results.sms.success).toBe(false);
      expect(response.body.results.sms.error).toContain('SMS service unavailable');
    });
  });

  describe('Notification Preferences Management', () => {
    it('should update notification preferences', async () => {
      const response = await request(app)
        .post('/api/notifications/update-preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: false,
          sms: true,
          paymentReminders: true,
          serviceReminders: false,
          promotions: true
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify preferences were updated in database
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      expect(updatedUser.notifications.email).toBe(false);
      expect(updatedUser.notifications.sms).toBe(true);
      expect(updatedUser.notifications.paymentReminders).toBe(true);
      expect(updatedUser.notifications.serviceReminders).toBe(false);
      expect(updatedUser.notifications.promotions).toBe(true);
    });

    it('should get current notification preferences', async () => {
      const response = await request(app)
        .get('/api/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.preferences).toMatchObject({
        email: true,
        sms: true,
        paymentReminders: true,
        serviceReminders: true,
        promotions: false
      });
    });
  });

  describe('Notification History and Tracking', () => {
    it('should track notification delivery status', async () => {
      mockEmailService.sendPaymentReminderNotification.mockResolvedValue({
        success: true,
        messageId: 'email_123'
      });

      const response = await request(app)
        .post('/api/notifications/payment-reminder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subscriptionId: testSubscription.id,
          daysUntilDue: 7
        });

      expect(response.status).toBe(200);

      // Check notification history
      const historyResponse = await request(app)
        .get('/api/notifications/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(historyResponse.status).toBe(200);
      expect(historyResponse.body.notifications).toHaveLength(1);
      expect(historyResponse.body.notifications[0]).toMatchObject({
        type: 'payment_reminder',
        channel: 'email',
        status: 'delivered',
        messageId: 'email_123'
      });
    });

    it('should retry failed notifications', async () => {
      // First attempt fails
      mockEmailService.sendPaymentReminderNotification
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          success: true,
          messageId: 'email_retry_123'
        });

      const response = await request(app)
        .post('/api/notifications/payment-reminder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subscriptionId: testSubscription.id,
          daysUntilDue: 7,
          retryOnFailure: true
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.retryAttempts).toBe(1);

      // Verify both attempts were made
      expect(mockEmailService.sendPaymentReminderNotification).toHaveBeenCalledTimes(2);
    });
  });

  describe('Notification Rate Limiting', () => {
    it('should prevent spam notifications', async () => {
      mockEmailService.sendPaymentReminderNotification.mockResolvedValue({
        success: true,
        messageId: 'email_123'
      });

      // Send first notification
      const firstResponse = await request(app)
        .post('/api/notifications/payment-reminder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subscriptionId: testSubscription.id,
          daysUntilDue: 7
        });

      expect(firstResponse.status).toBe(200);

      // Try to send same notification immediately
      const secondResponse = await request(app)
        .post('/api/notifications/payment-reminder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subscriptionId: testSubscription.id,
          daysUntilDue: 7
        });

      expect(secondResponse.status).toBe(429);
      expect(secondResponse.body.error).toContain('rate limit');
      expect(mockEmailService.sendPaymentReminderNotification).toHaveBeenCalledTimes(1);
    });
  });

  describe('Template and Content Validation', () => {
    it('should validate notification templates', async () => {
      const response = await request(app)
        .post('/api/notifications/validate-template')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          templateType: 'payment_reminder',
          templateData: {
            userName: testUser.name,
            daysUntilDue: 7,
            paymentAmount: 29.99
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.renderedContent).toContain(testUser.name);
      expect(response.body.renderedContent).toContain('7 days');
      expect(response.body.renderedContent).toContain('$29.99');
    });

    it('should reject invalid template data', async () => {
      const response = await request(app)
        .post('/api/notifications/validate-template')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          templateType: 'payment_reminder',
          templateData: {
            // Missing required fields
            userName: testUser.name
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.valid).toBe(false);
      expect(response.body.errors).toContain('daysUntilDue is required');
      expect(response.body.errors).toContain('paymentAmount is required');
    });
  });
});