import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Mock data for testing
const mockTemplates = [
  {
    id: '1',
    name: 'Welcome Email',
    subject: 'Welcome to Fixwell Services!',
    content: '<h1>Welcome {{customerName}}!</h1><p>Thank you for choosing our services.</p>',
    type: 'welcome',
    category: 'transactional',
    isActive: true,
    variables: ['customerName'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
    usageCount: 15
  },
  {
    id: '2',
    name: 'Booking Confirmation',
    subject: 'Your booking has been confirmed',
    content: '<h2>Booking Confirmed</h2><p>Dear {{customerName}}, your {{serviceType}} appointment is scheduled for {{appointmentDate}}.</p>',
    type: 'booking_confirmation',
    category: 'transactional',
    isActive: true,
    variables: ['customerName', 'serviceType', 'appointmentDate'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
    usageCount: 8
  },
  {
    id: '3',
    name: 'Payment Receipt',
    subject: 'Payment Receipt - {{serviceType}}',
    content: '<h2>Payment Receipt</h2><p>Thank you for your payment of ${{amount}} for {{serviceType}}.</p>',
    type: 'payment_receipt',
    category: 'transactional',
    isActive: true,
    variables: ['serviceType', 'amount'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
    usageCount: 23
  }
];

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
  }
];

export async function GET(request: NextRequest) {
  try {
    // Try to connect to backend first
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    
    try {
      const response = await fetch(`${backendUrl.replace(/\/$/, '')}/admin/email-templates`, {
        headers: { 'Cookie': request.headers.get('cookie') || '' }
      })
      
      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
      }
    } catch (backendError) {
      console.log('Backend not available, using mock data:', backendError.message)
    }
    
    // Fallback to mock data
    return NextResponse.json({
      success: true,
      templates: mockTemplates
    })
  } catch (error) {
    console.error('Email templates GET error:', error)
    return NextResponse.json({ 
      success: true,
      templates: mockTemplates 
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    
    // Try to connect to backend first
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    
    try {
      const response = await fetch(`${backendUrl.replace(/\/$/, '')}/admin/email-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': request.headers.get('cookie') || '' },
        body: JSON.stringify(payload)
      })
      
      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
      }
    } catch (backendError) {
      console.log('Backend not available, using mock response:', backendError.message)
    }
    
    // Fallback to mock response
    const newTemplate = {
      id: Date.now().toString(),
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      usageCount: 0,
      variables: payload.content ? extractVariables(payload.content) : []
    }
    
    return NextResponse.json({
      success: true,
      template: newTemplate,
      message: 'Template created successfully (mock)'
    })
  } catch (error) {
    console.error('Email templates POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to extract variables from content
function extractVariables(content: string): string[] {
  if (!content) return [];
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = variableRegex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
}