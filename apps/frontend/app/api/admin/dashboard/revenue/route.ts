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
    const metric = searchParams.get('metric') || 'total';
    const unit = searchParams.get('unit') || 'currency';
    const period = searchParams.get('period') || '30d';

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
          value: growthRate, 
          label: `Revenue Growth (${period})`,
          current,
          previous,
          unit: 'percentage'
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid metric' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin dashboard revenue error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}