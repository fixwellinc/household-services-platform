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
    const metric = searchParams.get('metric') || 'count';
    const period = searchParams.get('period') || '30d';

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
          value: growthRate, 
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
        return NextResponse.json({ error: 'Invalid metric' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin dashboard users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}