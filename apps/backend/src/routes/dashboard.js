import express from 'express';
import prisma from '../config/database.js';
import { authMiddleware, requireCustomer } from '../middleware/auth.js';

const router = express.Router();

// Get customer dashboard data
router.get('/customer', authMiddleware, requireCustomer, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });
    
    // Define perks based on subscription tier
    const tierPerks = {
      'STARTER': { maxServicesPerMonth: 4, monthlyPrice: 21.99, yearlyPrice: 237.49, features: ["4 services/month", "Standard support"] },
      'HOMECARE': { maxServicesPerMonth: 8, monthlyPrice: 41.99, yearlyPrice: 453.49, features: ["8 services/month", "Priority support", "Discounted rates"] },
      'PRIORITY': { maxServicesPerMonth: 12, monthlyPrice: 61.99, yearlyPrice: 669.49, features: ["12 services/month", "24/7 dedicated support", "Exclusive discounts", "Emergency service"] }
    };
    
    // Get user's bookings with statistics
    const bookings = await prisma.booking.findMany({
      where: { customerId: userId },
      orderBy: { scheduledDate: 'desc' }
    });
    
    // Manually fetch service data for each booking
    const bookingsWithServices = await Promise.all(
      bookings.map(async (booking) => {
        const service = await prisma.service.findUnique({
          where: { id: booking.serviceId },
          select: {
            id: true,
            name: true,
            description: true,
            basePrice: true,
            category: true
          }
        });
        return { ...booking, service };
      })
    );
    
    // Calculate statistics
    const totalBookings = bookingsWithServices.length;
    const upcomingBookings = bookingsWithServices.filter(b => 
      ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status) && 
      new Date(b.scheduledDate) > new Date()
    ).length;
    const completedBookings = bookingsWithServices.filter(b => b.status === 'COMPLETED').length;
    
    // Get recent activity (last 5 bookings)
    const recentActivity = bookingsWithServices.slice(0, 5).map(booking => ({
      id: booking.id,
      service: booking.service?.name || 'Unknown Service',
      date: booking.scheduledDate,
      status: booking.status,
      amount: booking.finalAmount,
      provider: 'Fixwell Team' // In a real app, this would come from the service provider
    }));
    
    // Calculate usage statistics if user has subscription
    let usageStats = null;
    if (subscription && subscription.status === 'ACTIVE') {
      const plan = tierPerks[subscription.tier] || { maxServicesPerMonth: 4 };
      const usedPerks = bookingsWithServices.filter(b => b.status === 'COMPLETED').length;
      const totalPerks = plan.maxServicesPerMonth;
      const perksUsed = Math.min(usedPerks, totalPerks);
      
      usageStats = {
        perksUsed: perksUsed,
        totalPerks: totalPerks,
        remainingPerks: Math.max(0, totalPerks - perksUsed),
        savings: bookingsWithServices
          .filter(b => b.status === 'COMPLETED' && b.discountAmount)
          .reduce((sum, b) => sum + parseFloat(b.discountAmount || 0), 0)
      };
    }
    
    // Get available services for quick booking
    const availableServices = await prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        basePrice: true,
        category: true
      },
      take: 6
    });
    
    const dashboardData = {
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        tier: subscription.tier,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        plan: {
          id: subscription.tier,
          name: subscription.tier,
          monthlyPrice: tierPerks[subscription.tier]?.monthlyPrice || 0,
          yearlyPrice: tierPerks[subscription.tier]?.yearlyPrice || 0,
          features: tierPerks[subscription.tier]?.features || [],
          maxServicesPerMonth: tierPerks[subscription.tier]?.maxServicesPerMonth || 4
        }
      } : null,
      statistics: {
        totalBookings,
        upcomingBookings,
        completedBookings
      },
      usageStats,
      recentActivity,
      availableServices: availableServices.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        basePrice: service.basePrice,
        category: service.category
      }))
    };
    
    res.json(dashboardData);
  } catch (error) {
    next(error);
  }
});

export default router; 