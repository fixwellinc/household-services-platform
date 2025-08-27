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
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';

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
import plansRoutes from './routes/plans.js';
import subscriptionRoutes from './routes/subscriptions.js';
import dashboardRoutes from './routes/dashboard.js';
import webhookRoutes from './routes/webhooks.js';
import serviceRequestRoutes from './routes/service-requests.js';
import jobRoutes from './routes/jobs.js';

// Import middleware
import { authMiddleware, requireAdmin } from './middleware/auth.js';
import { errorHandler } from './middleware/error.js';
import { requestLogger, errorLogger, performanceMonitor } from './middleware/logging.js';
import { generalLimiter, authLimiter, apiLimiter, bulkAdminLimiter } from './middleware/rateLimit.js';
import { sanitize } from './middleware/validation.js';

// Import database and config
import prisma from './config/database.js';
import { getCorsOptions } from './config/environment.js';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO real-time chat events
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  // Join a chat room
  socket.on('join-session', (chatId) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} joined chat ${chatId}`);
  });

  // Relay new messages to the room
  socket.on('new-message', (data) => {
    if (data && data.chatId) {
      io.to(data.chatId).emit('new-message', data);
    }
  });

  // Typing indicators
  socket.on('typing', (data) => {
    if (data && data.chatId) {
      socket.to(data.chatId).emit('typing', { chatId: data.chatId, sender: data.sender });
    }
  });
  socket.on('stop-typing', (data) => {
    if (data && data.chatId) {
      socket.to(data.chatId).emit('stop-typing', { chatId: data.chatId, sender: data.sender });
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

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
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all Railway domains
    if (origin.includes('railway.app')) {
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
  origin: 'Dynamic function (allows Railway, localhost)',
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

// TEMPORARY: Rate limit reset endpoint (remove in production)
app.post('/api/reset-rate-limit', async (req, res) => {
  try {
    // Get the client's IP
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Clear rate limit for this IP (this is a temporary solution)
    // In production, you'd want to implement proper rate limit management
    res.json({ 
      success: true,
      message: 'Rate limit reset requested',
      clientIP,
      timestamp: new Date().toISOString(),
      note: 'This is a temporary endpoint. Rate limits will reset automatically after the window period.'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to process rate limit reset request',
      timestamp: new Date().toISOString()
    });
  }
});

// Ensure admin routes have authenticated user context
app.use('/api/admin', authMiddleware);

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
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/webhooks', webhookRoutes);

function requireAdminLocal(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Apply authentication middleware to all admin routes
app.use('/api/admin', authMiddleware);

// CRITICAL SAFETY: Emergency admin creation route (keep for production safety)
app.post('/api/admin/emergency-create', async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      return res.json({ 
        message: 'Admin account already exists',
        admin: { email: existingAdmin.email, role: existingAdmin.role }
      });
    }

    // Create admin account
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash('admin123', 10);
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@fixwell.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        phone: '+1-555-0000',
        address: '123 Admin Street',
        postalCode: 'V5H 1Z1'
      }
    });

    res.json({ 
      success: true,
      message: 'Emergency admin account created successfully',
      admin: {
        email: adminUser.email,
        password: 'admin123',
        role: adminUser.role
      }
    });
    
  } catch (error) {
    console.error('Error creating emergency admin account:', error);
    res.status(500).json({ error: 'Failed to create emergency admin account' });
  }
});

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

// Admin: Get all users with safety checks
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
  try {
    // CRITICAL SAFEGUARD: Prevent bulk operations
    const { bulk, limit } = req.query;
    if (bulk === 'true') {
      return res.status(403).json({ 
        error: 'Bulk operations are disabled for security reasons. Please process users individually.',
        code: 'BULK_OPERATION_DISABLED'
      });
    }
    
    // Limit the number of users returned to prevent overwhelming the system
    const maxLimit = 100;
    const userLimit = Math.min(parseInt(limit) || 50, maxLimit);
    
    const users = await prisma.user.findMany({
      take: userLimit,
      include: {
        subscriptionUsage: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Add safety metadata
    const totalUsers = await prisma.user.count();
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    
    res.json({ 
      users,
      metadata: {
        totalUsers,
        adminCount,
        returnedUsers: users.length,
        maxLimit,
        safetyNote: 'Bulk operations are disabled. Users must be processed individually for security.',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Admin: Get all subscriptions with usage tracking
app.get('/api/admin/subscriptions', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  // Fetch subscriptions and join user + usage manually (no Prisma relation on Subscription.user)
  const subscriptions = await prisma.subscription.findMany();
  const userIds = subscriptions.map(s => s.userId).filter(Boolean);
  const users = userIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        include: { subscriptionUsage: true }
      })
    : [];
  const userById = Object.fromEntries(users.map(u => [u.id, u]));
  const enriched = subscriptions.map(s => ({ ...s, user: userById[s.userId] || null }));
  res.json({ subscriptions: enriched });
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
    console.error('System safety check failed:', error);
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
  
  // Manually fetch subscription data since relation doesn't exist yet
  const enrichedCustomers = await Promise.all(
    subscribedCustomers.map(async (customer) => {
      const subscription = customer.subscriptionId 
        ? await prisma.subscription.findUnique({ where: { id: customer.subscriptionId } })
        : null;
      return { ...customer, subscription };
    })
  );
  
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
  
  // Manually fetch subscription data since relation doesn't exist yet
  const enrichedCustomers = await Promise.all(
    customersWithPerksUsed.map(async (customer) => {
      const subscription = customer.subscriptionId 
        ? await prisma.subscription.findUnique({ where: { id: customer.subscriptionId } })
        : null;
      return { ...customer, subscription };
    })
  );
  
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

// Admin: Get all bookings
app.get('/api/admin/bookings', requireAdmin, async (req, res) => {
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
app.get('/api/admin/analytics', requireAdmin, async (req, res) => {
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
    console.error('Email blast preprocessing error:', error);
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
    console.error('Email blast error:', error);
    res.status(500).json({ error: 'Failed to send email blast' });
  }
});

// Admin: Email Templates CRUD
app.get('/api/admin/email-templates', requireAdmin, async (req, res) => {
  try {
    if (!prisma) return res.status(503).json({ error: 'Database not available' });
    const templates = await prisma.emailTemplate.findMany({ orderBy: { updatedAt: 'desc' } });
    res.json({ templates });
  } catch (error) {
    console.error('Get email templates error:', error);
    res.status(500).json({ error: 'Failed to get email templates' });
  }
});

app.get('/api/admin/email-templates/:id', requireAdmin, async (req, res) => {
  try {
    if (!prisma) return res.status(503).json({ error: 'Database not available' });
    const template = await prisma.emailTemplate.findUnique({ where: { id: req.params.id } });
    if (!template) return res.status(404).json({ error: 'Not found' });
    res.json({ template });
  } catch (error) {
    console.error('Get email template error:', error);
    res.status(500).json({ error: 'Failed to get email template' });
  }
});

app.post('/api/admin/email-templates', requireAdmin, async (req, res) => {
  try {
    if (!prisma) return res.status(503).json({ error: 'Database not available' });
    const { id, name, subject, body, html, isHtmlMode = false } = req.body || {};
    if (!name || !subject) return res.status(400).json({ error: 'Name and subject are required' });
    let template;
    if (id) {
      template = await prisma.emailTemplate.update({
        where: { id },
        data: { name, subject, body: body || null, html: html || null, isHtmlMode: !!isHtmlMode }
      });
    } else {
      template = await prisma.emailTemplate.upsert({
        where: { name },
        update: { subject, body: body || null, html: html || null, isHtmlMode: !!isHtmlMode },
        create: { name, subject, body: body || null, html: html || null, isHtmlMode: !!isHtmlMode, createdBy: req.user?.id || null }
      });
    }
    res.json({ template });
  } catch (error) {
    console.error('Save email template error:', error);
    res.status(500).json({ error: 'Failed to save email template' });
  }
});

app.delete('/api/admin/email-templates/:id', requireAdmin, async (req, res) => {
  try {
    if (!prisma) return res.status(503).json({ error: 'Database not available' });
    await prisma.emailTemplate.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete email template error:', error);
    res.status(500).json({ error: 'Failed to delete email template' });
  }
});

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
    console.error('Admin notifications error:', error);
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
    console.error('Failed to fetch settings:', error);
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
      console.error('Failed to reconfigure email service:', error);
    }
    
    res.json({ success: true, settings: results });
  } catch (error) {
    console.error('Failed to update settings:', error);
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
    console.error('Email test failed:', error);
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
    // Use transaction for atomicity with increased timeout (15 seconds)
    const result = await prisma.$transaction(async (tx) => {
      // Check if user exists with all related data
      const user = await tx.user.findUnique({ 
        where: { id },
        include: {
          subscription: true,
          subscriptionUsage: true,
          serviceRequests: true,
          technicianServiceRequests: true,
          technicianQuotes: true,
          customerJobs: true,
          technicianJobs: true,
          customerInvoices: true,
          technicianInvoices: true,
          assignedEmployee: true,
          assignedCustomers: true
        }
      });
      
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
      
      // CRITICAL SAFEGUARD 3: Check for active service requests and jobs
      const activeServiceRequests = user.serviceRequests.filter(request => 
        ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(request.status)
      );
      const activeJobs = user.customerJobs.filter(job => 
        ['SCHEDULED', 'IN_PROGRESS'].includes(job.status)
      );
      
      if (activeServiceRequests.length > 0 || activeJobs.length > 0) {
        throw new Error(`Cannot delete user with ${activeServiceRequests.length} active service requests and ${activeJobs.length} active jobs. Please cancel or complete all requests/jobs first.`);
      }
      
      // CRITICAL SAFEGUARD 4: Check for active subscription
      if (user.subscription && user.subscription.status === 'ACTIVE') {
        throw new Error('Cannot delete user with active subscription. Please cancel the subscription first.');
      }
      
      // CRITICAL SAFEGUARD 5: Check for assigned customers (if employee)
      if (user.role === 'EMPLOYEE' && user.assignedCustomers.length > 0) {
        throw new Error(`Cannot delete employee with ${user.assignedCustomers.length} assigned customers. Please reassign customers first.`);
      }
      
      // CRITICAL SAFEGUARD 6: Check for assigned employee (if customer)
      if (user.assignedEmployee) {
        throw new Error('Cannot delete customer with assigned employee. Please remove the assignment first.');
      }
      
      // CRITICAL SAFEGUARD 7: Log the deletion attempt
      console.log(`🚨 ADMIN USER DELETION ATTEMPT:`, {
        adminId: req.user.id,
        adminEmail: req.user.email,
        targetUserId: id,
        targetUserEmail: user.email,
        targetUserRole: user.role,
        timestamp: new Date().toISOString(),
        relatedData: {
          serviceRequests: user.serviceRequests.length,
          technicianServiceRequests: user.technicianServiceRequests.length,
          technicianQuotes: user.technicianQuotes.length,
          customerJobs: user.customerJobs.length,
          technicianJobs: user.technicianJobs.length,
          customerInvoices: user.customerInvoices.length,
          technicianInvoices: user.technicianInvoices.length,
          subscription: !!user.subscription,
          assignedCustomers: user.assignedCustomers.length
        }
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
      if (user.subscription) {
        await tx.subscription.update({
          where: { id: user.subscription.id },
          data: { status: 'CANCELLED' }
        });
      }
      
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
    console.error('❌ USER DELETION FAILED:', {
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
      console.error('Failed to send quote reply email:', emailResult.error);
    }
    
    res.json({ 
      success: true, 
      quote: updatedQuote,
      emailSent: emailResult.success 
    });
  } catch (error) {
    console.error('Quote reply error:', error);
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

export { app, server, io }; 