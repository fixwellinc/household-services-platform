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
    // Return mock data directly since backend doesn't have campaigns endpoint yet
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
