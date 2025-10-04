import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Mock campaigns data
const mockCampaigns = [
  {
    id: '1',
    name: 'Monthly Newsletter',
    templateId: '1',
    subject: 'Monthly Newsletter - {{month}}',
    recipients: 1250,
    sent: 1250,
    opened: 456,
    clicked: 89,
    status: 'sent',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Service Promotion',
    templateId: '2',
    subject: 'Special Offer - {{serviceType}}',
    recipients: 500,
    sent: 500,
    opened: 234,
    clicked: 45,
    status: 'sent',
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Welcome Series',
    templateId: '1',
    subject: 'Welcome to Fixwell Services!',
    recipients: 200,
    sent: 200,
    opened: 156,
    clicked: 34,
    status: 'sent',
    createdAt: new Date().toISOString()
  }
];

export async function GET(request: NextRequest) {
  try {
    // Try to connect to backend first
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    
    try {
      const response = await fetch(`${backendUrl.replace(/\/$/, '')}/admin/email-templates/campaigns`, {
        headers: { 'Cookie': request.headers.get('cookie') || '' }
      })
      
      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
      }
    } catch (backendError) {
      console.log('Backend not available, using mock campaigns data:', backendError.message)
    }
    
    // Fallback to mock data
    return NextResponse.json({
      success: true,
      campaigns: mockCampaigns
    })
  } catch (error) {
    console.error('Email campaigns GET error:', error)
    return NextResponse.json({ 
      success: true,
      campaigns: mockCampaigns 
    })
  }
}
