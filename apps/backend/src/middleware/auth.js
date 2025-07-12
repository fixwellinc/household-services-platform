import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authMiddleware = async (req, res, next) => {
  try {
    // Check for token in Authorization header first
    let token = null;
    const authHeader = req.headers.authorization;
    
    console.log('Auth middleware debug:', {
      url: req.url,
      authHeader: authHeader,
      cookies: req.cookies,
      hasAuthHeader: !!authHeader,
      authHeaderStartsWithBearer: authHeader?.startsWith('Bearer ')
    });
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('Token from Authorization header:', token ? `${token.substring(0, 20)}...` : 'null');
    } else {
      // Check for token in cookies
      token = req.cookies?.auth_token;
      console.log('Token from cookies:', token ? `${token.substring(0, 20)}...` : 'null');
    }
    
    if (!token) {
      console.log('No token found, returning 401');
      return res.status(401).json({ error: 'Access token required' });
    }
    
    // CRITICAL: Verify JWT token
    console.log('Verifying token with JWT_SECRET length:', process.env.JWT_SECRET?.length);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', { userId: decoded.userId, email: decoded.email });
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        address: true
      }
    });
    
    console.log('User found in database:', user ? { id: user.id, email: user.email, role: user.role } : 'null');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Add user to request object
    req.user = user;
    console.log('User added to request:', { id: req.user.id, email: req.user.email, role: req.user.role });
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Role-based access control middleware
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Specific role middlewares
export const requireCustomer = requireRole(['CUSTOMER']);
export const requireAdmin = requireRole(['ADMIN']);
export const requireCustomerOrAdmin = requireRole(['CUSTOMER', 'ADMIN']);

export default authMiddleware; 