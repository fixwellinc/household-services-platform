import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering since we access request headers
export const dynamic = 'force-dynamic'

// Get all billing adjustments (admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const url = `${backendUrl}/api/admin/subscriptions/billing-adjustments${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch billing adjustments' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin billing adjustments GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}