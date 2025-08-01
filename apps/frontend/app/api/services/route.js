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

// GET all services
export async function GET(_request) {
  try {
    const { searchParams } = new URL(_request.url);
    const category = searchParams.get('category');
    const complexity = searchParams.get('complexity');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const isActive = searchParams.get('isActive');
    
    const where = {
      isActive: isActive !== 'false', // Default to active services
      ...(category && { category }),
      ...(complexity && { complexity }),
      ...(minPrice && { basePrice: { gte: parseFloat(minPrice) } }),
      ...(maxPrice && { basePrice: { lte: parseFloat(maxPrice) } })
    };
    
    const services = await prisma.service.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ services });
  } catch {
    console.error('Get services error: Unknown error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST new service (admin only)
export async function POST(request) {
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
    
    const { name, description, category, complexity, basePrice } = await request.json();
    
    // Validation
    if (!name || !description || !category || !complexity || !basePrice) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    if (!['CLEANING', 'MAINTENANCE', 'REPAIR', 'ORGANIZATION', 'OTHER'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }
    
    if (!['SIMPLE', 'MODERATE', 'COMPLEX'].includes(complexity)) {
      return NextResponse.json(
        { error: 'Invalid complexity level' },
        { status: 400 }
      );
    }
    
    if (basePrice <= 0) {
      return NextResponse.json(
        { error: 'Base price must be greater than 0' },
        { status: 400 }
      );
    }
    
    const service = await prisma.service.create({
      data: {
        name,
        description,
        category,
        complexity,
        basePrice: parseFloat(basePrice)
      },
    });
    
    return NextResponse.json({ service }, { status: 201 });
  } catch {
    console.error('Create service error: Unknown error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 