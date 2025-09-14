import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import prisma from '../../config/database.js';
import jwt from 'jsonwebtoken';

// Mock external services
vi.mock('stripe');
vi.mock('../../services/emailService.js');
vi.mock('../../services/sms.js');

describe('End-to-End Payment Workflows', () => {
  let testUser;
  let testSubscription;
  let authToken;
  let mockStripe;
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

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'workflow-test@example.com',
        password: 'hashedpassword',
        name: 'Workflow Test User',
        role: 'CUSTOMER',
        phone: '+1234567890'
      }
    });

    // Generate auth token
    authToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Setup mocks
    const StripeConstructor = (await import('stripe')).default;
    mockStripe = new StripeConstructor();
    
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

  describe('Complete Subscription Lifecycle', () => {
    it('should handle complete subscription creation workflow', async () => {
      // Mock Stripe responses
      mockStripe.customers.create.mockResolvedValue({
        id: 'cus_new123',
        email: testUser.email
      });

      mockStripe.subscriptions.create.mockResolvedValue({
        id: 'sub_new123',
        customer: 'cus_new123',
        status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + 2592000,
        items: {
          data: [{
            price: { id: 'price_homecare_monthly' }
          }]
        }
      });

      mockEmailService.sendSubscriptionConfirmation.mockResolvedValue(true);
      mockSmsService.sendSMS.mockResolvedValue({ success: true });

      // Step 1: Subscribe to a plan
      const subscribeResponse = await request(app)
        .post('/api/plans/subscribe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tier: 'HOMECARE',
          paymentMethodId: 'pm_test123',
          paymentFrequency: 'MONTHLY'
        });

      expect(subscribeResponse.status).toBe(200);
      expect(subscribeResponse.body.success).toBe(true);

      // Verify subscription was created in database
      const subscription = await prisma.subscription.findFirst({
        where: { userId: testUser.id }
      });
      expect(subscription).toBeTruthy();
      expect(subscription.tier).toBe('HOMECARE');
      expect(subscription.status).toBe('ACTIVE');

      // Verify notifications were sent
      expect(mockEmailService.sendSubscriptionConfirmation).toHaveBeenCalledWith(
        testUser.email,
        expect.objectContaining({
          tier: 'HOMECARE',
          paymentFrequency: 'MONTHLY'
        })
      );

      expect(mockSmsService.sendSMS).toHaveBeenCalledWith(
        testUser.phone,
        expect.stringContaining('subscription confirmed')
      );
    });

    it('should handle subscription upgrade workflow', async () => {
      // Create initial subscription
      const subscription = await prisma.subscription.create({
        data: {
          userId: testUser.id,
          tier: 'STARTER',
          status: 'ACTIVE',
          paymentFrequency: 'MONTHLY',
          stripeSubscriptionId: 'sub_test123'
        }
      });

      mockStripe.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_test123',
        items: {
          data: [{
            id: 'si_test123',
            price: { id: 'price_starter_monthly' }
          }]
        }
      });

      mockStripe.subscriptions.update.mockResolvedValue({
        id: 'sub_test123',
        status: 'active',
        items: {
          data: [{
            price: { id: 'price_homecare_monthly' }
          }]
        }
      });

      mockEmailService.sendPlanChangeConfirmation.mockResolvedValue(true);

      // Step 1: Upgrade plan
      const upgradeResponse = await request(app)
        .post('/api/plans/change-plan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          newTier: 'HOMECARE'
        });

      expect(upgradeResponse.status).toBe(200);
      expect(upgradeResponse.body.success).toBe(true);

      // Verify upgrade was processed
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { id: subscription.id }
      });
      expect(updatedSubscription.tier).toBe('HOMECARE');

      // Verify Stripe was updated
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        'sub_test123',
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              price: expect.stringContaining('homecare')
            })
          ])
        })
      );

      // Verify notification was sent
      expect(mockEmailService.sendPlanChangeConfirmation).toHaveBeenCalled();
    });

    it('should handle payment failure and recovery workflow', async () => {
      // Create subscription
      const subscription = await prisma.subscription.create({
        data: {
          userId: testUser.id,
          tier: 'HOMECARE',
          status: 'ACTIVE',
          paymentFrequency: 'MONTHLY',
          stripeSubscriptionId: 'sub_test123'
        }
      });

      mockEmailService.sendPaymentFailureNotification.mockResolvedValue(true);
      mockEmailService.sendPaymentRecoveredNotification.mockResolvedValue(true);
      mockSmsService.sendSMS.mockResolvedValue({ success: true });

      // Step 1: Simulate payment failure webhook
      const failureWebhook = {
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_test123',
            subscription: 'sub_test123',
            customer: 'cus_workflow123',
            amount_due: 2999,
            attempt_count: 1
          }
        }
      };

      mockStripe.events.construct.mockReturnValue(failureWebhook);

      const failureResponse = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'test_signature')
        .send(failureWebhook);

      expect(failureResponse.status).toBe(200);

      // Verify subscription was paused
      const pausedSubscription = await prisma.subscription.findUnique({
        where: { id: subscription.id }
      });
      expect(pausedSubscription.isPaused).toBe(true);

      // Verify failure notifications were sent
      expect(mockEmailService.sendPaymentFailureNotification).toHaveBeenCalled();
      expect(mockSmsService.sendSMS).toHaveBeenCalledWith(
        testUser.phone,
        expect.stringContaining('payment failed')
      );

      // Step 2: Simulate payment recovery webhook
      const successWebhook = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_test123',
            subscription: 'sub_test123',
            customer: 'cus_workflow123',
            amount_paid: 2999
          }
        }
      };

      mockStripe.events.construct.mockReturnValue(successWebhook);

      const successResponse = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'test_signature')
        .send(successWebhook);

      expect(successResponse.status).toBe(200);

      // Verify subscription was resumed
      const resumedSubscription = await prisma.subscription.findUnique({
        where: { id: subscription.id }
      });
      expect(resumedSubscription.isPaused).toBe(false);

      // Verify recovery notifications were sent
      expect(mockEmailService.sendPaymentRecoveredNotification).toHaveBeenCalled();
    });
  });

  describe('Payment Frequency Change Workflow', () => {
    it('should handle monthly to yearly frequency change', async () => {
      // Create subscription
      const subscription = await prisma.subscription.create({
        data: {
          userId: testUser.id,
          tier: 'HOMECARE',
          status: 'ACTIVE',
          paymentFrequency: 'MONTHLY',
          stripeSubscriptionId: 'sub_test123'
        }
      });

      mockStripe.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_test123',
        items: {
          data: [{
            id: 'si_test123',
            price: { id: 'price_homecare_monthly' }
          }]
        }
      });

      mockStripe.subscriptions.update.mockResolvedValue({
        id: 'sub_test123',
        status: 'active',
        items: {
          data: [{
            price: { id: 'price_homecare_yearly' }
          }]
        }
      });

      mockEmailService.sendFrequencyChangeConfirmation.mockResolvedValue(true);

      // Change frequency
      const response = await request(app)
        .post('/api/subscriptions/change-frequency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ frequency: 'YEARLY' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify database was updated
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { id: subscription.id }
      });
      expect(updatedSubscription.paymentFrequency).toBe('YEARLY');

      // Verify PaymentFrequency record was created
      const paymentFrequency = await prisma.paymentFrequency.findFirst({
        where: { subscriptionId: subscription.id }
      });
      expect(paymentFrequency).toBeTruthy();
      expect(paymentFrequency.frequency).toBe('YEARLY');

      // Verify Stripe was updated
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        'sub_test123',
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              price: expect.stringContaining('yearly')
            })
          ])
        })
      );

      // Verify notification was sent
      expect(mockEmailService.sendFrequencyChangeConfirmation).toHaveBeenCalledWith(
        testUser.email,
        expect.objectContaining({
          oldFrequency: 'MONTHLY',
          newFrequency: 'YEARLY'
        })
      );
    });
  });

  describe('Additional Property Workflow', () => {
    it('should handle complete additional property addition workflow', async () => {
      // Create subscription
      const subscription = await prisma.subscription.create({
        data: {
          userId: testUser.id,
          tier: 'HOMECARE',
          status: 'ACTIVE',
          paymentFrequency: 'MONTHLY',
          stripeSubscriptionId: 'sub_test123'
        }
      });

      mockStripe.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_test123',
        items: {
          data: [{
            id: 'si_test123',
            price: { id: 'price_homecare_monthly' }
          }]
        }
      });

      mockStripe.subscriptions.update.mockResolvedValue({
        id: 'sub_test123',
        status: 'active'
      });

      mockEmailService.sendAdditionalPropertyConfirmation.mockResolvedValue(true);

      // Add additional property
      const response = await request(app)
        .post('/api/subscriptions/add-property')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          address: '456 Second St, City, State 12345',
          nickname: 'Vacation Home',
          ownershipVerification: 'deed_document_url'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify property was added to database
      const additionalProperty = await prisma.additionalProperty.findFirst({
        where: { subscriptionId: subscription.id }
      });
      expect(additionalProperty).toBeTruthy();
      expect(additionalProperty.address).toBe('456 Second St, City, State 12345');
      expect(additionalProperty.nickname).toBe('Vacation Home');

      // Verify Stripe subscription was updated with additional charges
      expect(mockStripe.subscriptions.update).toHaveBeenCalled();

      // Verify notification was sent
      expect(mockEmailService.sendAdditionalPropertyConfirmation).toHaveBeenCalledWith(
        testUser.email,
        expect.objectContaining({
          address: '456 Second St, City, State 12345',
          monthlyFee: expect.any(Number)
        })
      );
    });
  });

  describe('Rewards and Credits Workflow', () => {
    it('should handle complete referral reward workflow', async () => {
      // Create subscription for referrer
      const referrerSubscription = await prisma.subscription.create({
        data: {
          userId: testUser.id,
          tier: 'HOMECARE',
          status: 'ACTIVE',
          paymentFrequency: 'MONTHLY',
          stripeSubscriptionId: 'sub_referrer123'
        }
      });

      // Create referred user
      const referredUser = await prisma.user.create({
        data: {
          email: 'referred@example.com',
          password: 'hashedpassword',
          name: 'Referred User',
          role: 'CUSTOMER'
        }
      });

      mockStripe.customers.create.mockResolvedValue({
        id: 'cus_referred123',
        email: 'referred@example.com'
      });

      mockStripe.subscriptions.create.mockResolvedValue({
        id: 'sub_referred123',
        customer: 'cus_referred123',
        status: 'active'
      });

      mockEmailService.sendReferralRewardNotification.mockResolvedValue(true);

      // Process referral
      const response = await request(app)
        .post('/api/rewards/process-referral')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          referredUserId: referredUser.id,
          referralCode: 'REF123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify reward credit was created
      const rewardCredit = await prisma.rewardCredit.findFirst({
        where: { userId: testUser.id, type: 'REFERRAL' }
      });
      expect(rewardCredit).toBeTruthy();
      expect(rewardCredit.amount).toBeGreaterThan(0);

      // Verify notification was sent
      expect(mockEmailService.sendReferralRewardNotification).toHaveBeenCalledWith(
        testUser.email,
        expect.objectContaining({
          creditAmount: expect.any(Number),
          referredUserName: 'Referred User'
        })
      );
    });

    it('should handle credit application to billing workflow', async () => {
      // Create subscription
      const subscription = await prisma.subscription.create({
        data: {
          userId: testUser.id,
          tier: 'HOMECARE',
          status: 'ACTIVE',
          paymentFrequency: 'MONTHLY',
          stripeSubscriptionId: 'sub_test123'
        }
      });

      // Create reward credits
      await prisma.rewardCredit.create({
        data: {
          userId: testUser.id,
          amount: 50.00,
          type: 'REFERRAL',
          description: 'Referral reward'
        }
      });

      mockStripe.invoices.create.mockResolvedValue({
        id: 'in_credit123',
        amount_due: 2499 // $24.99 after $5 credit applied
      });

      mockEmailService.sendCreditApplicationNotification.mockResolvedValue(true);

      // Apply credits to next billing
      const response = await request(app)
        .post('/api/rewards/redeem-credits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 50.00
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify credit was marked as used
      const usedCredit = await prisma.rewardCredit.findFirst({
        where: { userId: testUser.id, type: 'REFERRAL' }
      });
      expect(usedCredit.usedAt).toBeTruthy();

      // Verify notification was sent
      expect(mockEmailService.sendCreditApplicationNotification).toHaveBeenCalledWith(
        testUser.email,
        expect.objectContaining({
          creditAmount: 50.00,
          newBillingAmount: expect.any(Number)
        })
      );
    });
  });

  describe('Error Recovery Workflows', () => {
    it('should handle Stripe API failures gracefully', async () => {
      const subscription = await prisma.subscription.create({
        data: {
          userId: testUser.id,
          tier: 'HOMECARE',
          status: 'ACTIVE',
          paymentFrequency: 'MONTHLY',
          stripeSubscriptionId: 'sub_test123'
        }
      });

      // Mock Stripe failure
      mockStripe.subscriptions.update.mockRejectedValue(
        new Error('Your card was declined.')
      );

      mockEmailService.sendPaymentErrorNotification.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/subscriptions/change-frequency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ frequency: 'YEARLY' });

      expect(response.status).toBe(500);

      // Verify error notification was sent
      expect(mockEmailService.sendPaymentErrorNotification).toHaveBeenCalledWith(
        testUser.email,
        expect.objectContaining({
          error: expect.stringContaining('card was declined')
        })
      );

      // Verify database state remained consistent
      const unchangedSubscription = await prisma.subscription.findUnique({
        where: { id: subscription.id }
      });
      expect(unchangedSubscription.paymentFrequency).toBe('MONTHLY');
    });

    it('should handle partial workflow failures', async () => {
      const subscription = await prisma.subscription.create({
        data: {
          userId: testUser.id,
          tier: 'HOMECARE',
          status: 'ACTIVE',
          paymentFrequency: 'MONTHLY',
          stripeSubscriptionId: 'sub_test123'
        }
      });

      // Mock successful Stripe update but failed notification
      mockStripe.subscriptions.update.mockResolvedValue({
        id: 'sub_test123',
        status: 'active'
      });

      mockEmailService.sendFrequencyChangeConfirmation.mockRejectedValue(
        new Error('Email service unavailable')
      );

      const response = await request(app)
        .post('/api/subscriptions/change-frequency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ frequency: 'YEARLY' });

      // Should still succeed even if notification fails
      expect(response.status).toBe(200);

      // Verify database was updated despite notification failure
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { id: subscription.id }
      });
      expect(updatedSubscription.paymentFrequency).toBe('YEARLY');
    });
  });
});