import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import billingAdjustmentService from '../services/billingAdjustmentService.js';
import prisma from '../config/database.js';

describe('BillingAdjustmentService', () => {
  let testSubscription;
  let testAdmin;

  beforeEach(async () => {
    // Clean up any existing data first
    await prisma.creditTransaction.deleteMany({});
    await prisma.subscriptionDiscount.deleteMany({});
    await prisma.pendingCharge.deleteMany({});
    await prisma.billingAdjustment.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test admin user
    testAdmin = await prisma.user.create({
      data: {
        email: `admin-${Date.now()}@test.com`,
        password: 'hashedpassword',
        name: 'Test Admin',
        role: 'ADMIN'
      }
    });

    // Create test user and subscription
    const testUser = await prisma.user.create({
      data: {
        email: `customer-${Date.now()}@test.com`,
        password: 'hashedpassword',
        name: 'Test Customer',
        role: 'CUSTOMER'
      }
    });

    testSubscription = await prisma.subscription.create({
      data: {
        userId: testUser.id,
        tier: 'HOMECARE',
        status: 'ACTIVE',
        availableCredits: 50.0,
        loyaltyPoints: 100,
        churnRiskScore: 0.2,
        lifetimeValue: 500.0
      }
    });
  });

  afterEach(async () => {
    // Clean up test data in correct order due to foreign key constraints
    await prisma.creditTransaction.deleteMany({});
    await prisma.subscriptionDiscount.deleteMany({});
    await prisma.pendingCharge.deleteMany({});
    await prisma.billingAdjustment.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('createAdjustment', () => {
    it('should create a credit adjustment successfully', async () => {
      const adjustmentData = {
        type: 'credit',
        amount: 25.0,
        reason: 'Service issue compensation',
        description: 'Compensation for delayed service',
        effectiveDate: new Date().toISOString(),
        requiresApproval: false
      };

      const result = await billingAdjustmentService.createAdjustment(
        testSubscription.id,
        adjustmentData,
        testAdmin.id
      );

      expect(result.success).toBe(true);
      expect(result.adjustment).toBeDefined();
      expect(result.adjustment.type).toBe('credit');
      expect(result.adjustment.amount).toBe(25.0);
      expect(result.adjustment.status).toBe('APPROVED');
    });

    it('should require approval for large amounts', async () => {
      const adjustmentData = {
        type: 'credit',
        amount: 150.0, // Over $100 threshold
        reason: 'Large compensation',
        description: 'Large compensation for service issues',
        effectiveDate: new Date().toISOString(),
        requiresApproval: false
      };

      const result = await billingAdjustmentService.createAdjustment(
        testSubscription.id,
        adjustmentData,
        testAdmin.id
      );

      expect(result.success).toBe(true);
      expect(result.adjustment.status).toBe('PENDING_APPROVAL');
      expect(result.adjustment.requiresApproval).toBe(true);
    });

    it('should validate required fields', async () => {
      const adjustmentData = {
        type: 'credit',
        // Missing amount
        reason: 'Test reason',
        description: 'Test description',
        effectiveDate: new Date().toISOString()
      };

      await expect(
        billingAdjustmentService.createAdjustment(
          testSubscription.id,
          adjustmentData,
          testAdmin.id
        )
      ).rejects.toThrow('Amount must be greater than 0');
    });

    it('should validate subscription exists', async () => {
      const adjustmentData = {
        type: 'credit',
        amount: 25.0,
        reason: 'Test reason',
        description: 'Test description',
        effectiveDate: new Date().toISOString()
      };

      await expect(
        billingAdjustmentService.createAdjustment(
          'nonexistent-id',
          adjustmentData,
          testAdmin.id
        )
      ).rejects.toThrow('Subscription not found');
    });
  });

  describe('approveAdjustment', () => {
    it('should approve and process adjustment', async () => {
      // Create adjustment requiring approval
      const adjustmentData = {
        type: 'credit',
        amount: 150.0,
        reason: 'Large compensation',
        description: 'Large compensation for service issues',
        effectiveDate: new Date().toISOString(),
        requiresApproval: true
      };

      const createResult = await billingAdjustmentService.createAdjustment(
        testSubscription.id,
        adjustmentData,
        testAdmin.id
      );

      // Approve the adjustment
      const approveResult = await billingAdjustmentService.approveAdjustment(
        createResult.adjustment.id,
        testAdmin.id,
        'Approved for testing'
      );

      expect(approveResult.success).toBe(true);

      // Check that adjustment was processed
      const adjustment = await prisma.billingAdjustment.findUnique({
        where: { id: createResult.adjustment.id }
      });

      expect(adjustment.status).toBe('PROCESSED');
      expect(adjustment.approvedBy).toBe(testAdmin.id);
      expect(adjustment.processedBy).toBe(testAdmin.id);

      // Check that credit was added to subscription
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { id: testSubscription.id }
      });

      expect(updatedSubscription.availableCredits).toBe(200.0); // 50 + 150
    });
  });

  describe('rejectAdjustment', () => {
    it('should reject adjustment with reason', async () => {
      // Create adjustment requiring approval
      const adjustmentData = {
        type: 'credit',
        amount: 150.0,
        reason: 'Large compensation',
        description: 'Large compensation for service issues',
        effectiveDate: new Date().toISOString(),
        requiresApproval: true
      };

      const createResult = await billingAdjustmentService.createAdjustment(
        testSubscription.id,
        adjustmentData,
        testAdmin.id
      );

      // Reject the adjustment
      const rejectResult = await billingAdjustmentService.rejectAdjustment(
        createResult.adjustment.id,
        testAdmin.id,
        'Insufficient justification'
      );

      expect(rejectResult.success).toBe(true);

      // Check that adjustment was rejected
      const adjustment = await prisma.billingAdjustment.findUnique({
        where: { id: createResult.adjustment.id }
      });

      expect(adjustment.status).toBe('REJECTED');
      expect(adjustment.rejectedBy).toBe(testAdmin.id);
      expect(adjustment.rejectionReason).toBe('Insufficient justification');

      // Check that no credit was added to subscription
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { id: testSubscription.id }
      });

      expect(updatedSubscription.availableCredits).toBe(50.0); // Unchanged
    });
  });

  describe('validateAdjustmentData', () => {
    it('should validate adjustment type', () => {
      const invalidData = {
        type: 'invalid',
        amount: 25.0,
        reason: 'Test',
        description: 'Test',
        effectiveDate: new Date().toISOString()
      };

      expect(() => {
        billingAdjustmentService.validateAdjustmentData(invalidData);
      }).toThrow('Invalid adjustment type');
    });

    it('should validate amount is positive', () => {
      const invalidData = {
        type: 'credit',
        amount: -25.0,
        reason: 'Test',
        description: 'Test',
        effectiveDate: new Date().toISOString()
      };

      expect(() => {
        billingAdjustmentService.validateAdjustmentData(invalidData);
      }).toThrow('Amount must be greater than 0');
    });

    it('should validate required fields', () => {
      const invalidData = {
        type: 'credit',
        amount: 25.0,
        // Missing reason
        description: 'Test',
        effectiveDate: new Date().toISOString()
      };

      expect(() => {
        billingAdjustmentService.validateAdjustmentData(invalidData);
      }).toThrow('Reason is required');
    });
  });
});