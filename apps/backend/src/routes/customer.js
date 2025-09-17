import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import usageTrackingService from '../services/usageTrackingService.js';
import socketService from '../services/socketService.js';

const router = express.Router();

// Track service usage (for testing real-time updates)
router.post('/track-usage', authenticateToken, async (req, res) => {
  try {
    const { serviceType, subscriptionTier = 'HOMECARE' } = req.body;
    const userId = req.user.userId;

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
router.post('/track-discount', authenticateToken, async (req, res) => {
  try {
    const { discountAmount, subscriptionTier = 'HOMECARE' } = req.body;
    const userId = req.user.userId;

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
router.post('/simulate-subscription-update', authenticateToken, async (req, res) => {
  try {
    const { status, tier, message } = req.body;
    const userId = req.user.userId;

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
router.post('/simulate-billing-event', authenticateToken, async (req, res) => {
  try {
    const { type, amount, message } = req.body;
    const userId = req.user.userId;

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
router.post('/simulate-usage', authenticateToken, async (req, res) => {
  try {
    const { subscriptionTier = 'HOMECARE' } = req.body;
    const userId = req.user.userId;

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
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
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

// Reset usage for testing
router.post('/reset-usage', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
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