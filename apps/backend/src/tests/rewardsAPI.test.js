import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import rewardsRoutes from '../routes/rewards.js';

// Mock dependencies
vi.mock('../middleware/auth.js', () => ({
  default: (req, res, next) => {
    req.user = { id: 'user-123', role: 'CUSTOMER' };
    next();
  }
}));

vi.mock('../services/rewardsService.js', () => ({
  default: {
    processReferral: vi.fn(),
    getUserCredits: vi.fn(),
    redeemCreditsManually: vi.fn(),
    getLoyaltyStatus: vi.fn(),
    checkLoyaltyMilestones: vi.fn(),
    applyCreditsAutomatically: vi.fn(),
    processExpirationWarnings: vi.fn(),
    processExpiredCredits: vi.fn(),
    reverseReferralReward: vi.fn(),
    getCreditTransactionHistory: vi.fn(),
  }
}));

vi.mock('../config/database.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    }
  }
}));

import rewardsService from '../services/rewardsService.js';
import prisma from '../config/database.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/rewards', rewardsRoutes);

describe('Rewards API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/rewards/process-referral', () => {
    it('should successfully process a referral', async () => {
      const mockResult = {
        success: true,
        creditAmount: 49.99,
        message: 'Referral reward of $49.99 awarded successfully'
      };

      rewardsService.processReferral.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/rewards/process-referral')
        .send({
          refereeId: 'referee-456',
          refereeSubscriptionId: 'sub-456'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.creditAmount).toBe(49.99);
      expect(rewardsService.processReferral).toHaveBeenCalledWith(
        'user-123',
        'referee-456',
        'sub-456'
      );
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/rewards/process-referral')
        .send({
          refereeId: 'referee-456'
          // Missing refereeSubscriptionId
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should handle self-referral error', async () => {
      rewardsService.processReferral.mockRejectedValue(
        new Error('Users cannot refer themselves')
      );

      const response = await request(app)
        .post('/api/rewards/process-referral')
        .send({
          refereeId: 'user-123', // Same as referrer
          refereeSubscriptionId: 'sub-456'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('cannot refer themselves');
    });

    it('should handle duplicate referral error', async () => {
      rewardsService.processReferral.mockRejectedValue(
        new Error('Referral reward has already been processed for this referee')
      );

      const response = await request(app)
        .post('/api/rewards/process-referral')
        .send({
          refereeId: 'referee-456',
          refereeSubscriptionId: 'sub-456'
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already been processed');
    });
  });

  describe('GET /api/rewards/credits', () => {
    it('should return user credits and transaction history', async () => {
      const mockCredits = {
        success: true,
        balance: {
          available: 75.50,
          used: 25.00,
          expired: 0,
          total: 100.50
        },
        subscription: {
          availableCredits: 75.50,
          tier: 'HOMECARE'
        }
      };

      const mockHistory = {
        transactions: [
          {
            id: 'tx-1',
            amount: 49.99,
            type: 'REFERRAL',
            description: 'Referral reward',
            earnedAt: new Date()
          }
        ],
        categorized: {
          earned: [],
          used: [],
          redeemed: [],
          expired: []
        },
        pagination: {
          total: 1,
          limit: 50,
          offset: 0,
          hasMore: false
        }
      };

      rewardsService.getUserCredits.mockResolvedValue(mockCredits);
      rewardsService.getCreditTransactionHistory.mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/api/rewards/credits');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.balance.available).toBe(75.50);
      expect(response.body.data.transactions).toHaveLength(1);
    });

    it('should handle pagination parameters', async () => {
      const mockCredits = { success: true, balance: {}, subscription: {} };
      const mockHistory = { transactions: [], categorized: {}, pagination: {} };

      rewardsService.getUserCredits.mockResolvedValue(mockCredits);
      rewardsService.getCreditTransactionHistory.mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/api/rewards/credits?limit=10&offset=20');

      expect(response.status).toBe(200);
      expect(rewardsService.getCreditTransactionHistory).toHaveBeenCalledWith(
        'user-123',
        10,
        20
      );
    });
  });

  describe('POST /api/rewards/redeem-credits', () => {
    it('should successfully redeem credits', async () => {
      const mockResult = {
        success: true,
        redeemedAmount: 25.00,
        remainingCredits: 50.50,
        message: 'Successfully redeemed $25.00 in credits'
      };

      rewardsService.redeemCreditsManually.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/rewards/redeem-credits')
        .send({
          amount: 25.00,
          reason: 'Gift card purchase'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.redeemedAmount).toBe(25.00);
      expect(rewardsService.redeemCreditsManually).toHaveBeenCalledWith(
        'user-123',
        25.00,
        'Gift card purchase'
      );
    });

    it('should return 400 for invalid amount', async () => {
      const response = await request(app)
        .post('/api/rewards/redeem-credits')
        .send({
          amount: 0,
          reason: 'Invalid amount'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Valid amount is required');
    });

    it('should handle insufficient credits error', async () => {
      rewardsService.redeemCreditsManually.mockRejectedValue(
        new Error('Insufficient credits. Available: $10.00, Requested: $25.00')
      );

      const response = await request(app)
        .post('/api/rewards/redeem-credits')
        .send({
          amount: 25.00,
          reason: 'Too much'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Insufficient credits');
    });
  });

  describe('GET /api/rewards/loyalty-status', () => {
    it('should return loyalty status', async () => {
      const mockStatus = {
        success: true,
        subscriptionMonths: 15,
        currentMilestone: {
          months: 12,
          type: 'FREE_SERVICE_VISIT',
          description: '12-month loyalty bonus'
        },
        nextMilestone: {
          months: 24,
          monthsRemaining: 9,
          type: 'PRIORITY_SERVICES'
        }
      };

      rewardsService.getLoyaltyStatus.mockResolvedValue(mockStatus);

      const response = await request(app)
        .get('/api/rewards/loyalty-status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.subscriptionMonths).toBe(15);
      expect(response.body.data.currentMilestone.months).toBe(12);
    });

    it('should handle user not found error', async () => {
      rewardsService.getLoyaltyStatus.mockRejectedValue(
        new Error('User or subscription not found')
      );

      const response = await request(app)
        .get('/api/rewards/loyalty-status');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('POST /api/rewards/check-milestones', () => {
    it('should check and award loyalty milestones', async () => {
      const mockResult = {
        success: true,
        subscriptionMonths: 13,
        awardedMilestones: [
          {
            months: 12,
            type: 'FREE_SERVICE_VISIT',
            description: '12-month loyalty bonus'
          }
        ],
        message: 'Awarded 1 loyalty milestone(s)'
      };

      rewardsService.checkLoyaltyMilestones.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/rewards/check-milestones');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.awardedMilestones).toHaveLength(1);
    });
  });

  describe('POST /api/rewards/apply-credits', () => {
    it('should apply credits to billing', async () => {
      const mockResult = {
        success: true,
        creditsApplied: 50.00,
        remainingBill: 25.00,
        remainingCredits: 25.50,
        message: 'Applied $50.00 in credits to billing'
      };

      rewardsService.applyCreditsAutomatically.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/rewards/apply-credits')
        .send({
          billingAmount: 75.00
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.creditsApplied).toBe(50.00);
    });

    it('should return 400 for invalid billing amount', async () => {
      const response = await request(app)
        .post('/api/rewards/apply-credits')
        .send({
          billingAmount: -10
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Valid billing amount is required');
    });
  });

  describe('GET /api/rewards/referral-link', () => {
    it('should generate referral link and stats', async () => {
      const mockUser = {
        id: 'user-123',
        rewardCredits: [
          { amount: 49.99, type: 'REFERRAL' },
          { amount: 29.99, type: 'REFERRAL' }
        ]
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      process.env.FRONTEND_URL = 'https://example.com';

      const response = await request(app)
        .get('/api/rewards/referral-link');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.referralLink).toBe('https://example.com/signup?ref=user-123');
      expect(response.body.data.referralCode).toBe('user-123');
      expect(response.body.data.stats.totalReferrals).toBe(2);
      expect(response.body.data.stats.totalCreditsEarned).toBe(79.98);
    });
  });

  describe('Admin endpoints', () => {
    it('should return 403 for non-admin users on expiring credits', async () => {
      const response = await request(app)
        .get('/api/rewards/expiring-credits');

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Admin access required');
    });

    it('should return 403 for non-admin users on process expired', async () => {
      const response = await request(app)
        .post('/api/rewards/process-expired')
        .send({ userId: 'user-123' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Admin access required');
    });

    it('should return 403 for non-admin users on reverse referral', async () => {
      const response = await request(app)
        .post('/api/rewards/reverse-referral')
        .send({
          referrerId: 'referrer-123',
          refereeId: 'referee-456'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Admin access required');
    });
  });

  describe('Error handling', () => {
    it('should handle service errors gracefully', async () => {
      rewardsService.processReferral.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/rewards/process-referral')
        .send({
          refereeId: 'referee-456',
          refereeSubscriptionId: 'sub-456'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to process referral');
    });

    it('should include error details in development mode', async () => {
      process.env.NODE_ENV = 'development';
      rewardsService.getUserCredits.mockRejectedValue(new Error('Specific database error'));

      const response = await request(app)
        .get('/api/rewards/credits');

      expect(response.status).toBe(500);
      expect(response.body.details).toBe('Specific database error');
    });

    it('should not include error details in production mode', async () => {
      process.env.NODE_ENV = 'production';
      rewardsService.getUserCredits.mockRejectedValue(new Error('Specific database error'));

      const response = await request(app)
        .get('/api/rewards/credits');

      expect(response.status).toBe(500);
      expect(response.body.details).toBeUndefined();
    });
  });
});