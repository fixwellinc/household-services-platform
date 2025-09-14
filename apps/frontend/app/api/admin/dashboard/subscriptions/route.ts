import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const metric = url.searchParams.get('metric');

    if (metric === 'plan_distribution') {
      // Chart data for pie chart
      const mockChartData = [
        { date: 'Basic', count: 45, plan: 'Basic' },
        { date: 'Standard', count: 32, plan: 'Standard' },
        { date: 'Premium', count: 18, plan: 'Premium' },
        { date: 'Enterprise', count: 5, plan: 'Enterprise' }
      ];

      return NextResponse.json({ chartData: mockChartData });
    } else {
      // Table data for subscription list
      const mockSubscriptions = [
        {
          'Customer': 'John Smith',
          'Plan': 'Premium',
          'Status': 'Active',
          'Created': '2024-01-15',
          'Revenue': '$99.99'
        },
        {
          'Customer': 'Sarah Johnson',
          'Plan': 'Standard',
          'Status': 'Active',
          'Created': '2024-01-14',
          'Revenue': '$49.99'
        },
        {
          'Customer': 'Mike Wilson',
          'Plan': 'Basic',
          'Status': 'Cancelled',
          'Created': '2024-01-10',
          'Revenue': '$19.99'
        },
        {
          'Customer': 'Emily Davis',
          'Plan': 'Premium',
          'Status': 'Active',
          'Created': '2024-01-08',
          'Revenue': '$99.99'
        },
        {
          'Customer': 'Robert Brown',
          'Plan': 'Standard',
          'Status': 'Pending',
          'Created': '2024-01-05',
          'Revenue': '$49.99'
        }
      ];

      return NextResponse.json({
        headers: ['Customer', 'Plan', 'Status', 'Created', 'Revenue'],
        subscriptions: mockSubscriptions,
        totalCount: 156
      });
    }
  } catch (error) {
    console.error('Error fetching subscriptions dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions data' },
      { status: 500 }
    );
  }
}