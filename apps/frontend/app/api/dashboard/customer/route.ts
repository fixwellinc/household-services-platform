import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }
    
    // Build the URL with query parameters
    const url = new URL(request.url)
    const railwayUrl = process.env.NEXT_PUBLIC_API_URL || 'https://cultured-account-production.up.railway.app/api'
    const targetUrl = `${railwayUrl}/customer-dashboard${url.search}`
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Get customer dashboard data proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 