import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔧 Environment configuration loading...');
console.log('🔍 Available environment variables:');
console.log('  - NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('  - DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('  - JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('  - STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
console.log('  - PORT:', process.env.PORT || 'undefined');

// Environment validation - warn but don't exit
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NODE_ENV'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn('⚠️  Missing environment variables:', missingVars.join(', '));
  console.warn('⚠️  Some features may not work properly');
  // Don't throw error - let the app start and handle missing vars gracefully
}

// Environment configuration
export const config = {
  // Server
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL,
  
  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  corsOrigins: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',') 
    : ['http://localhost:3000', 'http://localhost:3001'],
  // Additional production origins for Vercel deployments
  productionOrigins: [
    'https://household-services-zeta.vercel.app',
    'https://household-services-zeta-git-main.vercel.app',
    'https://household-services-zeta-git-develop.vercel.app',
    'https://household-services-zeta-git-feature.vercel.app'
  ],
  
  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  
  // Email
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    secure: process.env.SMTP_SECURE === 'true',
  },
  
  // Security
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  allowedFileTypes: process.env.ALLOWED_FILE_TYPES 
    ? process.env.ALLOWED_FILE_TYPES.split(',') 
    : ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  
  // Redis (for caching and sessions)
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
  },
  
  // Monitoring
  sentryDsn: process.env.SENTRY_DSN,
  
  // Feature flags
  features: {
    emailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
    fileUpload: process.env.ENABLE_FILE_UPLOAD === 'true',
    realTimeNotifications: process.env.ENABLE_REALTIME_NOTIFICATIONS === 'true',
    analytics: process.env.ENABLE_ANALYTICS === 'true',
  }
};

console.log('✅ Environment configuration loaded successfully');

// Validation helpers
export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
export const isTest = config.nodeEnv === 'test';

// Security helpers
export const getCorsOptions = () => {
  // For production, allow all Vercel domains to prevent CORS issues
  let allowedOrigins;
  
  if (isProduction) {
    // Allow all Vercel domains in production
    allowedOrigins = (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow all Vercel domains
      if (origin.includes('vercel.app') || origin.includes('localhost')) {
        return callback(null, true);
      }
      
      // Also allow any explicitly configured origins
      if (config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      return callback(null, true); // Allow all for now
    };
  } else {
    // Development: use specific origins
    allowedOrigins = config.corsOrigins.length > 0 
      ? config.corsOrigins 
      : ['http://localhost:3000', 'http://localhost:3001'];
  }

  console.log('🔧 CORS Configuration for', config.nodeEnv, ':', {
    type: typeof allowedOrigins,
    origins: typeof allowedOrigins === 'function' ? 'Dynamic function' : allowedOrigins
  });

  return {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  };
};

export const getHelmetOptions = () => ({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  } : false,
  crossOriginEmbedderPolicy: isProduction,
  crossOriginOpenerPolicy: isProduction,
  crossOriginResourcePolicy: isProduction,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: isProduction,
  ieNoOpen: true,
  noSniff: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: true,
  xssFilter: true,
}); 