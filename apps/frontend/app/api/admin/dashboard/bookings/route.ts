import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock data - in real implementation, this would query the database
    const mockData = {
      activeCount: 89,
      previousActiveCount: 92,
      trend: 'down' as const,
      pendingCount: 15,
      completedToday: 8,
      cancelledToday: 2
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error fetching bookings dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings data' },
      { status: 500 }
    );
  }
}