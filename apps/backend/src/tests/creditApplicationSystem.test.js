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
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  }
}));

import rewardsService from '../services/rewardsService.js';
import prisma from '../config/database.js';

describe('Credit Application System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('applyCreditsAutomatically', () => {
    const mockUser = {
      id: 'user-123',
      subscription: {
        id: 'sub-123',
        availableCredits: 75.50
      }
    };

    const mockUserCredits = {
      success: true,
      balance: {
        available: 75.50,
        used: 0,
        expired: 0,
        total: 75.50
      },
      credits: {
        available: [
          {
            id: 'credit-1',
            amount: 49.99,
            type: 'REFERRAL',
            earnedAt: new Date('2023-01-01'),
            description: 'Referral reward'
          },
          {
            id: 'credit-2',
            amount: 25.51,
            type: 'LOYALTY',
            earnedAt: new Date('2023-02-01'),
            description: 'Loyalty bonus'
          }
        ]
      }
    };

    it('should apply credits automatically to billing', async () => {
      // Mock getUserCredits method
      vi.spyOn(rewardsService, 'getUserCredits').mockResolvedValue(mockUserCredits);
      
      prisma.rewardCredit.update.mockResolvedValue({});
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.subscription.update.mockResolvedValue({});

      const result = await rewardsService.applyCreditsAutomatically('user-123', 100.00);

      expect(result.success).toBe(true);
      expect(result.creditsApplied).toBe(75.50);
      expect(result.remainingBill).toBe(24.50);
      expect(result.remainingCredits).toBe(0);
      expect(result.appliedCredits).toHaveLength(2);

      // Verify credits were marked as used
      expect(prisma.rewardCredit.update).toHaveBeenCalledTimes(2);
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
        data: {
          availableCredits: {
            decrement: 75.50
          }
        }
      });
    });

    it('should apply partial credits when billing amount is less than available credits', async () => {
      vi.spyOn(rewardsService, 'getUserCredits').mockResolvedValue(mockUserCredits);
      
      prisma.rewardCredit.update.mockResolvedValue({});
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.subscription.update.mockResolvedValue({});

      const result = await rewardsService.applyCreditsAutomatically('user-123', 30.00);

      expect(result.success).toBe(true);
      expect(result.creditsApplied).toBe(30.00);
      expect(result.remainingBill).toBe(0);
      expect(result.remainingCredits).toBe(45.50);
      expect(result.appliedCredits).toHaveLength(1); // Only first credit partially used
    });

    it('should handle no available credits', async () => {
      const noCreditsUser = {
        ...mockUserCredits,
        balance: { available: 0, used: 0, expired: 0, total: 0 },
        credits: { available: [] }
      };
      
      vi.spyOn(rewardsService, 'getUserCredits').mockResolvedValue(noCreditsUser);

      const result = await rewardsService.applyCreditsAutomatically('user-123', 50.00);

      expect(result.success).toBe(true);
      expect(result.creditsApplied).toBe(0);
      expect(result.remainingBill).toBe(50.00);
      expect(result.remainingCredits).toBe(0);
      expect(result.message).toContain('No credits available');
    });

    it('should reject invalid inputs', async () => {
      await expect(
        rewardsService.applyCreditsAutomatically('', 50.00)
      ).rejects.toThrow('User ID and valid billing amount are required');

      await expect(
        rewardsService.applyCreditsAutomatically('user-123', -10)
      ).rejects.toThrow('User ID and valid billing amount are required');
    });
  });

  describe('redeemCreditsManually', () => {
    const mockUserCredits = {
      success: true,
      balance: {
        available: 75.50,
        used: 0,
        expired: 0,
        total: 75.50
      },
      credits: {
        available: [
          {
            id: 'credit-1',
            amount: 49.99,
            type: 'REFERRAL',
            earnedAt: new Date('2023-01-01'),
            description: 'Referral reward'
          },
          {
            id: 'credit-2',
            amount: 25.51,
            type: 'LOYALTY',
            earnedAt: new Date('2023-02-01'),
            description: 'Loyalty bonus'
          }
        ]
      }
    };

    const mockUser = {
      id: 'user-123',
      subscription: {
        id: 'sub-123',
        availableCredits: 75.50
      }
    };

    it('should redeem credits manually', async () => {
      vi.spyOn(rewardsService, 'getUserCredits').mockResolvedValue(mockUserCredits);
      
      prisma.rewardCredit.update.mockResolvedValue({});
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.subscription.update.mockResolvedValue({});
      prisma.rewardCredit.create.mockResolvedValue({
        id: 'redemption-record',
        amount: -50.00,
        type: 'BONUS',
        description: 'Manual redemption: Gift card purchase'
      });

      const result = await rewardsService.redeemCreditsManually('user-123', 50.00, 'Gift card purchase');

      expect(result.success).toBe(true);
      expect(result.redeemedAmount).toBe(50.00);
      expect(result.remainingCredits).toBe(25.50);
      expect(result.redeemedCredits).toHaveLength(2);

      // Verify redemption record was created
      expect(prisma.rewardCredit.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          amount: -50.00,
          type: 'BONUS',
          description: 'Manual redemption: Gift card purchase',
          earnedAt: expect.any(Date),
          usedAt: expect.any(Date)
        }
      });
    });

    it('should reject redemption when insufficient credits', async () => {
      vi.spyOn(rewardsService, 'getUserCredits').mockResolvedValue(mockUserCredits);

      await expect(
        rewardsService.redeemCreditsManually('user-123', 100.00, 'Too much')
      ).rejects.toThrow('Insufficient credits. Available: $75.50, Requested: $100.00');
    });

    it('should reject invalid inputs', async () => {
      await expect(
        rewardsService.redeemCreditsManually('', 50.00)
      ).rejects.toThrow('User ID and valid amount are required');

      await expect(
        rewardsService.redeemCreditsManually('user-123', 0)
      ).rejects.toThrow('User ID and valid amount are required');

      await expect(
        rewardsService.redeemCreditsManually('user-123', -10)
      ).rejects.toThrow('User ID and valid amount are required');
    });
  });

  describe('processExpiredCredits', () => {
    const mockExpiredCredits = [
      {
        id: 'expired-1',
        userId: 'user-123',
        amount: 25.00,
        type: 'REFERRAL',
        description: 'Referral reward',
        earnedAt: new Date('2023-01-01'),
        expiresAt: new Date('2023-12-31'),
        usedAt: null,
        user: {
          id: 'user-123',
          email: 'user@example.com',
          subscription: {
            id: 'sub-123'
          }
        }
      },
      {
        id: 'expired-2',
        userId: 'user-456',
        amount: 15.50,
        type: 'LOYALTY',
        description: 'Loyalty bonus',
        earnedAt: new Date('2023-02-01'),
        expiresAt: new Date('2023-12-31'),
        usedAt: null,
        user: {
          id: 'user-456',
          email: 'user2@example.com',
          subscription: {
            id: 'sub-456'
          }
        }
      }
    ];

    it('should process expired credits for all users', async () => {
      prisma.rewardCredit.findMany.mockResolvedValue(mockExpiredCredits);
      prisma.rewardCredit.update.mockResolvedValue({});
      prisma.subscription.update.mockResolvedValue({});

      const result = await rewardsService.processExpiredCredits();

      expect(result.success).toBe(true);
      expect(result.expiredCount).toBe(2);
      expect(result.totalExpiredAmount).toBe(40.50);
      expect(Object.keys(result.expiredByUser)).toHaveLength(2);

      // Verify credits were marked as expired
      expect(prisma.rewardCredit.update).toHaveBeenCalledTimes(2);
      expect(prisma.subscription.update).toHaveBeenCalledTimes(2);
    });

    it('should process expired credits for specific user', async () => {
      const userSpecificExpired = [mockExpiredCredits[0]];
      prisma.rewardCredit.findMany.mockResolvedValue(userSpecificExpired);
      prisma.rewardCredit.update.mockResolvedValue({});
      prisma.subscription.update.mockResolvedValue({});

      const result = await rewardsService.processExpiredCredits('user-123');

      expect(result.success).toBe(true);
      expect(result.expiredCount).toBe(1);
      expect(result.totalExpiredAmount).toBe(25.00);
      expect(Object.keys(result.expiredByUser)).toHaveLength(1);
      expect(result.expiredByUser['user-123']).toBeDefined();
    });

    it('should handle no expired credits', async () => {
      prisma.rewardCredit.findMany.mockResolvedValue([]);

      const result = await rewardsService.processExpiredCredits();

      expect(result.success).toBe(true);
      expect(result.expiredCount).toBe(0);
      expect(result.totalExpiredAmount).toBe(0);
      expect(result.message).toContain('No expired credits found');
    });
  });

  describe('getCreditTransactionHistory', () => {
    const mockTransactions = [
      {
        id: 'tx-1',
        userId: 'user-123',
        amount: 49.99,
        type: 'REFERRAL',
        description: 'Referral reward',
        earnedAt: new Date('2023-03-01'),
        usedAt: null
      },
      {
        id: 'tx-2',
        userId: 'user-123',
        amount: 25.00,
        type: 'LOYALTY',
        description: 'Loyalty bonus',
        earnedAt: new Date('2023-02-01'),
        usedAt: new Date('2023-02-15')
      },
      {
        id: 'tx-3',
        userId: 'user-123',
        amount: -15.00,
        type: 'BONUS',
        description: 'Manual redemption: Gift card',
        earnedAt: new Date('2023-01-01'),
        usedAt: new Date('2023-01-01')
      }
    ];

    it('should return transaction history with categorization', async () => {
      prisma.rewardCredit.findMany.mockResolvedValue(mockTransactions);
      prisma.rewardCredit.count.mockResolvedValue(3);

      const result = await rewardsService.getCreditTransactionHistory('user-123');

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(3);
      expect(result.categorized.earned).toHaveLength(1); // Positive amount, not used
      expect(result.categorized.used).toHaveLength(1); // Positive amount, used
      expect(result.categorized.redeemed).toHaveLength(1); // Negative amount
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.hasMore).toBe(false);
    });

    it('should handle pagination', async () => {
      prisma.rewardCredit.findMany.mockResolvedValue(mockTransactions.slice(0, 2));
      prisma.rewardCredit.count.mockResolvedValue(10);

      const result = await rewardsService.getCreditTransactionHistory('user-123', 2, 0);

      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.offset).toBe(0);
      expect(result.pagination.total).toBe(10);
      expect(result.pagination.hasMore).toBe(true);
    });

    it('should reject invalid user ID', async () => {
      await expect(
        rewardsService.getCreditTransactionHistory('')
      ).rejects.toThrow('User ID is required');
    });
  });

  describe('processExpirationWarnings', () => {
    const mockExpiringCredits = [
      {
        id: 'expiring-1',
        userId: 'user-123',
        amount: 30.00,
        type: 'REFERRAL',
        description: 'Referral reward',
        earnedAt: new Date('2023-01-01'),
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        usedAt: null,
        user: {
          id: 'user-123',
          email: 'user@example.com'
        }
      },
      {
        id: 'expiring-2',
        userId: 'user-123',
        amount: 20.00,
        type: 'LOYALTY',
        description: 'Loyalty bonus',
        earnedAt: new Date('2023-02-01'),
        expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
        usedAt: null,
        user: {
          id: 'user-123',
          email: 'user@example.com'
        }
      }
    ];

    it('should identify credits expiring within warning period', async () => {
      prisma.rewardCredit.findMany.mockResolvedValue(mockExpiringCredits);

      const result = await rewardsService.processExpirationWarnings(30);

      expect(result.success).toBe(true);
      expect(result.expiringCreditsCount).toBe(2);
      expect(result.affectedUsersCount).toBe(1);
      expect(result.totalExpiringAmount).toBe(50.00);
      expect(result.warningDays).toBe(30);
      expect(result.expiringByUser['user-123']).toBeDefined();
      expect(result.expiringByUser['user-123'].totalAmount).toBe(50.00);
    });

    it('should handle no expiring credits', async () => {
      prisma.rewardCredit.findMany.mockResolvedValue([]);

      const result = await rewardsService.processExpirationWarnings(30);

      expect(result.success).toBe(true);
      expect(result.expiringCreditsCount).toBe(0);
      expect(result.affectedUsersCount).toBe(0);
      expect(result.totalExpiringAmount).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should handle database errors in credit application', async () => {
      vi.spyOn(rewardsService, 'getUserCredits').mockRejectedValue(new Error('Database error'));

      await expect(
        rewardsService.applyCreditsAutomatically('user-123', 50.00)
      ).rejects.toThrow('Database error');
    });

    it('should handle database errors in manual redemption', async () => {
      vi.spyOn(rewardsService, 'getUserCredits').mockRejectedValue(new Error('Database error'));

      await expect(
        rewardsService.redeemCreditsManually('user-123', 25.00)
      ).rejects.toThrow('Database error');
    });

    it('should handle database errors in expiration processing', async () => {
      prisma.rewardCredit.findMany.mockRejectedValue(new Error('Database error'));

      await expect(
        rewardsService.processExpiredCredits()
      ).rejects.toThrow('Database error');
    });
  });
});