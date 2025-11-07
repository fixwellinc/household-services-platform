// Import logger first for initialization logging
import { logger } from './utils/logger.js';

// Add environment debugging at the very top
logger.info('🚀 Application starting...');
logger.info('🔍 Environment variables check:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
  JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
  STRIPE_SECRET_KEY_EXISTS: !!process.env.STRIPE_SECRET_KEY,
  RELEVANT_ENV_VARS: Object.keys(process.env).filter(key => 
    key.includes('DATABASE') || key.includes('JWT') || key.includes('STRIPE') || 
    key.includes('NODE') || key.includes('PORT')
  )
});

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Import services
import socketService from './services/socketService.js';
import appointmentSocketService from './services/appointmentSocketService.js';
import queueService from './services/queueService.js';
import { auditService } from './services/auditService.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import serviceRoutes from './routes/services.js';
import bookingRoutes from './routes/bookings.js';
import paymentRoutes from './routes/payments.js';
import quotesRoutes from './routes/quotes.js';
import docsRoutes from './routes/docs.js';
import notificationRoutes from './routes/notifications.js';
import chatRoutes from './routes/chat.js';
import smsService from './services/sms.js';

// Enhanced Analytics Service imports
import AnalyticsService from './services/analyticsService.js';
import ChurnPredictionService from './services/churnPredictionService.js';
import plansRoutes from './routes/plans.js';
import subscriptionRoutes from './routes/subscriptions.js';
import dashboardRoutes from './routes/dashboard.js';
import webhookRoutes from './routes/webhooks.js';
import serviceRequestRoutes from './routes/service-requests.js';
import jobRoutes from './routes/jobs.js';
import rewardsRoutes from './routes/rewards.js';
import performanceRoutes from './routes/performance.js';
import securityRoutes from './routes/security.js';
import logoRoutes from './routes/logos.js';
import stripeTestRoutes from './routes/stripe-test.js';
import healthRoutes from './routes/health.js';
import adminRoutes from './routes/admin.js';
import appointmentRoutes from './routes/appointments.js';
import advancedSchedulingRoutes from './routes/advancedScheduling.js';
import adminDashboardRoutes from './routes/admin/dashboard.js';
import adminPermissionsRoutes from './routes/adminPermissions.js';
import adminImpersonationRoutes from './routes/adminImpersonation.js';
import adminUsersRoutes from './routes/adminUsers.js';
import adminRolesRoutes from './routes/adminRoles.js';
import bulkOperationsRoutes from './routes/bulkOperations.js';
import adminSubscriptionAnalyticsRoutes from './routes/admin/subscriptionAnalytics.js';
import adminSubscriptionsRoutes from './routes/admin/subscriptions.js';
import customerRoutes from './routes/customer.js';
import notificationPreferencesRoutes from './routes/notificationPreferences.js';
import salesmanRoutes from './routes/salesman.js';
import referralRoutes from './routes/referral.js';
import adminSalesmenRoutes from './routes/admin/salesmen.js';
import adminEmailTemplatesRoutes from './routes/admin/emailTemplates.js';
import analyticsRoutes from './routes/analytics.js';
import errorsRoutes from './routes/errors.js';

// Import middleware
import { authMiddleware, requireAdmin } from './middleware/auth.js';
import { errorHandler } from './middleware/error.js';
import { requestLogger, errorLogger, performanceMonitor } from './middleware/logging.js';
import { generalLimiter, authLimiter, apiLimiter, bulkAdminLimiter } from './middleware/rateLimit.js';
import { sanitize } from './middleware/validation.js';
import { performanceMiddleware, memoryMonitor } from './config/performance.js';
import { releaseLockMiddleware } from './middleware/concurrency.js';

// Import database and config
import prisma, { checkDatabaseConnection } from './config/database.js';
import { getCorsOptions } from './config/environment.js';

// Database connection check middleware
const checkDatabaseMiddleware = async (req, res, next) => {
  if (!prisma) {
    return res.status(503).json({ 
      error: 'Database not available. Please try again later.',
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    // Quick connection check
    await prisma.$queryRaw`SELECT 1`;
    next();
  } catch (error) {
    logger.error('❌ Database connection check failed', { 
      error: error.message,
      stack: error.stack 
    });
    return res.status(503).json({ 
      error: 'Database connection failed. Please try again later.',
      timestamp: new Date().toISOString()
    });
  }
};

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize enhanced Socket.IO service
socketService.initialize(io);
appointmentSocketService.initialize(io);

// Make io available to routes
app.set('io', io);

// PATTERN: Security middleware first
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://m.stripe.network"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Remove X-Powered-By header
app.disable('x-powered-by');

// CORS configuration - Properly configured for production
const corsOptions = getCorsOptions();

logger.info('🔧 CORS Configuration initialized', {
  environment: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  corsOrigins: process.env.CORS_ORIGINS || 'default',
  credentials: corsOptions.credentials,
  methods: corsOptions.methods
});

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// CORS debugging (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.debug('🌐 Request received', {
      origin: req.headers.origin,
      method: req.method,
      path: req.path,
      ip: req.ip
    });
    next();
  });
}

// Enhanced logging and monitoring
app.use(requestLogger);
app.use(performanceMonitor);
app.use(performanceMiddleware);
app.use(releaseLockMiddleware);

// Rate limiting
app.use('/api/', generalLimiter);
if (process.env.NODE_ENV === 'production') {
  // Apply strict rate limiting only to login and register routes
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  // Apply general rate limiting to other auth routes (including logout)
  app.use('/api/auth', generalLimiter);
}
app.use('/api/', apiLimiter);

// Trust proxy for rate limiting behind Railway
app.set('trust proxy', 1);

// PATTERN: Body parsing for JSON and form data
// Capture raw body for Stripe webhook signature verification
// IMPORTANT: Exclude webhook routes from JSON parsing to preserve raw body for signature verification
app.use((req, res, next) => {
  if (req.path.startsWith('/api/webhooks')) {
    // For webhook routes, use raw body parsing
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      req.rawBody = Buffer.from(data, 'utf8');
      next();
    });
  } else {
    // For all other routes, use JSON parsing
    express.json({
      limit: '10mb',
      verify: (req, res, buf) => {
        req.rawBody = buf;
      }
    })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true }));

// Cookie parsing
app.use(cookieParser());

// Input sanitization
app.use(sanitize);

// Add cache control headers for API responses
app.use('/api', (req, res, next) => {
  // Most API responses should not be cached
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  // Attach Socket.IO to request for downstream handlers if needed
  req.io = io;
  next();
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    if (!prisma) {
      return res.status(503).json({ 
        status: 'error', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: 'not_configured',
        stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'mock',
        error: 'Database not configured'
      });
    }
    
    // Test database connection
    const dbConnection = await checkDatabaseConnection();
    const dbStatus = dbConnection.status;
    
    res.json({ 
      status: dbStatus === 'healthy' ? 'ok' : 'error', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
      stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'mock',
      databaseDetails: dbConnection
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      error: error.message 
    });
  }
});

// Rate limit reset endpoint - ADMIN ONLY
// SECURITY: This endpoint is restricted to admins only to prevent abuse
app.post('/api/admin/reset-rate-limit', requireAdmin, async (req, res) => {
  try {
    const { ip, userId } = req.body;
    
    if (!ip && !userId) {
      return res.status(400).json({ 
        error: 'Either IP address or user ID is required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Log the rate limit reset for audit purposes
    logger.warn('Rate limit reset requested by admin', {
      adminId: req.user.id,
      adminEmail: req.user.email,
      targetIP: ip,
      targetUserId: userId,
      timestamp: new Date().toISOString()
    });
    
    // Note: Actual rate limit reset would require access to the rate limiter store
    // This is a placeholder - implement based on your rate limiter backend (Redis, etc.)
    res.json({ 
      success: true,
      message: 'Rate limit reset request logged. Rate limits will reset automatically after the window period.',
      targetIP: ip,
      targetUserId: userId,
      timestamp: new Date().toISOString(),
      note: 'If using Redis-backed rate limiting, implement actual reset logic here.'
    });
  } catch (error) {
    logger.error('Rate limit reset error', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to process rate limit reset request',
      timestamp: new Date().toISOString()
    });
  }
});

// CRITICAL SAFETY: Emergency admin creation route
// SECURITY: Only enabled in development or with explicit environment variable AND secure token
// This route MUST be before auth middleware to allow admin creation when no admin exists
// PRODUCTION: Requires ALLOW_EMERGENCY_ADMIN=true AND valid EMERGENCY_ADMIN_TOKEN header
app.post('/api/admin/emergency-create', async (req, res) => {
  // SECURITY: Strict production checks
  if (process.env.NODE_ENV === 'production') {
    // Require explicit flag
    if (process.env.ALLOW_EMERGENCY_ADMIN !== 'true') {
      logger.warn('Emergency admin creation attempted but disabled', {
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({ 
        error: 'Emergency admin creation is disabled in production for security reasons' 
      });
    }

    // Require secure token
    const emergencyToken = req.headers['x-emergency-token'];
    const expectedToken = process.env.EMERGENCY_ADMIN_TOKEN;
    
    if (!emergencyToken || !expectedToken || emergencyToken !== expectedToken) {
      logger.warn('Emergency admin creation attempted with invalid token', {
        ip: req.ip,
        hasToken: !!emergencyToken,
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({ 
        error: 'Invalid emergency token' 
      });
    }
  }

  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      logger.info('Emergency admin creation attempted but admin exists', {
        existingAdminEmail: existingAdmin.email
      });
      return res.json({
        message: 'Admin account already exists',
        admin: { email: existingAdmin.email, role: existingAdmin.role }
      });
    }

    // SECURITY: Use environment variable for password, fallback to random secure password
    const adminPassword = process.env.EMERGENCY_ADMIN_PASSWORD || 
      crypto.randomBytes(32).toString('hex');
    
    // Create admin account
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(adminPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    const adminUser = await prisma.user.create({
      data: {
        email: process.env.EMERGENCY_ADMIN_EMAIL || 'admin@fixwell.ca',
        name: 'Fixwell Admin',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        phone: process.env.EMERGENCY_ADMIN_PHONE || '+1-604-555-0001',
        address: '123 Admin Street, Vancouver, BC',
        postalCode: 'V6B 1A1',
        preferences: {
          notifications: {
            email: true,
            sms: true,
            push: true
          },
          dashboard: {
            theme: 'light',
            defaultView: 'overview'
          }
        }
      }
    });

    // Log the admin creation for security (with password in dev only)
    const logData = {
      id: adminUser.id,
      email: adminUser.email,
      ip: req.ip,
      timestamp: new Date().toISOString()
    };
    
    if (process.env.NODE_ENV === 'development') {
      logData.password = adminPassword;
      logger.warn('⚠️  Emergency admin account created (DEV MODE)', logData);
    } else {
      logger.warn('⚠️  Emergency admin account created (PRODUCTION)', logData);
      // In production, log to secure log system
      auditService.log({
        adminId: 'system',
        action: 'EMERGENCY_ADMIN_CREATED',
        entityType: 'User',
        entityId: adminUser.id,
        severity: 'critical',
        metadata: { ip: req.ip }
      }).catch(err => logger.error('Failed to log emergency admin creation', { error: err.message }));
    }

    res.json({
      message: 'Emergency admin account created successfully',
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role
      },
      // Only show password in development
      ...(process.env.NODE_ENV === 'development' && { 
        password: adminPassword,
        warning: 'This password is only shown in development. Change it immediately in production.' 
      })
    });
  } catch (error) {
    logger.error('❌ Emergency admin creation failed', { 
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    res.status(500).json({
      error: 'Failed to create emergency admin account',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Ensure admin routes have authenticated user context
app.use('/api/admin', authMiddleware);

// CRITICAL: Authentication middleware for protected routes
// app.use('/api/users', authMiddleware);
// app.use('/api/bookings', authMiddleware);
// app.use('/api/payments', authMiddleware);

// Route registration with database connection checks
app.use('/api/auth', checkDatabaseMiddleware, authRoutes);
app.use('/api/users', checkDatabaseMiddleware, userRoutes);
app.use('/api/services', checkDatabaseMiddleware, serviceRoutes);
app.use('/api/bookings', checkDatabaseMiddleware, bookingRoutes);
app.use('/api/payments', checkDatabaseMiddleware, paymentRoutes);
app.use('/api/quotes', checkDatabaseMiddleware, quotesRoutes);
app.use('/api/service-requests', checkDatabaseMiddleware, serviceRequestRoutes);
app.use('/api/jobs', checkDatabaseMiddleware, jobRoutes);
app.use('/api/docs', checkDatabaseMiddleware, docsRoutes);
app.use('/api/chat', checkDatabaseMiddleware, chatRoutes);
app.use('/api/plans', checkDatabaseMiddleware, plansRoutes);
app.use('/api/subscriptions', checkDatabaseMiddleware, subscriptionRoutes);
app.use('/api/customer', checkDatabaseMiddleware, customerRoutes);
app.use('/api/rewards', checkDatabaseMiddleware, rewardsRoutes);
app.use('/api/dashboard', checkDatabaseMiddleware, dashboardRoutes);
app.use('/api/performance', checkDatabaseMiddleware, performanceRoutes);
app.use('/api/security', checkDatabaseMiddleware, securityRoutes);
app.use('/api/logos', checkDatabaseMiddleware, logoRoutes);
app.use('/api/stripe-test', stripeTestRoutes);
app.use('/health', healthRoutes); // Health check endpoint (no database check needed)
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', checkDatabaseMiddleware, adminRoutes);
app.use('/api/admin/dashboard', checkDatabaseMiddleware, adminDashboardRoutes);
app.use('/api/admin/users', checkDatabaseMiddleware, adminUsersRoutes);
app.use('/api/admin/roles', checkDatabaseMiddleware, adminRolesRoutes);
app.use('/api/admin/permissions', checkDatabaseMiddleware, adminPermissionsRoutes);
app.use('/api/admin/impersonation', checkDatabaseMiddleware, adminImpersonationRoutes);
app.use('/api/admin/subscriptions', checkDatabaseMiddleware, adminSubscriptionsRoutes);
app.use('/api/admin/subscriptions/analytics', checkDatabaseMiddleware, adminSubscriptionAnalyticsRoutes);
app.use('/api/bulk-operations', checkDatabaseMiddleware, bulkOperationsRoutes);
app.use('/api/appointments', checkDatabaseMiddleware, appointmentRoutes);
app.use('/api/advanced-scheduling', checkDatabaseMiddleware, advancedSchedulingRoutes);
app.use('/api/notifications', checkDatabaseMiddleware, notificationPreferencesRoutes);
app.use('/api/salesman', checkDatabaseMiddleware, salesmanRoutes);
app.use('/api/referral', checkDatabaseMiddleware, referralRoutes);
app.use('/api/admin/salesmen', checkDatabaseMiddleware, adminSalesmenRoutes);
app.use('/api/admin/email-templates', checkDatabaseMiddleware, adminEmailTemplatesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/errors', errorsRoutes);

function requireAdminLocal(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Note: Emergency admin creation route is defined earlier, before auth middleware

// Mount admin routes AFTER auth middleware
app.use('/api/admin/notifications', notificationRoutes);

// Test endpoint to verify authentication
app.get('/api/admin/test-auth', requireAdmin, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Authentication working',
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Admin: Get all services
app.get('/api/admin/services', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  const services = await prisma.service.findMany();
  res.json({ services });
});

// Admin: Get all users with safety checks and pagination
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
  try {
    // CRITICAL SAFEGUARD: Prevent bulk operations
    const { bulk, limit, page = 1 } = req.query;
    if (bulk === 'true') {
      return res.status(403).json({ 
        error: 'Bulk operations are disabled for security reasons. Please process users individually.',
        code: 'BULK_OPERATION_DISABLED'
      });
    }
    
    // Parse pagination
    const { parsePagination, createPaginatedResponse, setPaginationHeaders } = await import('./utils/pagination.js');
    const pagination = parsePagination(req.query, { defaultLimit: 50, maxLimit: 100 });
    
    // Build optimized query with includes
    const users = await prisma.user.findMany({
      skip: pagination.skip,
      take: pagination.take,
      include: {
        subscriptionUsage: true,
        subscription: {
          select: {
            id: true,
            tier: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true
          }
        },
        assignedEmployee: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Get total count for pagination
    const totalUsers = await prisma.user.count();
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    
    // Set pagination headers
    setPaginationHeaders(res, pagination, totalUsers);
    
    res.json({ 
      success: true,
      users,
      pagination: {
        ...pagination,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / pagination.limit)
      },
      metadata: {
        totalUsers,
        adminCount,
        returnedUsers: users.length,
        maxLimit: 100,
        safetyNote: 'Bulk operations are disabled. Users must be processed individually for security.',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching users', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Admin: Get all subscriptions with usage tracking - optimized with Prisma includes
app.get('/api/admin/subscriptions', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
  try {
    // Use Prisma includes for optimized query
    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            subscriptionUsage: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json({ success: true, subscriptions });
  } catch (error) {
    logger.error('Error fetching subscriptions', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Admin: Get subscription usage details
app.get('/api/admin/subscriptions/:id/usage', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  const { id } = req.params;
  const subscription = await prisma.subscription.findUnique({ where: { id } });
  if (!subscription) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  const user = subscription.userId
    ? await prisma.user.findUnique({
        where: { id: subscription.userId },
        include: { subscriptionUsage: true }
      })
    : null;
  res.json({ subscription: { ...subscription, user } });
});

// CRITICAL SAFETY: System health and safety monitoring
app.get('/api/admin/system-safety', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
  try {
    // Get critical system metrics
    const totalUsers = await prisma.user.count();
    const adminUsers = await prisma.user.count({ where: { role: 'ADMIN' } });
    const activeUsers = await prisma.user.count({ where: { isActive: true } });
    const totalSubscriptions = await prisma.subscription.count();
    const activeSubscriptions = await prisma.subscription.count({ where: { status: 'ACTIVE' } });
    const totalBookings = await prisma.booking.count();
    
    // Calculate safety scores
    const adminSafetyScore = adminUsers > 0 ? 100 : 0;
    const userSafetyScore = totalUsers > 0 ? Math.min(100, (activeUsers / totalUsers) * 100) : 0;
    
    // Check for potential issues
    const warnings = [];
    if (adminUsers === 0) warnings.push('CRITICAL: No admin users found');
    if (adminUsers === 1) warnings.push('WARNING: Only one admin user remaining');
    if (totalUsers === 0) warnings.push('CRITICAL: No users found in system');
    if (activeUsers === 0) warnings.push('WARNING: No active users found');
    
    res.json({
      systemHealth: {
        totalUsers,
        adminUsers,
        activeUsers,
        totalSubscriptions,
        activeSubscriptions,
        totalBookings
      },
      safetyScores: {
        adminSafety: adminSafetyScore,
        userSafety: userSafetyScore,
        overallSafety: Math.round((adminSafetyScore + userSafetyScore) / 2)
      },
      warnings,
      lastCheck: new Date().toISOString(),
      safetyFeatures: {
        bulkOperationsDisabled: true,
        adminDeletionProtected: true,
        softDeleteEnabled: true,
        transactionProtection: true,
        foreignKeyConstraints: true
      }
    });
  } catch (error) {
    logger.error('System safety check failed', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to check system safety' });
  }
});

// Admin: Block subscription cancellation
app.patch('/api/admin/subscriptions/:id/block-cancellation', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  const { id } = req.params;
  const { reason } = req.body;
  
  try {
    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        canCancel: false,
        cancellationBlockedAt: new Date(),
        cancellationBlockedReason: reason || 'Perks have been used'
      }
    });
    res.json({ subscription });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Allow subscription cancellation
app.patch('/api/admin/subscriptions/:id/allow-cancellation', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  const { id } = req.params;
  
  try {
    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        canCancel: true,
        cancellationBlockedAt: null,
        cancellationBlockedReason: null
      }
    });
    res.json({ subscription });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Get customers with active subscriptions
app.get('/api/admin/customers/subscribed', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  const subscribedCustomers = await prisma.user.findMany({
    where: {
      subscriptionId: { not: null },
      isActive: true
    },
    include: {
      subscriptionUsage: true
    }
  });
  
  // Manually fetch subscription data using batch query to avoid N+1
  const subscriptionIds = subscribedCustomers
    .map(c => c.subscriptionId)
    .filter(Boolean);
  
  const subscriptions = subscriptionIds.length > 0
    ? await prisma.subscription.findMany({
        where: { id: { in: subscriptionIds } }
      })
    : [];
  
  const subscriptionMap = new Map(subscriptions.map(s => [s.id, s]));
  
  const enrichedCustomers = subscribedCustomers.map(customer => ({
    ...customer,
    subscription: customer.subscriptionId ? subscriptionMap.get(customer.subscriptionId) || null : null
  }));
  
  res.json({ customers: enrichedCustomers });
});

// Admin: Get customers who have used perks
app.get('/api/admin/customers/perks-used', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  const customersWithPerksUsed = await prisma.user.findMany({
    where: {
      subscriptionUsage: {
        OR: [
          { priorityBookingUsed: true },
          { discountUsed: true },
          { freeServiceUsed: true },
          { emergencyServiceUsed: true }
        ]
      }
    },
    include: {
      subscriptionUsage: true
    }
  });
  
  // Manually fetch subscription data using batch query to avoid N+1
  const subscriptionIds = customersWithPerksUsed
    .map(c => c.subscriptionId)
    .filter(Boolean);
  
  const subscriptions = subscriptionIds.length > 0
    ? await prisma.subscription.findMany({
        where: { id: { in: subscriptionIds } }
      })
    : [];
  
  const subscriptionMap = new Map(subscriptions.map(s => [s.id, s]));
  
  const enrichedCustomers = customersWithPerksUsed.map(customer => ({
    ...customer,
    subscription: customer.subscriptionId ? subscriptionMap.get(customer.subscriptionId) || null : null
  }));
  
  res.json({ customers: enrichedCustomers });
});

// Admin: Get subscription analytics
app.get('/api/admin/subscriptions/analytics', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
  const totalSubscriptions = await prisma.subscription.count({
    where: { status: 'ACTIVE' }
  });
  
  const blockedCancellations = await prisma.subscription.count({
    where: { canCancel: false }
  });
  
  const perksUsedCount = await prisma.subscriptionUsage.count({
    where: {
      OR: [
        { priorityBookingUsed: true },
        { discountUsed: true },
        { freeServiceUsed: true },
        { emergencyServiceUsed: true }
      ]
    }
  });
  
  const tierBreakdown = await prisma.subscription.groupBy({
    by: ['tier'],
    where: { status: 'ACTIVE' },
    _count: { tier: true }
  });
  
  res.json({
    totalSubscriptions,
    blockedCancellations,
    perksUsedCount,
    tierBreakdown
  });
});

// Admin: Get all bookings - optimized with Prisma includes
app.get('/api/admin/bookings', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
  try {
    // Use Prisma includes for optimized query
    const bookings = await prisma.booking.findMany({
      include: {
        // Note: Add relations to Booking model if needed
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limit for performance
    });
    
    // Get related data in batch to avoid N+1 queries
    const customerIds = [...new Set(bookings.map(b => b.customerId))];
    const serviceIds = [...new Set(bookings.map(b => b.serviceId))];
    
    const [customers, services] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, name: true, email: true }
      }),
      prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: { id: true, name: true, category: true }
      })
    ]);
    
    const customerMap = new Map(customers.map(c => [c.id, c]));
    const serviceMap = new Map(services.map(s => [s.id, s]));
    
    const bookingsWithDetails = bookings.map(booking => ({
      ...booking,
      customer: customerMap.get(booking.customerId) || null,
      service: serviceMap.get(booking.serviceId) || null
    }));
    
    res.json({ success: true, bookings: bookingsWithDetails });
  } catch (error) {
    logger.error('Error fetching bookings', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Initialize analytics services
const analyticsService = new AnalyticsService(prisma);
const churnPredictionService = new ChurnPredictionService(prisma);

// Admin: Enhanced Analytics summary with subscription-specific metrics
app.get('/api/admin/analytics', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
  try {
    // Get current counts
    const userCount = await prisma.user.count();
    const serviceCount = await prisma.service.count();
    const bookingCount = await prisma.booking.count();
    const quoteCount = await prisma.quote.count();
    
    // Get active chat sessions count
    const activeSessionsCount = await prisma.chatSession.count({
      where: {
        OR: [
          { lastCustomerReadAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          { lastAdminReadAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
        ]
      }
    });
    
    // Calculate revenue from subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { 
        user: true,
        paymentFrequencies: true,
        subscriptionPauses: true,
        familyMembers: true,
        additionalProperties: true
      }
    });
    
    const totalRevenue = subscriptions.reduce((sum, sub) => {
      const planPrice = sub.plan?.monthlyPrice || sub.plan?.yearlyPrice || 0;
      return sum + planPrice;
    }, 0);
    
    // Calculate growth percentages (comparing last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    
    // User growth
    const recentUsers = await prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });
    const previousUsers = await prisma.user.count({
      where: { 
        createdAt: { 
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo 
        } 
      }
    });
    const userGrowth = previousUsers > 0 ? ((recentUsers - previousUsers) / previousUsers) * 100 : 0;
    
    // Booking growth
    const recentBookings = await prisma.booking.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });
    const previousBookings = await prisma.booking.count({
      where: { 
        createdAt: { 
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo 
        } 
      }
    });
    const bookingGrowth = previousBookings > 0 ? ((recentBookings - previousBookings) / previousBookings) * 100 : 0;
    
    // Session growth
    const recentSessions = await prisma.chatSession.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });
    const previousSessions = await prisma.chatSession.count({
      where: { 
        createdAt: { 
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo 
        } 
      }
    });
    const sessionGrowth = previousSessions > 0 ? ((recentSessions - previousSessions) / previousSessions) * 100 : 0;
    
    // Revenue growth (simplified - using subscription count as proxy)
    const recentSubscriptions = await prisma.subscription.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });
    const previousSubscriptions = await prisma.subscription.count({
      where: { 
        createdAt: { 
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo 
        } 
      }
    });
    const revenueGrowth = previousSubscriptions > 0 ? ((recentSubscriptions - previousSubscriptions) / previousSubscriptions) * 100 : 0;
    
    // Get top services by booking count
    const topServices = await prisma.service.findMany({
      include: {
        _count: {
          select: { bookings: true }
        }
      },
      orderBy: {
        bookings: {
          _count: 'desc'
        }
      },
      take: 5
    });

    // Enhanced subscription analytics
    const analyticsService = new AnalyticsService();
    const churnRate = await analyticsService.calculateChurnRate({
      startDate: thirtyDaysAgo.toISOString(),
      endDate: now.toISOString()
    });

    const clvAnalysis = await analyticsService.calculateCustomerLifetimeValue();
    const perkUtilization = await analyticsService.getPerkUtilization();

    // Calculate notification statistics (mock for now, can be enhanced later)
    const notificationStats = {
      totalSentToday: Math.floor(Math.random() * 1000) + 2000, // Mock data
      deliveryRate: 98.5,
      openRate: 67.2,
      clickRate: 23.8
    };

    res.json({
      // Original metrics
      totalUsers: userCount,
      totalRevenue: totalRevenue,
      totalBookings: bookingCount,
      activeSessions: activeSessionsCount,
      userGrowth: Math.round(userGrowth * 10) / 10,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      bookingGrowth: Math.round(bookingGrowth * 10) / 10,
      sessionGrowth: Math.round(sessionGrowth * 10) / 10,
      totalQuotes: quoteCount,
      totalServices: serviceCount,
      totalSubscriptions: subscriptions.length,
      topServices: topServices.map(service => ({
        name: service.name,
        bookings: service._count.bookings
      })),
      notificationStats,
      
      // Enhanced subscription metrics
      subscriptionMetrics: {
        churnRate: churnRate.overallChurnRate,
        churnByTier: churnRate.churnByTier,
        churnByFrequency: churnRate.churnByFrequency,
        averageCLV: clvAnalysis.averageCLV,
        clvByTier: clvAnalysis.clvByTier,
        perkUtilization: perkUtilization.utilizationRates
      }
    });
  } catch (error) {
    logger.error('Analytics calculation error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to calculate analytics' });
  }
});

// New endpoint: Churn risk analysis
app.get('/api/analytics/churn-risk', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }

  try {
    const { limit = 50, riskThreshold = 70 } = req.query;
    
    const highRiskCustomers = await churnPredictionService.getBulkChurnRiskScores({
      limit: parseInt(limit),
      riskThreshold: parseFloat(riskThreshold)
    });

    // Get summary statistics
    const totalActiveSubscriptions = await prisma.subscription.count({
      where: { status: 'ACTIVE' }
    });

    const riskDistribution = {
      critical: highRiskCustomers.filter(c => c.riskScore >= 80).length,
      high: highRiskCustomers.filter(c => c.riskScore >= 60 && c.riskScore < 80).length,
      medium: highRiskCustomers.filter(c => c.riskScore >= 40 && c.riskScore < 60).length,
      low: highRiskCustomers.filter(c => c.riskScore < 40).length
    };

    res.json({
      summary: {
        totalActiveSubscriptions,
        highRiskCount: highRiskCustomers.length,
        riskDistribution
      },
      highRiskCustomers: highRiskCustomers.slice(0, parseInt(limit))
    });
  } catch (error) {
    logger.error('Churn risk analysis error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to analyze churn risk' });
  }
});

// New endpoint: Revenue trends analysis
app.get('/api/analytics/revenue-trends', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }

  try {
    const { months = 12 } = req.query;
    
    const revenueTrends = await analyticsService.getRevenueTrends({
      months: parseInt(months)
    });

    res.json(revenueTrends);
  } catch (error) {
    logger.error('Revenue trends analysis error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to analyze revenue trends' });
  }
});

// New endpoint: Perk utilization analysis
app.get('/api/analytics/perk-utilization', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }

  try {
    const perkUtilization = await analyticsService.getPerkUtilization();
    
    res.json(perkUtilization);
  } catch (error) {
    logger.error('Perk utilization analysis error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to analyze perk utilization' });
  }
});

// Admin: Email blast
app.post('/api/admin/email-blast', requireAdmin, bulkAdminLimiter, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
  const { subject, body, html, isHtmlMode, emails, recipientFilter, template } = req.body;
  
  if (!subject || (!body && !html && !template)) {
    return res.status(400).json({ error: 'Subject and message are required' });
  }
  
  let targetEmails = Array.isArray(emails) ? emails.filter(Boolean) : [];
  
  try {
    // Derive recipients if not directly provided
    if (targetEmails.length === 0 && recipientFilter) {
      if (recipientFilter === 'all') {
        const users = await prisma.user.findMany({ select: { email: true }, where: { isActive: true } });
        targetEmails = users.map(u => u.email).filter(Boolean);
      } else if (recipientFilter === 'subscribers') {
        const users = await prisma.user.findMany({
          where: { subscriptionId: { not: null }, isActive: true },
          select: { email: true }
        });
        targetEmails = users.map(u => u.email).filter(Boolean);
      }
    }

    if (!targetEmails || targetEmails.length === 0) {
      return res.status(400).json({ error: 'No recipients found for this blast' });
    }
  } catch (error) {
    logger.error('Email blast preprocessing error', { error: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Failed to prepare recipients' });
  }

  try {
    // Import email service
    const { default: emailService } = await import('./services/email.js');
    
    let sentCount = 0;
    const failedEmails = [];
    
    for (const email of targetEmails) {
      try {
        let result;
        if (template) {
          // Use subscription marketing template pathway
          result = await emailService.sendSubscriptionMarketingEmail({ email, name: 'there' }, template);
        } else {
          result = await emailService.sendEmail({
            to: email,
            subject,
            text: body,
            html: isHtmlMode ? html : undefined
          });
        }
        
        if (result.success) {
          sentCount++;
        } else {
          failedEmails.push({ email, error: result.error });
        }
      } catch (error) {
        failedEmails.push({ email, error: error.message });
      }
    }
    
    res.json({
      success: true,
      sentCount,
      failedCount: failedEmails.length,
      failedEmails
    });
  } catch (error) {
    logger.error('Email blast error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to send email blast' });
  }
});

// Email Templates CRUD is handled by the dedicated admin routes

// Admin: Send mobile notification (basic SMS helper)
app.post('/api/admin/notifications', requireAdmin, bulkAdminLimiter, async (req, res) => {
  try {
    const { phoneNumber, message = 'Notification', type = 'new_chat', customerName = 'Customer', chatId = 'admin-broadcast' } = req.body || {};

    if (phoneNumber) {
      const result = await smsService.sendChatNotification(phoneNumber, customerName, message, chatId);
      if (!result.success) return res.status(500).json({ success: false, error: result.error || 'Failed to send' });
      return res.json({ success: true, sid: result.sid });
    }

    // No direct phone provided: try owner/manager phones from settings/env
    const settings = await prisma.setting.findMany({ where: { key: { in: ['ownerPhone', 'managerPhones'] } } });
    const map = Object.fromEntries(settings.map(s => [s.key, s.value]));
    const owner = map.ownerPhone || process.env.OWNER_PHONE_NUMBER;
    const managers = (map.managerPhones || process.env.MANAGER_PHONE_NUMBERS || '').split(',').map(s => s.trim()).filter(Boolean);
    const targets = [owner, ...managers].filter(Boolean);

    if (targets.length === 0) return res.status(400).json({ success: false, error: 'No target phone numbers configured' });

    const results = [];
    for (const phone of targets) {
      const r = await smsService.sendChatNotification(phone, customerName, message, chatId);
      results.push({ phone, ...r });
    }

    const failed = results.filter(r => !r.success);
    res.json({ success: failed.length === 0, results });
  } catch (error) {
    logger.error('Admin notifications error', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: 'Failed to send notifications' });
  }
});

// Admin: Get settings
app.get('/api/admin/settings', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    
    res.json({ settings: settingsMap });
  } catch (error) {
    logger.error('Failed to fetch settings', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Admin: Update settings
app.post('/api/admin/settings', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
  const { settings } = req.body;
  
  if (!settings || !Array.isArray(settings)) {
    return res.status(400).json({ error: 'Settings array is required' });
  }
  
  try {
    const results = [];
    
    for (const setting of settings) {
      const result = await prisma.setting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value }
      });
      results.push(result);
    }
    
    // Reconfigure email service with new settings
    try {
      const { default: emailService } = await import('./services/email.js');
      await emailService.reconfigure();
    } catch (error) {
      logger.error('Failed to reconfigure email service', { error: error.message, stack: error.stack });
    }
    
    res.json({ success: true, settings: results });
  } catch (error) {
    logger.error('Failed to update settings', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Admin: Test email connection
app.post('/api/admin/test-email', requireAdmin, async (req, res) => {
  const { emailSettings } = req.body;
  
  if (!emailSettings || !emailSettings.emailHost || !emailSettings.emailUser || !emailSettings.emailPassword) {
    return res.status(400).json({ error: 'Email settings are required' });
  }
  
  try {
    // Create a temporary transporter for testing
    const nodemailerModule = await import('nodemailer');
    const nodemailer = nodemailerModule.default;
    const testTransporter = nodemailer.createTransport({
      host: emailSettings.emailHost,
      port: parseInt(emailSettings.emailPort) || 587,
      secure: emailSettings.emailSecure,
      auth: {
        user: emailSettings.emailUser,
        pass: emailSettings.emailPassword,
      },
    });
    
    // Verify connection
    await testTransporter.verify();
    
    // Send test email
    const testResult = await testTransporter.sendMail({
      from: emailSettings.emailFrom || emailSettings.emailUser,
      to: emailSettings.emailUser, // Send to self for testing
      subject: 'Fixwell Services - Email Test',
      text: 'This is a test email from Fixwell Services. If you receive this, your email configuration is working correctly.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Email Test Successful</h2>
          <p>This is a test email from Fixwell Services.</p>
          <p>If you receive this email, your email configuration is working correctly.</p>
          <p>Best regards,<br>The Fixwell Services Team</p>
        </div>
      `
    });
    
    res.json({ 
      success: true, 
      message: 'Email test successful',
      messageId: testResult.messageId 
    });
  } catch (error) {
    logger.error('Email test failed', { error: error.message, stack: error.stack });
    res.status(500).json({ error: `Email test failed: ${error.message}` });
  }
});

// Admin: Update user status
app.patch('/api/admin/users/:id/status', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  const { id } = req.params;
  const { isActive } = req.body;
  
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive }
    });
    res.json({ user });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update user status' });
  }
});

// Admin: Update user role
app.patch('/api/admin/users/:id/role', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  const { id } = req.params;
  const { role } = req.body;
  
  if (!['CUSTOMER', 'EMPLOYEE', 'ADMIN'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { role }
    });
    res.json({ user });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update user role' });
  }
});

// Admin: Update user information
app.patch('/api/admin/users/:id', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  const { id } = req.params;
  const { name, email, role, phone, address, postalCode } = req.body;
  
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { 
        name, 
        email, 
        role, 
        phone, 
        address, 
        postalCode 
      }
    });
    res.json({ user });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update user information' });
  }
});

// Admin: Delete user with comprehensive safeguards
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  // CRITICAL SAFEGUARD 0: Prevent deletion of all users
  if (req.params.id === 'all' || req.params.id === '*') {
    return res.status(403).json({ 
      error: 'Cannot delete all users. This operation is blocked for security reasons.',
      code: 'MASS_DELETION_BLOCKED',
      timestamp: new Date().toISOString()
    });
  }
  
  // CRITICAL SAFEGUARD 0.1: Prevent deletion of multiple users at once
  if (req.params.id.includes(',') || req.params.id.includes(';')) {
    return res.status(403).json({ 
      error: 'Cannot delete multiple users at once. Please delete users individually.',
      code: 'BATCH_DELETION_BLOCKED',
      timestamp: new Date().toISOString()
    });
  }
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  const { id } = req.params;
  
  try {
    // Use transaction for atomicity with increased timeout (30 seconds)
    const result = await prisma.$transaction(async (tx) => {
      // Set transaction timeout to 30 seconds
      await tx.$executeRaw`SET LOCAL statement_timeout = 30000;`;
      
      // Check if user exists first (basic check)
      const user = await tx.user.findUnique({ 
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true
        }
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // CRITICAL SAFEGUARD 1: Prevent deletion of admin accounts
      if (user.role === 'ADMIN') {
        const adminCount = await tx.user.count({
          where: { role: 'ADMIN' }
        });
        if (adminCount <= 1) {
          throw new Error('Cannot delete the last admin account. At least one admin must remain.');
        }
        throw new Error('Cannot delete admin accounts. Admin accounts are protected from deletion.');
      }
      
      // Check for active service requests and jobs (simplified)
      const activeServiceRequests = await tx.serviceRequest.count({
        where: { 
          customerId: id,
          status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] }
        }
      });
      
      const activeJobs = await tx.job.count({
        where: { 
          customerId: id,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
        }
      });
      
      if (activeServiceRequests > 0 || activeJobs > 0) {
        throw new Error(`Cannot delete user with ${activeServiceRequests} active service requests and ${activeJobs} active jobs. Please cancel or complete all requests/jobs first.`);
      }
      
      // Check for active subscription
      const activeSubscription = await tx.subscription.findFirst({
        where: { 
          userId: id,
          status: 'ACTIVE'
        }
      });
      
      if (activeSubscription) {
        throw new Error('Cannot delete user with active subscription. Please cancel the subscription first.');
      }
      
             // Check for assigned customers (if employee)
       if (user.role === 'EMPLOYEE') {
         const assignedCustomers = await tx.customerEmployeeAssignment.count({
           where: { employeeId: id }
         });
         
         if (assignedCustomers > 0) {
           throw new Error(`Cannot delete employee with ${assignedCustomers} assigned customers. Please reassign customers first.`);
         }
       }
       
       // Check for assigned employee (if customer)
       if (user.role === 'CUSTOMER') {
         const assignedEmployee = await tx.customerEmployeeAssignment.findFirst({
           where: { customerId: id }
         });
         
         if (assignedEmployee) {
           throw new Error('Cannot delete customer with assigned employee. Please remove the assignment first.');
         }
       }
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // CRITICAL SAFEGUARD 1: Prevent deletion of admin accounts
      if (user.role === 'ADMIN') {
        // Only check admin count when actually trying to delete an admin
        const adminCount = await tx.user.count({
          where: { role: 'ADMIN' }
        });
        if (adminCount <= 1) {
          throw new Error('Cannot delete the last admin account. At least one admin must remain.');
        }
        throw new Error('Cannot delete admin accounts. Admin accounts are protected from deletion.');
      }
      
      // CRITICAL SAFEGUARD 7: Log the deletion attempt
      logger.warn('🚨 ADMIN USER DELETION ATTEMPT', {
        adminId: req.user.id,
        adminEmail: req.user.email,
        targetUserId: id,
        targetUserEmail: user.email,
        targetUserRole: user.role,
        timestamp: new Date().toISOString()
      });
      
      // CRITICAL SAFEGUARD 8: Soft delete instead of hard delete (recommended for production)
      // This preserves data integrity while marking the user as inactive
      const updatedUser = await tx.user.update({
        where: { id },
        data: {
          isActive: false,
          email: `deleted_${Date.now()}_${user.email}`,
          name: `[DELETED] ${user.name}`,
          updatedAt: new Date()
        }
      });
      
      // CRITICAL SAFEGUARD 9: Archive related data instead of deleting
      // This prevents data loss and maintains audit trail
      // Note: We'll handle subscription cancellation separately if needed
      
      return {
        success: true,
        message: 'User deactivated successfully (soft delete)',
        userId: id,
        action: 'deactivated',
        timestamp: new Date().toISOString()
      };
    });
    
    res.json(result);
    
  } catch (error) {
    logger.error('❌ USER DELETION FAILED', {
      adminId: req.user.id,
      targetUserId: id,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    res.status(400).json({ 
      error: error.message,
      timestamp: new Date().toISOString(),
      requestId: `del_${Date.now()}_${id}`
    });
  }
});

// Admin: Assign employee to customer
app.post('/api/admin/users/:id/assign-employee', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  const { id } = req.params;
  const { employeeId } = req.body;
  
  try {
    // Verify both users exist and have correct roles
    const customer = await prisma.user.findUnique({ where: { id } });
    const employee = await prisma.user.findUnique({ where: { id: employeeId } });
    
    if (!customer || customer.role !== 'CUSTOMER') {
      return res.status(400).json({ error: 'Invalid customer' });
    }
    
    if (!employee || employee.role !== 'EMPLOYEE') {
      return res.status(400).json({ error: 'Invalid employee' });
    }
    
    // Create or update the assignment
    const assignment = await prisma.customerEmployeeAssignment.upsert({
      where: { customerId: id },
      update: { employeeId },
      create: { customerId: id, employeeId }
    });
    
    res.json({ assignment });
  } catch (error) {
    res.status(400).json({ error: 'Failed to assign employee' });
  }
});

// Quote reply with email
app.post('/api/quotes/:id/reply', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
  const { id } = req.params;
  const { reply, email } = req.body;
  
  if (!reply || !email) {
    return res.status(400).json({ error: 'Reply message and email are required' });
  }
  
  try {
    // Update quote with reply
    const updatedQuote = await prisma.quote.update({
      where: { id },
      data: {
        adminReply: reply,
        status: 'REPLIED',
        adminReplySentAt: new Date()
      }
    });
    
    // Send email reply
    const { default: emailService } = await import('./services/email.js');
    
    const emailResult = await emailService.sendEmail({
      to: email,
      subject: 'Re: Your Quote Request - Fixwell Services',
      text: `Thank you for your quote request. Here's our response:\n\n${reply}\n\nBest regards,\nThe Fixwell Services Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Quote Response</h2>
          <p>Thank you for your quote request. Here's our response:</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>${reply.replace(/\n/g, '<br>')}</p>
          </div>
          <p>Best regards,<br>The Fixwell Services Team</p>
        </div>
      `
    });
    
    if (!emailResult.success) {
      logger.error('Failed to send quote reply email', { error: emailResult.error });
    }
    
    res.json({ 
      success: true, 
      quote: updatedQuote,
      emailSent: emailResult.success 
    });
  } catch (error) {
    logger.error('Quote reply error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to send quote reply' });
  }
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

// Serve uploads directory for chat file access with cache control
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

// Serve avatars directory with cache control and fallback
app.use('/avatars', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
  
  // If the requested avatar doesn't exist, serve a default one
  const avatarPath = path.join(process.cwd(), 'apps/backend/public/avatars', req.path);
  
  if (!fs.existsSync(avatarPath)) {
    // Generate a simple SVG avatar based on the filename
    const name = path.basename(req.path, path.extname(req.path));
    const initial = name.charAt(0).toUpperCase();
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];
    const color = colors[name.length % colors.length];
    
    const svg = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="${color}"/>
      <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">${initial}</text>
    </svg>`;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(svg);
  }
  
  next();
}, express.static(path.join(process.cwd(), 'apps/backend/public/avatars')));

// PATTERN: Error handling middleware last
app.use(errorLogger);

// 404 handler - must be before error handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler - must be last
app.use(errorHandler);

// Only start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const PORT = process.env.PORT || 5000;
  
  // Start memory monitoring
  memoryMonitor.startMonitoring();
  logger.info('🔍 Memory monitoring started');
  
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info('🚀 Performance monitoring enabled');
    
    // Start automated alerting service
    import('./services/alertingService.js').then(({ default: alertingService }) => {
      alertingService.startMonitoring(30000); // Check every 30 seconds
      logger.info('🔔 Automated alerting service started');
    }).catch(error => {
      logger.error('Failed to start alerting service', { error: error.message, stack: error.stack });
    });
  });
}

export { app, server, io }; 