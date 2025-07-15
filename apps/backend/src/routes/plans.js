import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getAllPlans, getPlanById, getPlanByTier, calculateServiceDiscount } from '../config/plans.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

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
          where: { id: decoded.userId },
          include: { subscription: true }
        });
        
        if (user?.subscription) {
          userPlan = {
            tier: user.subscription.tier,
            status: user.subscription.status,
            currentPeriodEnd: user.subscription.currentPeriodEnd
          };
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