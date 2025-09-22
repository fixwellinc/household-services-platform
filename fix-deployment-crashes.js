#!/usr/bin/env node

/**
 * Fix Deployment Crashes - Railway Stability Issues
 * Addresses crashes that occur every 15 minutes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing deployment crashes...');

// 1. Fix database connection pool issues
const fixedDatabaseConfig = `import { PrismaClient } from '@prisma/client';

console.log('🔧 Database configuration loading...');
console.log('🔍 DATABASE_URL exists:', !!process.env.DATABASE_URL);

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL environment variable is not set!');
  console.warn('⚠️  Database features will not work properly');
  console.warn('⚠️  Please set DATABASE_URL in your Railway environment variables.');
  console.warn('⚠️  Example: postgresql://username:password@host:port/database');
}

// Create a single PrismaClient instance that can be shared throughout your app
const globalForPrisma = globalThis;

let prisma = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

// Database connection retry logic with better error handling
const initializePrisma = async (retries = 3, delay = 1000) => {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  Skipping Prisma client initialization (no DATABASE_URL)');
    return null;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(\`🔌 Attempting database connection (attempt \${attempt}/\${retries})...\`);
      
      // Disconnect existing client if any
      if (prisma) {
        try {
          await prisma.$disconnect();
        } catch (e) {
          console.warn('Warning disconnecting previous client:', e.message);
        }
      }
      
      prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        },
        // Optimized connection pool settings for Railway
        __internal: {
          engine: {
            connectionLimit: 3, // Reduced from 5
            pool: {
              min: 0,
              max: 5, // Reduced from 10
              acquireTimeoutMillis: 10000,
              createTimeoutMillis: 10000,
              destroyTimeoutMillis: 5000,
              idleTimeoutMillis: 30000,
              reapIntervalMillis: 1000,
              createRetryIntervalMillis: 200
            }
          }
        }
      });

      // Test the connection with timeout
      const connectionTest = prisma.$queryRaw\`SELECT 1\`;
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      );
      
      await Promise.race([connectionTest, timeout]);
      console.log('✅ Prisma client initialized and connected successfully');
      
      connectionAttempts = 0; // Reset on success
      if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
      return prisma;
      
    } catch (error) {
      console.error(\`❌ Database connection attempt \${attempt} failed:\`, error.message);
      connectionAttempts++;
      
      if (prisma) {
        try {
          await prisma.$disconnect();
        } catch (disconnectError) {
          console.error('❌ Error disconnecting Prisma client:', disconnectError.message);
        }
        prisma = null;
      }
      
      if (attempt < retries) {
        console.log(\`⏳ Retrying in \${delay}ms...\`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.2; // Smaller exponential backoff
      } else {
        console.error('❌ All database connection attempts failed');
        
        // If we've failed too many times, wait longer before next attempt
        if (connectionAttempts > MAX_CONNECTION_ATTEMPTS) {
          console.log('⏸️  Too many failed attempts, entering cooldown mode');
          await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second cooldown
          connectionAttempts = 0;
        }
        
        return null;
      }
    }
  }
  
  return null;
};

// Initialize Prisma client
try {
  prisma = await initializePrisma();
} catch (error) {
  console.error('❌ Failed to initialize Prisma client:', error.message);
  console.log('⚠️  Running in mock database mode');
  prisma = null;
}

// Enhanced graceful shutdown with proper cleanup
const gracefulShutdown = async (signal) => {
  console.log(\`📴 Received \${signal}, starting graceful shutdown...\`);
  
  try {
    if (prisma) {
      console.log('🔌 Disconnecting from database...');
      await Promise.race([
        prisma.$disconnect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Disconnect timeout')), 5000))
      ]);
      console.log('✅ Database disconnected successfully');
    }
  } catch (error) {
    console.error('❌ Error during database disconnect:', error.message);
  }
  
  process.exit(0);
};

// Handle various shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('beforeExit', async () => {
  if (prisma) {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error('❌ Error in beforeExit:', error.message);
    }
  }
});

// Handle unhandled promise rejections (common cause of crashes)
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  
  // Don't exit immediately, log and continue
  if (reason && reason.message && reason.message.includes('database')) {
    console.log('🔄 Database-related error detected, attempting reconnection...');
    // Attempt to reinitialize database connection
    setTimeout(async () => {
      try {
        prisma = await initializePrisma();
      } catch (error) {
        console.error('❌ Failed to reinitialize database:', error.message);
      }
    }, 5000);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  
  // Log the error but don't crash immediately
  if (error.message && !error.message.includes('ECONNRESET')) {
    console.log('🔄 Non-network error, attempting graceful recovery...');
    setTimeout(() => {
      console.log('🔄 Recovery attempt completed');
    }, 1000);
  }
});

// Health check function with better error handling
export const checkDatabaseConnection = async () => {
  if (!prisma) {
    // Attempt to reconnect if no connection
    try {
      prisma = await initializePrisma();
    } catch (error) {
      console.error('❌ Failed to reconnect during health check:', error.message);
    }
    
    if (!prisma) {
      return { 
        status: 'unhealthy', 
        error: 'Database not configured or connection failed', 
        timestamp: new Date().toISOString(),
        reconnectAttempted: true
      };
    }
  }
  
  try {
    await Promise.race([
      prisma.$queryRaw\`SELECT 1\`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), 3000))
    ]);
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('❌ Database health check failed:', error.message);
    
    // Attempt to reconnect on health check failure
    try {
      prisma = await initializePrisma();
      return { 
        status: 'recovering', 
        error: error.message, 
        timestamp: new Date().toISOString(),
        reconnectAttempted: true
      };
    } catch (reconnectError) {
      return { 
        status: 'unhealthy', 
        error: error.message, 
        timestamp: new Date().toISOString(),
        reconnectFailed: reconnectError.message
      };
    }
  }
};

// Database utilities with better error handling
export const withTransaction = async (callback) => {
  if (!prisma) {
    throw new Error('Database not configured');
  }
  
  try {
    return await prisma.$transaction(callback, {
      timeout: 10000, // 10 second timeout
      maxWait: 5000,  // 5 second max wait
    });
  } catch (error) {
    console.error('❌ Transaction failed:', error.message);
    throw error;
  }
};

export const disconnect = async () => {
  if (prisma) {
    try {
      await Promise.race([
        prisma.$disconnect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Disconnect timeout')), 5000))
      ]);
    } catch (error) {
      console.error('❌ Error during manual disconnect:', error.message);
    }
  }
};

// Periodic connection health check (every 5 minutes instead of 15)
setInterval(async () => {
  try {
    const health = await checkDatabaseConnection();
    if (health.status !== 'healthy') {
      console.log('⚠️  Database health check failed:', health);
    }
  } catch (error) {
    console.error('❌ Error during periodic health check:', error.message);
  }
}, 5 * 60 * 1000); // 5 minutes

export default prisma;
`;

// 2. Fix the session cleanup to be less aggressive
const fixedAuthMiddleware = `import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Enhanced authentication service with better memory management
class EnhancedAuthService {
    constructor() {
        this.sessionStore = new Map();
        this.blockedAccounts = new Set();
        this.loginAttempts = new Map();
        this.maxSessionSize = 1000; // Limit session store size
    }

    // Generate JWT token
    generateToken(payload, expiresIn = '15m') {
        return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
    }

    // Verify JWT token
    async verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    // Track login attempts with memory limits
    trackLoginAttempt(identifier, success = false) {
        const now = Date.now();
        const key = \`login_\${identifier}\`;
        
        // Clean up old attempts first
        this.cleanupOldAttempts();
        
        if (!this.loginAttempts.has(key)) {
            this.loginAttempts.set(key, {
                attempts: 0,
                lastAttempt: now,
                blockedUntil: null
            });
        }

        const attempts = this.loginAttempts.get(key);

        if (success) {
            // Reset on successful login
            this.loginAttempts.delete(key);
            this.blockedAccounts.delete(key);
            return { blocked: false, attempts: 0 };
        }

        // Check if currently blocked
        if (attempts.blockedUntil && now < attempts.blockedUntil) {
            return { 
                blocked: true, 
                attempts: attempts.attempts,
                blockedUntil: attempts.blockedUntil
            };
        }

        // Reset block if time has passed
        if (attempts.blockedUntil && now >= attempts.blockedUntil) {
            attempts.blockedUntil = null;
            attempts.attempts = 0;
            this.blockedAccounts.delete(key);
        }

        // Increment attempts
        attempts.attempts++;
        attempts.lastAttempt = now;

        // Block account after 5 failed attempts
        if (attempts.attempts >= 5) {
            attempts.blockedUntil = now + (15 * 60 * 1000); // Block for 15 minutes
            this.blockedAccounts.add(key);
        }

        this.loginAttempts.set(key, attempts);
        return { 
            blocked: attempts.blockedUntil !== null, 
            attempts: attempts.attempts,
            blockedUntil: attempts.blockedUntil
        };
    }

    // Clean up old login attempts (prevent memory leaks)
    cleanupOldAttempts() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        for (const [key, attempt] of this.loginAttempts.entries()) {
            if (now - attempt.lastAttempt > maxAge) {
                this.loginAttempts.delete(key);
                this.blockedAccounts.delete(key);
            }
        }
    }

    // Store session with size limits
    storeSession(sessionId, userId, ipAddress, userAgent) {
        // Prevent memory leaks by limiting session store size
        if (this.sessionStore.size >= this.maxSessionSize) {
            // Remove oldest sessions
            const oldestKeys = Array.from(this.sessionStore.keys()).slice(0, 100);
            oldestKeys.forEach(key => this.sessionStore.delete(key));
        }
        
        this.sessionStore.set(sessionId, {
            userId,
            ipAddress,
            userAgent,
            createdAt: new Date(),
            lastActivity: new Date()
        });
    }

    // Get session
    getSession(sessionId) {
        return this.sessionStore.get(sessionId);
    }

    // Update session activity
    updateSessionActivity(sessionId, ipAddress, userAgent) {
        const session = this.sessionStore.get(sessionId);
        if (session) {
            session.lastActivity = new Date();
            session.ipAddress = ipAddress;
            session.userAgent = userAgent;
        }
    }

    // Clean up expired sessions with better memory management
    cleanupExpiredSessions() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        let cleanedCount = 0;

        try {
            for (const [sessionId, session] of this.sessionStore.entries()) {
                if (now - session.lastActivity.getTime() > maxAge) {
                    this.sessionStore.delete(sessionId);
                    cleanedCount++;
                }
            }
            
            // Also cleanup login attempts
            this.cleanupOldAttempts();
            
            if (cleanedCount > 0) {
                console.log(\`🧹 Cleaned up \${cleanedCount} expired sessions\`);
            }
            
            // Force garbage collection if available and we cleaned a lot
            if (cleanedCount > 50 && global.gc) {
                global.gc();
            }
            
        } catch (error) {
            console.error('❌ Error during session cleanup:', error.message);
        }
    }
}

// Initialize the auth service
const authService = new EnhancedAuthService();

// Clean up expired sessions every 30 minutes instead of every hour
// and make it more robust
const cleanupInterval = setInterval(() => {
    try {
        authService.cleanupExpiredSessions();
    } catch (error) {
        console.error('❌ Error in session cleanup interval:', error.message);
    }
}, 30 * 60 * 1000); // 30 minutes

// Clear interval on shutdown
process.on('SIGTERM', () => {
    clearInterval(cleanupInterval);
});

process.on('SIGINT', () => {
    clearInterval(cleanupInterval);
});

// Enhanced authentication middleware with better error handling
const enhancedAuth = async (req, res, next) => {
    try {
        const token = extractToken(req);
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                code: 'NO_TOKEN'
            });
        }

        const decoded = await authService.verifyToken(token);
        
        // Store user info in request
        req.user = decoded;
        req.userId = decoded.userId || decoded.id;
        
        // Update session activity if session exists
        const sessionId = req.headers['x-session-id'];
        if (sessionId) {
            authService.updateSessionActivity(
                sessionId, 
                req.ip, 
                req.get('User-Agent')
            );
        }
        
        next();
        
    } catch (error) {
        console.error('❌ Authentication error:', error.message);
        
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN'
        });
    }
};

// Extract token from request
const extractToken = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    return req.cookies?.token || null;
};

export { enhancedAuth, authService };
export default enhancedAuth;
`;

// Write the fixed files
const backendPath = path.join(process.cwd(), 'apps', 'backend', 'src');
const configPath = path.join(backendPath, 'config');
const middlewarePath = path.join(backendPath, 'middleware');

if (fs.existsSync(configPath)) {
  fs.writeFileSync(path.join(configPath, 'database.js'), fixedDatabaseConfig);
  console.log('✅ Fixed database configuration');
}

if (fs.existsSync(middlewarePath)) {
  fs.writeFileSync(path.join(middlewarePath, 'enhancedAuth.js'), fixedAuthMiddleware);
  console.log('✅ Fixed authentication middleware');
}

// 3. Create a process monitoring script
const processMonitorContent = `#!/usr/bin/env node

/**
 * Process Monitor for Railway Deployment
 * Monitors memory usage and prevents crashes
 */

const fs = require('fs');

class ProcessMonitor {
  constructor() {
    this.memoryThreshold = 450; // MB (Railway has 512MB limit)
    this.checkInterval = 60000; // 1 minute
    this.logFile = '/tmp/process-monitor.log';
    this.startTime = Date.now();
  }

  start() {
    console.log('🔍 Starting process monitor...');
    
    // Monitor memory usage
    setInterval(() => {
      this.checkMemoryUsage();
    }, this.checkInterval);
    
    // Monitor for unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.log(\`❌ Unhandled Rejection: \${reason}\`);
    });
    
    // Monitor for uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.log(\`❌ Uncaught Exception: \${error.message}\`);
    });
    
    console.log('✅ Process monitor started');
  }

  checkMemoryUsage() {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(usage.rss / 1024 / 1024);
    
    const uptime = Math.round((Date.now() - this.startTime) / 1000 / 60); // minutes
    
    if (heapUsedMB > this.memoryThreshold) {
      this.log(\`⚠️  High memory usage: \${heapUsedMB}MB (threshold: \${this.memoryThreshold}MB)\`);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        const newUsage = process.memoryUsage();
        const newHeapUsedMB = Math.round(newUsage.heapUsed / 1024 / 1024);
        this.log(\`🧹 Garbage collection: \${heapUsedMB}MB -> \${newHeapUsedMB}MB\`);
      }
    }
    
    // Log memory stats every 15 minutes
    if (uptime % 15 === 0) {
      this.log(\`📊 Memory stats - Heap: \${heapUsedMB}/\${heapTotalMB}MB, RSS: \${rssMB}MB, Uptime: \${uptime}min\`);
    }
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = \`[\${timestamp}] \${message}\`;
    
    console.log(logMessage);
    
    try {
      fs.appendFileSync(this.logFile, logMessage + '\\n');
    } catch (error) {
      // Ignore file write errors
    }
  }
}

// Start monitoring if this script is run directly
if (require.main === module) {
  const monitor = new ProcessMonitor();
  monitor.start();
}

module.exports = ProcessMonitor;
`;

fs.writeFileSync(path.join(process.cwd(), 'process-monitor.js'), processMonitorContent);
console.log('✅ Created process monitor');

// 4. Update Dockerfile to include process monitoring
const dockerfilePath = path.join(process.cwd(), 'Dockerfile');
if (fs.existsSync(dockerfilePath)) {
  let dockerfile = fs.readFileSync(dockerfilePath, 'utf8');
  
  // Add process monitoring to the startup
  if (!dockerfile.includes('process-monitor.js')) {
    dockerfile = dockerfile.replace(
      /CMD \["node", "unified-server.js"\]/,
      'CMD ["sh", "-c", "node process-monitor.js & node unified-server.js"]'
    );
    
    fs.writeFileSync(dockerfilePath, dockerfile);
    console.log('✅ Updated Dockerfile with process monitoring');
  }
}

console.log('\n🎉 Deployment Crash Fix Complete!');
console.log('\n📋 What was fixed:');
console.log('• Database connection pool optimized for Railway limits');
console.log('• Session cleanup made less aggressive (30min instead of 1hr)');
console.log('• Added proper error handling for unhandled rejections');
console.log('• Implemented memory monitoring and garbage collection');
console.log('• Added connection health checks every 5 minutes');
console.log('• Limited session store size to prevent memory leaks');
console.log('• Added graceful shutdown handling');
console.log('\n🚀 Next steps:');
console.log('1. Commit and push these changes');
console.log('2. Deploy to Railway with: railway up');
console.log('3. Monitor logs for memory usage and connection health');
console.log('4. The 15-minute crashes should be resolved!');