import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import plansRouter from '../routes/plans.js';

// Mock dependencies
vi.mock('../config/database.js', () => ({
  default: {
    user: {
      findUnique: vi.fn()
    },
    subscription: {
      update: vi.fn(),
      findUnique: vi.fn()
    },
    subscriptionUsage: {
      findUnique: vi.fn(),
      upsert: vi.fn()
    }
  }
}));

vi.mock('../middleware/auth.js', () => ({
  authMiddleware: (req, res, next) => {
    req.user = { id: 'user123', role: 'USER' };
    next();
  }
}));

vi.mock('../services/enhancedPlanService.js', () => ({
  default: {
    changePlan: vi.fn(),
    getChangePreview: vi.fn()
  }
}));

vi.mock('../config/plans.js', () => ({
  getAllPlans: vi.fn(() => []),
  getPlanById: vi.fn(),
  getPlanByTier: vi.fn(),
  calculateServiceDiscount: vi.fn(() => 0),
  PLAN_COMPARISON: { features: [] }
}));

import enhancedPlanService from '../services/enhancedPlanService.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/plans', plansRouter);

describe('Enhanced Plan API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /api/plans/user/change-plan/preview', () => {
    it('should return plan change preview successfully', async () => {
      const mockPreview = {
        currentPlan: {
          id: 'starter',
          name: 'Starter Plan',
          monthlyPrice: 21.99
        },
        newPlan: {
          id: 'homecare',
          name: 'HomeCare Plan',
          monthlyPrice: 54.99
        },
        isUpgrade: true,
        canChange: true,
        restrictions: [],
        billingPreview: {
          currentPrice: 21.99,
          newPrice: 54.99,
          proratedDifference: 16.5,
          immediateCharge: 16.5,
          creditAmount: 0,
          nextAmount: 54.99,
          remainingDays: 15,
          totalDays: 30,
          billingCycle: 'monthly'
        },
        visitCarryover: {
          currentVisitsPerMonth: 1,
          newVisitsPerMonth: 1,
          unusedVisits: 0,
          carryoverVisits: 0,
          totalVisitsNextPeriod: 1
        },
        effectiveDate: new Date()
      };

      enhancedPlanService.getChangePreview.mockResolvedValue(mockPreview);

      const response = await request(app)
        .post('/api/plans/user/change-plan/preview')
        .send({
          newTier: 'HOMECARE',
          billingCycle: 'monthly'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.preview).toMatchObject({
        currentPlan: mockPreview.currentPlan,
        newPlan: mockPreview.newPlan,
        isUpgrade: mockPreview.isUpgrade,
        canChange: mockPreview.canChange,
        restrictions: mockPreview.restrictions,
        billingPreview: mockPreview.billingPreview,
        visitCarryover: mockPreview.visitCarryover
      });
      expect(enhancedPlanService.getChangePreview).toHaveBeenCalledWith(
        'user123',
        'HOMECARE',
        'monthly'
      );
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/plans/user/change-plan/preview')
        .send({
          newTier: 'HOMECARE'
          // Missing billingCycle
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('New tier and billing cycle are required');
    });

    it('should return 400 for invalid billing cycle', async () => {
      const response = await request(app)
        .post('/api/plans/user/change-plan/preview')
        .send({
          newTier: 'HOMECARE',
          billingCycle: 'weekly'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Billing cycle must be monthly or yearly');
    });

    it('should return 400 for invalid plan tier', async () => {
      const response = await request(app)
        .post('/api/plans/user/change-plan/preview')
        .send({
          newTier: 'INVALID_TIER',
          billingCycle: 'monthly'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid plan tier');
    });

    it('should handle service errors gracefully', async () => {
      enhancedPlanService.getChangePreview.mockRejectedValue(
        new Error('No active subscription found')
      );

      const response = await request(app)
        .post('/api/plans/user/change-plan/preview')
        .send({
          newTier: 'HOMECARE',
          billingCycle: 'monthly'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No active subscription found');
    });
  });

  describe('POST /api/plans/user/change-plan', () => {
    it('should successfully change plan with upgrade', async () => {
      const mockResult = {
        success: true,
        subscription: {
          id: 'sub123',
          tier: 'HOMECARE',
          status: 'ACTIVE',
          paymentFrequency: 'MONTHLY',
          nextPaymentAmount: 54.99
        },
        billingPreview: {
          currentPrice: 21.99,
          newPrice: 54.99,
          proratedDifference: 16.5,
          immediateCharge: 16.5,
          creditAmount: 0,
          nextAmount: 54.99,
          remainingDays: 15,
          totalDays: 30,
          billingCycle: 'monthly'
        },
        visitCarryover: {
          currentVisitsPerMonth: 1,
          newVisitsPerMonth: 1,
          unusedVisits: 0,
          carryoverVisits: 0,
          totalVisitsNextPeriod: 1
        },
        effectiveDate: new Date(),
        isUpgrade: true,
        message: 'Plan upgraded successfully with immediate effect'
      };

      enhancedPlanService.changePlan.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/plans/user/change-plan')
        .send({
          newTier: 'HOMECARE',
          billingCycle: 'monthly'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Plan upgraded successfully with immediate effect');
      expect(response.body.subscription.tier).toBe('HOMECARE');
      expect(response.body.isUpgrade).toBe(true);
      expect(enhancedPlanService.changePlan).toHaveBeenCalledWith(
        'user123',
        'HOMECARE',
        'monthly'
      );
    });

    it('should successfully schedule downgrade for next billing cycle', async () => {
      const mockResult = {
        success: true,
        subscription: {
          id: 'sub123',
          tier: 'STARTER',
          status: 'PENDING_CHANGE',
          paymentFrequency: 'MONTHLY',
          nextPaymentAmount: 21.99
        },
        billingPreview: {
          currentPrice: 54.99,
          newPrice: 21.99,
          proratedDifference: -16.5,
          immediateCharge: 0,
          creditAmount: 16.5,
          nextAmount: 21.99,
          remainingDays: 15,
          totalDays: 30,
          billingCycle: 'monthly'
        },
        visitCarryover: {
          currentVisitsPerMonth: 1,
          newVisitsPerMonth: 1,
          unusedVisits: 1,
          carryoverVisits: 1,
          totalVisitsNextPeriod: 2
        },
        effectiveDate: new Date('2024-02-01'),
        isUpgrade: false,
        message: 'Plan downgrade scheduled for next billing cycle'
      };

      enhancedPlanService.changePlan.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/plans/user/change-plan')
        .send({
          newTier: 'STARTER',
          billingCycle: 'monthly'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Plan downgrade scheduled for next billing cycle');
      expect(response.body.isUpgrade).toBe(false);
      expect(response.body.visitCarryover.carryoverVisits).toBe(1);
    });

    it('should handle yearly billing cycle', async () => {
      const mockResult = {
        success: true,
        subscription: {
          id: 'sub123',
          tier: 'PRIORITY',
          status: 'ACTIVE',
          paymentFrequency: 'YEARLY',
          nextPaymentAmount: 1306.69
        },
        billingPreview: {
          currentPrice: 593.89,
          newPrice: 1306.69,
          proratedDifference: 356.4,
          immediateCharge: 356.4,
          creditAmount: 0,
          nextAmount: 1306.69,
          remainingDays: 180,
          totalDays: 365,
          billingCycle: 'yearly'
        },
        visitCarryover: {
          currentVisitsPerMonth: 1,
          newVisitsPerMonth: 2,
          unusedVisits: 0,
          carryoverVisits: 0,
          totalVisitsNextPeriod: 2
        },
        effectiveDate: new Date(),
        isUpgrade: true,
        message: 'Plan upgraded successfully with immediate effect'
      };

      enhancedPlanService.changePlan.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/plans/user/change-plan')
        .send({
          newTier: 'PRIORITY',
          billingCycle: 'yearly'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.billingPreview.billingCycle).toBe('yearly');
      expect(enhancedPlanService.changePlan).toHaveBeenCalledWith(
        'user123',
        'PRIORITY',
        'yearly'
      );
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/plans/user/change-plan')
        .send({
          newTier: 'HOMECARE'
          // Missing billingCycle
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('New tier and billing cycle are required');
    });

    it('should return 400 for invalid billing cycle', async () => {
      const response = await request(app)
        .post('/api/plans/user/change-plan')
        .send({
          newTier: 'HOMECARE',
          billingCycle: 'quarterly'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Billing cycle must be monthly or yearly');
    });

    it('should return 400 for invalid plan tier', async () => {
      const response = await request(app)
        .post('/api/plans/user/change-plan')
        .send({
          newTier: 'PREMIUM',
          billingCycle: 'monthly'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid plan tier');
    });

    it('should handle downgrade restrictions', async () => {
      enhancedPlanService.changePlan.mockRejectedValue(
        new Error('Cannot downgrade: Same-week emergency service has been used this billing cycle')
      );

      const response = await request(app)
        .post('/api/plans/user/change-plan')
        .send({
          newTier: 'STARTER',
          billingCycle: 'monthly'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Cannot downgrade');
    });

    it('should handle no active subscription error', async () => {
      enhancedPlanService.changePlan.mockRejectedValue(
        new Error('No active subscription found')
      );

      const response = await request(app)
        .post('/api/plans/user/change-plan')
        .send({
          newTier: 'HOMECARE',
          billingCycle: 'monthly'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No active subscription found');
    });

    it('should handle same tier error', async () => {
      enhancedPlanService.changePlan.mockRejectedValue(
        new Error('Already subscribed to this plan')
      );

      const response = await request(app)
        .post('/api/plans/user/change-plan')
        .send({
          newTier: 'STARTER',
          billingCycle: 'monthly'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Already subscribed to this plan');
    });
  });
});