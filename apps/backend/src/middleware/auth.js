import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

export const authMiddleware = async (req, res, next) => {
  try {
    // Check for token in Authorization header first
    let token = null;
    const authHeader = req.headers.authorization;
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Auth middleware debug:', {
        url: req.url,
        hasAuthHeader: !!authHeader,
        hasCookie: !!req.cookies?.auth_token,
      });
    }
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    } else {
      // Check for token in cookies
      token = req.cookies?.auth_token;
    }
    
    if (!token) {
      console.log('No token found, returning 401');
      return res.status(401).json({ error: 'Access token required' });
    }
    
    // CRITICAL: Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
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
        address: true,
        postalCode: true,
        createdAt: true
      }
    });
    
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Add user to request object
    req.user = user;
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
export const requireTechnician = requireRole(['TECHNICIAN']);
export const requireCustomerOrAdmin = requireRole(['CUSTOMER', 'ADMIN']);
export const requireTechnicianOrAdmin = requireRole(['TECHNICIAN', 'ADMIN']);

export default authMiddleware; 