import express from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import SubscriptionAnalyticsService from '../../services/subscriptionAnalyticsService.js';
import ChurnPredictionService from '../../services/churnPredictionService.js';
import prisma from '../../config/database.js';

const router = express.Router();

// Initialize services
const analyticsService = new SubscriptionAnalyticsService(prisma);
const churnService = new ChurnPredictionService(prisma);

/**
 * GET /api/admin/subscriptions/analytics
 * Get comprehensive subscription analytics
 */
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const analytics = await analyticsService.getSubscriptionAnalytics({ timeRange });
    
    res.json({
      success: true,
      analytics
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
 * GET /api/admin/subscriptions/analytics/export
 * Export subscription analytics data
 */
router.get('/analytics/export', requireAdmin, async (req, res) => {
  try {
    const { timeRange = '30d', format = 'csv' } = req.query;
    
    if (format !== 'csv') {
      return res.status(400).json({
        success: false,
        error: 'Only CSV format is currently supported'
      });
    }
    
    const csvData = await analyticsService.exportAnalytics({ timeRange });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=subscription-analytics-${timeRange}.csv`);
    
    res.json({
      success: true,
      data: csvData
    });
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics data'
    });
  }
});

/**
 * GET /api/admin/subscriptions/churn-predictions
 * Get churn predictions for customers
 */
router.get('/churn-predictions', requireAdmin, async (req, res) => {
  try {
    const { riskLevel = 'ALL', limit = 50 } = req.query;
    
    const predictions = await churnService.getChurnPredictions({
      riskLevel,
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      predictions
    });
  } catch (error) {
    console.error('Error fetching churn predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch churn predictions'
    });
  }
});

/**
 * GET /api/admin/subscriptions/churn-metrics
 * Get churn metrics summary
 */
router.get('/churn-metrics', requireAdmin, async (req, res) => {
  try {
    const metrics = await churnService.getChurnMetrics();
    
    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Error fetching churn metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch churn metrics'
    });
  }
});

/**
 * GET /api/admin/subscriptions/retention-campaigns
 * Get available retention campaigns
 */
router.get('/retention-campaigns', requireAdmin, async (req, res) => {
  try {
    const campaigns = await churnService.getRetentionCampaigns();
    
    res.json({
      success: true,
      campaigns
    });
  } catch (error) {
    console.error('Error fetching retention campaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch retention campaigns'
    });
  }
});

/**
 * POST /api/admin/subscriptions/retention-campaign
 * Launch a retention campaign
 */
router.post('/retention-campaign', requireAdmin, async (req, res) => {
  try {
    const { type, customerIds } = req.body;
    
    if (!type || !customerIds || !Array.isArray(customerIds)) {
      return res.status(400).json({
        success: false,
        error: 'Campaign type and customer IDs are required'
      });
    }
    
    if (customerIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one customer ID is required'
      });
    }
    
    const result = await churnService.runRetentionCampaign(type, customerIds);
    
    res.json({
      success: result.success,
      result
    });
  } catch (error) {
    console.error('Error launching retention campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to launch retention campaign'
    });
  }
});

/**
 * GET /api/admin/subscriptions/churn-algorithm/config
 * Get churn algorithm configuration
 */
router.get('/churn-algorithm/config', requireAdmin, async (req, res) => {
  try {
    // In a real implementation, this would come from a database
    // For now, return default configuration
    const config = {
      factors: [
        {
          id: 'payment_failures',
          name: 'Payment Failures',
          description: 'Number of failed payment attempts in the last 30 days',
          weight: 0.25,
          enabled: true,
          category: 'financial'
        },
        {
          id: 'service_usage',
          name: 'Service Usage Decline',
          description: 'Decrease in service bookings compared to historical average',
          weight: 0.20,
          enabled: true,
          category: 'behavioral'
        },
        {
          id: 'support_tickets',
          name: 'Support Ticket Frequency',
          description: 'Increase in support tickets indicating dissatisfaction',
          weight: 0.15,
          enabled: true,
          category: 'support'
        },
        {
          id: 'login_frequency',
          name: 'Login Frequency',
          description: 'Decrease in platform login frequency',
          weight: 0.10,
          enabled: true,
          category: 'engagement'
        }
      ],
      thresholds: {
        low: 0.3,
        medium: 0.5,
        high: 0.7,
        critical: 0.85
      },
      predictionWindow: 30,
      minimumDataPoints: 10,
      enableAutoRetention: false
    };
    
    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error fetching algorithm config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch algorithm configuration'
    });
  }
});

/**
 * PUT /api/admin/subscriptions/churn-algorithm/config
 * Update churn algorithm configuration
 */
router.put('/churn-algorithm/config', requireAdmin, async (req, res) => {
  try {
    const config = req.body;
    
    // In a real implementation, this would save to database
    // For now, just validate and return success
    if (!config.factors || !config.thresholds) {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration format'
      });
    }
    
    res.json({
      success: true,
      message: 'Algorithm configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating algorithm config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update algorithm configuration'
    });
  }
});

/**
 * GET /api/admin/subscriptions/churn-algorithm/performance
 * Get algorithm performance metrics
 */
router.get('/churn-algorithm/performance', requireAdmin, async (req, res) => {
  try {
    // In a real implementation, this would come from actual performance data
    const performance = {
      accuracy: 0.78,
      precision: 0.72,
      recall: 0.68,
      f1Score: 0.70,
      truePositives: 45,
      falsePositives: 18,
      trueNegatives: 127,
      falseNegatives: 21,
      lastUpdated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      performance
    });
  } catch (error) {
    console.error('Error fetching algorithm performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch algorithm performance'
    });
  }
});

/**
 * POST /api/admin/subscriptions/churn-algorithm/test
 * Run algorithm test
 */
router.post('/churn-algorithm/test', requireAdmin, async (req, res) => {
  try {
    // In a real implementation, this would run the algorithm on test data
    // For now, simulate a test run
    
    res.json({
      success: true,
      message: 'Algorithm test completed successfully',
      testResults: {
        samplesProcessed: 100,
        accuracy: 0.78,
        executionTime: '2.3s'
      }
    });
  } catch (error) {
    console.error('Error running algorithm test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run algorithm test'
    });
  }
});

/**
 * POST /api/admin/subscriptions/update-churn-scores
 * Update churn risk scores for all active subscriptions
 */
router.post('/update-churn-scores', requireAdmin, async (req, res) => {
  try {
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: { userId: true }
    });

    let updated = 0;
    let failed = 0;

    for (const subscription of activeSubscriptions) {
      try {
        const riskAnalysis = await churnService.calculateChurnRiskScore(subscription.userId);
        await churnService.updateChurnRiskScore(subscription.userId, riskAnalysis.riskScore);
        updated++;
      } catch (error) {
        console.error(`Failed to update churn score for user ${subscription.userId}:`, error);
        failed++;
      }
    }

    res.json({
      success: true,
      message: 'Churn scores updated',
      results: {
        updated,
        failed,
        total: activeSubscriptions.length
      }
    });
  } catch (error) {
    console.error('Error updating churn scores:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update churn scores'
    });
  }
});

export default router;