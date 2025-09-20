/**
 * Production Security Middleware Integration
 * Combines all security measures into a comprehensive middleware stack
 */

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const compression = require('compression');
const morgan = require('morgan');
const winston = require('winston');

const ProductionSecurityConfig = require('../config/productionSecurity');
const { 
    requestTrackingMiddleware,
    errorTrackingMiddleware,
    securityMonitoringMiddleware,
    rateLimitingMiddleware,
    authMonitoringMiddleware,
    healthCheckMiddleware
} = require('./monitoringMiddleware');

const {
    enhancedAuth,
    enhancedRequireRole,
    adminIPRestriction
} = require('./enhancedAuth');

class ProductionSecurityMiddleware {
    constructor() {
        this.securityConfig = new ProductionSecurityConfig();
        this.logger = this.setupLogger();
        this.rateLimiters = this.setupRateLimiters();
    }

    setupLogger() {
        return winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'security-middleware' },
            transports: [
                new winston.transports.File({ 
                    filename: 'logs/security.log',
                    level: 'warn'
                }),
                new winston.transports.File({ 
                    filename: 'logs/access.log'
                }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }

    setupRateLimiters() {
        const configs = this.securityConfig.getRateLimitConfigs();
        const slowDownConfigs = this.securityConfig.getSlowDownConfigs();

        return {
            general: configs.general,
            auth: configs.auth,
            admin: configs.admin,
            passwordReset: configs.passwordReset,
            authSlowDown: slowDownConfigs.auth
        };
    }

    // Core security middleware stack
    getCoreSecurityMiddleware() {
        return [
            // Trust proxy for Railway deployment
            this.trustProxyMiddleware(),
            
            // Health check (before other middleware)
            healthCheckMiddleware,
            
            // Request logging
            this.requestLoggingMiddleware(),
            
            // HTTPS enforcement
            this.securityConfig.httpsEnforcementMiddleware(),
            
            // Security headers
            this.securityConfig.securityHeadersMiddleware(),
            
            // CORS configuration
            this.corsMiddleware(),
            
            // Request compression
            this.compressionMiddleware(),
            
            // Request sanitization
            this.securityConfig.requestSanitizationMiddleware(),
            
            // Security monitoring
            securityMonitoringMiddleware,
            
            // Request tracking
            requestTrackingMiddleware,
            
            // General rate limiting
            this.rateLimiters.general
        ];
    }

    // Authentication-specific middleware
    getAuthMiddleware() {
        return [
            // Slow down repeated auth attempts
            this.rateLimiters.authSlowDown,
            
            // Auth-specific rate limiting
            this.rateLimiters.auth,
            
            // Authentication monitoring
            authMonitoringMiddleware,
            
            // Input validation (applied per route)
            // this.securityConfig.validateRequest(schema)
        ];
    }

    // Admin panel middleware
    getAdminMiddleware() {
        return [
            // IP restriction for admin panel
            adminIPRestriction(),
            
            // Admin-specific rate limiting
            this.rateLimiters.admin,
            
            // Enhanced authentication
            enhancedAuth,
            
            // Admin role requirement
            enhancedRequireRole(['ADMIN']),
            
            // Additional admin security checks
            this.adminSecurityChecks()
        ];
    }

    // API-specific middleware
    getAPIMiddleware() {
        return [
            // API versioning
            this.apiVersioningMiddleware(),
            
            // API key validation (if required)
            this.apiKeyValidationMiddleware(),
            
            // Request/response validation
            this.apiValidationMiddleware()
        ];
    }

    // Error handling middleware (should be last)
    getErrorHandlingMiddleware() {
        return [
            // Error tracking
            errorTrackingMiddleware,
            
            // Final error handler
            this.finalErrorHandler()
        ];
    }

    // Individual middleware implementations
    trustProxyMiddleware() {
        return (req, res, next) => {
            // Configure Express to trust Railway proxy
            req.app.set('trust proxy', this.securityConfig.trustedProxies);
            next();
        };
    }

    requestLoggingMiddleware() {
        return morgan('combined', {
            stream: {
                write: (message) => {
                    this.logger.info(message.trim());
                }
            },
            skip: (req) => {
                // Skip logging for health checks
                return req.path === '/health' || req.path === '/api/health';
            }
        });
    }

    corsMiddleware() {
        return cors(this.securityConfig.getCorsConfig());
    }

    compressionMiddleware() {
        return compression({
            filter: (req, res) => {
                // Don't compress if the request includes a cache-control: no-transform directive
                if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
                    return false;
                }
                
                // Use compression filter function
                return compression.filter(req, res);
            },
            level: 6, // Compression level (1-9)
            threshold: 1024 // Only compress if response is larger than 1KB
        });
    }

    adminSecurityChecks() {
        return (req, res, next) => {
            // Additional security checks for admin routes
            const user = req.user;
            
            // Check if admin account is active
            if (!user.isActive) {
                return res.status(403).json({
                    success: false,
                    error: 'Admin account is deactivated',
                    code: 'ADMIN_DEACTIVATED'
                });
            }
            
            // Check for suspicious admin activity
            const suspiciousPatterns = [
                'bulk_delete',
                'mass_export',
                'privilege_escalation'
            ];
            
            const action = req.body.action || req.query.action;
            if (action && suspiciousPatterns.includes(action)) {
                this.logger.warn('Suspicious admin activity detected', {
                    userId: user.id,
                    action,
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });
            }
            
            next();
        };
    }

    apiVersioningMiddleware() {
        return (req, res, next) => {
            // Set API version from header or default
            const apiVersion = req.headers['api-version'] || 'v1';
            req.apiVersion = apiVersion;
            
            // Validate API version
            const supportedVersions = ['v1'];
            if (!supportedVersions.includes(apiVersion)) {
                return res.status(400).json({
                    success: false,
                    error: 'Unsupported API version',
                    supportedVersions
                });
            }
            
            next();
        };
    }

    apiKeyValidationMiddleware() {
        return (req, res, next) => {
            // Skip API key validation for public endpoints
            const publicEndpoints = ['/health', '/api/health', '/api/auth/login', '/api/auth/register'];
            
            if (publicEndpoints.includes(req.path)) {
                return next();
            }
            
            // Check for API key in header
            const apiKey = req.headers['x-api-key'];
            
            if (!apiKey && req.path.startsWith('/api/')) {
                // API key required for API endpoints (unless authenticated)
                if (!req.headers.authorization) {
                    return res.status(401).json({
                        success: false,
                        error: 'API key or authentication required',
                        code: 'API_KEY_REQUIRED'
                    });
                }
            }
            
            next();
        };
    }

    apiValidationMiddleware() {
        return (req, res, next) => {
            // Validate request size
            const maxSize = 10 * 1024 * 1024; // 10MB
            const contentLength = parseInt(req.headers['content-length'] || '0');
            
            if (contentLength > maxSize) {
                return res.status(413).json({
                    success: false,
                    error: 'Request too large',
                    maxSize: '10MB'
                });
            }
            
            // Validate content type for POST/PUT requests
            if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
                const contentType = req.headers['content-type'];
                const allowedTypes = [
                    'application/json',
                    'application/x-www-form-urlencoded',
                    'multipart/form-data'
                ];
                
                if (contentType && !allowedTypes.some(type => contentType.includes(type))) {
                    return res.status(415).json({
                        success: false,
                        error: 'Unsupported content type',
                        allowedTypes
                    });
                }
            }
            
            next();
        };
    }

    finalErrorHandler() {
        return (error, req, res, next) => {
            // Log error
            this.logger.error('Unhandled error', {
                error: error.message,
                stack: error.stack,
                url: req.originalUrl,
                method: req.method,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                userId: req.user?.id
            });
            
            // Don't expose internal errors in production
            const isDevelopment = process.env.NODE_ENV !== 'production';
            
            res.status(error.status || 500).json({
                success: false,
                error: isDevelopment ? error.message : 'Internal server error',
                ...(isDevelopment && { stack: error.stack }),
                timestamp: new Date().toISOString(),
                requestId: req.id || 'unknown'
            });
        };
    }

    // Security middleware for specific route patterns
    getRouteSpecificMiddleware(routeType) {
        const middlewareMap = {
            'auth': this.getAuthMiddleware(),
            'admin': this.getAdminMiddleware(),
            'api': this.getAPIMiddleware(),
            'public': [], // No additional middleware for public routes
            'webhook': [
                // Webhook-specific middleware
                this.webhookSecurityMiddleware()
            ]
        };
        
        return middlewareMap[routeType] || [];
    }

    webhookSecurityMiddleware() {
        return (req, res, next) => {
            // Webhook signature verification
            const signature = req.headers['stripe-signature'] || req.headers['x-webhook-signature'];
            
            if (!signature) {
                return res.status(401).json({
                    success: false,
                    error: 'Webhook signature required'
                });
            }
            
            // Verify webhook signature (implementation depends on provider)
            // This is a placeholder - implement actual signature verification
            
            next();
        };
    }

    // Method to apply all middleware to Express app
    applyToApp(app) {
        // Apply core security middleware
        app.use(this.getCoreSecurityMiddleware());
        
        // Apply route-specific middleware
        app.use('/api/auth/*', this.getRouteSpecificMiddleware('auth'));
        app.use('/admin/*', this.getRouteSpecificMiddleware('admin'));
        app.use('/api/*', this.getRouteSpecificMiddleware('api'));
        app.use('/webhooks/*', this.getRouteSpecificMiddleware('webhook'));
        
        // Apply error handling middleware (must be last)
        app.use(this.getErrorHandlingMiddleware());
        
        this.logger.info('Production security middleware applied successfully');
    }

    // Health check for security middleware
    getSecurityHealthCheck() {
        return (req, res) => {
            const healthStatus = {
                security: {
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    features: {
                        rateLimiting: true,
                        securityHeaders: true,
                        cors: true,
                        authentication: true,
                        monitoring: true,
                        errorTracking: true
                    }
                }
            };
            
            res.json(healthStatus);
        };
    }
}

module.exports = ProductionSecurityMiddleware;