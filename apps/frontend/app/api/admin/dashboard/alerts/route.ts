import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock data - in real implementation, this would query the database
    const mockAlerts = [
      {
        id: 'alert-1',
        message: 'High CPU usage detected on server-01',
        severity: 'high',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        acknowledged: false
      },
      {
        id: 'alert-2',
        message: 'Database connection pool near capacity',
        severity: 'medium',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        acknowledged: false
      },
      {
        id: 'alert-3',
        message: 'Backup completed successfully',
        severity: 'low',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        acknowledged: true
      },
      {
        id: 'alert-4',
        message: 'Payment gateway response time increased',
        severity: 'medium',
        timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        acknowledged: false
      },
      {
        id: 'alert-5',
        message: 'Disk space usage above 85% on storage server',
        severity: 'critical',
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        acknowledged: false
      }
    ];

    return NextResponse.json({ alerts: mockAlerts });
  } catch (error) {
    console.error('Error fetching alerts dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts data' },
      { status: 500 }
    );
  }
}