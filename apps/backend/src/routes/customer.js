import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import usageTrackingService from '../services/usageTrackingService.js';
import socketService from '../services/socketService.js';

const router = express.Router();

// Track service usage (for testing real-time updates)
router.post('/track-usage', authMiddleware, async (req, res) => {
  try {
    const { serviceType, subscriptionTier = 'HOMECARE' } = req.body;
    const userId = req.user.id;

    const usageUpdate = await usageTrackingService.trackServiceUsage(
      userId, 
      serviceType, 
      subscriptionTier
    );

    res.json({
      success: true,
      message: 'Usage tracked successfully',
      data: usageUpdate
    });
  } catch (error) {
    console.error('Error tracking usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track usage'
    });
  }
});

// Track discount usage (for testing real-time updates)
router.post('/track-discount', authMiddleware, async (req, res) => {
  try {
    const { discountAmount, subscriptionTier = 'HOMECARE' } = req.body;
    const userId = req.user.id;

    const usageUpdate = await usageTrackingService.trackDiscountUsage(
      userId, 
      discountAmount, 
      subscriptionTier
    );

    res.json({
      success: true,
      message: 'Discount usage tracked successfully',
      data: usageUpdate
    });
  } catch (error) {
    console.error('Error tracking discount usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track discount usage'
    });
  }
});

// Simulate subscription status change (for testing real-time updates)
router.post('/simulate-subscription-update', authMiddleware, async (req, res) => {
  try {
    const { status, tier, message } = req.body;
    const userId = req.user.id;

    const subscriptionUpdate = {
      id: `sub_${userId}`,
      userId,
      tier: tier || 'HOMECARE',
      status: status || 'ACTIVE',
      paymentFrequency: 'MONTHLY',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      nextPaymentAmount: tier === 'PRIORITY' ? 99 : tier === 'HOMECARE' ? 49 : 19,
      plan: {
        name: `${tier || 'HOMECARE'} Plan`,
        monthlyPrice: tier === 'PRIORITY' ? 99 : tier === 'HOMECARE' ? 49 : 19,
        yearlyPrice: (tier === 'PRIORITY' ? 99 : tier === 'HOMECARE' ? 49 : 19) * 10,
        features: ['Basic Support', 'Service Discounts']
      }
    };

    // Send real-time update
    socketService.notifyCustomerSubscriptionUpdate(userId, subscriptionUpdate);

    // Also send a notification
    const notification = {
      id: `notification_${Date.now()}`,
      userId,
      type: 'ACCOUNT',
      priority: 'MEDIUM',
      title: 'Subscription Updated',
      message: message || `Your subscription status has been updated to ${status}`,
      actionRequired: false,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    socketService.notifyCustomerNotification(userId, notification);

    res.json({
      success: true,
      message: 'Subscription update simulated successfully',
      data: subscriptionUpdate
    });
  } catch (error) {
    console.error('Error simulating subscription update:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to simulate subscription update'
    });
  }
});

// Simulate billing event (for testing real-time updates)
router.post('/simulate-billing-event', authMiddleware, async (req, res) => {
  try {
    const { type, amount, message } = req.body;
    const userId = req.user.id;

    const billingEvent = {
      userId,
      subscriptionId: `sub_${userId}`,
      type: type || 'PAYMENT_SUCCESS',
      amount: amount || 49,
      currency: 'USD',
      message: message || 'Payment processed successfully',
      timestamp: new Date().toISOString()
    };

    // Send real-time update
    socketService.notifyCustomerBillingEvent(userId, billingEvent);

    res.json({
      success: true,
      message: 'Billing event simulated successfully',
      data: billingEvent
    });
  } catch (error) {
    console.error('Error simulating billing event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to simulate billing event'
    });
  }
});

// Simulate usage for testing
router.post('/simulate-usage', authMiddleware, async (req, res) => {
  try {
    const { subscriptionTier = 'HOMECARE' } = req.body;
    const userId = req.user.id;

    // Run simulation in background
    usageTrackingService.simulateUsage(userId, subscriptionTier);

    res.json({
      success: true,
      message: 'Usage simulation started',
      data: { userId, subscriptionTier }
    });
  } catch (error) {
    console.error('Error starting usage simulation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start usage simulation'
    });
  }
});

// Get current usage data
router.get('/usage', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const usage = usageTrackingService.getUserUsage(userId);
    const limits = usageTrackingService.getLimitsForTier('HOMECARE'); // Default tier
    const warnings = usageTrackingService.checkUsageWarnings(usage, 'HOMECARE');

    res.json({
      success: true,
      data: {
        ...usage,
        limits,
        warnings
      }
    });
  } catch (error) {
    console.error('Error getting usage data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get usage data'
    });
  }
});

// Get usage metrics for analytics
router.post('/usage/metrics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.body;

    // Get usage data
    const usage = usageTrackingService.getUserUsage(userId);
    const limits = usageTrackingService.getLimitsForTier('HOMECARE'); // Default tier

    // Generate mock metrics for the requested period
    const metrics = [
      {
        id: 'services_used',
        name: 'Services Used',
        value: usage.servicesUsed || 0,
        category: 'SERVICES',
        unit: 'count',
        trend: 'up',
        change: '+2'
      },
      {
        id: 'discount_savings',
        name: 'Discount Savings',
        value: usage.discountsSaved || 0,
        category: 'BILLING',
        unit: 'currency',
        trend: 'up',
        change: '+$45'
      },
      {
        id: 'priority_bookings',
        name: 'Priority Bookings',
        value: usage.priorityBookings || 0,
        category: 'BOOKING',
        unit: 'count',
        trend: 'stable',
        change: '0'
      }
    ];

    // Generate mock service breakdown
    const serviceBreakdown = [
      {
        serviceId: 'plumbing',
        serviceName: 'Plumbing Services',
        totalAmount: 150.00,
        discountAmount: 30.00,
        finalAmount: 120.00,
        usageCount: 2
      },
      {
        serviceId: 'electrical',
        serviceName: 'Electrical Services',
        totalAmount: 200.00,
        discountAmount: 40.00,
        finalAmount: 160.00,
        usageCount: 1
      }
    ];

    const totalSavings = serviceBreakdown.reduce((sum, service) => sum + service.discountAmount, 0);
    const totalSpent = serviceBreakdown.reduce((sum, service) => sum + service.finalAmount, 0);

    res.json({
      success: true,
      metrics,
      serviceBreakdown,
      totalSavings,
      totalSpent,
      message: 'Usage metrics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting usage metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get usage metrics'
    });
  }
});

// Reset usage for testing
router.post('/reset-usage', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    usageTrackingService.resetUsageForPeriod(userId);

    res.json({
      success: true,
      message: 'Usage reset successfully'
    });
  } catch (error) {
    console.error('Error resetting usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset usage'
    });
  }
});

export default router;