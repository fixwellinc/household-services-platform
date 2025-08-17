import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getAllPlans, getPlanById, getPlanByTier, calculateServiceDiscount } from '../config/plans.js';
import prisma from '../config/database.js';

const router = express.Router();

// Get all plans (public endpoint)
router.get('/', async (req, res) => {
  try {
    const plans = getAllPlans();
    
    // Add user's current plan if authenticated
    let userPlan = null;
    if (req.headers.authorization) {
      try {
        // Extract user from token without full auth middleware
        const token = req.headers.authorization.replace('Bearer ', '');
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId }
        });
        
        if (user?.subscriptionId) {
          const subscription = await prisma.subscription.findUnique({
            where: { id: user.subscriptionId }
          });
          
          if (subscription) {
            userPlan = {
              tier: subscription.tier,
              status: subscription.status,
              currentPeriodEnd: subscription.currentPeriodEnd
            };
          }
        }
      } catch (error) {
        // Token invalid or expired, continue without user plan
        console.log('Could not verify user token for plans endpoint');
      }
    }
    
    res.json({
      success: true,
      plans,
      userPlan,
      message: 'Plans retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plans'
    });
  }
});

// Get specific plan by ID
router.get('/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const plan = getPlanById(planId);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }
    
    res.json({
      success: true,
      plan,
      message: 'Plan retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plan'
    });
  }
});

// Calculate service discount for user's plan
router.post('/calculate-discount', authMiddleware, async (req, res) => {
  try {
    const { servicePrice } = req.body;
    const userId = req.user.id;
    
    if (!servicePrice || isNaN(servicePrice)) {
      return res.status(400).json({
        success: false,
        error: 'Valid service price is required'
      });
    }
    
    // Get user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });
    
    if (!subscription || subscription.status !== 'ACTIVE') {
      return res.json({
        success: true,
        discount: 0,
        finalPrice: servicePrice,
        message: 'No active subscription found'
      });
    }
    
    const discount = calculateServiceDiscount(subscription.tier, servicePrice);
    const finalPrice = servicePrice - discount;
    
    res.json({
      success: true,
      discount,
      finalPrice,
      planTier: subscription.tier,
      message: 'Discount calculated successfully'
    });
  } catch (error) {
    console.error('Error calculating discount:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate discount'
    });
  }
});

// Get user's current plan details
router.get('/user/current', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });
    
    if (!subscription) {
      return res.json({
        success: true,
        hasPlan: false,
        message: 'No subscription found'
      });
    }
    
    const plan = getPlanByTier(subscription.tier);
    
    res.json({
      success: true,
      hasPlan: true,
      subscription: {
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        createdAt: subscription.createdAt
      },
      plan,
      message: 'User plan retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching user plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user plan'
    });
  }
});

// Record user's plan selection (before payment)
router.post('/user/select-plan', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { tier, billingCycle } = req.body; // billingCycle: 'monthly' or 'yearly'
    
    if (!tier || !billingCycle) {
      return res.status(400).json({
        success: false,
        error: 'Tier and billing cycle are required'
      });
    }
    
    // Check if user already has a subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId }
    });
    
    if (existingSubscription) {
      // Update existing subscription
      await prisma.subscription.update({
        where: { userId },
        data: {
          tier,
          status: 'ACTIVE', // Set to ACTIVE immediately for now
          updatedAt: new Date()
        }
      });
    } else {
      // Create new subscription record
      const newSubscription = await prisma.subscription.create({
        data: {
          userId,
          tier,
          status: 'ACTIVE', // Set to ACTIVE immediately for now
          canCancel: true
        }
      });
      
      // Update user's subscriptionId
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionId: newSubscription.id }
      });
    }
    
    res.json({
      success: true,
      message: 'Plan selection recorded successfully',
      tier,
      billingCycle
    });
  } catch (error) {
    console.error('Error recording plan selection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record plan selection'
    });
  }
});

// TEMPORARY: Manually activate subscription for testing
router.post('/user/activate-subscription', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user has a subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No subscription found'
      });
    }
    
    // Activate the subscription
    await prisma.subscription.update({
      where: { userId },
      data: {
        status: 'ACTIVE',
        updatedAt: new Date()
      }
    });
    
    res.json({
      success: true,
      message: 'Subscription activated successfully',
      subscription: {
        id: subscription.id,
        tier: subscription.tier,
        status: 'ACTIVE'
      }
    });
  } catch (error) {
    console.error('Error activating subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate subscription'
    });
  }
});

// Change user's plan (from dashboard)
router.post('/user/change-plan', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { newTier, billingCycle } = req.body;
    
    if (!newTier || !billingCycle) {
      return res.status(400).json({
        success: false,
        error: 'New tier and billing cycle are required'
      });
    }
    
    // Check if user has an active subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId }
    });
    
    if (!existingSubscription || existingSubscription.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'No active subscription found'
      });
    }
    
    // Update subscription with new plan
    await prisma.subscription.update({
      where: { userId },
      data: {
        tier: newTier,
        status: 'PENDING_CHANGE', // Will be updated to ACTIVE after payment
        updatedAt: new Date()
      }
    });
    
    res.json({
      success: true,
      message: 'Plan change requested successfully',
      newTier,
      billingCycle,
      currentStatus: 'PENDING_CHANGE'
    });
  } catch (error) {
    console.error('Error changing plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change plan'
    });
  }
});

// TEST ENDPOINT: Create test subscription for debugging
router.post('/test/create-subscription', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { tier = 'STARTER' } = req.body;
    
    console.log('🔍 Creating test subscription for user:', userId, 'tier:', tier);
    
    // Check if user already has a subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId }
    });
    
    if (existingSubscription) {
      console.log('📝 Updating existing subscription:', existingSubscription.id);
      await prisma.subscription.update({
        where: { userId },
        data: {
          tier,
          status: 'ACTIVE',
          updatedAt: new Date()
        }
      });
    } else {
      console.log('🆕 Creating new subscription');
      const newSubscription = await prisma.subscription.create({
        data: {
          userId,
          tier,
          status: 'ACTIVE',
          canCancel: true
        }
      });
      
      console.log('✅ Subscription created:', newSubscription.id);
      
      // Update user's subscriptionId
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionId: newSubscription.id }
      });
      
      console.log('✅ User subscriptionId updated');
    }
    
    // Verify the subscription was created/updated
    const finalSubscription = await prisma.subscription.findUnique({
      where: { userId }
    });
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, subscriptionId: true }
    });
    
    console.log('🔍 Final verification:', {
      subscription: finalSubscription,
      user: user
    });
    
    res.json({
      success: true,
      message: 'Test subscription created/updated successfully',
      tier,
      subscription: finalSubscription,
      user: user
    });
  } catch (error) {
    console.error('❌ Error creating test subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test subscription',
      details: error.message
    });
  }
});

// DEBUG ENDPOINT: Check current subscription status
router.get('/test/debug-subscription', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('🔍 Debugging subscription for user:', userId);
    
    // Get user with subscriptionId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        subscriptionId: true,
        createdAt: true
      }
    });
    
    console.log('👤 User data:', user);
    
    // Get subscription if exists
    let subscription = null;
    if (user?.subscriptionId) {
      subscription = await prisma.subscription.findUnique({
        where: { id: user.subscriptionId }
      });
      console.log('📋 Subscription data:', subscription);
    } else {
      console.log('❌ No subscriptionId found in user record');
      
      // Check if there's a subscription by userId
      const subscriptionByUserId = await prisma.subscription.findUnique({
        where: { userId }
      });
      
      if (subscriptionByUserId) {
        console.log('🔍 Found subscription by userId:', subscriptionByUserId);
        console.log('⚠️  User subscriptionId is not set but subscription exists!');
      }
    }
    
    // Get all subscriptions for this user (should be 0 or 1)
    const allSubscriptions = await prisma.subscription.findMany({
      where: { userId }
    });
    
    console.log('📊 All subscriptions for user:', allSubscriptions);
    
    res.json({
      success: true,
      debug: {
        user,
        subscription,
        allSubscriptions,
        hasSubscriptionId: !!user?.subscriptionId,
        hasSubscription: !!subscription,
        subscriptionCount: allSubscriptions.length
      }
    });
  } catch (error) {
    console.error('❌ Error debugging subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to debug subscription',
      details: error.message
    });
  }
});

// Get plan comparison data
router.get('/comparison/table', async (req, res) => {
  try {
    const { PLAN_COMPARISON } = await import('../config/plans.js');
    
    res.json({
      success: true,
      comparison: PLAN_COMPARISON,
      message: 'Plan comparison data retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching plan comparison:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plan comparison'
    });
  }
});

// Get plan statistics (admin only)
router.get('/admin/stats', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    // Get subscription statistics
    const stats = await prisma.subscription.groupBy({
      by: ['tier', 'status'],
      _count: {
        id: true
      }
    });
    
    // Get total revenue (mock data for now)
    const totalRevenue = {
      monthly: 15000,
      yearly: 45000
    };
    
    res.json({
      success: true,
      stats,
      totalRevenue,
      message: 'Plan statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching plan statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plan statistics'
    });
  }
});

export default router; 