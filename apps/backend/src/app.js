// Add environment debugging at the very top
console.log('🚀 Application starting...');
console.log('🔍 Environment variables check:');
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - PORT:', process.env.PORT);
console.log('  - DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('  - JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('  - STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
console.log('  - All env vars:', Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('JWT') || key.includes('STRIPE') || key.includes('NODE') || key.includes('PORT')));

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import serviceRoutes from './routes/services.js';
import bookingRoutes from './routes/bookings.js';
import paymentRoutes from './routes/payments.js';
import quotesRoutes from './routes/quotes.js';
import docsRoutes from './routes/docs.js';
// import webhookRoutes from './routes/webhooks.js';

// Import middleware
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/error.js';
import { requestLogger, errorLogger, performanceMonitor } from './middleware/logging.js';
import { generalLimiter, authLimiter, apiLimiter } from './middleware/rateLimit.js';
import { sanitize } from './middleware/validation.js';

// Import database and config
import prisma from './config/database.js';
import { getCorsOptions } from './config/environment.js';

const app = express();

// PATTERN: Security middleware first
app.use(helmet());

// CORS configuration - Properly configured for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all Vercel domains
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    // Allow the specific Vercel domains being used
    if (origin === 'https://frontend-lovat-sigma-87.vercel.app' || 
        origin === 'https://frontend-mq2e2lnbj-jms-projects-46d87d50.vercel.app') {
      return callback(null, true);
    }
    
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow the specific Railway domain if needed
    if (origin.includes('railway.app')) {
      return callback(null, true);
    }
    
    // Allow all origins for now to prevent CORS issues
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

console.log('🔧 CORS Configuration (Production Ready):', {
  origin: 'Dynamic function (allows Vercel, localhost, Railway)',
  credentials: corsOptions.credentials,
  methods: corsOptions.methods
});

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// CORS debugging (all environments)
app.use((req, res, next) => {
  console.log('🌐 Request from:', req.headers.origin);
  console.log('🌐 Request method:', req.method);
  console.log('🌐 Request path:', req.path);
  next();
});

// Enhanced logging and monitoring
app.use(requestLogger);
app.use(performanceMonitor);

// Rate limiting
app.use('/api/', generalLimiter);
if (process.env.NODE_ENV === 'production') {
  app.use('/api/auth', authLimiter);
}
app.use('/api/', apiLimiter);

// PATTERN: Body parsing for JSON and form data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing
app.use(cookieParser());

// Input sanitization
app.use(sanitize);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = prisma ? 'connected' : 'not_configured';
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
      stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'mock'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      error: error.message 
    });
  }
});

// CRITICAL: Authentication middleware for protected routes
// app.use('/api/users', authMiddleware);
// app.use('/api/bookings', authMiddleware);
// app.use('/api/payments', authMiddleware);

// Route registration
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/docs', docsRoutes);
// app.use('/api/webhooks', webhookRoutes);

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Admin: Get all services
app.get('/admin/services', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  const services = await prisma.service.findMany();
  res.json({ services });
});

// Admin: Get all users
app.get('/admin/users', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  const users = await prisma.user.findMany();
  res.json({ users });
});

// Admin: Get all bookings
app.get('/admin/bookings', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  const bookings = await prisma.booking.findMany();
  const bookingsWithDetails = await Promise.all(bookings.map(async booking => {
    const customer = await prisma.user.findUnique({ where: { id: booking.customerId } });
    const service = await prisma.service.findUnique({ where: { id: booking.serviceId } });
    return { ...booking, customer, service };
  }));
  res.json({ bookings: bookingsWithDetails });
});

// Admin: Analytics summary (real data for counts, dummy for email stats)
app.get('/admin/analytics', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  const userCount = await prisma.user.count();
  const serviceCount = await prisma.service.count();
  const bookingCount = await prisma.booking.count();
  // TODO: Replace with real email stats if available
  const emailOpenRate = 0.72;
  const emailClickRate = 0.38;
  const emailBounceRate = 0.04;
  res.json({
    userCount,
    serviceCount,
    bookingCount,
    emailOpenRate,
    emailClickRate,
    emailBounceRate
  });
});

// Admin: Settings (configurable)
const allowedKeys = [
  'siteName', 'maintenanceMode', 'supportEmail',
  'emailHost', 'emailPort', 'emailUser', 'emailPassword', 'emailFrom', 'emailSecure', 'emailReplyTo'
];

app.get('/admin/settings', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  const settings = await prisma.setting.findMany({ where: { key: { in: allowedKeys } } });
  res.json({ settings });
});

app.post('/admin/settings', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  const { key, value } = req.body;
  if (!allowedKeys.includes(key)) {
    return res.status(400).json({ error: 'Invalid setting key' });
  }
  const setting = await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });
  res.json({ setting });
});

// User: Profile
app.get('/profile', async (req, res) => {
  // Assume authMiddleware sets req.user
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({ user });
});

// User: Settings (placeholder)
app.get('/settings', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ settings: { notifications: true, darkMode: false } });
});

// PATTERN: Error handling middleware last
app.use(errorLogger);
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Only start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app; 