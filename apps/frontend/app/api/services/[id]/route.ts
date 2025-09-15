import { NextRequest, NextResponse } from 'next/server'

// Get service by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization')
    
    // Proxy the request to the Railway backend
    const railwayUrl = process.env.NEXT_PUBLIC_API_URL || 'https://cultured-account-production.up.railway.app/api'
    const response = await fetch(`${railwayUrl}/services/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Get service proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update service (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization')
    
    // Proxy the request to the Railway backend
    const railwayUrl = process.env.NEXT_PUBLIC_API_URL || 'https://cultured-account-production.up.railway.app/api'
    const response = await fetch(`${railwayUrl}/services/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
      body: JSON.stringify(body),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Update service proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete service (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization')
    
    // Proxy the request to the Railway backend
    const railwayUrl = process.env.NEXT_PUBLIC_API_URL || 'https://cultured-account-production.up.railway.app/api'
    const response = await fetch(`${railwayUrl}/services/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Delete service proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 