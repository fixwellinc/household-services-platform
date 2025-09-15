import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');

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

    // Add a sample performance alert
    alerts.push({
      id: 'email-service-timeout',
      type: 'PERFORMANCE',
      severity: 'LOW',
      title: 'Email Service Timeout',
      message: 'Email service experiencing connection timeouts',
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
    const limitedAlerts = filteredAlerts.slice(0, limit);

    return NextResponse.json({
      alerts: limitedAlerts,
      total: filteredAlerts.length,
      unresolved: filteredAlerts.filter(a => !a.resolved).length
    });
  } catch (error) {
    console.error('Admin dashboard alerts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}