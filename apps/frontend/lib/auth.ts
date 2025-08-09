import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './database'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    role: string
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: string, email: string, role: string): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not configured')
  }
  
  return jwt.sign(
    { userId, email, role },
    secret,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): { userId: string; email: string; role: string } | null {
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET is not configured')
    }
    
    const decoded = jwt.verify(token, secret) as { userId: string; email: string; role: string }
    return decoded
  } catch {
    return null
  }
}

export async function authenticateUser(request: NextRequest): Promise<AuthenticatedRequest> {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value

  if (!token) {
    return request as AuthenticatedRequest
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return request as AuthenticatedRequest
  }

  // Verify user still exists in database
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, role: true }
  })

  if (!user) {
    return request as AuthenticatedRequest
  }

  (request as AuthenticatedRequest).user = user
  return request as AuthenticatedRequest
}

export function requireAuth<T = any>(handler: (req: AuthenticatedRequest, context?: T) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: T) => {
    const authenticatedRequest = await authenticateUser(request)
    
    if (!authenticatedRequest.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return handler(authenticatedRequest, context)
  }
}

export function requireAdmin<T = any>(handler: (req: AuthenticatedRequest, context?: T) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: T) => {
    const authenticatedRequest = await authenticateUser(request)
    
    if (!authenticatedRequest.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (authenticatedRequest.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    return handler(authenticatedRequest, context)
  }
} 