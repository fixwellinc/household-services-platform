import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering since we access request headers
export const dynamic = 'force-dynamic'

// Launch retention campaign (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/admin/subscriptions/retention-campaign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to launch retention campaign' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin retention campaign error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}