import { describe, it, expect, beforeEach, vi } from 'vitest';
import AnalyticsService from '../services/analyticsService.js';
import ChurnPredictionService from '../services/churnPredictionService.js';

// Mock Prisma client
const mockPrisma = {
  subscription: {
    count: vi.fn(),
    findMany: vi.fn(),
    groupBy: vi.fn(),
    update: vi.fn()
  },
  subscriptionUsage: {
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn()
  },
  user: {
    findUnique: vi.fn()
  },
  booking: {
    count: vi.fn()
  }
};

describe('AnalyticsService', () => {
  let analyticsService;

  beforeEach(() => {
    analyticsService = new AnalyticsService(mockPrisma);
    vi.clearAllMocks();
  });

  describe('calculateChurnRate', () => {
    it('should calculate overall churn rate correctly', async () => {
      mockPrisma.subscription.count
        .mockResolvedValueOnce(100) // total subscriptions
        .mockResolvedValueOnce(15); // cancelled subscriptions

      mockPrisma.subscription.groupBy
        .mockResolvedValueOnce([
          { tier: 'STARTER', _count: { tier: 8 } },
          { tier: 'HOMECARE', _count: { tier: 5 } },
          { tier: 'PRIORITY', _count: { tier: 2 } }
        ])
        .mockResolvedValueOnce([
          { paymentFrequency: 'MONTHLY', _count: { paymentFrequency: 12 } },
          { paymentFrequency: 'YEARLY', _count: { paymentFrequency: 3 } }
        ]);

      const result = await analyticsService.calculateChurnRate();

      expect(result.overallChurnRate).toBe(15);
      expect(result.totalSubscriptions).toBe(100);
      expect(result.cancelledSubscriptions).toBe(15);
      expect(result.churnByTier).toHaveLength(3);
      expect(result.churnByFrequency).toHaveLength(2);
    });

    it('should handle zero subscriptions gracefully', async () => {
      mockPrisma.subscription.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      mockPrisma.subscription.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await analyticsService.calculateChurnRate();

      expect(result.overallChurnRate).toBe(0);
      expect(result.totalSubscriptions).toBe(0);
      expect(result.cancelledSubscriptions).toBe(0);
    });

    it('should filter by tier and payment frequency', async () => {
      const options = { tier: 'PRIORITY', paymentFrequency: 'YEARLY' };
      
      mockPrisma.subscription.count
        .mockResolvedValueOnce(25)
        .mockResolvedValueOnce(2);

      mockPrisma.subscription.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await analyticsService.calculateChurnRate(options);

      expect(mockPrisma.subscription.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tier: 'PRIORITY',
          paymentFrequency: 'YEARLY'
        })
      });
    });
  });

  describe('calculateCustomerLifetimeValue', () => {
    it('should calculate CLV correctly', async () => {
      const mockSubscriptions = [
        {
          tier: 'HOMECARE',
          paymentFrequency: 'MONTHLY',
          createdAt: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000), // 6 months ago
          additionalProperties: []
        },
        {
          tier: 'PRIORITY',
          paymentFrequency: 'YEARLY',
          createdAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000), // 12 months ago
          additionalProperties: [{ id: '1' }]
        }
      ];

      mockPrisma.subscription.findMany.mockResolvedValue(mockSubscriptions);

      const result = await analyticsService.calculateCustomerLifetimeValue();

      expect(result.averageCLV).toBeGreaterThan(0);
      expect(result.totalActiveSubscriptions).toBe(2);
      expect(result.clvByTier).toHaveLength(2);
      expect(result.clvByFrequency).toHaveLength(2);
    });

    it('should apply yearly discount correctly', async () => {
      const mockSubscriptions = [
        {
          tier: 'HOMECARE',
          paymentFrequency: 'YEARLY',
          createdAt: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000),
          additionalProperties: []
        }
      ];

      mockPrisma.subscription.findMany.mockResolvedValue(mockSubscriptions);

      const result = await analyticsService.calculateCustomerLifetimeValue();

      // Should apply 10% discount for yearly subscriptions
      expect(result.averageCLV).toBeLessThan(49.99 * 12); // Less than full price
    });
  });

  describe('getRevenueTrends', () => {
    it('should calculate monthly revenue trends', async () => {
      const mockSubscriptions = [
        {
          tier: 'HOMECARE',
          paymentFrequency: 'MONTHLY',
          status: 'ACTIVE',
          additionalProperties: []
        }
      ];

      mockPrisma.subscription.findMany.mockResolvedValue(mockSubscriptions);

      const result = await analyticsService.getRevenueTrends({ months: 3 });

      expect(result.monthlyData).toHaveLength(3);
      expect(result.revenueGrowthRates).toHaveLength(2);
      expect(result.totalRevenue).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getPerkUtilization', () => {
    it('should calculate perk utilization rates', async () => {
      mockPrisma.subscriptionUsage.count.mockResolvedValue(100);
      
      mockPrisma.subscriptionUsage.aggregate.mockResolvedValue({
        _count: {
          priorityBookingUsed: 30,
          discountUsed: 45,
          freeServiceUsed: 20,
          emergencyServiceUsed: 10
        }
      });

      mockPrisma.subscriptionUsage.groupBy.mockResolvedValue([
        {
          tier: 'HOMECARE',
          _count: {
            priorityBookingUsed: 15,
            discountUsed: 20,
            freeServiceUsed: 10,
            emergencyServiceUsed: 5
          }
        }
      ]);

      const result = await analyticsService.getPerkUtilization();

      expect(result.totalSubscriptionsWithUsage).toBe(100);
      expect(result.utilizationRates).toHaveLength(4);
      expect(result.usageByTier).toHaveLength(1);
    });
  });

  describe('getBasePriceByTier', () => {
    it('should return correct prices for each tier', () => {
      expect(analyticsService.getBasePriceByTier('STARTER')).toBe(29.99);
      expect(analyticsService.getBasePriceByTier('HOMECARE')).toBe(49.99);
      expect(analyticsService.getBasePriceByTier('PRIORITY')).toBe(99.99);
      expect(analyticsService.getBasePriceByTier('INVALID')).toBe(0);
    });
  });
});

describe('ChurnPredictionService', () => {
  let churnService;

  beforeEach(() => {
    churnService = new ChurnPredictionService(mockPrisma);
    vi.clearAllMocks();
  });

  describe('calculateChurnRiskScore', () => {
    it('should calculate risk score for new subscription', async () => {
      const mockUser = {
        id: 'user1',
        subscription: {
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
          paymentFrequency: 'MONTHLY',
          tier: 'STARTER',
          subscriptionPauses: [],
          additionalProperties: []
        },
        subscriptionUsage: {
          priorityBookingUsed: false,
          discountUsed: false,
          freeServiceUsed: false,
          emergencyServiceUsed: false
        },
        rewardCredits: []
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.booking.count.mockResolvedValue(0);

      const result = await churnService.calculateChurnRiskScore('user1');

      expect(result.riskScore).toBeGreaterThan(50); // New subscription should have higher risk
      expect(result.riskLevel).toBeDefined();
      expect(result.riskFactors.length).toBeGreaterThan(0);
    });

    it('should calculate lower risk for loyal customer', async () => {
      const mockUser = {
        id: 'user2',
        subscription: {
          createdAt: new Date(Date.now() - 18 * 30 * 24 * 60 * 60 * 1000), // 18 months ago
          paymentFrequency: 'YEARLY',
          tier: 'PRIORITY',
          subscriptionPauses: [],
          additionalProperties: [{ id: '1' }, { id: '2' }]
        },
        subscriptionUsage: {
          priorityBookingUsed: true,
          discountUsed: true,
          freeServiceUsed: true,
          emergencyServiceUsed: false
        },
        rewardCredits: [
          { amount: 30 },
          { amount: 25 }
        ]
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.booking.count.mockResolvedValue(5);

      const result = await churnService.calculateChurnRiskScore('user2');

      expect(result.riskScore).toBeLessThan(50); // Loyal customer should have lower risk
      expect(result.protectiveFactors.length).toBeGreaterThan(0);
    });

    it('should handle user without subscription', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user3',
        subscription: null
      });

      const result = await churnService.calculateChurnRiskScore('user3');

      expect(result.riskScore).toBe(0);
      expect(result.recommendation).toBe('No active subscription');
    });
  });

  describe('getBulkChurnRiskScores', () => {
    it('should return high-risk customers only', async () => {
      const mockSubscriptions = [
        { userId: 'user1', user: { id: 'user1' } },
        { userId: 'user2', user: { id: 'user2' } }
      ];

      mockPrisma.subscription.findMany.mockResolvedValue(mockSubscriptions);

      // Mock high risk for user1, low risk for user2
      vi.spyOn(churnService, 'calculateChurnRiskScore')
        .mockResolvedValueOnce({ userId: 'user1', riskScore: 85 })
        .mockResolvedValueOnce({ userId: 'user2', riskScore: 25 });

      const result = await churnService.getBulkChurnRiskScores({ riskThreshold: 70 });

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user1');
    });
  });

  describe('getRiskLevel', () => {
    it('should return correct risk levels', () => {
      expect(churnService.getRiskLevel(85)).toBe('CRITICAL');
      expect(churnService.getRiskLevel(65)).toBe('HIGH');
      expect(churnService.getRiskLevel(45)).toBe('MEDIUM');
      expect(churnService.getRiskLevel(25)).toBe('LOW');
      expect(churnService.getRiskLevel(15)).toBe('MINIMAL');
    });
  });

  describe('calculatePerkUsageScore', () => {
    it('should calculate usage score correctly', () => {
      const usage = {
        priorityBookingUsed: true,
        discountUsed: true,
        freeServiceUsed: false,
        emergencyServiceUsed: false
      };

      const score = churnService.calculatePerkUsageScore(usage);
      expect(score).toBe(0.5); // 2 out of 4 perks used
    });
  });
});