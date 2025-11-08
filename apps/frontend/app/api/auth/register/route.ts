import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Determine backend URL - use local backend if unified server, otherwise use configured URL
    const isUnifiedServer = process.env.UNIFIED_SERVER === 'true' || !process.env.NEXT_PUBLIC_API_URL
    const backendUrl = isUnifiedServer 
      ? `http://localhost:${process.env.PORT || 3000}/api`
      : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api')
    const response = await fetch(`${backendUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }
    
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Registration proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 