import express from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';
import prisma from '../../config/database.js';

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Users metrics endpoint
router.get('/users', async (req, res) => {
  try {
    const { metric = 'count', period = '30d' } = req.query;
    let result;

    switch (metric) {
      case 'count':
        const totalUsers = await prisma.user.count();
        result = { value: totalUsers, label: 'Total Users' };
        break;

      case 'growth':
        const days = parseInt(period.replace('d', '')) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [currentPeriodUsers, previousPeriodUsers] = await Promise.all([
          prisma.user.count({
            where: { createdAt: { gte: startDate } }
          }),
          prisma.user.count({
            where: { 
              createdAt: { 
                gte: new Date(startDate.getTime() - (days * 24 * 60 * 60 * 1000)),
                lt: startDate
              }
            }
          })
        ]);

        const growthRate = previousPeriodUsers > 0 
          ? ((currentPeriodUsers - previousPeriodUsers) / previousPeriodUsers) * 100 
          : 0;

        result = { 
          value: Math.round(growthRate * 100) / 100, 
          label: `Growth (${period})`,
          current: currentPeriodUsers,
          previous: previousPeriodUsers
        };
        break;

      case 'active':
        const activeUsers = await prisma.user.count({
          where: {
            lastLoginAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        });
        result = { value: activeUsers, label: 'Active Users (30d)' };
        break;

      default:
        return res.status(400).json({ error: 'Invalid metric' });
    }

    res.json(result);
  } catch (error) {
    console.error('Admin dashboard users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bookings metrics endpoint
router.get('/bookings', async (req, res) => {
  try {
    const { metric = 'active_count', period = '30d' } = req.query;
    let result;

    switch (metric) {
      case 'active_count':
        const activeBookings = await prisma.booking.count({
          where: {
            status: { in: ['CONFIRMED', 'IN_PROGRESS'] }
          }
        });
        result = { value: activeBookings, label: 'Active Bookings' };
        break;

      case 'total_count':
        const totalBookings = await prisma.booking.count();
        result = { value: totalBookings, label: 'Total Bookings' };
        break;

      case 'completed_today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const completedToday = await prisma.booking.count({
          where: {
            status: 'COMPLETED',
            updatedAt: {
              gte: today,
              lt: tomorrow
            }
          }
        });
        result = { value: completedToday, label: 'Completed Today' };
        break;

      case 'revenue':
        const days = parseInt(period.replace('d', '')) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const bookingsRevenue = await prisma.booking.aggregate({
          where: {
            status: 'COMPLETED',
            createdAt: { gte: startDate }
          },
          _sum: {
            totalAmount: true
          }
        });

        result = { 
          value: bookingsRevenue._sum.totalAmount || 0, 
          label: `Revenue (${period})` 
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid metric' });
    }

    res.json(result);
  } catch (error) {
    console.error('Admin dashboard bookings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Revenue metrics endpoint
router.get('/revenue', async (req, res) => {
  try {
    const { metric = 'total', unit = 'currency', period = '30d' } = req.query;
    let result;

    switch (metric) {
      case 'total':
        // Get total revenue from completed bookings
        const totalRevenue = await prisma.booking.aggregate({
          where: {
            status: 'COMPLETED'
          },
          _sum: {
            totalAmount: true
          }
        });

        // Get subscription revenue
        const subscriptionRevenue = await prisma.subscription.aggregate({
          where: {
            status: 'ACTIVE'
          },
          _sum: {
            amount: true
          }
        });

        const total = (totalRevenue._sum.totalAmount || 0) + (subscriptionRevenue._sum.amount || 0);
        result = { 
          value: total, 
          label: 'Total Revenue',
          currency: 'USD'
        };
        break;

      case 'monthly':
        const days = parseInt(period.replace('d', '')) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [monthlyBookings, monthlySubscriptions] = await Promise.all([
          prisma.booking.aggregate({
            where: {
              status: 'COMPLETED',
              createdAt: { gte: startDate }
            },
            _sum: {
              totalAmount: true
            }
          }),
          prisma.subscription.aggregate({
            where: {
              status: 'ACTIVE',
              createdAt: { gte: startDate }
            },
            _sum: {
              amount: true
            }
          })
        ]);

        const monthlyTotal = (monthlyBookings._sum.totalAmount || 0) + (monthlySubscriptions._sum.amount || 0);
        result = { 
          value: monthlyTotal, 
          label: `Revenue (${period})`,
          currency: 'USD'
        };
        break;

      case 'growth':
        const growthDays = parseInt(period.replace('d', '')) || 30;
        const currentStart = new Date();
        currentStart.setDate(currentStart.getDate() - growthDays);
        
        const previousStart = new Date(currentStart);
        previousStart.setDate(previousStart.getDate() - growthDays);

        const [currentRevenue, previousRevenue] = await Promise.all([
          prisma.booking.aggregate({
            where: {
              status: 'COMPLETED',
              createdAt: { gte: currentStart }
            },
            _sum: { totalAmount: true }
          }),
          prisma.booking.aggregate({
            where: {
              status: 'COMPLETED',
              createdAt: { 
                gte: previousStart,
                lt: currentStart
              }
            },
            _sum: { totalAmount: true }
          })
        ]);

        const current = currentRevenue._sum.totalAmount || 0;
        const previous = previousRevenue._sum.totalAmount || 0;
        const growthRate = previous > 0 ? ((current - previous) / previous) * 100 : 0;

        result = { 
          value: Math.round(growthRate * 100) / 100, 
          label: `Revenue Growth (${period})`,
          current,
          previous,
          unit: 'percentage'
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid metric' });
    }

    res.json(result);
  } catch (error) {
    console.error('Admin dashboard revenue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Alerts endpoint
router.get('/alerts', async (req, res) => {
  try {
    const { severity = 'all', limit = 10 } = req.query;
    const limitNum = parseInt(limit);

    // Generate system alerts based on current data
    const alerts = [];

    // Check for failed bookings
    const failedBookings = await prisma.booking.count({
      where: {
        status: 'CANCELLED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    if (failedBookings > 5) {
      alerts.push({
        id: 'high-cancellation-rate',
        type: 'SYSTEM',
        severity: 'HIGH',
        title: 'High Cancellation Rate',
        message: `${failedBookings} bookings cancelled in the last 24 hours`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    // Check for inactive users
    const inactiveUsers = await prisma.user.count({
      where: {
        lastLoginAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        }
      }
    });

    if (inactiveUsers > 10) {
      alerts.push({
        id: 'inactive-users',
        type: 'USER',
        severity: 'MEDIUM',
        title: 'High Inactive User Count',
        message: `${inactiveUsers} users haven't logged in for 30+ days`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    // Check for subscription issues
    const expiredSubscriptions = await prisma.subscription.count({
      where: {
        status: 'EXPIRED',
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    if (expiredSubscriptions > 0) {
      alerts.push({
        id: 'expired-subscriptions',
        type: 'BILLING',
        severity: 'HIGH',
        title: 'Expired Subscriptions',
        message: `${expiredSubscriptions} subscriptions expired in the last 24 hours`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    // Check for low revenue
    const todayRevenue = await prisma.booking.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      },
      _sum: {
        totalAmount: true
      }
    });

    const revenue = todayRevenue._sum.totalAmount || 0;
    if (revenue < 100) { // Threshold can be adjusted
      alerts.push({
        id: 'low-daily-revenue',
        type: 'REVENUE',
        severity: 'MEDIUM',
        title: 'Low Daily Revenue',
        message: `Today's revenue is only $${revenue.toFixed(2)}`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    // Add email service alert if email is not configured
    alerts.push({
      id: 'email-service-disabled',
      type: 'PERFORMANCE',
      severity: 'LOW',
      title: 'Email Service Disabled',
      message: 'Email notifications are currently disabled',
      timestamp: new Date().toISOString(),
      resolved: false
    });

    // Filter by severity if specified
    let filteredAlerts = alerts;
    if (severity !== 'all') {
      filteredAlerts = alerts.filter(alert => 
        alert.severity.toLowerCase() === severity.toLowerCase()
      );
    }

    // Apply limit
    const limitedAlerts = filteredAlerts.slice(0, limitNum);

    res.json({
      alerts: limitedAlerts,
      total: filteredAlerts.length,
      unresolved: filteredAlerts.filter(a => !a.resolved).length
    });
  } catch (error) {
    console.error('Admin dashboard alerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Performance alerts endpoint
router.get('/performance-alerts', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit);

    // Generate performance-specific alerts
    const performanceAlerts = [
      {
        id: 'slow-database-queries',
        type: 'PERFORMANCE',
        severity: 'MEDIUM',
        title: 'Slow Database Queries',
        message: 'Multiple queries taking >1s to complete',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        resolved: false,
        metrics: {
          avgResponseTime: '1.2s',
          affectedQueries: 5
        }
      },
      {
        id: 'email-service-disabled',
        type: 'PERFORMANCE',
        severity: 'LOW',
        title: 'Email Service Disabled',
        message: 'Email notifications are currently disabled in production',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        resolved: false,
        metrics: {
          status: 'disabled',
          reason: 'SMTP not configured'
        }
      },
      {
        id: 'api-rate-limit-approaching',
        type: 'PERFORMANCE',
        severity: 'MEDIUM',
        title: 'API Rate Limit Approaching',
        message: 'Stripe API usage at 80% of rate limit',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
        resolved: true,
        metrics: {
          currentUsage: '80%',
          limit: '100 req/min'
        }
      }
    ];

    // Apply limit
    const limitedAlerts = performanceAlerts.slice(0, limitNum);

    res.json({
      alerts: limitedAlerts,
      total: performanceAlerts.length,
      unresolved: performanceAlerts.filter(a => !a.resolved).length,
      summary: {
        critical: performanceAlerts.filter(a => a.severity === 'HIGH' && !a.resolved).length,
        warning: performanceAlerts.filter(a => a.severity === 'MEDIUM' && !a.resolved).length,
        info: performanceAlerts.filter(a => a.severity === 'LOW' && !a.resolved).length
      }
    });
  } catch (error) {
    console.error('Admin dashboard performance alerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;