import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

// Define role-based route access
const roleRoutes = [
  { path: '/admin', role: 'ADMIN' },
  { path: '/dashboard', role: 'ADMIN' }, // Only admin can access /dashboard
  { path: '/customer', role: 'CUSTOMER' },
  { path: '/settings', role: ['ADMIN', 'CUSTOMER'] },
  { path: '/profile', role: ['CUSTOMER'] },
  { path: '/bookings', role: ['CUSTOMER', 'ADMIN'] },
  { path: '/payments', role: ['CUSTOMER'] },
  { path: '/support', role: ['CUSTOMER'] },
];

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/about',
  '/contact',
  '/pricing',
  '/pricing/subscribe',
  '/welcome',
  '/blog',
  '/test-api',
  '/services',
];

function getRequiredRole(pathname: string): string | string[] | null {
  // Check if it's a public route first
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return null;
  }
  
  // Find the first matching route
  for (const route of roleRoutes) {
    if (pathname.startsWith(route.path)) {
      return route.role;
    }
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requiredRole = getRequiredRole(pathname);
  
  if (!requiredRole) {
    // No role restriction for this route
    return NextResponse.next();
  }

  // Check for token in cookies first, then try to get from Authorization header
  let token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    // Check Authorization header (for API requests)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    // Not logged in, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  let userRole: string | undefined;
  try {
    const decoded = jwtDecode(token);
    if (typeof decoded === 'object' && decoded !== null && 'role' in decoded && typeof decoded.role === 'string') {
      userRole = decoded.role;
    }
  } catch {
    // Invalid token, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check if userRole matches requiredRole
  if (Array.isArray(requiredRole)) {
    if (!userRole || !requiredRole.includes(userRole)) {
      // Redirect to their dashboard
      return NextResponse.redirect(new URL(getDashboardForRole(userRole), request.url));
    }
  } else {
    if (!userRole || userRole !== requiredRole) {
      // Redirect to their dashboard
      return NextResponse.redirect(new URL(getDashboardForRole(userRole), request.url));
    }
  }

  return NextResponse.next();
}

function getDashboardForRole(role: string | undefined): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'CUSTOMER':
      return '/services';
    default:
      return '/login';
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/customer/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/bookings/:path*',
    '/payments/:path*',
    '/support/:path*',
    '/services/:path*',
  ],
}; 