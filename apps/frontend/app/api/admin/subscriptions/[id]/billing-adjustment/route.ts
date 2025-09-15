import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering since we access request headers
export const dynamic = 'force-dynamic'

// Create billing adjustment (admin)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/admin/subscriptions/${params.id}/billing-adjustment`, {
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
        { error: errorData.error || 'Failed to create billing adjustment' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin billing adjustment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}