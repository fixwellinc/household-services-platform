import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock data - in real implementation, this would query the database
    const mockData = {
      total: 45600,
      previousTotal: 40800,
      trend: 'up' as const,
      growth: 11.8,
      target: 50000,
      todayRevenue: 1250,
      monthlyRecurring: 38400
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error fetching revenue dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    );
  }
}