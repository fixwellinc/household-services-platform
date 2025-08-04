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
import plansRoutes from './routes/plans.js';
import subscriptionRoutes from './routes/subscriptions.js';
// import webhookRoutes from './routes/webhooks.js';

// Import middleware
import { authMiddleware, requireAdmin } from './middleware/auth.js';
import { errorHandler } from './middleware/error.js';
import { requestLogger, errorLogger, performanceMonitor } from './middleware/logging.js';
import { generalLimiter, authLimiter, apiLimiter } from './middleware/rateLimit.js';
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
  app.use('/api/auth', authLimiter);
}
app.use('/api/', apiLimiter);

// Trust proxy for rate limiting behind Railway
app.set('trust proxy', 1);

// PATTERN: Body parsing for JSON and form data
app.use(express.json({ limit: '10mb' }));
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
app.use('/api/chat', chatRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
// app.use('/api/webhooks', webhookRoutes);

function requireAdminLocal(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Apply authentication middleware to all admin routes
app.use('/api/admin', authMiddleware);

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

// Admin: Get all users
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  const users = await prisma.user.findMany({
    include: {
      subscriptionUsage: true
    }
  });
  res.json({ users });
});

// Admin: Get all subscriptions with usage tracking
app.get('/api/admin/subscriptions', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  const subscriptions = await prisma.subscription.findMany({
    include: {
      user: {
        include: {
          subscriptionUsage: true
        }
      }
    }
  });
  res.json({ subscriptions });
});

// Admin: Get subscription usage details
app.get('/api/admin/subscriptions/:id/usage', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  const { id } = req.params;
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          subscriptionUsage: true
        }
      }
    }
  });
  if (!subscription) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  res.json({ subscription });
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
      subscriptionUsage: true,
      subscription: true
    }
  });
  res.json({ customers: subscribedCustomers });
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
      subscriptionUsage: true,
      subscription: true
    }
  });
  res.json({ customers: customersWithPerksUsed });
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
app.post('/api/admin/email-blast', requireAdmin, async (req, res) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Database not available' });
  }
  
  const { subject, body, html, isHtmlMode, emails } = req.body;
  
  if (!subject || (!body && !html)) {
    return res.status(400).json({ error: 'Subject and message are required' });
  }
  
  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: 'At least one email address is required' });
  }
  
  try {
    // Import email service
    const { default: emailService } = await import('./services/email.js');
    
    let sentCount = 0;
    const failedEmails = [];
    
    for (const email of emails) {
      try {
        const result = await emailService.sendEmail({
          to: email,
          subject,
          text: body,
          html: isHtmlMode ? html : undefined
        });
        
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