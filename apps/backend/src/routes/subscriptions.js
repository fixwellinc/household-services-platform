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
  updateSubscription
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

export default router; 