import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
    const response = await fetch(`${backendUrl.replace(/\/$/, '')}/admin/email-templates`, {
      headers: { 'Cookie': request.headers.get('cookie') || '' }
    })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Email templates GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
    const response = await fetch(`${backendUrl.replace(/\/$/, '')}/admin/email-templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': request.headers.get('cookie') || '' },
      body: JSON.stringify(payload)
    })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Email templates POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


