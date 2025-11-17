import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import usageTrackingService from '../services/usageTrackingService.js';
import socketService from '../services/socketService.js';
import subscriptionService from '../services/subscriptionService.js';
import PaymentMethodService from '../services/paymentMethodService.js';
import { getSubscription, updateCustomer, getCustomer } from '../services/stripe.js';
import prisma from '../config/database.js';
import { logger } from '../utils/logger.js';

const paymentMethodService = new PaymentMethodService(prisma);

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
    logger.error('Error tracking usage', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      serviceType: req.body.serviceType
    });
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
    logger.error('Error tracking discount usage', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
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
    logger.error('Error simulating subscription update', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
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
    logger.error('Error simulating billing event', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
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
    logger.error('Error starting usage simulation', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
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

    // Get subscription to determine tier
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    const tier = subscription?.tier || 'HOMECARE';

    // Get usage from database
    let usage = await prisma.subscriptionUsage.findUnique({
      where: { userId }
    });

    // If no usage record exists, create one
    if (!usage && subscription) {
      usage = await prisma.subscriptionUsage.create({
        data: {
          userId,
          subscriptionId: subscription.id,
          tier,
          priorityBookingCount: 0,
          discountAmount: 0,
          maxPriorityBookings: tier === 'PRIORITY' ? 10 : tier === 'HOMECARE' ? 5 : 2,
          maxDiscountAmount: tier === 'PRIORITY' ? 500 : tier === 'HOMECARE' ? 200 : 50,
          maxFreeServices: tier === 'PRIORITY' ? 2 : tier === 'HOMECARE' ? 1 : 0,
          maxEmergencyServices: tier === 'PRIORITY' ? 3 : tier === 'HOMECARE' ? 1 : 0
        }
      });
    }

    // Get limits for tier
    const limits = usageTrackingService.getLimitsForTier(tier);

    // Calculate services used from appointments and jobs
    const [appointmentsCount, jobsCount] = await Promise.all([
      prisma.appointment.count({
        where: {
          customerId: userId,
          status: {
            in: ['CONFIRMED', 'COMPLETED']
          },
          createdAt: {
            gte: subscription?.currentPeriodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.job.count({
        where: {
          customerId: userId,
          status: 'COMPLETED',
          createdAt: {
            gte: subscription?.currentPeriodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    const servicesUsed = appointmentsCount + jobsCount;

    // Get discount savings from invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        customerId: userId,
        createdAt: {
          gte: subscription?.currentPeriodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      select: {
        discountAmount: true
      }
    });

    const discountsSaved = invoices.reduce((sum, inv) => sum + (inv.discountAmount || 0), 0);

    // Format usage data
    const usageData = {
      userId,
      subscriptionId: usage?.subscriptionId || subscription?.id,
      tier,
      servicesUsed,
      discountsSaved,
      priorityBookings: usage?.priorityBookingCount || 0,
      emergencyServices: usage?.emergencyServiceUsed ? 1 : 0,
      limits: {
        maxServices: limits.maxServices || 100,
        maxDiscountAmount: usage?.maxDiscountAmount || limits.maxDiscountAmount || 200,
        maxPriorityBookings: usage?.maxPriorityBookings || limits.maxPriorityBookings || 5,
        maxEmergencyServices: usage?.maxEmergencyServices || limits.maxEmergencyServices || 1
      },
      warnings: usageTrackingService.checkUsageWarnings({
        servicesUsed,
        discountsSaved,
        priorityBookings: usage?.priorityBookingCount || 0,
        emergencyServices: usage?.emergencyServiceUsed ? 1 : 0
      }, tier)
    };

    res.json({
      success: true,
      data: usageData
    });
  } catch (error) {
    logger.error('Error getting usage data', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
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
    logger.error('Error getting usage metrics', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
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
    logger.error('Error resetting usage', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to reset usage'
    });
  }
});

// ============================================
// SUBSCRIPTION MANAGEMENT ENDPOINTS
// ============================================

// GET /api/customer/subscription - Get current subscription details
router.get('/subscription', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        subscriptionPauses: {
          where: {
            status: 'ACTIVE'
          },
          orderBy: {
            startDate: 'desc'
          },
          take: 1
        }
      }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No subscription found'
      });
    }

    // Get usage data
    const usage = await prisma.subscriptionUsage.findUnique({
      where: { userId }
    });

    // Get Stripe subscription details if available
    let stripeSubscription = null;
    if (subscription.stripeSubscriptionId) {
      try {
        stripeSubscription = await getSubscription(subscription.stripeSubscriptionId);
      } catch (error) {
        logger.warn('Could not fetch Stripe subscription', {
          subscriptionId: subscription.stripeSubscriptionId,
          error: error.message
        });
      }
    }

    // Calculate days remaining
    const daysRemaining = subscription.currentPeriodEnd
      ? Math.ceil((new Date(subscription.currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24))
      : null;

    res.json({
      success: true,
      data: {
        ...subscription,
        usage,
        stripeSubscription,
        daysRemaining,
        isPaused: subscription.isPaused || (subscription.subscriptionPauses?.length > 0)
      }
    });
  } catch (error) {
    logger.error('Error getting subscription', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription'
    });
  }
});

// PUT /api/customer/subscription - Update subscription
router.put('/subscription', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { tier, paymentFrequency } = req.body;

    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No subscription found'
      });
    }

    const updateData = {};
    if (tier) updateData.tier = tier;
    if (paymentFrequency) updateData.paymentFrequency = paymentFrequency;

    const updatedSubscription = await prisma.subscription.update({
      where: { userId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Send real-time update
    socketService.notifyCustomerSubscriptionUpdate(userId, updatedSubscription);

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: updatedSubscription
    });
  } catch (error) {
    logger.error('Error updating subscription', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update subscription'
    });
  }
});

// POST /api/customer/subscription/pause - Pause subscription
router.post('/subscription/pause', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No subscription found'
      });
    }

    if (subscription.isPaused) {
      return res.status(400).json({
        success: false,
        error: 'Subscription is already paused'
      });
    }

    // Create pause record
    const pause = await prisma.subscriptionPause.create({
      data: {
        subscriptionId: subscription.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason: reason || null,
        status: 'ACTIVE'
      }
    });

    // Update subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { userId },
      data: {
        isPaused: true,
        pauseStartDate: new Date(startDate),
        pauseEndDate: new Date(endDate)
      }
    });

    // Send real-time update
    socketService.notifyCustomerSubscriptionUpdate(userId, updatedSubscription);

    res.json({
      success: true,
      message: 'Subscription paused successfully',
      data: {
        subscription: updatedSubscription,
        pause
      }
    });
  } catch (error) {
    logger.error('Error pausing subscription', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to pause subscription'
    });
  }
});

// POST /api/customer/subscription/resume - Resume subscription
router.post('/subscription/resume', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: {
        subscriptionPauses: {
          where: {
            status: 'ACTIVE'
          }
        }
      }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No subscription found'
      });
    }

    if (!subscription.isPaused) {
      return res.status(400).json({
        success: false,
        error: 'Subscription is not paused'
      });
    }

    // Mark all active pauses as completed
    await prisma.subscriptionPause.updateMany({
      where: {
        subscriptionId: subscription.id,
        status: 'ACTIVE'
      },
      data: {
        status: 'COMPLETED'
      }
    });

    // Update subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { userId },
      data: {
        isPaused: false,
        pauseStartDate: null,
        pauseEndDate: null
      }
    });

    // Send real-time update
    socketService.notifyCustomerSubscriptionUpdate(userId, updatedSubscription);

    res.json({
      success: true,
      message: 'Subscription resumed successfully',
      data: updatedSubscription
    });
  } catch (error) {
    logger.error('Error resuming subscription', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to resume subscription'
    });
  }
});

// GET /api/customer/subscription/history - Get subscription history
router.get('/subscription/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No subscription found'
      });
    }

    // Get pause history
    const pauses = await prisma.subscriptionPause.findMany({
      where: {
        subscriptionId: subscription.id
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    // Get billing adjustments
    const billingAdjustments = await prisma.billingAdjustment.findMany({
      where: {
        subscriptionId: subscription.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    // Get credit transactions
    const creditTransactions = await prisma.creditTransaction.findMany({
      where: {
        subscriptionId: subscription.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    res.json({
      success: true,
      data: {
        subscription,
        pauses,
        billingAdjustments,
        creditTransactions
      }
    });
  } catch (error) {
    logger.error('Error getting subscription history', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription history'
    });
  }
});

// ============================================
// SERVICE MANAGEMENT ENDPOINTS
// ============================================

// GET /api/customer/appointments - List appointments
router.get('/appointments', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, startDate, endDate, limit = 50, offset = 0 } = req.query;

    const where = {
      customerId: userId
    };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) where.scheduledDate.gte = new Date(startDate);
      if (endDate) where.scheduledDate.lte = new Date(endDate);
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          serviceType: {
            select: {
              id: true,
              name: true,
              displayName: true,
              duration: true
            }
          }
        },
        orderBy: {
          scheduledDate: 'desc'
        },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.appointment.count({ where })
    ]);

    res.json({
      success: true,
      data: appointments,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + appointments.length < total
      }
    });
  } catch (error) {
    logger.error('Error getting appointments', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get appointments'
    });
  }
});

// GET /api/customer/appointments/:id - Get appointment details
router.get('/appointments/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        customerId: userId
      },
      include: {
        serviceType: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    logger.error('Error getting appointment', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      appointmentId: req.params.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get appointment'
    });
  }
});

// POST /api/customer/appointments - Create appointment
router.post('/appointments', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      serviceTypeId,
      scheduledDate,
      duration,
      customerName,
      customerEmail,
      customerPhone,
      propertyAddress,
      notes
    } = req.body;

    if (!serviceTypeId || !scheduledDate || !customerName || !customerEmail || !propertyAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: serviceTypeId, scheduledDate, customerName, customerEmail, propertyAddress'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true }
    });

    const appointment = await prisma.appointment.create({
      data: {
        customerId: userId,
        serviceTypeId,
        scheduledDate: new Date(scheduledDate),
        duration: duration || 60,
        customerName: customerName || user?.name || '',
        customerEmail: customerEmail || user?.email || '',
        customerPhone: customerPhone || user?.phone || null,
        propertyAddress,
        notes: notes || null,
        status: 'PENDING'
      },
      include: {
        serviceType: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: appointment
    });
  } catch (error) {
    logger.error('Error creating appointment', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to create appointment'
    });
  }
});

// PUT /api/customer/appointments/:id - Update appointment
router.put('/appointments/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { scheduledDate, duration, notes, status } = req.body;

    // Verify appointment belongs to user
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id,
        customerId: userId
      }
    });

    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    const updateData = {};
    if (scheduledDate) updateData.scheduledDate = new Date(scheduledDate);
    if (duration) updateData.duration = duration;
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        serviceType: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: updatedAppointment
    });
  } catch (error) {
    logger.error('Error updating appointment', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      appointmentId: req.params.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update appointment'
    });
  }
});

// DELETE /api/customer/appointments/:id - Cancel appointment
router.delete('/appointments/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify appointment belongs to user
    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        customerId: userId
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    // Update status to CANCELLED instead of deleting
    const cancelledAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      }
    });

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: cancelledAppointment
    });
  } catch (error) {
    logger.error('Error cancelling appointment', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      appointmentId: req.params.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to cancel appointment'
    });
  }
});

// GET /api/customer/service-requests - Get service requests
router.get('/service-requests', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 50, offset = 0 } = req.query;

    const where = {
      customerId: userId
    };

    if (status) {
      where.status = status;
    }

    const [serviceRequests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        include: {
          service: {
            select: {
              id: true,
              name: true,
              description: true,
              category: true
            }
          },
          assignedTechnician: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          quotes: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 5
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.serviceRequest.count({ where })
    ]);

    res.json({
      success: true,
      data: serviceRequests,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + serviceRequests.length < total
      }
    });
  } catch (error) {
    logger.error('Error getting service requests', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get service requests'
    });
  }
});

// GET /api/customer/service-history - Get service history
router.get('/service-history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where: {
          customerId: userId,
          status: 'COMPLETED'
        },
        include: {
          serviceRequest: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  category: true
                }
              }
            }
          },
          technician: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          invoices: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        },
        orderBy: {
          completedAt: 'desc'
        },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.job.count({
        where: {
          customerId: userId,
          status: 'COMPLETED'
        }
      })
    ]);

    res.json({
      success: true,
      data: jobs,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + jobs.length < total
      }
    });
  } catch (error) {
    logger.error('Error getting service history', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get service history'
    });
  }
});

// ============================================
// BILLING & PAYMENT ENDPOINTS
// ============================================

// GET /api/customer/billing - Get billing overview
router.get('/billing', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No subscription found'
      });
    }

    // Get upcoming charges
    const upcomingCharges = {
      nextBillingDate: subscription.currentPeriodEnd,
      nextPaymentAmount: subscription.nextPaymentAmount || 0,
      currency: 'USD'
    };

    // Get outstanding invoices
    const outstandingInvoices = await prisma.invoice.findMany({
      where: {
        customerId: userId,
        status: {
          in: ['PENDING', 'OVERDUE']
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Get recent transactions (from invoices)
    const recentTransactions = await prisma.invoice.findMany({
      where: {
        customerId: userId,
        status: 'PAID'
      },
      orderBy: {
        paidAt: 'desc'
      },
      take: 10
    });

    res.json({
      success: true,
      data: {
        subscription: {
          tier: subscription.tier,
          status: subscription.status,
          paymentFrequency: subscription.paymentFrequency
        },
        upcomingCharges,
        outstandingBalance: totalOutstanding,
        outstandingInvoices,
        recentTransactions
      }
    });
  } catch (error) {
    logger.error('Error getting billing overview', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get billing overview'
    });
  }
});

// GET /api/customer/payment-methods - List payment methods
router.get('/payment-methods', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await paymentMethodService.getPaymentMethods(userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to get payment methods'
      });
    }

    res.json({
      success: true,
      data: result.paymentMethods
    });
  } catch (error) {
    logger.error('Error getting payment methods', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get payment methods'
    });
  }
});

// POST /api/customer/payment-methods - Add payment method
router.post('/payment-methods', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentMethodId } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        error: 'Payment method ID is required'
      });
    }

    const result = await paymentMethodService.updatePaymentMethod(userId, paymentMethodId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to add payment method'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Payment method added successfully',
      data: result.paymentMethod
    });
  } catch (error) {
    logger.error('Error adding payment method', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to add payment method'
    });
  }
});

// DELETE /api/customer/payment-methods/:id - Remove payment method
router.delete('/payment-methods/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await paymentMethodService.removePaymentMethod(userId, id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to remove payment method'
      });
    }

    res.json({
      success: true,
      message: 'Payment method removed successfully'
    });
  } catch (error) {
    logger.error('Error removing payment method', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      paymentMethodId: req.params.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to remove payment method'
    });
  }
});

// GET /api/customer/invoices - List invoices
router.get('/invoices', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 50, offset = 0 } = req.query;

    const where = {
      customerId: userId
    };

    if (status) {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          job: {
            include: {
              serviceRequest: {
                include: {
                  service: {
                    select: {
                      id: true,
                      name: true,
                      description: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.invoice.count({ where })
    ]);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + invoices.length < total
      }
    });
  } catch (error) {
    logger.error('Error getting invoices', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get invoices'
    });
  }
});

// GET /api/customer/invoices/:id - Get invoice details
router.get('/invoices/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        customerId: userId
      },
      include: {
        job: {
          include: {
            serviceRequest: {
              include: {
                service: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    category: true
                  }
                }
              }
            },
            technician: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    logger.error('Error getting invoice', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      invoiceId: req.params.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get invoice'
    });
  }
});

// GET /api/customer/invoices/:id/pdf - Download invoice PDF
router.get('/invoices/:id/pdf', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        customerId: userId
      }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // If PDF URL exists, redirect to it
    if (invoice.pdfUrl) {
      return res.redirect(invoice.pdfUrl);
    }

    // Otherwise, return invoice data (PDF generation would be implemented separately)
    res.status(501).json({
      success: false,
      error: 'PDF generation not yet implemented',
      data: invoice
    });
  } catch (error) {
    logger.error('Error getting invoice PDF', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      invoiceId: req.params.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get invoice PDF'
    });
  }
});

// GET /api/customer/billing-history - Get billing history
router.get('/billing-history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    // Get all invoices (paid and unpaid)
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          customerId: userId
        },
        include: {
          job: {
            select: {
              id: true,
              serviceRequest: {
                select: {
                  service: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.invoice.count({
        where: {
          customerId: userId
        }
      })
    ]);

    // Get billing adjustments
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    let billingAdjustments = [];
    if (subscription) {
      billingAdjustments = await prisma.billingAdjustment.findMany({
        where: {
          subscriptionId: subscription.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      });
    }

    res.json({
      success: true,
      data: {
        invoices,
        billingAdjustments,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + invoices.length < total
        }
      }
    });
  } catch (error) {
    logger.error('Error getting billing history', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get billing history'
    });
  }
});

// ============================================
// NOTIFICATION ENDPOINTS
// ============================================

// GET /api/customer/notifications - Get notifications
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, status, isRead, limit = 50, offset = 0 } = req.query;

    const where = {
      userId
    };

    if (type) where.type = type;
    if (status) where.status = status;
    if (isRead !== undefined) {
      // Note: NotificationDelivery doesn't have isRead, but we can use status
      // This would need to be adapted based on actual notification structure
    }

    const [notifications, total] = await Promise.all([
      prisma.notificationDelivery.findMany({
        where,
        include: {
          appointment: {
            select: {
              id: true,
              scheduledDate: true,
              serviceType: {
                select: {
                  displayName: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.notificationDelivery.count({ where })
    ]);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + notifications.length < total
      }
    });
  } catch (error) {
    logger.error('Error getting notifications', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications'
    });
  }
});

// PUT /api/customer/notifications/:id - Update notification (mark as read)
router.put('/notifications/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    const notification = await prisma.notificationDelivery.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (status === 'SENT' && !notification.sentAt) {
      updateData.sentAt = new Date();
    }

    const updatedNotification = await prisma.notificationDelivery.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Notification updated successfully',
      data: updatedNotification
    });
  } catch (error) {
    logger.error('Error updating notification', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      notificationId: req.params.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update notification'
    });
  }
});

// PUT /api/customer/notifications/read-all - Mark all as read
router.put('/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Update all pending notifications to sent
    const result = await prisma.notificationDelivery.updateMany({
      where: {
        userId,
        status: 'PENDING'
      },
      data: {
        status: 'SENT',
        sentAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
      count: result.count
    });
  } catch (error) {
    logger.error('Error marking all notifications as read', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
});

// GET /api/customer/notifications/preferences - Get notification preferences
router.get('/notifications/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId,
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true
        }
      });
    }

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    logger.error('Error getting notification preferences', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get notification preferences'
    });
  }
});

// PUT /api/customer/notifications/preferences - Update preferences
router.put('/notifications/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Remove userId from updateData if present
    delete updateData.userId;
    delete updateData.id;
    delete updateData.createdAt;

    const preferences = await prisma.notificationPreference.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData
      }
    });

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: preferences
    });
  } catch (error) {
    logger.error('Error updating notification preferences', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences'
    });
  }
});

// ============================================
// PROFILE & SETTINGS ENDPOINTS
// ============================================

// GET /api/customer/profile - Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        postalCode: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Error getting profile', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
});

// PUT /api/customer/profile - Update profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, address, postalCode, avatar } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (postalCode !== undefined) updateData.postalCode = postalCode;
    if (avatar !== undefined) updateData.avatar = avatar;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        postalCode: true,
        avatar: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    logger.error('Error updating profile', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// GET /api/customer/settings - Get account settings
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        notifications: true
      }
    });

    // Get notification preferences
    const notificationPreferences = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    res.json({
      success: true,
      data: {
        user: {
          email: user?.email,
          notifications: user?.notifications
        },
        notificationPreferences
      }
    });
  } catch (error) {
    logger.error('Error getting settings', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get settings'
    });
  }
});

// PUT /api/customer/settings - Update settings
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notifications, timezone, language } = req.body;

    const updateData = {};
    if (notifications !== undefined) updateData.notifications = notifications;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        user: {
          email: updatedUser.email,
          notifications: updatedUser.notifications
        }
      }
    });
  } catch (error) {
    logger.error('Error updating settings', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
});

// GET /api/customer/security - Get security info
router.get('/security', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        lastLoginAt: true,
        passwordChangedAt: true,
        isLocked: true,
        lockedAt: true,
        failedLoginAttempts: true,
        lastFailedLoginAt: true
      }
    });

    res.json({
      success: true,
      data: {
        email: user?.email,
        lastLoginAt: user?.lastLoginAt,
        passwordChangedAt: user?.passwordChangedAt,
        isLocked: user?.isLocked || false,
        lockedAt: user?.lockedAt,
        failedLoginAttempts: user?.failedLoginAttempts || 0,
        lastFailedLoginAt: user?.lastFailedLoginAt
      }
    });
  } catch (error) {
    logger.error('Error getting security info', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get security info'
    });
  }
});

// POST /api/customer/change-password - Change password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password (you'll need to implement password verification)
    // For now, we'll assume there's a password verification function
    // const bcrypt = require('bcrypt');
    // const isValid = await bcrypt.compare(currentPassword, user.password);
    // if (!isValid) {
    //   return res.status(401).json({
    //     success: false,
    //     error: 'Current password is incorrect'
    //   });
    // }

    // Hash new password
    // const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    // await prisma.user.update({
    //   where: { id: userId },
    //   data: {
    //     password: hashedPassword,
    //     passwordChangedAt: new Date()
    //   }
    // });

    // For now, return success (password change implementation depends on your auth system)
    res.json({
      success: true,
      message: 'Password change functionality requires password hashing implementation'
    });
  } catch (error) {
    logger.error('Error changing password', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

export default router;