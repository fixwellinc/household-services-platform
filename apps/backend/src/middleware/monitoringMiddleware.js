/**
 * Monitoring Middleware
 * Integrates monitoring services with the application
 */

const ProductionMonitoringService = require('../services/productionMonitoringService');
const ErrorTrackingService = require('../services/errorTrackingService');
const SecurityMonitoringService = require('../services/securityMonitoringService');

// Initialize monitoring services
const productionMonitoring = new ProductionMonitoringService();
const errorTracking = new ErrorTrackingService();
const securityMonitoring = new SecurityMonitoringService();

// Request tracking middleware
const requestTrackingMiddleware = (req, res, next) => {
    const startTime = Date.now();
    
    // Track request metrics
    const requestMetrics = productionMonitoring.getMetric('requests') || { 
        total: 0, 
        rate: 0, 
        methods: {}, 
        endpoints: {} 
    };
    
    requestMetrics.total++;
    requestMetrics.methods[req.method] = (requestMetrics.methods[req.method] || 0) + 1;
    requestMetrics.endpoints[req.path] = (requestMetrics.endpoints[req.path] || 0) + 1;
    
    productionMonitoring.updateMetric('requests', requestMetrics);
    
    // Override res.end to capture response metrics
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        const responseTime = Date.now() - startTime;
        
        // Track response metrics
        const responseMetrics = productionMonitoring.getMetric('responses') || {
            averageTime: 0,
            statusCodes: {},
            slowRequests: 0
        };
        
        // Update average response time
        const totalRequests = requestMetrics.total;
        responseMetrics.averageTime = ((responseMetrics.averageTime * (totalRequests - 1)) + responseTime) / totalRequests;
        
        // Track status codes
        responseMetrics.statusCodes[res.statusCode] = (responseMetrics.statusCodes[res.statusCode] || 0) + 1;
        
        // Track slow requests (>1000ms)
        if (responseTime > 1000) {
            responseMetrics.slowRequests++;
        }
        
        productionMonitoring.updateMetric('responses', responseMetrics);
        
        // Track security events for suspicious requests
        if (res.statusCode >= 400) {
            const securityEventType = getSecurityEventType(req, res);
            if (securityEventType) {
                securityMonitoring.trackSecurityEvent(securityEventType, {
                    ip: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('User-Agent'),
                    userId: req.user?.id,
                    sessionId: req.sessionID,
                    url: req.originalUrl,
                    method: req.method,
                    headers: req.headers,
                    payload: req.body,
                    statusCode: res.statusCode,
                    responseTime
                });
            }
        }
        
        originalEnd.call(this, chunk, encoding);
    };
    
    next();
};

// Error tracking middleware
const errorTrackingMiddleware = (error, req, res, next) => {
    // Track the error
    const errorId = errorTracking.trackError(error, {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        sessionId: req.sessionID,
        url: req.originalUrl,
        method: req.method,
        headers: req.headers,
        body: req.body,
        params: req.params,
        query: req.query
    });
    
    // Update error metrics
    const errorMetrics = productionMonitoring.getMetric('errors') || {
        total: 0,
        rate: 0,
        types: {},
        recent: []
    };
    
    errorMetrics.total++;
    errorMetrics.types[error.name] = (errorMetrics.types[error.name] || 0) + 1;
    errorMetrics.recent.push({
        id: errorId,
        timestamp: new Date().toISOString(),
        message: error.message,
        type: error.name
    });
    
    // Keep only last 10 recent errors
    if (errorMetrics.recent.length > 10) {
        errorMetrics.recent = errorMetrics.recent.slice(-10);
    }
    
    productionMonitoring.updateMetric('errors', errorMetrics);
    
    // Add error ID to response headers for debugging
    res.setHeader('X-Error-ID', errorId);
    
    next(error);
};

// Security monitoring middleware
const securityMonitoringMiddleware = (req, res, next) => {
    // Check if IP is blocked
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (securityMonitoring.isIPBlocked(clientIP)) {
        return res.status(403).json({
            success: false,
            error: 'Access denied',
            message: 'Your IP address has been blocked due to suspicious activity'
        });
    }
    
    // Detect potential security threats
    const threats = detectSecurityThreats(req);
    
    for (const threat of threats) {
        securityMonitoring.trackSecurityEvent(threat.type, {
            ip: clientIP,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id,
            sessionId: req.sessionID,
            url: req.originalUrl,
            method: req.method,
            headers: req.headers,
            payload: req.body,
            threat: threat.details
        });
    }
    
    next();
};

// Rate limiting middleware with monitoring
const rateLimitingMiddleware = (options = {}) => {
    const {
        windowMs = 60000, // 1 minute
        maxRequests = 100,
        skipSuccessfulRequests = false,
        skipFailedRequests = false
    } = options;
    
    const requestCounts = new Map();
    
    return (req, res, next) => {
        const clientIP = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Clean up old entries
        for (const [ip, requests] of requestCounts.entries()) {
            const filteredRequests = requests.filter(timestamp => timestamp > windowStart);
            if (filteredRequests.length === 0) {
                requestCounts.delete(ip);
            } else {
                requestCounts.set(ip, filteredRequests);
            }
        }
        
        // Get current request count for IP
        const ipRequests = requestCounts.get(clientIP) || [];
        const currentCount = ipRequests.length;
        
        if (currentCount >= maxRequests) {
            // Track rate limiting event
            securityMonitoring.trackSecurityEvent('rate_limit_exceeded', {
                ip: clientIP,
                userAgent: req.get('User-Agent'),
                url: req.originalUrl,
                method: req.method,
                requestCount: currentCount,
                limit: maxRequests
            });
            
            return res.status(429).json({
                success: false,
                error: 'Too many requests',
                message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds.`,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
        
        // Add current request timestamp
        ipRequests.push(now);
        requestCounts.set(clientIP, ipRequests);
        
        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - currentCount - 1));
        res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
        
        next();
    };
};

// Authentication monitoring middleware
const authMonitoringMiddleware = (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
        // Monitor authentication events
        if (req.path.includes('/auth/')) {
            const isSuccess = data.success === true;
            const eventType = isSuccess ? 'authentication_success' : 'authentication_failed';
            
            securityMonitoring.trackSecurityEvent(eventType, {
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                url: req.originalUrl,
                method: req.method,
                userId: data.user?.id,
                email: req.body?.email,
                success: isSuccess,
                errorMessage: data.error
            });
        }
        
        originalJson.call(this, data);
    };
    
    next();
};

// Helper functions
function getSecurityEventType(req, res) {
    const statusCode = res.statusCode;
    const path = req.path.toLowerCase();
    
    if (statusCode === 401) {
        return 'authentication_failed';
    } else if (statusCode === 403) {
        return 'authorization_failed';
    } else if (statusCode === 404 && path.includes('admin')) {
        return 'admin_path_probe';
    } else if (statusCode >= 500) {
        return 'server_error';
    }
    
    return null;
}

function detectSecurityThreats(req) {
    const threats = [];
    const url = req.originalUrl.toLowerCase();
    const body = JSON.stringify(req.body || {}).toLowerCase();
    const query = JSON.stringify(req.query || {}).toLowerCase();
    
    // SQL Injection detection
    const sqlPatterns = [
        /union\s+select/i,
        /or\s+1\s*=\s*1/i,
        /'\s*or\s*'/i,
        /'\s*;\s*drop\s+table/i
    ];
    
    for (const pattern of sqlPatterns) {
        if (pattern.test(url) || pattern.test(body) || pattern.test(query)) {
            threats.push({
                type: 'sql_injection',
                details: { pattern: pattern.toString(), location: 'request' }
            });
            break;
        }
    }
    
    // XSS detection
    const xssPatterns = [
        /<script[^>]*>/i,
        /javascript:/i,
        /on\w+\s*=/i
    ];
    
    for (const pattern of xssPatterns) {
        if (pattern.test(url) || pattern.test(body) || pattern.test(query)) {
            threats.push({
                type: 'xss_attempt',
                details: { pattern: pattern.toString(), location: 'request' }
            });
            break;
        }
    }
    
    // Directory traversal detection
    if (url.includes('../') || url.includes('..\\') || body.includes('../')) {
        threats.push({
            type: 'directory_traversal',
            details: { location: 'request' }
        });
    }
    
    // Admin path probing
    const adminPaths = ['/admin', '/administrator', '/wp-admin', '/phpmyadmin'];
    if (adminPaths.some(path => url.includes(path)) && !req.user?.role?.includes('ADMIN')) {
        threats.push({
            type: 'admin_path_probe',
            details: { path: url }
        });
    }
    
    // Suspicious user agents
    const suspiciousUserAgents = [
        /sqlmap/i,
        /nikto/i,
        /nessus/i,
        /burp/i,
        /nmap/i
    ];
    
    const userAgent = req.get('User-Agent') || '';
    for (const pattern of suspiciousUserAgents) {
        if (pattern.test(userAgent)) {
            threats.push({
                type: 'suspicious_user_agent',
                details: { userAgent }
            });
            break;
        }
    }
    
    return threats;
}

// Health check middleware
const healthCheckMiddleware = (req, res, next) => {
    if (req.path === '/health') {
        const healthStatus = productionMonitoring.getHealthStatus();
        return res.json(healthStatus);
    }
    next();
};

module.exports = {
    requestTrackingMiddleware,
    errorTrackingMiddleware,
    securityMonitoringMiddleware,
    rateLimitingMiddleware,
    authMonitoringMiddleware,
    healthCheckMiddleware,
    
    // Export monitoring services for use in other parts of the application
    productionMonitoring,
    errorTracking,
    securityMonitoring
};