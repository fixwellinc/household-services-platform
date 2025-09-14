import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import prisma from '../config/database.js';
import jwt from 'jsonwebtoken';

describe('Payment Frequency API Endpoints', () => {
  let testUser;
  let testSubscription;
  let authToken;

  beforeEach(async () => {
    // Clean up any existing test data in correct order (respecting foreign key constraints)
    await prisma.paymentFrequency.deleteMany({});
    await prisma.subscriptionUsage.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'CUSTOMER'
      }
    });

    // Create test subscription
    testSubscription = await prisma.subscription.create({
      data: {
        userId: testUser.id,
        tier: 'STARTER',
        status: 'ACTIVE',
        paymentFrequency: 'MONTHLY'
      }
    });

    // Generate auth token
    authToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterEach(async () => {
    // Clean up test data in correct order (respecting foreign key constraints)
    await prisma.paymentFrequency.deleteMany({});
    await prisma.subscriptionUsage.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('GET /api/subscriptions/frequency-options', () => {
    it('should return frequency options for user subscription', async () => {
      const response = await request(app)
        .get('/api/subscriptions/frequency-options')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.planTier).toBe('STARTER');
      expect(response.body.options).toBeInstanceOf(Array);
      expect(response.body.options.length).toBe(5); // WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, YEARLY
      expect(response.body.comparison).toBeDefined();
    });

    it('should return frequency options for specified plan tier', async () => {
      const response = await request(app)
        .get('/api/subscriptions/frequency-options?planTier=HOMECARE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.planTier).toBe('HOMECARE');
      expect(response.body.options).toBeInstanceOf(Array);
    });

    it('should return 404 when user has no subscription and no plan tier specified', async () => {
      // Delete the subscription
      await prisma.subscription.delete({ where: { id: testSubscription.id } });

      const response = await request(app)
        .get('/api/subscriptions/frequency-options')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toContain('No subscription found');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/subscriptions/frequency-options')
        .expect(401);
    });
  });

  describe('POST /api/subscriptions/change-frequency', () => {
    it('should successfully change payment frequency', async () => {
      const response = await request(app)
        .post('/api/subscriptions/change-frequency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ frequency: 'QUARTERLY' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated successfully');
      expect(response.body.subscription.paymentFrequency).toBe('QUARTERLY');
      expect(response.body.calculation).toBeDefined();
      expect(response.body.paymentFrequency).toBeDefined();

      // Verify database was updated
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { id: testSubscription.id }
      });
      expect(updatedSubscription.paymentFrequency).toBe('QUARTERLY');
    });

    it('should validate frequency parameter', async () => {
      const response = await request(app)
        .post('/api/subscriptions/change-frequency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ frequency: 'INVALID' })
        .expect(400);

      expect(response.body.error).toContain('Invalid frequency');
    });

    it('should require frequency parameter', async () => {
      const response = await request(app)
        .post('/api/subscriptions/change-frequency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toContain('Payment frequency is required');
    });

    it('should reject changing to same frequency', async () => {
      const response = await request(app)
        .post('/api/subscriptions/change-frequency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ frequency: 'MONTHLY' })
        .expect(400);

      expect(response.body.error).toContain('must be different');
    });

    it('should return 404 when user has no subscription', async () => {
      // Delete the subscription
      await prisma.subscription.delete({ where: { id: testSubscription.id } });

      const response = await request(app)
        .post('/api/subscriptions/change-frequency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ frequency: 'QUARTERLY' })
        .expect(404);

      expect(response.body.error).toContain('No active subscription found');
    });

    it('should reject frequency change for paused subscription', async () => {
      // Update subscription to paused
      await prisma.subscription.update({
        where: { id: testSubscription.id },
        data: { isPaused: true }
      });

      const response = await request(app)
        .post('/api/subscriptions/change-frequency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ frequency: 'QUARTERLY' })
        .expect(400);

      expect(response.body.error).toContain('paused');
    });

    it('should reject frequency change for inactive subscription', async () => {
      // Update subscription to inactive
      await prisma.subscription.update({
        where: { id: testSubscription.id },
        data: { status: 'CANCELLED' }
      });

      const response = await request(app)
        .post('/api/subscriptions/change-frequency')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ frequency: 'QUARTERLY' })
        .expect(400);

      expect(response.body.error).toContain('active subscriptions');
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/subscriptions/change-frequency')
        .send({ frequency: 'QUARTERLY' })
        .expect(401);
    });
  });
});