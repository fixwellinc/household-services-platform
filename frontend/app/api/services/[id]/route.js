import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Helper function to get user from token
async function getUserFromToken(request) {
  try {
    let token = null;
    const authHeader = request.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = request.cookies.get('auth_token')?.value;
    }
    
    if (!token) {
      return null;
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
    
    return user;
  } catch {
    return null;
  }
}

// GET service by ID
export async function GET(_request, { params }) {
  try {
    const { id } = params;
    
    const service = await prisma.service.findUnique({ where: { id } });
    
    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ service });
  } catch {
    console.error('Get service error: Unknown error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update service (admin only)
export async function PUT(request, { params }) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const { id } = params;
    const { name, description, category, complexity, basePrice, isActive } = await request.json();
    
    // Check if service exists
    const existingService = await prisma.service.findUnique({ where: { id } });
    
    if (!existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }
    
    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(category && { category }),
        ...(complexity && { complexity }),
        ...(basePrice && { basePrice: parseFloat(basePrice) }),
        ...(typeof isActive === 'boolean' && { isActive })
      },
    });
    
    return NextResponse.json({ service });
  } catch {
    console.error('Update service error: Unknown error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE service (admin only)
export async function DELETE(request, { params }) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const { id } = params;
    
    // Check if service exists
    const existingService = await prisma.service.findUnique({ where: { id } });
    
    if (!existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }
    
    await prisma.service.delete({ where: { id } });
    
    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch {
    console.error('Delete service error: Unknown error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 