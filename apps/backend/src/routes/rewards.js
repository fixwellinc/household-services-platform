import express from 'express';
import auth from '../middleware/auth.js';
import rewardsService from '../services/rewardsService.js';
import { validate } from '../middleware/validation.js';
import prisma from '../config/database.js';

const router = express.Router();

// POST /api/rewards/process-referral - Process a referral and award credits
router.post('/process-referral', auth, async (req, res) => {
  try {
    const { refereeId, refereeSubscriptionId } = req.body;
    const referrerId = req.user.id;

    if (!refereeId || !refereeSubscriptionId) {
      return res.status(400).json({ 
        error: 'Referee ID and referee subscription ID are required' 
      });
    }

    const result = await rewardsService.processReferral(
      referrerId, 
      refereeId, 
      refereeSubscriptionId
    );

    res.json({
      success: true,
      data: result,
      message: result.message
    });

  } catch (error) {
    console.error('Error processing referral:', error);
    
    // Handle specific error cases
    if (error.message.includes('cannot refer themselves')) {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('already been processed')) {
      return res.status(409).json({ error: error.message });
    }
    
    if (error.message.includes('must have an active subscription')) {
      return res.status(403).json({ error: error.message });
    }

    res.status(500).json({ 
      error: 'Failed to process referral',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/rewards/credits - Get user's credit balance and history
router.get('/credits', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    // Get credit balance and summary
    const creditsResult = await rewardsService.getUserCredits(userId);
    
    if (!creditsResult.success) {
      return res.status(500).json({ error: 'Failed to retrieve credits' });
    }

    // Get transaction history
    const historyResult = await rewardsService.getCreditTransactionHistory(
      userId, 
      parseInt(limit), 
      parseInt(offset)
    );

    res.json({
      success: true,
      data: {
        balance: creditsResult.balance,
        subscription: creditsResult.subscription,
        transactions: historyResult.transactions,
        categorized: historyResult.categorized,
        pagination: historyResult.pagination
      }
    });

  } catch (error) {
    console.error('Error getting user credits:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve credits',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/rewards/redeem-credits - Manually redeem credits
router.post('/redeem-credits', auth, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        error: 'Valid amount is required' 
      });
    }

    const result = await rewardsService.redeemCreditsManually(
      userId, 
      parseFloat(amount), 
      reason || 'Manual redemption'
    );

    res.json({
      success: true,
      data: result,
      message: result.message
    });

  } catch (error) {
    console.error('Error redeeming credits:', error);
    
    if (error.message.includes('Insufficient credits')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ 
      error: 'Failed to redeem credits',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/rewards/loyalty-status - Get user's loyalty status and milestones
router.get('/loyalty-status', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await rewardsService.getLoyaltyStatus(userId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error getting loyalty status:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ 
      error: 'Failed to retrieve loyalty status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/rewards/check-milestones - Check and award loyalty milestones
router.post('/check-milestones', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await rewardsService.checkLoyaltyMilestones(userId);

    res.json({
      success: true,
      data: result,
      message: result.message
    });

  } catch (error) {
    console.error('Error checking loyalty milestones:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ 
      error: 'Failed to check loyalty milestones',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/rewards/apply-credits - Apply credits to billing (for internal use)
router.post('/apply-credits', auth, async (req, res) => {
  try {
    const { billingAmount } = req.body;
    const userId = req.user.id;

    if (!billingAmount || billingAmount < 0) {
      return res.status(400).json({ 
        error: 'Valid billing amount is required' 
      });
    }

    const result = await rewardsService.applyCreditsAutomatically(
      userId, 
      parseFloat(billingAmount)
    );

    res.json({
      success: true,
      data: result,
      message: result.message
    });

  } catch (error) {
    console.error('Error applying credits:', error);
    res.status(500).json({ 
      error: 'Failed to apply credits',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/rewards/expiring-credits - Get credits expiring soon (admin endpoint)
router.get('/expiring-credits', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { warningDays = 30 } = req.query;

    const result = await rewardsService.processExpirationWarnings(
      parseInt(warningDays)
    );

    res.json({
      success: true,
      data: result,
      message: result.message
    });

  } catch (error) {
    console.error('Error getting expiring credits:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve expiring credits',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/rewards/process-expired - Process expired credits (admin endpoint)
router.post('/process-expired', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.body; // Optional - if not provided, processes all users

    const result = await rewardsService.processExpiredCredits(userId);

    res.json({
      success: true,
      data: result,
      message: result.message
    });

  } catch (error) {
    console.error('Error processing expired credits:', error);
    res.status(500).json({ 
      error: 'Failed to process expired credits',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/rewards/reverse-referral - Reverse a referral reward (admin endpoint)
router.post('/reverse-referral', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { referrerId, refereeId } = req.body;

    if (!referrerId || !refereeId) {
      return res.status(400).json({ 
        error: 'Referrer ID and referee ID are required' 
      });
    }

    const result = await rewardsService.reverseReferralReward(referrerId, refereeId);

    res.json({
      success: true,
      data: result,
      message: result.message
    });

  } catch (error) {
    console.error('Error reversing referral reward:', error);
    
    if (error.message.includes('not found') || error.message.includes('already used')) {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('only allowed within')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ 
      error: 'Failed to reverse referral reward',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/rewards/referral-link - Generate referral link for user
router.get('/referral-link', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Generate a referral link with the user's ID
    const referralLink = `${baseUrl}/signup?ref=${userId}`;
    
    // Get user's referral stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        rewardCredits: {
          where: { type: 'REFERRAL' }
        }
      }
    });

    const referralCount = user?.rewardCredits?.length || 0;
    const totalReferralCredits = user?.rewardCredits?.reduce((sum, credit) => sum + credit.amount, 0) || 0;

    res.json({
      success: true,
      data: {
        referralLink,
        referralCode: userId,
        stats: {
          totalReferrals: referralCount,
          totalCreditsEarned: Math.round(totalReferralCredits * 100) / 100
        }
      }
    });

  } catch (error) {
    console.error('Error generating referral link:', error);
    res.status(500).json({ 
      error: 'Failed to generate referral link',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;