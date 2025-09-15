import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering since we access request headers
export const dynamic = 'force-dynamic'

// Get churn algorithm configuration (admin)
export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/admin/subscriptions/churn-algorithm/config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch algorithm config' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin churn algorithm config GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update churn algorithm configuration (admin)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/admin/subscriptions/churn-algorithm/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to update algorithm config' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin churn algorithm config PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}