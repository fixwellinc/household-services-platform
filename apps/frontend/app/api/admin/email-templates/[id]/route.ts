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
  }
];

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    // Try to connect to backend first
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    
    try {
      const response = await fetch(`${backendUrl.replace(/\/$/, '')}/admin/email-templates/${id}`, {
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
    const template = mockTemplates.find(t => t.id === id)
    if (!template) {
      return NextResponse.json({ 
        success: false,
        error: 'Template not found' 
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      template
    })
  } catch (error) {
    console.error('Email template GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const payload = await request.json()
    
    // Try to connect to backend first
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    
    try {
      const response = await fetch(`${backendUrl.replace(/\/$/, '')}/admin/email-templates/${id}`, {
        method: 'PUT',
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
    const updatedTemplate = {
      id,
      ...payload,
      updatedAt: new Date().toISOString(),
      variables: payload.content ? extractVariables(payload.content) : []
    }
    
    return NextResponse.json({
      success: true,
      template: updatedTemplate,
      message: 'Template updated successfully (mock)'
    })
  } catch (error) {
    console.error('Email template PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    // Try to connect to backend first
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    
    try {
      const response = await fetch(`${backendUrl.replace(/\/$/, '')}/admin/email-templates/${id}`, {
        method: 'DELETE',
        headers: { 'Cookie': request.headers.get('cookie') || '' }
      })
      
      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
      }
    } catch (backendError) {
      console.log('Backend not available, using mock response:', backendError.message)
    }
    
    // Fallback to mock response
    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully (mock)'
    })
  } catch (error) {
    console.error('Email template DELETE error:', error)
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