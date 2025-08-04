import express from 'express';
import auth from '../middleware/auth.js';
import subscriptionService from '../services/subscriptionService.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/subscriptions/track-perk - Track perk usage
router.post('/track-perk', auth, async (req, res) => {
  try {
    const { perkType, details } = req.body;
    const userId = req.user.id;

    if (!perkType) {
      return res.status(400).json({ error: 'Perk type is required' });
    }

    const result = await subscriptionService.trackPerkUsage(userId, perkType, details);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/subscriptions/usage - Get user's subscription usage
router.get('/usage', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const usage = await subscriptionService.getUsageSummary(userId);
    res.json({ usage });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/subscriptions/can-use-perk - Check if user can use a specific perk
router.get('/can-use-perk/:perkType', auth, async (req, res) => {
  try {
    const { perkType } = req.params;
    const userId = req.user.id;

    const result = await subscriptionService.canUsePerk(userId, perkType);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/subscriptions/can-cancel - Check if user can cancel subscription
router.get('/can-cancel', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user?.subscription) {
      return res.json({ canCancel: true, reason: 'No active subscription' });
    }

    res.json({
      canCancel: user.subscription.canCancel,
      reason: user.subscription.cancellationBlockedReason,
      blockedAt: user.subscription.cancellationBlockedAt
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router; 