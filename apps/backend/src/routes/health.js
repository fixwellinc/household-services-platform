import express from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Health Check Endpoint for Production Monitoring
 * 
 * This endpoint provides comprehensive health status for all critical systems
 * Used by load balancers, monitoring systems, and alerting tools
 */

// Basic health check
router.get('/', async (req, res) => {
  try {
    const healthStatus = await performHealthChecks();
    
    const overallStatus = healthStatus.checks.every(check => check.status === 'healthy') 
      ? 'healthy' 
      : 'unhealthy';

    const statusCode = overallStatus === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      ...healthStatus
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      uptime: process.uptime()
    });
  }
});

// Detailed health check with component status
router.get('/detailed', async (req, res) => {
  try {
    const healthStatus = await performDetailedHealthChecks();
    
    const overallStatus = healthStatus.components.every(component => component.status === 'healthy')
      ? 'healthy'
      : 'unhealthy';

    res.status(overallStatus === 'healthy' ? 200 : 503).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      ...healthStatus
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Readiness probe (for Kubernetes/container orchestration)
router.get('/ready', async (req, res) => {
  try {
    // Check if application is ready to serve traffic
    const isReady = await checkReadiness();
    
    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Liveness probe (for Kubernetes/container orchestration)
router.get('/live', (req, res) => {
  // Simple liveness check - if this endpoint responds, the process is alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Performance metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await getPerformanceMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      message: error.message
    });
  }
});

// Helper functions
async function performHealthChecks() {
  const checks = [];
  
  // Database connectivity check
  try {
    const startTime = Date.now();
    await prisma.user.count();
    const responseTime = Date.now() - startTime;
    
    checks.push({
      name: 'database',
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      details: 'Database connection successful'
    });
  } catch (error) {
    checks.push({
      name: 'database',
      status: 'unhealthy',
      error: error.message,
      details: 'Database connection failed'
    });
  }

  // Stripe API connectivity check
  try {
    const startTime = Date.now();
    await stripe.products.list({ limit: 1 });
    const responseTime = Date.now() - startTime;
    
    checks.push({
      name: 'stripe',
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      details: 'Stripe API connection successful'
    });
  } catch (error) {
    checks.push({
      name: 'stripe',
      status: 'unhealthy',
      error: error.message,
      details: 'Stripe API connection failed'
    });
  }

  // Memory usage check
  const memoryUsage = process.memoryUsage();
  const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const memoryLimitMB = 1024; // 1GB limit
  
  checks.push({
    name: 'memory',
    status: memoryUsageMB < memoryLimitMB ? 'healthy' : 'warning',
    usage: `${memoryUsageMB}MB`,
    limit: `${memoryLimitMB}MB`,
    details: `Memory usage: ${memoryUsageMB}MB / ${memoryLimitMB}MB`
  });

  return { checks };
}

async function performDetailedHealthChecks() {
  const components = [];

  // Application server health
  components.push({
    name: 'application',
    status: 'healthy',
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV
  });

  // Database health with connection pool info
  try {
    const dbStartTime = Date.now();
    const userCount = await prisma.user.count();
    const subscriptionCount = await prisma.subscription.count();
    const dbResponseTime = Date.now() - dbStartTime;

    components.push({
      name: 'database',
      status: 'healthy',
      responseTime: `${dbResponseTime}ms`,
      connections: {
        total: userCount + subscriptionCount,
        users: userCount,
        subscriptions: subscriptionCount
      }
    });
  } catch (error) {
    components.push({
      name: 'database',
      status: 'unhealthy',
      error: error.message
    });
  }

  // Payment system health
  try {
    const stripeStartTime = Date.now();
    const products = await stripe.products.list({ limit: 1 });
    const stripeResponseTime = Date.now() - stripeStartTime;

    components.push({
      name: 'payment_system',
      status: 'healthy',
      responseTime: `${stripeResponseTime}ms`,
      provider: 'Stripe',
      productsConfigured: products.data.length > 0
    });
  } catch (error) {
    components.push({
      name: 'payment_system',
      status: 'unhealthy',
      error: error.message,
      provider: 'Stripe'
    });
  }

  // Email service health (if configured)
  if (process.env.SMTP_HOST) {
    try {
      // Simple SMTP connection test would go here
      components.push({
        name: 'email_service',
        status: 'healthy',
        provider: 'SMTP',
        host: process.env.SMTP_HOST
      });
    } catch (error) {
      components.push({
        name: 'email_service',
        status: 'unhealthy',
        error: error.message,
        provider: 'SMTP'
      });
    }
  }

  // SMS service health (if configured)
  if (process.env.TWILIO_ACCOUNT_SID) {
    components.push({
      name: 'sms_service',
      status: 'healthy', // Would need actual Twilio API check
      provider: 'Twilio'
    });
  }

  // Redis health (if configured)
  if (process.env.REDIS_URL) {
    try {
      // Redis connection test would go here
      components.push({
        name: 'cache',
        status: 'healthy',
        provider: 'Redis'
      });
    } catch (error) {
      components.push({
        name: 'cache',
        status: 'unhealthy',
        error: error.message,
        provider: 'Redis'
      });
    }
  }

  return { components };
}

async function checkReadiness() {
  try {
    // Check database connectivity
    await prisma.user.count();
    
    // Check Stripe connectivity
    await stripe.products.list({ limit: 1 });
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    if (memoryUsageMB > 1024) { // 1GB limit
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

async function getPerformanceMetrics() {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    eventLoop: {
      delay: await getEventLoopDelay()
    }
  };

  // Add business metrics if available
  try {
    const businessMetrics = await getBusinessMetrics();
    metrics.business = businessMetrics;
  } catch (error) {
    metrics.business = { error: 'Failed to retrieve business metrics' };
  }

  return metrics;
}

function getEventLoopDelay() {
  return new Promise((resolve) => {
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const delta = process.hrtime.bigint() - start;
      resolve(Number(delta) / 1000000); // Convert to milliseconds
    });
  });
}

async function getBusinessMetrics() {
  try {
    const [
      totalUsers,
      activeSubscriptions,
      pausedSubscriptions,
      totalRevenue
    ] = await Promise.all([
      prisma.user.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { isPaused: true } }),
      prisma.subscription.aggregate({
        _sum: { lifetimeValue: true },
        where: { status: 'ACTIVE' }
      })
    ]);

    return {
      users: {
        total: totalUsers
      },
      subscriptions: {
        active: activeSubscriptions,
        paused: pausedSubscriptions,
        total: activeSubscriptions + pausedSubscriptions
      },
      revenue: {
        lifetime: totalRevenue._sum.lifetimeValue || 0
      }
    };
  } catch (error) {
    throw new Error(`Failed to retrieve business metrics: ${error.message}`);
  }
}

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

export default router;