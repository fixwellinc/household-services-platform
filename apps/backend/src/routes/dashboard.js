import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireCustomer } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get customer dashboard data
router.get('/customer', authMiddleware, requireCustomer, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: {
        plan: true
      }
    });
    
    // Get user's bookings with statistics
    const bookings = await prisma.booking.findMany({
      where: { customerId: userId },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            basePrice: true,
            category: true
          }
        }
      },
      orderBy: { scheduledDate: 'desc' }
    });
    
    // Calculate statistics
    const totalBookings = bookings.length;
    const upcomingBookings = bookings.filter(b => 
      ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status) && 
      new Date(b.scheduledDate) > new Date()
    ).length;
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;
    const totalSpent = bookings
      .filter(b => b.status === 'COMPLETED')
      .reduce((sum, b) => sum + parseFloat(b.finalAmount || 0), 0);
    
    // Get recent activity (last 5 bookings)
    const recentActivity = bookings.slice(0, 5).map(booking => ({
      id: booking.id,
      service: booking.service.name,
      date: booking.scheduledDate,
      status: booking.status,
      amount: booking.finalAmount,
      provider: 'Fixwell Team' // In a real app, this would come from the service provider
    }));
    
    // Calculate usage statistics if user has subscription
    let usageStats = null;
    if (subscription && subscription.status === 'ACTIVE') {
      const plan = subscription.plan;
      const usedPerks = bookings.filter(b => b.status === 'COMPLETED').length;
      const totalPerks = plan.maxServicesPerMonth || 12;
      const perksUsed = Math.min(usedPerks, totalPerks);
      
      usageStats = {
        perksUsed: perksUsed,
        totalPerks: totalPerks,
        remainingPerks: Math.max(0, totalPerks - perksUsed),
        savings: bookings
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
        plan: subscription.plan
      } : null,
      statistics: {
        totalBookings,
        upcomingBookings,
        completedBookings,
        totalSpent: parseFloat(totalSpent.toFixed(2))
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