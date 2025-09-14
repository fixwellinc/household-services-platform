import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import prisma from '../../config/database.js';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

// Mock Stripe
vi.mock('stripe', () => {
  const mockStripe = {
    customers: {
      create: vi.fn(),
      retrieve: vi.fn(),
      update: vi.fn(),
      list: vi.fn()
    },
    subscriptions: {
      create: vi.fn(),
      retrieve: vi.fn(),
      update: vi.fn(),
      cancel: vi.fn(),
      list: vi.fn()
    },
    paymentMethods: {
      create: vi.fn(),
      attach: vi.fn(),
      detach: vi.fn(),
      list: vi.fn()
    },
    invoices: {
      create: vi.fn(),
      retrieve: vi.fn(),
      pay: vi.fn(),
      list: vi.fn()
    },
    webhookEndpoints: {
      create: vi.fn(),
      list: vi.fn()
    },
    events: {
      construct: vi.fn()
    }
  };
  
  return {
    default: vi.fn(() => mockStripe),
    Stripe: vi.fn(() => mockStripe)
  };
});

describe('Stripe API Integration Tests', () => {
  let testUser;
  let testSubscription;
  let authToken;
  let mockStripe;

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
        email: 'stripe-test@example.com',
        password: 'hashedpassword',
        name: 'Stripe Test User',
        role: 'CUSTOMER'
      }
    });

    // Create test subscription
    testSubscription = await prisma.subscription.create({
      data: {
        userId: testUser.id,
        tier: 'HOMECARE',
        status: 'ACTIVE',
        paymentFrequency: 'MONTHLY',
        stripeCustomerId: 'cus_test123',
        stripeSubscriptionId: 'sub_test123'
      }
    });

    // Generate auth token
    authToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Get mocked Stripe instance
    const StripeConstructor = (await import('stripe')).default;
    mockStripe = new StripeConstructor();
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

  describe('Customer Management Integration', () => {
    it('should create Stripe customer when user subscribes', async () => {
      // Mock Stripe customer creation
      mockStripe.customers.create.mockResolvedValue({
        id: 'cus_new123',
        email: 'newuser@example.com',
        name: 'New User'
      });

      // Create new user without Stripe customer
      const newUser = await prisma.user.create({
        data: {
          email: 'newuser@example.com',
          password: 'hashedpassword',
          name: 'New User',
          role: 'CUSTOMER'
        }
      });

      const newAuthToken = jwt.sign(
        { id: newUser.id, email: newUser.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/api/plans/subscribe')
        .set('Authorization', `Bearer ${newAuthToken}`)
        .send({
          tier: 'STARTER',
          paymentMethodId: 'pm_test123'
        });

      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        name: 'New User',
        metadata: {
          userId: newUser.id
        }
      });
    });

    it('should retrieve existing Stripe customer', async () => {
      mockStripe.customers.retrieve.mockResolvedValue({
        id: 'cus_test123',
        email: 'stripe-test@example.com',
        name: 'Stripe Test User'
      });

      const response = await request(app)
        .get('/api/users/me/payment-methods')
        .set('Authorization', `Bearer ${authToken}`);

      expect(mockStripe.customers.retrieve).toHaveBeenCalledWith('cus_test123');
    });
  });

  describe('Subscription Management Integration', () => {
    it('should create Stripe subscription with correct parameters', async () => {
      mockStripe.subscriptions.create.mockResolvedValue({
        id: 'sub_new123',
        customer: 'cus_test123',
        status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days
        items: {
          data: [{
            price: { id: 'price_homecare_monthly' }
          }]
        }
      });

      const response = await request(app)
        .post('/api/plans/subscribe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tier: 'HOMECARE',
          paymentMethodId: 'pm_test123',
          paymentFrequency: 'MONTHLY'
        });

      expect(mockStripe.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_test123',
          items: expect.arrayContaining([
            expect.objectContaining({
              price: expect.stringContaining('homecare')
            })
          ]),
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent']
        })
      );
    });

    it('should update Stripe subscription for frequency changes', async () => {
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_test123',
        customer: 'cus_test123',
        status: 'active',
        items: {
          data: [{
            id: 'si_test123',
            price: { id: 'price_homecare_monthly' }
          }]
        }
      });

      mockStripe.subscriptions.update.mockResolvedValue({
        id: 'sub_test123',
        customer: 'cus_test123',
        status: 'active',
        items: {
          data: [{
            id: 'si_test123',
            price: { id: 'price_homecare_yearly' }
          }]
        }
      });

      const response = await request(app)
        .post('/api/subscriptions/change-frequency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ frequency: 'YEARLY' });

      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        'sub_test123',
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              id: 'si_test123',
              price: expect.stringContaining('yearly')
            })
          ]),
          proration_behavior: 'create_prorations'
        })
      );
    });

    it('should pause Stripe subscription correctly', async () => {
      mockStripe.subscriptions.update.mockResolvedValue({
        id: 'sub_test123',
        status: 'paused',
        pause_collection: {
          behavior: 'void'
        }
      });

      const response = await request(app)
        .post('/api/subscriptions/pause')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          durationMonths: 2,
          reason: 'Vacation'
        });

      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        'sub_test123',
        expect.objectContaining({
          pause_collection: {
            behavior: 'void',
            resumes_at: expect.any(Number)
          }
        })
      );
    });

    it('should resume Stripe subscription correctly', async () => {
      // First pause the subscription
      await prisma.subscription.update({
        where: { id: testSubscription.id },
        data: { isPaused: true }
      });

      mockStripe.subscriptions.update.mockResolvedValue({
        id: 'sub_test123',
        status: 'active',
        pause_collection: null
      });

      const response = await request(app)
        .post('/api/subscriptions/resume')
        .set('Authorization', `Bearer ${authToken}`);

      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        'sub_test123',
        expect.objectContaining({
          pause_collection: ''
        })
      );
    });
  });

  describe('Payment Method Integration', () => {
    it('should attach payment method to customer', async () => {
      mockStripe.paymentMethods.attach.mockResolvedValue({
        id: 'pm_test123',
        customer: 'cus_test123'
      });

      mockStripe.customers.update.mockResolvedValue({
        id: 'cus_test123',
        invoice_settings: {
          default_payment_method: 'pm_test123'
        }
      });

      const response = await request(app)
        .post('/api/users/me/payment-methods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentMethodId: 'pm_test123',
          setAsDefault: true
        });

      expect(mockStripe.paymentMethods.attach).toHaveBeenCalledWith('pm_test123', {
        customer: 'cus_test123'
      });

      expect(mockStripe.customers.update).toHaveBeenCalledWith('cus_test123', {
        invoice_settings: {
          default_payment_method: 'pm_test123'
        }
      });
    });

    it('should list customer payment methods', async () => {
      mockStripe.paymentMethods.list.mockResolvedValue({
        data: [
          {
            id: 'pm_test123',
            type: 'card',
            card: {
              brand: 'visa',
              last4: '4242',
              exp_month: 12,
              exp_year: 2025
            }
          }
        ]
      });

      const response = await request(app)
        .get('/api/users/me/payment-methods')
        .set('Authorization', `Bearer ${authToken}`);

      expect(mockStripe.paymentMethods.list).toHaveBeenCalledWith({
        customer: 'cus_test123',
        type: 'card'
      });

      expect(response.body.paymentMethods).toHaveLength(1);
      expect(response.body.paymentMethods[0].card.last4).toBe('4242');
    });
  });

  describe('Invoice and Payment Integration', () => {
    it('should handle failed payment webhook', async () => {
      const webhookPayload = {
        id: 'evt_test123',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_test123',
            subscription: 'sub_test123',
            customer: 'cus_test123',
            amount_due: 2999,
            attempt_count: 1
          }
        }
      };

      mockStripe.events.construct.mockReturnValue(webhookPayload);

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'test_signature')
        .send(webhookPayload);

      expect(response.status).toBe(200);

      // Verify subscription was paused due to payment failure
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { id: testSubscription.id }
      });
      expect(updatedSubscription.isPaused).toBe(true);
    });

    it('should handle successful payment webhook', async () => {
      // First set subscription as paused
      await prisma.subscription.update({
        where: { id: testSubscription.id },
        data: { isPaused: true }
      });

      const webhookPayload = {
        id: 'evt_test123',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_test123',
            subscription: 'sub_test123',
            customer: 'cus_test123',
            amount_paid: 2999
          }
        }
      };

      mockStripe.events.construct.mockReturnValue(webhookPayload);

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'test_signature')
        .send(webhookPayload);

      expect(response.status).toBe(200);

      // Verify subscription was resumed after successful payment
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { id: testSubscription.id }
      });
      expect(updatedSubscription.isPaused).toBe(false);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle Stripe API errors gracefully', async () => {
      mockStripe.subscriptions.update.mockRejectedValue(
        new Error('Your card was declined.')
      );

      const response = await request(app)
        .post('/api/subscriptions/change-frequency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ frequency: 'YEARLY' });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('card was declined');
    });

    it('should handle network timeouts', async () => {
      mockStripe.customers.retrieve.mockRejectedValue(
        new Error('Request timeout')
      );

      const response = await request(app)
        .get('/api/users/me/payment-methods')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('timeout');
    });

    it('should validate webhook signatures', async () => {
      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'invalid_signature')
        .send({ type: 'test.event' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid signature');
    });
  });

  describe('Concurrent Payment Processing', () => {
    it('should handle multiple simultaneous subscription updates', async () => {
      mockStripe.subscriptions.update.mockResolvedValue({
        id: 'sub_test123',
        status: 'active'
      });

      // Simulate concurrent requests
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/subscriptions/change-frequency')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ frequency: i % 2 === 0 ? 'YEARLY' : 'MONTHLY' })
      );

      const responses = await Promise.all(promises);

      // Only one should succeed, others should be rejected due to concurrency control
      const successfulResponses = responses.filter(r => r.status === 200);
      const failedResponses = responses.filter(r => r.status !== 200);

      expect(successfulResponses.length).toBe(1);
      expect(failedResponses.length).toBe(4);
    });
  });
});