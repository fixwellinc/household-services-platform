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
    const metric = searchParams.get('metric') || 'active_count';
    const period = searchParams.get('period') || '30d';

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
        return NextResponse.json({ error: 'Invalid metric' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin dashboard bookings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}