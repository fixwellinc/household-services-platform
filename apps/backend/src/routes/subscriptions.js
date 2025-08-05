import express from 'express';
import auth from '../middleware/auth.js';
import subscriptionService from '../services/subscriptionService.js';
import { 
  createCustomer, 
  createSubscription, 
  cancelSubscription, 
  getSubscription,
  getCustomer,
  updateCustomer,
  createSubscriptionCheckoutSession
} from '../services/stripe.js';
import { PLANS, getPlanByTier } from '../config/plans.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/subscriptions/create - Create a new subscription
router.post('/create', auth, async (req, res) => {
  try {
    const { tier, billingPeriod = 'monthly' } = req.body;
    const userId = req.user.id;

    if (!tier) {
      return res.status(400).json({ error: 'Tier is required' });
    }

    // Validate tier
    const plan = getPlanByTier(tier);
    
    if (!plan) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    // Get user
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user already has an active subscription
    if (user.subscription && user.subscription.status === 'ACTIVE') {
      return res.status(400).json({ error: 'User already has an active subscription' });
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.subscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await createCustomer(user.email, user.name, {
        userId: user.id,
      });
      stripeCustomerId = customer.id;
    }

    // Get Stripe price ID for the selected plan and billing period
    const priceId = plan.stripePriceIds[billingPeriod];
    if (!priceId) {
      return res.status(400).json({ error: 'Invalid billing period' });
    }

    // Create subscription in Stripe
    const stripeSubscription = await createSubscription(stripeCustomerId, priceId, {
      userId: user.id,
      tier,
      billingPeriod,
    });

    // Create or update subscription in database
    const subscription = await prisma.subscription.upsert({
      where: { userId },
      update: {
        tier,
        status: stripeSubscription.status.toUpperCase(),
        stripeCustomerId,
        stripeSubscriptionId: stripeSubscription.id,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
      create: {
        userId,
        tier,
        status: stripeSubscription.status.toUpperCase(),
        stripeCustomerId,
        stripeSubscriptionId: stripeSubscription.id,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
    });

    res.json({
      subscription,
      clientSecret: stripeSubscription.latest_invoice?.payment_intent?.client_secret,
      requiresAction: stripeSubscription.status === 'incomplete',
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/subscriptions/cancel - Cancel subscription
router.post('/cancel', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user?.subscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    // Check if subscription can be cancelled
    if (!user.subscription.canCancel) {
      return res.status(400).json({ 
        error: 'Subscription cannot be cancelled',
        reason: user.subscription.cancellationBlockedReason 
      });
    }

    // Cancel in Stripe if subscription exists there
    if (user.subscription.stripeSubscriptionId) {
      await cancelSubscription(user.subscription.stripeSubscriptionId);
    }

    // Update subscription status in database
    await prisma.subscription.update({
      where: { id: user.subscription.id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    });

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/subscriptions/current - Get current subscription details
router.get('/current', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        subscription: true,
        subscriptionUsage: true
      }
    });

    if (!user?.subscription) {
      return res.json({ subscription: null });
    }

    // Get plan details
    const plan = getPlanByTier(user.subscription.tier);

    // Get Stripe subscription details if available
    let stripeSubscription = null;
    if (user.subscription.stripeSubscriptionId) {
      try {
        stripeSubscription = await getSubscription(user.subscription.stripeSubscriptionId);
      } catch (error) {
        console.error('Error fetching Stripe subscription:', error);
      }
    }

    res.json({
      subscription: {
        ...user.subscription,
        plan,
        stripeSubscription,
        usage: user.subscriptionUsage,
      },
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/subscriptions/update - Update subscription (change plan)
router.post('/update', auth, async (req, res) => {
  try {
    const { tier, billingPeriod = 'monthly' } = req.body;
    const userId = req.user.id;

    if (!tier) {
      return res.status(400).json({ error: 'Tier is required' });
    }

    // Validate tier
    const plan = getPlanByTier(tier);
    if (!plan) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    // Get user's current subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user?.subscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    // Get new price ID
    const newPriceId = plan.stripePriceIds[billingPeriod];
    if (!newPriceId) {
      return res.status(400).json({ error: 'Invalid billing period' });
    }

    // Update subscription in Stripe
    if (user.subscription.stripeSubscriptionId) {
      // Note: Stripe subscription updates require creating a new subscription
      // or using the subscription update API with proper parameters
      // For now, we'll update the database and let the webhook handle Stripe updates
    }

    // Update subscription in database
    await prisma.subscription.update({
      where: { id: user.subscription.id },
      data: {
        tier,
        updatedAt: new Date(),
      },
    });

    res.json({ message: 'Subscription updated successfully' });
  } catch (error) {
    console.error('Subscription update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/subscriptions/checkout-session - Create checkout session for subscription
router.post('/checkout-session', auth, async (req, res) => {
  try {
    const { tier, billingPeriod = 'monthly', successUrl, cancelUrl } = req.body;
    const userId = req.user.id;

    if (!tier || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Tier, success URL, and cancel URL are required' });
    }

    // Validate tier
    const plan = getPlanByTier(tier);
    if (!plan) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    // Get price ID
    const priceId = plan.stripePriceIds[billingPeriod];
    if (!priceId) {
      return res.status(400).json({ error: 'Invalid billing period' });
    }

    // Create checkout session
    const session = await createSubscriptionCheckoutSession(
      priceId,
      successUrl,
      cancelUrl,
      { userId, tier, billingPeriod }
    );

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Checkout session creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/subscriptions/plans - Get available subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = Object.values(PLANS).map(plan => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      originalPrice: plan.originalPrice,
      features: plan.features,
      savings: plan.savings,
      color: plan.color,
      icon: plan.icon,
      popular: plan.popular,
      visitFrequency: plan.visitFrequency,
      timePerVisit: plan.timePerVisit,
      visitsPerMonth: plan.visitsPerMonth
    }));

    res.json({
      success: true,
      plans,
      message: 'Plans retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/subscriptions/track-perk - Track perk usage
router.post('/track-perk', auth, async (req, res) => {
  try {
    const { perkType, details = {} } = req.body;
    const userId = req.user.id;

    if (!perkType) {
      return res.status(400).json({ error: 'Perk type is required' });
    }

    await subscriptionService.trackPerkUsage(userId, perkType, details);

    res.json({ 
      success: true, 
      message: 'Perk usage tracked successfully' 
    });
  } catch (error) {
    console.error('Error tracking perk usage:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/subscriptions/usage - Get usage summary
router.get('/usage', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const usageSummary = await subscriptionService.getUsageSummary(userId);

    res.json({
      success: true,
      usage: usageSummary
    });
  } catch (error) {
    console.error('Error fetching usage summary:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/subscriptions/can-use-perk/:perkType - Check if user can use a specific perk
router.get('/can-use-perk/:perkType', auth, async (req, res) => {
  try {
    const { perkType } = req.params;
    const userId = req.user.id;

    const canUse = await subscriptionService.canUsePerk(userId, perkType);

    res.json({
      success: true,
      canUse,
      perkType
    });
  } catch (error) {
    console.error('Error checking perk usage:', error);
    res.status(500).json({ error: error.message });
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