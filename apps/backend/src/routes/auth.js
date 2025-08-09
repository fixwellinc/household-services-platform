import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { ValidationError } from '../middleware/error.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, role = 'CUSTOMER' } = req.body;
    
    // Validation
    if (!email || !password || !name) {
      throw new ValidationError('Email, password, and name are required');
    }
    
    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }
    
    if (role !== 'CUSTOMER') {
      throw new ValidationError('Only customer registration is allowed');
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }
    
    // CRITICAL: Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Set secure auth cookie for middleware and SSR
    res.cookie('auth_token', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    
    res.status(201).json({
      message: 'User created successfully',
      user,
      token
    });
  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true
      }
    });
    
    if (!user) {
      throw new ValidationError('Invalid credentials');
    }
    
    // CRITICAL: Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new ValidationError('Invalid credentials');
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Set secure auth cookie for middleware and SSR
    res.cookie('auth_token', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  res.json({
    user: req.user
  });
});

// Logout (clear token and cookie)
router.post('/logout', authMiddleware, async (req, res) => {
  // Clear the auth token cookie
  res.clearCookie('auth_token', {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  });
  
  res.json({
    message: 'Logout successful'
  });
});

export default router; 