import { NextRequest, NextResponse } from 'next/server'

// Get all services with optional filtering
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization')
    
    // Build the URL with query parameters
    const url = new URL(request.url)
    // Use BACKEND_URL or NEXT_PUBLIC_API_URL, fallback to Render URL
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://fixwell.onrender.com/api'
    const targetUrl = `${backendUrl.replace(/\/api$/, '')}/services${url.search}`
    
    // Add timeout to prevent hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout
    
    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader && { 'Authorization': authHeader }),
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch services' }))
        return NextResponse.json(errorData, { status: response.status })
      }
      
      const data = await response.json()
      
      // Ensure services array exists
      if (!data.services || !Array.isArray(data.services)) {
        return NextResponse.json({ services: [] })
      }
      
      return NextResponse.json(data)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        console.error('Services API request timeout')
        return NextResponse.json(
          { error: 'Request timeout', services: [] },
          { status: 504 }
        )
      }
      throw fetchError
    }
  } catch (error: any) {
    console.error('Get services proxy error:', error)
    // Return empty services array instead of error to prevent page breakage
    return NextResponse.json(
      { services: [], error: 'Failed to load services' },
      { status: 500 }
    )
  }
}

// Create new service (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization')
    
    // Proxy the request to the Railway backend
    const railwayUrl = process.env.NEXT_PUBLIC_API_URL || 'https://cultured-account-production.up.railway.app/api'
    const response = await fetch(`${railwayUrl}/services`, {
      method: 'POST',
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
    
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Create service proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 