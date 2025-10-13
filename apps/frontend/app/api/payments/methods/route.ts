import { NextRequest, NextResponse } from 'next/server';

// Get customer's payment methods
export async function GET(request: NextRequest) {
  try {
    // Get the auth token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const authToken = authHeader.replace('Bearer ', '');

    // Call your backend API
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const response = await fetch(`${backendUrl}/api/payments/methods`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Backend request failed' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Payment methods GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Add new payment method
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentMethodId } = body;

    // Get the auth token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const authToken = authHeader.replace('Bearer ', '');

    // Call your backend API
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const response = await fetch(`${backendUrl}/api/payments/methods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ paymentMethodId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Backend request failed' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Payment methods POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
