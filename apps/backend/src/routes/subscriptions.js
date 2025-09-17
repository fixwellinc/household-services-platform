import express from 'express';
import auth from '../middleware/auth.js';
import subscriptionService from '../services/subscriptionService.js';
import paymentFrequencyService from '../services/paymentFrequencyService.js';
import subscriptionPauseService from '../services/subscriptionPauseService.js';
import additionalPropertyService from '../services/additionalPropertyService.js';
import { validate } from '../middleware/validation.js';
import { 
  createCustomer, 
  createSubscription, 
  cancelSubscription, 
  getSubscription,
  getCustomer,
  updateCustomer,
  createSubscriptionCheckoutSession,
  updateSubscriptionSchedule,
  updateSubscription,
  updateSubscriptionPlan
} from '../services/stripe.js';
import { PLANS, getPlanByTier } from '../config/plans.js';
import prisma from '../config/database.js';

const router = express.Router();

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
    const { reason, comments } = req.body;
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

    // Store cancellation feedback if provided
    if (reason) {
      try {
        await prisma.cancellationFeedback.create({
          data: {
            subscriptionId: user.subscription.id,
            userId: userId,
            reason: reason,
            comments: comments || null,
            createdAt: new Date()
          }
        });
      } catch (feedbackError) {
        console.error('Failed to store cancellation feedback:', feedbackError);
        // Continue with cancellation even if feedback storage fails
      }
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

    // Update subscription in Stripe with proration
    let stripeSubscription = null;
    if (user.subscription.stripeSubscriptionId) {
      try {
        stripeSubscription = await updateSubscriptionPlan(
          user.subscription.stripeSubscriptionId,
          newPriceId,
          'create_prorations'
        );
      } catch (stripeError) {
        console.error('Stripe subscription update failed:', stripeError);
        // Continue with database update even if Stripe fails
      }
    }

    // Update subscription in database
    const updatedSubscription = await prisma.subscription.update({
      where: { id: user.subscription.id },
      data: {
        tier,
        paymentFrequency: billingPeriod.toUpperCase(),
        updatedAt: new Date(),
      },
    });

    res.json({ 
      message: 'Subscription updated successfully',
      subscription: updatedSubscription,
      stripeUpdate: stripeSubscription ? { success: true } : { success: false }
    });
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
      stripePriceIds: plan.stripePriceIds,
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

// GET /api/subscriptions/plans/:planId - Get specific plan by ID
router.get('/plans/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const plan = PLANS[planId.toUpperCase()];

    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        error: 'Plan not found' 
      });
    }

    const planData = {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      originalPrice: plan.originalPrice,
      stripePriceIds: plan.stripePriceIds,
      features: plan.features,
      savings: plan.savings,
      color: plan.color,
      icon: plan.icon,
      popular: plan.popular,
      visitFrequency: plan.visitFrequency,
      timePerVisit: plan.timePerVisit,
      visitsPerMonth: plan.visitsPerMonth
    };

    res.json({
      success: true,
      plan: planData,
      message: 'Plan retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching plan:', error);
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

// GET /api/subscriptions/retention-offers - Get retention offers for cancellation
router.get('/retention-offers', auth, async (req, res) => {
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

    const currentPlan = getPlanByTier(user.subscription.tier);
    if (!currentPlan) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    // Generate retention offers based on subscription tier and history
    const offers = [
      {
        id: 'discount_50',
        type: 'DISCOUNT',
        title: '50% Off Next 3 Months',
        description: 'Continue enjoying all your benefits at half the price',
        value: '50% discount',
        duration: '3 months',
        originalPrice: currentPlan.monthlyPrice,
        discountedPrice: currentPlan.monthlyPrice * 0.5,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      },
      {
        id: 'pause_30',
        type: 'PAUSE',
        title: 'Pause for 30 Days',
        description: 'Take a break and resume your subscription when ready',
        value: 'Free pause',
        duration: '30 days',
        originalPrice: currentPlan.monthlyPrice,
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    ];

    // Add downgrade option if user is on higher tier
    if (user.subscription.tier !== 'STARTER') {
      const starterPlan = getPlanByTier('STARTER');
      if (starterPlan) {
        offers.push({
          id: 'downgrade_starter',
          type: 'DOWNGRADE',
          title: 'Switch to Starter Plan',
          description: 'Keep essential features at a lower cost',
          value: 'Lower monthly cost',
          originalPrice: currentPlan.monthlyPrice,
          discountedPrice: starterPlan.monthlyPrice,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });
      }
    }

    res.json({
      success: true,
      offers,
      message: 'Retention offers retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching retention offers:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/subscriptions/apply-retention-offer - Apply a retention offer
router.post('/apply-retention-offer', auth, async (req, res) => {
  try {
    const { offerId } = req.body;
    const userId = req.user.id;

    if (!offerId) {
      return res.status(400).json({ error: 'Offer ID is required' });
    }

    // Get user's subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user?.subscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    // For now, we'll just log the retention offer application
    // In a real implementation, you would apply the specific offer
    console.log(`Applying retention offer ${offerId} for user ${userId}`);

    // Create a retention offer record
    try {
      await prisma.retentionOffer.create({
        data: {
          subscriptionId: user.subscription.id,
          userId: userId,
          offerId: offerId,
          status: 'APPLIED',
          appliedAt: new Date()
        }
      });
    } catch (retentionError) {
      console.error('Failed to store retention offer:', retentionError);
      // Continue even if storage fails
    }

    res.json({
      success: true,
      message: 'Retention offer applied successfully',
      offerId
    });
  } catch (error) {
    console.error('Error applying retention offer:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/subscriptions/frequency-options - Get available payment frequency options
router.get('/frequency-options', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { planTier } = req.query;

    // Get user's current subscription if no planTier provided
    let targetTier = planTier;
    if (!targetTier) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      if (!user?.subscription) {
        return res.status(404).json({ error: 'No subscription found and no plan tier specified' });
      }

      targetTier = user.subscription.tier;
    }

    // Get frequency options from the service
    const options = paymentFrequencyService.getFrequencyOptions(targetTier);
    const comparison = paymentFrequencyService.getFrequencyComparison(targetTier);

    res.json({
      success: true,
      planTier: targetTier,
      options,
      comparison,
      message: 'Frequency options retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching frequency options:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/subscriptions/change-frequency - Change payment frequency
router.post('/change-frequency', auth, validate('paymentFrequency'), async (req, res) => {
  try {
    const { frequency } = req.body;
    const userId = req.user.id;

    // Get user's current subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        subscription: {
          include: {
            paymentFrequencies: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!user?.subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const subscription = user.subscription;
    const currentFrequency = subscription.paymentFrequency || 'MONTHLY';

    // Validate the frequency change
    const validation = paymentFrequencyService.validateFrequencyChange(
      currentFrequency,
      frequency,
      subscription
    );

    if (!validation.valid) {
      return res.status(400).json({ error: validation.reason });
    }

    // Calculate new payment amount and next payment date
    const calculation = paymentFrequencyService.calculatePaymentAmount(subscription.tier, frequency);
    const nextPaymentDate = paymentFrequencyService.getNextPaymentDate(frequency);

    // Calculate proration if there's a current payment frequency record
    let proration = null;
    const currentFrequencyRecord = subscription.paymentFrequencies[0];
    if (currentFrequencyRecord) {
      proration = paymentFrequencyService.calculateProration(
        currentFrequency,
        frequency,
        subscription.tier,
        currentFrequencyRecord.createdAt
      );
    }

    // Start database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update subscription
      const updatedSubscription = await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          paymentFrequency: frequency,
          nextPaymentAmount: calculation.pricing.paymentAmount,
          updatedAt: new Date()
        }
      });

      // Create new payment frequency record
      const paymentFrequencyRecord = await tx.paymentFrequency.create({
        data: {
          subscriptionId: subscription.id,
          frequency,
          amount: calculation.pricing.paymentAmount,
          nextPaymentDate
        }
      });

      return { updatedSubscription, paymentFrequencyRecord };
    });

    // Update Stripe subscription schedule if we have a Stripe subscription
    let stripeUpdate = null;
    if (subscription.stripeSubscriptionId) {
      try {
        // Get the plan to find the appropriate price ID
        const plan = getPlanByTier(subscription.tier);
        if (plan && plan.stripePriceIds) {
          // Map frequency to billing period for Stripe
          const billingPeriodMap = {
            'MONTHLY': 'monthly',
            'YEARLY': 'yearly'
          };

          const billingPeriod = billingPeriodMap[frequency] || 'monthly';
          const priceId = plan.stripePriceIds[billingPeriod];

          if (priceId) {
            stripeUpdate = await updateSubscriptionSchedule(
              subscription.stripeSubscriptionId,
              priceId,
              nextPaymentDate
            );
          }
        }
      } catch (stripeError) {
        console.error('Stripe update failed, but database was updated:', stripeError);
        // Continue with success response since database was updated
      }
    }

    res.json({
      success: true,
      message: 'Payment frequency updated successfully',
      subscription: result.updatedSubscription,
      paymentFrequency: result.paymentFrequencyRecord,
      calculation,
      proration,
      stripeUpdate: stripeUpdate ? { success: true } : { success: false, reason: 'No Stripe integration or update failed' }
    });
  } catch (error) {
    console.error('Error changing payment frequency:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/subscriptions/pause - Manually pause subscription (admin only)
router.post('/pause', auth, async (req, res) => {
  try {
    const { durationDays, reason } = req.body;
    const userId = req.user.id;

    // Check if user is admin (you may want to add admin middleware)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // For now, allow any user to manually pause (you can restrict this later)
    if (!user.subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Validate input
    if (!durationDays || durationDays < 1 || durationDays > 180) {
      return res.status(400).json({ 
        error: 'Duration must be between 1 and 180 days' 
      });
    }

    // Check if subscription is already paused
    if (user.subscription.isPaused) {
      return res.status(400).json({ error: 'Subscription is already paused' });
    }

    // Manually pause the subscription
    const result = await subscriptionPauseService.pauseSubscriptionManually(
      user.subscription.id,
      durationDays,
      reason || 'MANUAL_PAUSE'
    );

    res.json({
      success: true,
      message: result.message,
      pause: {
        id: result.pauseId,
        startDate: result.startDate,
        endDate: result.endDate,
        durationDays: result.durationDays,
        reason: result.reason
      }
    });
  } catch (error) {
    console.error('Error pausing subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/subscriptions/resume - Resume paused subscription
router.post('/resume', auth, async (req, res) => {
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

    // Check if subscription is paused
    if (!user.subscription.isPaused) {
      return res.status(400).json({ error: 'Subscription is not currently paused' });
    }

    // Resume the subscription
    const result = await subscriptionPauseService.resumeSubscription(user.subscription.id);

    res.json({
      success: true,
      message: result.message,
      resume: {
        resumeDate: result.resumeDate,
        pauseDuration: result.pauseDuration
      }
    });
  } catch (error) {
    console.error('Error resuming subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/subscriptions/pause-status - Get pause status
router.get('/pause-status', auth, async (req, res) => {
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

    // Get pause status
    const pauseStatus = await subscriptionPauseService.getPauseStatus(user.subscription.id);

    res.json({
      success: true,
      pauseStatus
    });
  } catch (error) {
    console.error('Error fetching pause status:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/subscriptions/add-property - Add additional property to subscription
router.post('/add-property', auth, async (req, res) => {
  try {
    const { address, nickname, ownershipVerification } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!address) {
      return res.status(400).json({ error: 'Property address is required' });
    }

    // Get user's subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user?.subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Check eligibility
    const eligibility = await additionalPropertyService.validatePropertyManagementEligibility(
      user.subscription.id
    );

    if (!eligibility.eligible) {
      return res.status(400).json({ 
        error: 'Not eligible to add properties',
        details: eligibility.checks
      });
    }

    // Add the property
    const result = await additionalPropertyService.addProperty(user.subscription.id, {
      address,
      nickname,
      ownershipVerification
    });

    res.json({
      success: true,
      message: result.message,
      property: {
        id: result.id,
        address: result.address,
        nickname: result.nickname,
        monthlyFee: result.monthlyFee,
        ownershipVerified: result.ownershipVerified,
        addedAt: result.addedAt
      }
    });
  } catch (error) {
    console.error('Error adding property:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/subscriptions/properties - Get all properties for subscription
router.get('/properties', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user?.subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Get properties
    const properties = await additionalPropertyService.getPropertiesForSubscription(
      user.subscription.id
    );

    // Get cost breakdown
    const costBreakdown = await additionalPropertyService.calculateTotalAdditionalPropertiesCost(
      user.subscription.id
    );

    res.json({
      success: true,
      properties,
      costBreakdown,
      message: 'Properties retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/subscriptions/properties/:id - Update property details
router.put('/properties/:id', auth, async (req, res) => {
  try {
    const { id: propertyId } = req.params;
    const { nickname, preferences } = req.body;
    const userId = req.user.id;

    // Validate property ID
    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    // Get user's subscription to verify ownership
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        subscription: {
          include: {
            additionalProperties: true
          }
        }
      }
    });

    if (!user?.subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Verify property belongs to user's subscription
    const property = user.subscription.additionalProperties.find(p => p.id === propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found or does not belong to your subscription' });
    }

    // Update the property
    const result = await additionalPropertyService.updateProperty(propertyId, {
      nickname,
      preferences
    });

    res.json({
      success: true,
      message: result.message,
      property: {
        id: result.id,
        address: result.address,
        nickname: result.nickname,
        monthlyFee: result.monthlyFee,
        ownershipVerified: result.ownershipVerified
      }
    });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/subscriptions/properties/:id - Remove property from subscription
router.delete('/properties/:id', auth, async (req, res) => {
  try {
    const { id: propertyId } = req.params;
    const userId = req.user.id;

    // Validate property ID
    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    // Get user's subscription to verify ownership
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        subscription: {
          include: {
            additionalProperties: true
          }
        }
      }
    });

    if (!user?.subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Verify property belongs to user's subscription
    const property = user.subscription.additionalProperties.find(p => p.id === propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found or does not belong to your subscription' });
    }

    // Remove the property
    const result = await additionalPropertyService.removeProperty(user.subscription.id, propertyId);

    res.json({
      success: true,
      message: result.message,
      removedProperty: {
        propertyId: result.propertyId,
        address: result.address,
        monthlyFee: result.monthlyFee
      }
    });
  } catch (error) {
    console.error('Error removing property:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/subscriptions/change-plan/preview - Get plan change preview
router.post('/change-plan/preview', auth, async (req, res) => {
  try {
    const { newTier, billingCycle = 'monthly' } = req.body;
    const userId = req.user.id;

    if (!newTier) {
      return res.status(400).json({ error: 'New tier is required' });
    }

    // Get user's current subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user?.subscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const currentSubscription = user.subscription;
    
    // Get current and new plan details
    const currentPlan = getPlanByTier(currentSubscription.tier);
    const newPlan = getPlanByTier(newTier);

    if (!currentPlan || !newPlan) {
      return res.status(400).json({ error: 'Invalid plan tier' });
    }

    // Check if change is allowed
    const canChange = currentSubscription.status === 'ACTIVE';
    const restrictions = [];
    
    if (!canChange) {
      restrictions.push('Subscription must be active to change plans');
    }

    // Calculate billing preview
    const currentPrice = billingCycle === 'yearly' 
      ? currentPlan.yearlyPrice / 12 
      : currentPlan.monthlyPrice;
    
    const newPrice = billingCycle === 'yearly' 
      ? newPlan.yearlyPrice / 12 
      : newPlan.monthlyPrice;

    const proratedDifference = newPrice - currentPrice;
    
    // Calculate remaining days in current period
    const currentPeriodEnd = new Date(currentSubscription.currentPeriodEnd);
    const now = new Date();
    const remainingDays = Math.max(0, Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const totalDays = 30; // Assuming monthly billing for simplicity

    // Calculate prorated amounts
    const proratedFactor = remainingDays / totalDays;
    const immediateCharge = Math.max(0, proratedDifference * proratedFactor);
    const creditAmount = Math.max(0, -proratedDifference * proratedFactor);

    // Determine if it's an upgrade or downgrade
    const tierHierarchy = { STARTER: 1, HOMECARE: 2, PRIORITY: 3 };
    const isUpgrade = tierHierarchy[newTier] > tierHierarchy[currentSubscription.tier];

    // Calculate visit carryover (mock data for now)
    const visitCarryover = {
      currentVisitsPerMonth: currentPlan.visitsPerMonth || 1,
      newVisitsPerMonth: newPlan.visitsPerMonth || 1,
      unusedVisits: 0, // This would come from usage tracking
      carryoverVisits: 0,
      totalVisitsNextPeriod: newPlan.visitsPerMonth || 1
    };

    // Set effective date
    const effectiveDate = new Date();
    effectiveDate.setDate(effectiveDate.getDate() + 1); // Next day

    const preview = {
      currentPlan: {
        id: currentPlan.id,
        name: currentPlan.name,
        monthlyPrice: currentPlan.monthlyPrice,
        yearlyPrice: currentPlan.yearlyPrice
      },
      newPlan: {
        id: newPlan.id,
        name: newPlan.name,
        monthlyPrice: newPlan.monthlyPrice,
        yearlyPrice: newPlan.yearlyPrice
      },
      isUpgrade,
      canChange,
      restrictions,
      billingPreview: {
        currentPrice,
        newPrice,
        proratedDifference,
        immediateCharge,
        creditAmount,
        nextAmount: newPrice,
        remainingDays,
        totalDays,
        billingCycle
      },
      visitCarryover,
      effectiveDate: effectiveDate.toISOString()
    };

    res.json({
      success: true,
      preview,
      message: 'Plan change preview generated successfully'
    });
  } catch (error) {
    console.error('Error generating plan change preview:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/subscriptions/change-plan - Change subscription plan
router.post('/change-plan', auth, async (req, res) => {
  try {
    const { newTier, billingCycle = 'monthly' } = req.body;
    const userId = req.user.id;

    if (!newTier) {
      return res.status(400).json({ error: 'New tier is required' });
    }

    // Get user's current subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user?.subscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const currentSubscription = user.subscription;
    
    // Validate the change is allowed
    if (currentSubscription.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Subscription must be active to change plans' });
    }

    if (currentSubscription.tier === newTier) {
      return res.status(400).json({ error: 'You are already on this plan' });
    }

    // Get plan details
    const newPlan = getPlanByTier(newTier);
    if (!newPlan) {
      return res.status(400).json({ error: 'Invalid plan tier' });
    }

    // Get new price ID
    const newPriceId = newPlan.stripePriceIds[billingCycle];
    if (!newPriceId) {
      return res.status(400).json({ error: 'Invalid billing cycle' });
    }

    // Update subscription in Stripe with proration
    let stripeSubscription = null;
    if (currentSubscription.stripeSubscriptionId) {
      try {
        stripeSubscription = await updateSubscriptionPlan(
          currentSubscription.stripeSubscriptionId,
          newPriceId,
          'create_prorations'
        );
      } catch (stripeError) {
        console.error('Stripe subscription update failed:', stripeError);
        return res.status(500).json({ error: 'Failed to update payment processing' });
      }
    }

    // Update subscription in database
    const updatedSubscription = await prisma.subscription.update({
      where: { id: currentSubscription.id },
      data: {
        tier: newTier,
        paymentFrequency: billingCycle.toUpperCase(),
        updatedAt: new Date(),
      },
    });

    // Calculate response data (similar to preview)
    const currentPlan = getPlanByTier(currentSubscription.tier);
    const tierHierarchy = { STARTER: 1, HOMECARE: 2, PRIORITY: 3 };
    const isUpgrade = tierHierarchy[newTier] > tierHierarchy[currentSubscription.tier];

    res.json({
      success: true,
      message: 'Plan changed successfully',
      subscription: {
        tier: updatedSubscription.tier,
        status: updatedSubscription.status,
        paymentFrequency: updatedSubscription.paymentFrequency,
        nextPaymentAmount: newPlan.monthlyPrice
      },
      billingPreview: {
        currentPrice: currentPlan?.monthlyPrice || 0,
        newPrice: newPlan.monthlyPrice,
        proratedDifference: newPlan.monthlyPrice - (currentPlan?.monthlyPrice || 0),
        immediateCharge: 0, // Would be calculated based on proration
        creditAmount: 0,
        nextAmount: newPlan.monthlyPrice,
        remainingDays: 0,
        totalDays: 30,
        billingCycle
      },
      visitCarryover: {
        currentVisitsPerMonth: currentPlan?.visitsPerMonth || 1,
        newVisitsPerMonth: newPlan.visitsPerMonth || 1,
        unusedVisits: 0,
        carryoverVisits: 0,
        totalVisitsNextPeriod: newPlan.visitsPerMonth || 1
      },
      effectiveDate: new Date().toISOString(),
      isUpgrade
    });
  } catch (error) {
    console.error('Error changing plan:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 