import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Proxy the request to the Railway backend
    const railwayUrl = process.env.NEXT_PUBLIC_API_URL || 'https://cultured-account-production.up.railway.app/api'
    const response = await fetch(`${railwayUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Health check proxy error:', error)
    return NextResponse.json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
} 