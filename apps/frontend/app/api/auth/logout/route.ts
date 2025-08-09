import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization')
    
    // Proxy the request to the Railway backend
    const railwayUrl = process.env.NEXT_PUBLIC_API_URL || 'https://cultured-account-production.up.railway.app/api'
    const response = await fetch(`${railwayUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }
    
    // Create response and clear the auth cookie
    const nextResponse = NextResponse.json(data)
    nextResponse.cookies.set('auth_token', '', {
      httpOnly: false,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0 // Expire immediately
    })
    
    return nextResponse
  } catch (error) {
    console.error('Logout proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 