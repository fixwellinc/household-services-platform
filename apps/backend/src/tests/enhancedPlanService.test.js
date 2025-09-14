import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import enhancedPlanService from '../services/enhancedPlanService.js';

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

vi.mock('../config/plans.js', () => ({
  getPlanByTier: vi.fn(),
  PLANS: {
    STARTER: {
      id: 'starter',
      name: 'Starter Plan',
      monthlyPrice: 21.99,
      yearlyPrice: 237.49,
      stripePriceIds: {
        monthly: 'price_starter_monthly',
        yearly: 'price_starter_yearly'
      }
    },
    HOMECARE: {
      id: 'homecare',
      name: 'HomeCare Plan',
      monthlyPrice: 54.99,
      yearlyPrice: 593.89,
      stripePriceIds: {
        monthly: 'price_homecare_monthly',
        yearly: 'price_homecare_yearly'
      }
    },
    PRIORITY: {
      id: 'priority',
      name: 'Priority Plan',
      monthlyPrice: 120.99,
      yearlyPrice: 1306.69,
      stripePriceIds: {
        monthly: 'price_priority_monthly',
        yearly: 'price_priority_yearly'
      }
    }
  },
  VISIT_FREQUENCIES: {
    STARTER: 1,
    HOMECARE: 1,
    PRIORITY: 2
  }
}));

vi.mock('../services/stripe.js', () => ({
  updateSubscription: vi.fn()
}));

import prisma from '../config/database.js';
import { getPlanByTier, PLANS } from '../config/plans.js';
import { updateSubscription } from '../services/stripe.js';

describe('EnhancedPlanService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    getPlanByTier.mockImplementation((tier) => PLANS[tier]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('changePlan', () => {
    const mockUser = {
      id: 'user123',
      subscription: {
        id: 'sub123',
        userId: 'user123',
        tier: 'STARTER',
        status: 'ACTIVE',
        stripeSubscriptionId: 'stripe_sub_123',
        currentPeriodStart: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2024-02-01'),
        paymentFrequency: 'MONTHLY'
      },
      subscriptionUsage: {
        userId: 'user123',
        priorityBookingCount: 0,
        discountUsed: false,
        emergencyServiceUsed: false
      }
    };

    it('should successfully upgrade from STARTER to HOMECARE', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.subscription.update.mockResolvedValue({
        ...mockUser.subscription,
        tier: 'HOMECARE'
      });
      updateSubscription.mockResolvedValue({});

      const result = await enhancedPlanService.changePlan('user123', 'HOMECARE', 'monthly');

      expect(result.success).toBe(true);
      expect(result.isUpgrade).toBe(true);
      expect(result.subscription.tier).toBe('HOMECARE');
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub123' },
        data: expect.objectContaining({
          tier: 'HOMECARE',
          paymentFrequency: 'MONTHLY'
        })
      });
    });

    it('should handle downgrade with perk validation', async () => {
      const downgradeMockUser = {
        ...mockUser,
        subscription: {
          ...mockUser.subscription,
          tier: 'PRIORITY'
        },
        subscriptionUsage: {
          ...mockUser.subscriptionUsage,
          emergencyServiceUsed: true
        }
      };

      prisma.user.findUnique.mockResolvedValue(downgradeMockUser);
      prisma.subscriptionUsage.findUnique.mockResolvedValue(downgradeMockUser.subscriptionUsage);

      await expect(
        enhancedPlanService.changePlan('user123', 'HOMECARE', 'monthly')
      ).rejects.toThrow('Cannot downgrade: Same-week emergency service has been used this billing cycle');
    });

    it('should calculate prorated billing correctly for upgrades', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.subscription.update.mockResolvedValue({
        ...mockUser.subscription,
        tier: 'HOMECARE'
      });
      updateSubscription.mockResolvedValue({});

      const result = await enhancedPlanService.changePlan('user123', 'HOMECARE', 'monthly');

      expect(result.billingPreview).toHaveProperty('currentPrice');
      expect(result.billingPreview).toHaveProperty('newPrice');
      expect(result.billingPreview).toHaveProperty('proratedDifference');
      expect(result.billingPreview.newPrice).toBe(54.99);
    });

    it('should handle visit carryover correctly', async () => {
      const priorityUser = {
        ...mockUser,
        subscription: {
          ...mockUser.subscription,
          tier: 'PRIORITY'
        }
      };

      prisma.user.findUnique.mockResolvedValue(priorityUser);
      prisma.subscription.update.mockResolvedValue({
        ...priorityUser.subscription,
        tier: 'HOMECARE'
      });
      prisma.subscriptionUsage.findUnique.mockResolvedValue({
        userId: 'user123',
        priorityBookingCount: 1 // Used 1 out of 2 visits
      });

      const result = await enhancedPlanService.changePlan('user123', 'HOMECARE', 'monthly');

      expect(result.visitCarryover.carryoverVisits).toBe(1); // 1 unused visit carried over
      expect(result.visitCarryover.totalVisitsNextPeriod).toBe(2); // 1 new + 1 carryover
    });

    it('should reject plan change for inactive subscription', async () => {
      const inactiveUser = {
        ...mockUser,
        subscription: {
          ...mockUser.subscription,
          status: 'CANCELLED'
        }
      };

      prisma.user.findUnique.mockResolvedValue(inactiveUser);

      await expect(
        enhancedPlanService.changePlan('user123', 'HOMECARE', 'monthly')
      ).rejects.toThrow('Subscription must be active to change plans');
    });

    it('should reject change to same tier', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        enhancedPlanService.changePlan('user123', 'STARTER', 'monthly')
      ).rejects.toThrow('Already subscribed to this plan');
    });
  });

  describe('validateDowngrade', () => {
    it('should allow downgrade when no tier-specific perks are used', async () => {
      prisma.subscriptionUsage.findUnique.mockResolvedValue({
        userId: 'user123',
        emergencyServiceUsed: false,
        discountUsed: false
      });

      const result = await enhancedPlanService.validateDowngrade('user123', 'PRIORITY', 'HOMECARE');

      expect(result.allowed).toBe(true);
    });

    it('should prevent downgrade when emergency service perk is used', async () => {
      prisma.subscriptionUsage.findUnique.mockResolvedValue({
        userId: 'user123',
        emergencyServiceUsed: true,
        discountUsed: false
      });

      const result = await enhancedPlanService.validateDowngrade('user123', 'PRIORITY', 'STARTER');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Same-week emergency service has been used');
    });

    it('should allow upgrades without validation', async () => {
      const result = await enhancedPlanService.validateDowngrade('user123', 'STARTER', 'HOMECARE');

      expect(result.allowed).toBe(true);
    });
  });

  describe('calculateProratedBilling', () => {
    const mockSubscription = {
      currentPeriodStart: new Date('2024-01-01'),
      currentPeriodEnd: new Date('2024-02-01')
    };

    const starterPlan = PLANS.STARTER;
    const homecarePlan = PLANS.HOMECARE;

    it('should calculate prorated billing for monthly upgrade', async () => {
      // Mock current date to be halfway through billing period
      const mockDate = new Date('2024-01-16'); // 15 days into 31-day period
      vi.setSystemTime(mockDate);

      const result = await enhancedPlanService.calculateProratedBilling(
        mockSubscription,
        starterPlan,
        homecarePlan,
        'monthly'
      );

      expect(result.currentPrice).toBe(21.99);
      expect(result.newPrice).toBe(54.99);
      expect(result.proratedDifference).toBeGreaterThan(0);
      expect(result.immediateCharge).toBeGreaterThan(0);
      expect(result.billingCycle).toBe('monthly');

      vi.useRealTimers();
    });

    it('should calculate prorated billing for yearly plans', async () => {
      const mockDate = new Date('2024-01-16');
      vi.setSystemTime(mockDate);

      const result = await enhancedPlanService.calculateProratedBilling(
        mockSubscription,
        starterPlan,
        homecarePlan,
        'yearly'
      );

      expect(result.currentPrice).toBe(237.49);
      expect(result.newPrice).toBe(593.89);
      expect(result.billingCycle).toBe('yearly');

      vi.useRealTimers();
    });
  });

  describe('calculateVisitCarryover', () => {
    it('should calculate carryover for downgrade from PRIORITY to HOMECARE', async () => {
      prisma.subscriptionUsage.findUnique.mockResolvedValue({
        userId: 'user123',
        priorityBookingCount: 1 // Used 1 out of 2 visits
      });

      const result = await enhancedPlanService.calculateVisitCarryover('user123', 'PRIORITY', 'HOMECARE');

      expect(result.currentVisitsPerMonth).toBe(2);
      expect(result.newVisitsPerMonth).toBe(1);
      expect(result.carryoverVisits).toBe(1); // 1 unused visit
      expect(result.totalVisitsNextPeriod).toBe(2); // 1 new + 1 carryover
    });

    it('should limit carryover to maximum of 2 visits', async () => {
      prisma.subscriptionUsage.findUnique.mockResolvedValue({
        userId: 'user123',
        priorityBookingCount: 0 // Used 0 out of 2 visits
      });

      const result = await enhancedPlanService.calculateVisitCarryover('user123', 'PRIORITY', 'STARTER');

      expect(result.carryoverVisits).toBe(2); // Maximum 2 visits carried over
      expect(result.totalVisitsNextPeriod).toBe(3); // 1 new + 2 carryover
    });

    it('should handle no carryover for upgrades', async () => {
      prisma.subscriptionUsage.findUnique.mockResolvedValue({
        userId: 'user123',
        priorityBookingCount: 1
      });

      const result = await enhancedPlanService.calculateVisitCarryover('user123', 'STARTER', 'HOMECARE');

      expect(result.currentVisitsPerMonth).toBe(1);
      expect(result.newVisitsPerMonth).toBe(1);
      expect(result.carryoverVisits).toBe(0); // No unused visits to carry over
    });
  });

  describe('isUpgrade', () => {
    it('should correctly identify upgrades', () => {
      expect(enhancedPlanService.isUpgrade('STARTER', 'HOMECARE')).toBe(true);
      expect(enhancedPlanService.isUpgrade('HOMECARE', 'PRIORITY')).toBe(true);
      expect(enhancedPlanService.isUpgrade('STARTER', 'PRIORITY')).toBe(true);
    });

    it('should correctly identify downgrades', () => {
      expect(enhancedPlanService.isUpgrade('HOMECARE', 'STARTER')).toBe(false);
      expect(enhancedPlanService.isUpgrade('PRIORITY', 'HOMECARE')).toBe(false);
      expect(enhancedPlanService.isUpgrade('PRIORITY', 'STARTER')).toBe(false);
    });

    it('should handle same tier', () => {
      expect(enhancedPlanService.isUpgrade('STARTER', 'STARTER')).toBe(false);
      expect(enhancedPlanService.isUpgrade('HOMECARE', 'HOMECARE')).toBe(false);
    });
  });

  describe('getChangePreview', () => {
    const mockUser = {
      id: 'user123',
      subscription: {
        id: 'sub123',
        userId: 'user123',
        tier: 'STARTER',
        status: 'ACTIVE',
        currentPeriodStart: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2024-02-01')
      },
      subscriptionUsage: {
        userId: 'user123',
        priorityBookingCount: 0,
        emergencyServiceUsed: false
      }
    };

    it('should generate preview for valid plan change', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.subscriptionUsage.findUnique.mockResolvedValue(mockUser.subscriptionUsage);

      const preview = await enhancedPlanService.getChangePreview('user123', 'HOMECARE', 'monthly');

      expect(preview.currentPlan).toEqual(PLANS.STARTER);
      expect(preview.newPlan).toEqual(PLANS.HOMECARE);
      expect(preview.isUpgrade).toBe(true);
      expect(preview.canChange).toBe(true);
      expect(preview.billingPreview).toHaveProperty('currentPrice');
      expect(preview.visitCarryover).toHaveProperty('carryoverVisits');
    });

    it('should show restrictions for invalid downgrade', async () => {
      const restrictedUser = {
        ...mockUser,
        subscription: {
          ...mockUser.subscription,
          tier: 'PRIORITY'
        },
        subscriptionUsage: {
          ...mockUser.subscriptionUsage,
          emergencyServiceUsed: true
        }
      };

      prisma.user.findUnique.mockResolvedValue(restrictedUser);
      prisma.subscriptionUsage.findUnique.mockResolvedValue(restrictedUser.subscriptionUsage);

      const preview = await enhancedPlanService.getChangePreview('user123', 'HOMECARE', 'monthly');

      expect(preview.canChange).toBe(false);
      expect(preview.restrictions).toContain('Same-week emergency service has been used this billing cycle');
    });
  });
});