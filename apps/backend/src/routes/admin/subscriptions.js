import express from 'express';
import { authMiddleware, requireAdmin } from '../../middleware/auth.js';
import { auditPresets } from '../../middleware/auditMiddleware.js';
import prisma from '../../config/database.js';
import subscriptionService from '../../services/subscriptionService.js';

const router = express.Router();

// Apply admin role check (auth already applied globally)
router.use(requireAdmin);

/**
 * GET /api/admin/subscriptions
 * Get all subscriptions with advanced filtering and search
 */
router.get('/', async (req, res) => {
  try {
    const {
      search,
      tier,
      status,
      paymentFrequency,
      churnRisk,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { stripeCustomerId: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (tier) {
      where.tier = tier;
    }

    if (status) {
      where.status = status;
    }

    if (paymentFrequency) {
      where.paymentFrequency = paymentFrequency;
    }

    if (churnRisk) {
      const riskThreshold = parseFloat(churnRisk);
      if (riskThreshold >= 0 && riskThreshold <= 1) {
        where.churnRiskScore = { gte: riskThreshold };
      }
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get subscriptions with pagination
    const [subscriptions, totalCount] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              createdAt: true
            }
          }
        }
      }),
      prisma.subscription.count({ where })
    ]);

    // Enhance subscription data with calculated fields
    const enhancedSubscriptions = subscriptions.map(subscription => {
      const currentDate = new Date();
      const periodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
      const isExpired = periodEnd && currentDate > periodEnd;
      const isNearExpiry = periodEnd && (periodEnd.getTime() - currentDate.getTime()) < (7 * 24 * 60 * 60 * 1000);
      
      // Calculate effective status
      let effectiveStatus = subscription.status;
      if (subscription.isPaused) {
        effectiveStatus = 'PAUSED';
      } else if (isExpired && subscription.status === 'ACTIVE') {
        effectiveStatus = 'EXPIRED';
      } else if (isNearExpiry && subscription.status === 'ACTIVE') {
        effectiveStatus = 'ACTIVE'; // Keep as active but mark as near expiry
      }

      return {
        ...subscription,
        effectiveStatus,
        isExpired,
        isNearExpiry,
        daysUntilExpiry: periodEnd ? Math.ceil((periodEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) : null
      };
    });

    const totalPages = Math.ceil(totalCount / take);

    res.json({
      success: true,
      subscriptions: enhancedSubscriptions,
      pagination: {
        page: parseInt(page),
        limit: take,
        totalCount,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscriptions'
    });
  }
});

/**
 * GET /api/admin/subscriptions/analytics
 * Get subscription analytics and statistics
 */
router.get('/analytics', async (req, res) => {
  try {
    const stats = await subscriptionService.getSubscriptionAnalytics();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching subscription analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription analytics'
    });
  }
});

/**
 * GET /api/admin/subscriptions/:id
 * Get detailed subscription information
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            address: true,
            postalCode: true,
            createdAt: true
          }
        },
        paymentFrequencies: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        subscriptionPauses: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        additionalProperties: true
      }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    // Get usage data
    const usage = await subscriptionService.getUsageSummary(subscription.userId);

    res.json({
      success: true,
      subscription: {
        ...subscription,
        usage
      }
    });
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription details'
    });
  }
});

/**
 * POST /api/admin/subscriptions/:id/pause
 * Pause a subscription
 */
router.post('/:id/pause', auditPresets.subscriptionUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, endDate } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Pause reason is required'
      });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    if (subscription.isPaused) {
      return res.status(400).json({
        success: false,
        error: 'Subscription is already paused'
      });
    }

    // Calculate pause duration
    const pauseEndDate = endDate ? new Date(endDate) : null;
    const pauseStartDate = new Date();
    
    // Update subscription
    await prisma.subscription.update({
      where: { id },
      data: {
        isPaused: true,
        pauseStartDate,
        pauseEndDate,
        updatedAt: new Date()
      }
    });

    // Create pause record
    await prisma.subscriptionPause.create({
      data: {
        subscriptionId: id,
        reason,
        startDate: pauseStartDate,
        endDate: pauseEndDate,
        pausedBy: req.user.id
      }
    });

    res.json({
      success: true,
      message: 'Subscription paused successfully'
    });
  } catch (error) {
    console.error('Error pausing subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pause subscription'
    });
  }
});

/**
 * POST /api/admin/subscriptions/:id/resume
 * Resume a paused subscription
 */
router.post('/:id/resume', auditPresets.subscriptionUpdate, async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    if (!subscription.isPaused) {
      return res.status(400).json({
        success: false,
        error: 'Subscription is not paused'
      });
    }

    // Update subscription
    await prisma.subscription.update({
      where: { id },
      data: {
        isPaused: false,
        pauseStartDate: null,
        pauseEndDate: null,
        updatedAt: new Date()
      }
    });

    // Update the most recent pause record
    const latestPause = await prisma.subscriptionPause.findFirst({
      where: { 
        subscriptionId: id,
        endDate: null
      },
      orderBy: { createdAt: 'desc' }
    });

    if (latestPause) {
      await prisma.subscriptionPause.update({
        where: { id: latestPause.id },
        data: {
          endDate: new Date(),
          resumedBy: req.user.id
        }
      });
    }

    res.json({
      success: true,
      message: 'Subscription resumed successfully'
    });
  } catch (error) {
    console.error('Error resuming subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resume subscription'
    });
  }
});

/**
 * POST /api/admin/subscriptions/:id/cancel
 * Cancel a subscription
 */
router.post('/:id/cancel', auditPresets.subscriptionUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Cancellation reason is required'
      });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    if (subscription.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: 'Subscription is already cancelled'
      });
    }

    // Update subscription
    await prisma.subscription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription'
    });
  }
});

export default router;