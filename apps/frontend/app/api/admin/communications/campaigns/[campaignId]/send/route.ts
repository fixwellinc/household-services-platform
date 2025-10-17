import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export async function POST(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/communications/campaigns/${params.campaignId}/send`, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error sending campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send campaign' },
      { status: 500 }
    );
  }
}