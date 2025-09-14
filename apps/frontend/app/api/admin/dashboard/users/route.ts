import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock data - in real implementation, this would query the database
    const mockData = {
      count: 1250,
      previousCount: 1150,
      trend: 'up' as const,
      growth: 8.7,
      target: 1500,
      newToday: 12,
      activeToday: 89
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error fetching user dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}