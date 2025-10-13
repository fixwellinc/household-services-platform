import { NextRequest, NextResponse } from 'next/server';

// Update payment method (set as default)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ paymentMethodId: string }> }
) {
  try {
    const { paymentMethodId } = await params;

    // Get the auth token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const authToken = authHeader.replace('Bearer ', '');

    // Call your backend API
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const response = await fetch(`${backendUrl}/api/payments/methods/${paymentMethodId}`, {
      method: 'PUT',
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
    console.error('Payment method PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Remove payment method
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ paymentMethodId: string }> }
) {
  try {
    const { paymentMethodId } = await params;

    // Get the auth token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const authToken = authHeader.replace('Bearer ', '');

    // Call your backend API
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const response = await fetch(`${backendUrl}/api/payments/methods/${paymentMethodId}`, {
      method: 'DELETE',
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
    console.error('Payment method DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
