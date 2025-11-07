import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

// Load environment variables
dotenv.config();

logger.info('🔧 Environment configuration loading...');

// Environment validation - FAIL FAST on missing critical variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NODE_ENV'
];

// Additional validation for production
const productionRequiredVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  const errorMsg = `❌ CRITICAL: Missing required environment variables: ${missingVars.join(', ')}. Application cannot start without these variables.`;
  logger.error(errorMsg);
  throw new Error(errorMsg);
}

// Validate JWT_SECRET strength in production
if (process.env.NODE_ENV === 'production') {
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    const errorMsg = '❌ CRITICAL: JWT_SECRET must be at least 32 characters long in production';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  // Check production-specific variables
  const missingProductionVars = productionRequiredVars.filter(varName => !process.env[varName]);
  if (missingProductionVars.length > 0) {
    logger.warn(`⚠️  Missing production environment variables: ${missingProductionVars.join(', ')}. Some features may not work properly.`);
  }
}

logger.info('✅ Environment configuration validated successfully', {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
  JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
  STRIPE_SECRET_KEY_EXISTS: !!process.env.STRIPE_SECRET_KEY
});

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
  // Additional production origins for Railway deployments
  productionOrigins: [
    'https://fixwell-services-platform-production.up.railway.app',
    'https://fixwell-services-platform-staging.up.railway.app'
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

logger.info('✅ Environment configuration loaded successfully');

// Validation helpers
export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
export const isTest = config.nodeEnv === 'test';

// Security helpers
export const getCorsOptions = () => {
  let allowedOrigins;
  
  if (isProduction) {
    // Production: Use configured origins + Railway domains
    const allowedOriginsList = [
      ...config.corsOrigins,
      ...config.productionOrigins,
      config.frontendUrl
    ].filter(Boolean);
    
    allowedOrigins = (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check against allowed origins list
      if (allowedOriginsList.includes(origin)) {
        return callback(null, true);
      }
      
      // Allow Railway domains (for dynamic deployments)
      if (origin.includes('.railway.app')) {
        return callback(null, true);
      }
      
      // Deny all other origins
      return callback(new Error('Not allowed by CORS'));
    };
  } else {
    // Development: use specific origins from config
    allowedOrigins = config.corsOrigins.length > 0 
      ? config.corsOrigins 
      : ['http://localhost:3000', 'http://localhost:3001'];
  }

  logger.debug('🔧 CORS Configuration', {
    environment: config.nodeEnv,
    type: typeof allowedOrigins,
    origins: typeof allowedOrigins === 'function' 
      ? `Dynamic function (checking ${config.corsOrigins.length} configured origins)` 
      : allowedOrigins
  });

  return {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept', 'X-Emergency-Token'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    preflightContinue: false,
    optionsSuccessStatus: 204
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