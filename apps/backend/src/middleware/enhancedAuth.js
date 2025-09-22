import jwt from 'jsonwebtoken';
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
        const key = `login_${identifier}`;
        
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
                console.log(`🧹 Cleaned up ${cleanedCount} expired sessions`);
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
