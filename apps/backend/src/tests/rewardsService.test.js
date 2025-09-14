import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the database module first
vi.mock('../config/database.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    subscription: {
      update: vi.fn(),
    },
    rewardCredit: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
  }
}));

import rewardsService from '../services/rewardsService.js';
import prisma from '../config/database.js';

describe('RewardsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('processReferral', () => {
    const mockReferrer = {
      id: 'referrer-123',
      subscription: {
        id: 'sub-123',
        tier: 'HOMECARE',
        status: 'ACTIVE'
      }
    };

    const mockReferee = {
      id: 'referee-456',
      subscription: {
        id: 'sub-456',
        tier: 'STARTER',
        status: 'ACTIVE'
      }
    };

    it('should successfully process a valid referral', async () => {
      // Setup mocks
      prisma.user.findUnique
        .mockResolvedValueOnce(mockReferrer) // First call for referrer
        .mockResolvedValueOnce(mockReferee); // Second call for referee
      
      prisma.rewardCredit.findFirst.mockResolvedValue(null); // No existing referral
      prisma.rewardCredit.create.mockResolvedValue({
        id: 'credit-123',
        userId: 'referrer-123',
        amount: 49.99,
        type: 'REFERRAL',
        description: 'Referral reward: One month free for referring user referee-456',
        earnedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      });
      prisma.subscription.update.mockResolvedValue({});

      const result = await rewardsService.processReferral('referrer-123', 'referee-456', 'sub-456');

      expect(result.success).toBe(true);
      expect(result.creditAmount).toBe(49.99); // HOMECARE tier price
      expect(result.message).toContain('$49.99');
      expect(prisma.rewardCredit.create).toHaveBeenCalledWith({
        data: {
          userId: 'referrer-123',
          amount: 49.99,
          type: 'REFERRAL',
          description: 'Referral reward: One month free for referring user referee-456',
          earnedAt: expect.any(Date),
          expiresAt: expect.any(Date)
        }
      });
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
        data: {
          availableCredits: {
            increment: 49.99
          }
        }
      });
    });

    it('should reject self-referrals', async () => {
      await expect(
        rewardsService.processReferral('user-123', 'user-123', 'sub-123')
      ).rejects.toThrow('Users cannot refer themselves');
    });

    it('should reject referrals when referrer not found', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        rewardsService.processReferral('invalid-referrer', 'referee-456', 'sub-456')
      ).rejects.toThrow('Referrer not found');
    });

    it('should reject referrals when referrer has no active subscription', async () => {
      const inactiveReferrer = {
        ...mockReferrer,
        subscription: { ...mockReferrer.subscription, status: 'CANCELLED' }
      };
      prisma.user.findUnique.mockResolvedValueOnce(inactiveReferrer);

      await expect(
        rewardsService.processReferral('referrer-123', 'referee-456', 'sub-456')
      ).rejects.toThrow('Referrer must have an active subscription to earn referral rewards');
    });

    it('should reject duplicate referrals', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(mockReferrer)
        .mockResolvedValueOnce(mockReferee);
      
      prisma.rewardCredit.findFirst.mockResolvedValue({
        id: 'existing-credit',
        userId: 'referrer-123',
        type: 'REFERRAL',
        description: 'Referral reward: One month free for referring user referee-456'
      });

      await expect(
        rewardsService.processReferral('referrer-123', 'referee-456', 'sub-456')
      ).rejects.toThrow('Referral reward has already been processed for this referee');
    });

    it('should calculate correct credit amounts for different tiers', async () => {
      const starterReferrer = {
        ...mockReferrer,
        subscription: { ...mockReferrer.subscription, tier: 'STARTER' }
      };
      
      prisma.user.findUnique
        .mockResolvedValueOnce(starterReferrer)
        .mockResolvedValueOnce(mockReferee);
      
      prisma.rewardCredit.findFirst.mockResolvedValue(null);
      prisma.rewardCredit.create.mockResolvedValue({
        id: 'credit-123',
        amount: 29.99
      });
      prisma.subscription.update.mockResolvedValue({});

      const result = await rewardsService.processReferral('referrer-123', 'referee-456', 'sub-456');

      expect(result.creditAmount).toBe(29.99); // STARTER tier price
    });
  });

  describe('checkLoyaltyMilestones', () => {
    const mockUser = {
      id: 'user-123',
      subscription: {
        id: 'sub-123',
        createdAt: new Date(Date.now() - 13 * 30 * 24 * 60 * 60 * 1000), // 13 months ago
        tier: 'HOMECARE'
      },
      rewardCredits: []
    };

    it('should award 12-month loyalty milestone', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.rewardCredit.create.mockResolvedValue({
        id: 'loyalty-credit-123',
        userId: 'user-123',
        amount: 0,
        type: 'LOYALTY',
        description: '12-month 12-month loyalty bonus: One free service visit',
        earnedAt: new Date()
      });

      const result = await rewardsService.checkLoyaltyMilestones('user-123');

      expect(result.success).toBe(true);
      expect(result.subscriptionMonths).toBeGreaterThanOrEqual(12);
      expect(result.awardedMilestones).toHaveLength(1);
      expect(result.awardedMilestones[0].months).toBe(12);
      expect(result.awardedMilestones[0].type).toBe('FREE_SERVICE_VISIT');
    });

    it('should not award already earned milestones', async () => {
      const userWithExistingMilestone = {
        ...mockUser,
        rewardCredits: [{
          id: 'existing-loyalty',
          type: 'LOYALTY',
          description: '12-month 12-month loyalty bonus: One free service visit',
          earnedAt: new Date()
        }]
      };

      prisma.user.findUnique.mockResolvedValue(userWithExistingMilestone);

      const result = await rewardsService.checkLoyaltyMilestones('user-123');

      expect(result.success).toBe(true);
      expect(result.awardedMilestones).toHaveLength(0);
      expect(result.message).toContain('No new loyalty milestones to award');
    });

    it('should handle users with no subscription', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        subscription: null
      });

      await expect(
        rewardsService.checkLoyaltyMilestones('user-123')
      ).rejects.toThrow('User or subscription not found');
    });
  });

  describe('getUserCredits', () => {
    const mockUserWithCredits = {
      id: 'user-123',
      subscription: {
        availableCredits: 75.50,
        tier: 'HOMECARE'
      },
      rewardCredits: [
        {
          id: 'credit-1',
          amount: 49.99,
          type: 'REFERRAL',
          earnedAt: new Date(),
          usedAt: null,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        },
        {
          id: 'credit-2',
          amount: 25.50,
          type: 'BONUS',
          earnedAt: new Date(),
          usedAt: new Date(),
          expiresAt: null
        },
        {
          id: 'credit-3',
          amount: 15.00,
          type: 'REFERRAL',
          earnedAt: new Date(),
          usedAt: null,
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expired yesterday
        }
      ]
    };

    it('should calculate credit balances correctly', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUserWithCredits);

      const result = await rewardsService.getUserCredits('user-123');

      expect(result.success).toBe(true);
      expect(result.balance.available).toBe(49.99); // Only non-expired, unused credit
      expect(result.balance.used).toBe(25.50); // Used credit
      expect(result.balance.expired).toBe(15.00); // Expired credit
      expect(result.balance.total).toBe(90.49); // Sum of all
      expect(result.subscription.availableCredits).toBe(75.50);
    });

    it('should group credits by type', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUserWithCredits);

      const result = await rewardsService.getUserCredits('user-123');

      expect(result.credits.byType.REFERRAL).toHaveLength(2);
      expect(result.credits.byType.BONUS).toHaveLength(1);
      expect(result.credits.available).toHaveLength(1);
      expect(result.credits.used).toHaveLength(1);
      expect(result.credits.expired).toHaveLength(1);
    });
  });

  describe('reverseReferralReward', () => {
    const mockReferralCredit = {
      id: 'referral-credit-123',
      userId: 'referrer-123',
      amount: 49.99,
      type: 'REFERRAL',
      description: 'Referral reward: One month free for referring user referee-456',
      earnedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
      usedAt: null
    };

    const mockReferrer = {
      id: 'referrer-123',
      subscription: {
        id: 'sub-123',
        availableCredits: 49.99
      }
    };

    it('should successfully reverse a referral reward', async () => {
      prisma.rewardCredit.findFirst.mockResolvedValue(mockReferralCredit);
      prisma.rewardCredit.create.mockResolvedValue({
        id: 'reversal-credit-123',
        userId: 'referrer-123',
        amount: -49.99,
        type: 'BONUS',
        description: 'Referral reversal: Referee referee-456 cancelled within 3 months'
      });
      prisma.user.findUnique.mockResolvedValue(mockReferrer);
      prisma.subscription.update.mockResolvedValue({});

      const result = await rewardsService.reverseReferralReward('referrer-123', 'referee-456');

      expect(result.success).toBe(true);
      expect(result.reversedAmount).toBe(49.99);
      expect(prisma.rewardCredit.create).toHaveBeenCalledWith({
        data: {
          userId: 'referrer-123',
          amount: -49.99,
          type: 'BONUS',
          description: 'Referral reversal: Referee referee-456 cancelled within 3 months',
          earnedAt: expect.any(Date)
        }
      });
    });

    it('should reject reversal of already used credits', async () => {
      const usedCredit = { ...mockReferralCredit, usedAt: new Date() };
      prisma.rewardCredit.findFirst.mockResolvedValue(null); // No unused credit found

      await expect(
        rewardsService.reverseReferralReward('referrer-123', 'referee-456')
      ).rejects.toThrow('Referral credit not found or already used');
    });

    it('should reject reversal after 3 months', async () => {
      const oldCredit = {
        ...mockReferralCredit,
        earnedAt: new Date(Date.now() - 4 * 30 * 24 * 60 * 60 * 1000) // 4 months ago
      };
      prisma.rewardCredit.findFirst.mockResolvedValue(oldCredit);

      await expect(
        rewardsService.reverseReferralReward('referrer-123', 'referee-456')
      ).rejects.toThrow('Referral reversal is only allowed within 3 months of earning');
    });
  });

  describe('calculateMonthlySubscriptionAmount', () => {
    it('should return correct amounts for each tier', () => {
      expect(rewardsService.calculateMonthlySubscriptionAmount('STARTER')).toBe(29.99);
      expect(rewardsService.calculateMonthlySubscriptionAmount('HOMECARE')).toBe(49.99);
      expect(rewardsService.calculateMonthlySubscriptionAmount('PRIORITY')).toBe(79.99);
    });

    it('should default to STARTER price for unknown tiers', () => {
      expect(rewardsService.calculateMonthlySubscriptionAmount('UNKNOWN')).toBe(29.99);
    });
  });

  describe('calculateMonthsDifference', () => {
    it('should calculate months difference correctly', () => {
      const start = new Date('2023-01-15');
      const end = new Date('2023-06-20');
      
      expect(rewardsService.calculateMonthsDifference(start, end)).toBe(5);
    });

    it('should handle year boundaries', () => {
      const start = new Date('2022-10-15');
      const end = new Date('2023-02-20');
      
      expect(rewardsService.calculateMonthsDifference(start, end)).toBe(4);
    });

    it('should handle same month', () => {
      const start = new Date('2023-06-01');
      const end = new Date('2023-06-30');
      
      expect(rewardsService.calculateMonthsDifference(start, end)).toBe(0);
    });
  });

  describe('getLoyaltyStatus', () => {
    const mockUserForLoyalty = {
      id: 'user-123',
      subscription: {
        createdAt: new Date(Date.now() - 15 * 30 * 24 * 60 * 60 * 1000), // 15 months ago
        tier: 'HOMECARE'
      },
      rewardCredits: [
        {
          description: '12-month 12-month loyalty bonus: One free service visit',
          earnedAt: new Date(),
          amount: 0
        }
      ]
    };

    it('should return correct loyalty status', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUserForLoyalty);

      const result = await rewardsService.getLoyaltyStatus('user-123');

      expect(result.success).toBe(true);
      expect(result.subscriptionMonths).toBe(15);
      expect(result.currentMilestone.months).toBe(12);
      expect(result.nextMilestone.months).toBe(24);
      expect(result.nextMilestone.monthsRemaining).toBe(9);
      expect(result.earnedMilestones).toHaveLength(1);
    });

    it('should handle users with no milestones yet', async () => {
      const newUser = {
        ...mockUserForLoyalty,
        subscription: {
          ...mockUserForLoyalty.subscription,
          createdAt: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) // 6 months ago
        },
        rewardCredits: []
      };

      prisma.user.findUnique.mockResolvedValue(newUser);

      const result = await rewardsService.getLoyaltyStatus('user-123');

      expect(result.success).toBe(true);
      expect(result.subscriptionMonths).toBe(6);
      expect(result.currentMilestone).toBeNull();
      expect(result.nextMilestone.months).toBe(12);
      expect(result.nextMilestone.monthsRemaining).toBe(6);
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors', async () => {
      // Temporarily replace prisma with null
      const originalPrisma = prisma;
      Object.defineProperty(rewardsService, 'constructor', {
        value: function() {
          // This test verifies the error handling when prisma is null
          // The actual implementation checks for prisma at the start of each method
        }
      });

      // Since we can't easily mock the imported prisma to be null after import,
      // let's test a different error scenario - database query failure
      prisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        rewardsService.processReferral('referrer-123', 'referee-456', 'sub-456')
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle missing required parameters', async () => {
      await expect(
        rewardsService.processReferral('', 'referee-456', 'sub-456')
      ).rejects.toThrow('Referrer ID, referee ID, and referee subscription ID are required');

      await expect(
        rewardsService.checkLoyaltyMilestones('')
      ).rejects.toThrow('User ID is required');

      await expect(
        rewardsService.getUserCredits('')
      ).rejects.toThrow('User ID is required');
    });
  });
});