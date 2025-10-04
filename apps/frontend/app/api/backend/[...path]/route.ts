import { NextRequest, NextResponse } from 'next/server';

// This route will handle all backend API calls
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params;
  const path = pathArray.join('/');
  
  try {
    const base = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const backendBase = base.replace(/\/$/, '');
    
    // Get headers from the request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('cookie') || '',
    };
    
    // Add Authorization header if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(`${backendBase}/${path}`, {
      method: 'GET',
      headers,
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Backend proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params;
  const path = pathArray.join('/');
  const body = await request.json();
  
  try {
    const base = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const backendBase = base.replace(/\/$/, '');
    
    // Get headers from the request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('cookie') || '',
    };
    
    // Add Authorization header if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(`${backendBase}/${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Backend proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params;
  const path = pathArray.join('/');
  const body = await request.json();
  
  try {
    const base = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const backendBase = base.replace(/\/$/, '');
    
    // Get headers from the request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('cookie') || '',
    };
    
    // Add Authorization header if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(`${backendBase}/${path}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Backend proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params;
  const path = pathArray.join('/');
  const body = await request.json();
  
  try {
    const base = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const backendBase = base.replace(/\/$/, '');
    
    // Get headers from the request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('cookie') || '',
    };
    
    // Add Authorization header if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(`${backendBase}/${path}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Backend proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params;
  const path = pathArray.join('/');
  
  try {
    const base = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const backendBase = base.replace(/\/$/, '');
    
    // Get headers from the request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('cookie') || '',
    };
    
    // Add Authorization header if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(`${backendBase}/${path}`, {
      method: 'DELETE',
      headers,
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Backend proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 