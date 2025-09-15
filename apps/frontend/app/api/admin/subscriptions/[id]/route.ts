import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering since we access request headers
export const dynamic = 'force-dynamic'

// Get subscription details (admin)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/admin/subscriptions/${params.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch subscription' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin subscription GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update subscription (admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/admin/subscriptions/${params.id}`, {
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
        { error: errorData.error || 'Failed to update subscription' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin subscription PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}