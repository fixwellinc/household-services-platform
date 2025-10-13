/**
 * Production Security Configuration
 * Comprehensive security settings for production environment
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { body, validationResult } = require('express-validator');

class ProductionSecurityConfig {
    constructor() {
        this.trustedProxies = this.getTrustedProxies();
        this.allowedOrigins = this.getAllowedOrigins();
        this.adminIPWhitelist = this.getAdminIPWhitelist();
    }

    getTrustedProxies() {
        // Configure trusted proxies for Railway/production environment
        return [
            'loopback',
            'linklocal',
            'uniquelocal',
            // Railway proxy IPs
            '10.0.0.0/8',
            '172.16.0.0/12',
            '192.168.0.0/16'
        ];
    }

    getAllowedOrigins() {
        const origins = [
            process.env.FRONTEND_URL,
            process.env.ADMIN_URL,
            'https://fixwell-services.railway.app',
            'https://admin.fixwell-services.railway.app'
        ].filter(Boolean);

        // Add development origins in non-production environments
        if (process.env.NODE_ENV !== 'production') {
            origins.push(
                'http://localhost:3000',
                'http://localhost:3001',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:3001'
            );
        }

        return origins;
    }

    getAdminIPWhitelist() {
        // IP addresses allowed to access admin panel
        const whitelist = [];
        
        if (process.env.ADMIN_IP_WHITELIST) {
            whitelist.push(...process.env.ADMIN_IP_WHITELIST.split(','));
        }

        // Add default safe IPs in development
        if (process.env.NODE_ENV !== 'production') {
            whitelist.push('127.0.0.1', '::1', 'localhost');
        }

        return whitelist;
    }

    // Security headers configuration
    getHelmetConfig() {
        return {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: [
                        "'self'",
                        "'unsafe-inline'",
                        'https://fonts.googleapis.com',
                        'https://cdn.jsdelivr.net'
                    ],
                    scriptSrc: [
                        "'self'",
                        "'unsafe-inline'",
                        "'unsafe-eval'", // Required for React dev tools
                        'https://js.stripe.com',
                        'https://cdn.jsdelivr.net'
                    ],
                    fontSrc: [
                        "'self'",
                        'https://fonts.gstatic.com',
                        'https://cdn.jsdelivr.net'
                    ],
                    imgSrc: [
                        "'self'",
                        'data:',
                        'https:',
                        'blob:'
                    ],
                    connectSrc: [
                        "'self'",
                        'https://api.stripe.com',
                        'wss:',
                        'ws:'
                    ],
                    frameSrc: [
                        "'self'",
                        'https://js.stripe.com'
                    ],
                    objectSrc: ["'none'"],
                    upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
                }
            },
            crossOriginEmbedderPolicy: false, // Disable for Stripe compatibility
            hsts: {
                maxAge: 31536000, // 1 year
                includeSubDomains: true,
                preload: true
            },
            noSniff: true,
            frameguard: { action: 'deny' },
            xssFilter: true,
            referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
        };
    }

    // CORS configuration
    getCorsConfig() {
        return {
            origin: (origin, callback) => {
                // Allow requests with no origin (mobile apps, Postman, etc.)
                if (!origin) return callback(null, true);
                
                if (this.allowedOrigins.includes(origin)) {
                    return callback(null, true);
                }
                
                // Check for wildcard subdomains in production
                if (process.env.NODE_ENV === 'production') {
                    const allowedDomains = [
                        '.railway.app',
                        '.fixwell.com'
                    ];
                    
                    for (const domain of allowedDomains) {
                        if (origin.endsWith(domain)) {
                            return callback(null, true);
                        }
                    }
                }
                
                callback(new Error('Not allowed by CORS'));
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: [
                'Origin',
                'X-Requested-With',
                'Content-Type',
                'Accept',
                'Authorization',
                'X-API-Key',
                'X-CSRF-Token'
            ],
            exposedHeaders: [
                'X-Total-Count',
                'X-Error-ID',
                'X-Request-ID'
            ]
        };
    }

    // Rate limiting configurations
    getRateLimitConfigs() {
        return {
            // General API rate limiting
            general: rateLimit({
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 1000, // Limit each IP to 1000 requests per windowMs
                message: {
                    error: 'Too many requests from this IP',
                    retryAfter: '15 minutes'
                },
                standardHeaders: true,
                legacyHeaders: false,
                skip: (req) => {
                    // Skip rate limiting for health checks
                    return req.path === '/health' || req.path === '/api/health';
                }
            }),

            // Strict rate limiting for authentication endpoints
            auth: rateLimit({
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 50, // Limit each IP to 50 auth requests per windowMs (increased for testing)
                message: {
                    error: 'Too many authentication attempts',
                    retryAfter: '15 minutes'
                },
                standardHeaders: true,
                legacyHeaders: false,
                skipSuccessfulRequests: true
            }),

            // Admin panel rate limiting
            admin: rateLimit({
                windowMs: 5 * 60 * 1000, // 5 minutes
                max: 100, // Limit each IP to 100 admin requests per windowMs
                message: {
                    error: 'Too many admin requests',
                    retryAfter: '5 minutes'
                },
                standardHeaders: true,
                legacyHeaders: false
            }),

            // Password reset rate limiting
            passwordReset: rateLimit({
                windowMs: 60 * 60 * 1000, // 1 hour
                max: 3, // Limit each IP to 3 password reset requests per hour
                message: {
                    error: 'Too many password reset attempts',
                    retryAfter: '1 hour'
                },
                standardHeaders: true,
                legacyHeaders: false
            })
        };
    }

    // Slow down configurations for progressive delays
    getSlowDownConfigs() {
        return {
            auth: slowDown({
                windowMs: 15 * 60 * 1000, // 15 minutes
                delayAfter: 5, // Allow 5 requests per windowMs without delay
                delayMs: 500, // Add 500ms delay per request after delayAfter
                maxDelayMs: 20000, // Maximum delay of 20 seconds
                skipSuccessfulRequests: true
            })
        };
    }

    // Input validation schemas
    getValidationSchemas() {
        return {
            // User registration validation
            userRegistration: [
                body('email')
                    .isEmail()
                    .normalizeEmail()
                    .isLength({ max: 255 })
                    .withMessage('Valid email is required'),
                body('password')
                    .isLength({ min: 8, max: 128 })
                    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
                    .withMessage('Password must contain at least 8 characters with uppercase, lowercase, number, and special character'),
                body('name')
                    .trim()
                    .isLength({ min: 2, max: 100 })
                    .matches(/^[a-zA-Z\s'-]+$/)
                    .withMessage('Name must be 2-100 characters and contain only letters, spaces, hyphens, and apostrophes'),
                body('phone')
                    .optional()
                    .isMobilePhone()
                    .withMessage('Valid phone number is required')
            ],

            // User login validation
            userLogin: [
                body('email')
                    .isEmail()
                    .normalizeEmail()
                    .withMessage('Valid email is required'),
                body('password')
                    .isLength({ min: 1 })
                    .withMessage('Password is required')
            ],

            // Admin user creation validation
            adminUserCreation: [
                body('email')
                    .isEmail()
                    .normalizeEmail()
                    .isLength({ max: 255 })
                    .withMessage('Valid email is required'),
                body('name')
                    .trim()
                    .isLength({ min: 2, max: 100 })
                    .matches(/^[a-zA-Z\s'-]+$/)
                    .withMessage('Name must be 2-100 characters and contain only letters, spaces, hyphens, and apostrophes'),
                body('role')
                    .isIn(['ADMIN', 'EMPLOYEE'])
                    .withMessage('Role must be ADMIN or EMPLOYEE'),
                body('permissions')
                    .optional()
                    .isArray()
                    .withMessage('Permissions must be an array')
            ],

            // Service booking validation
            serviceBooking: [
                body('serviceId')
                    .isUUID()
                    .withMessage('Valid service ID is required'),
                body('scheduledDate')
                    .isISO8601()
                    .toDate()
                    .withMessage('Valid scheduled date is required'),
                body('address')
                    .trim()
                    .isLength({ min: 10, max: 500 })
                    .withMessage('Address must be 10-500 characters'),
                body('notes')
                    .optional()
                    .trim()
                    .isLength({ max: 1000 })
                    .withMessage('Notes must not exceed 1000 characters')
            ]
        };
    }

    // IP whitelist middleware for admin panel
    adminIPWhitelistMiddleware() {
        return (req, res, next) => {
            // Skip in development or if no whitelist is configured
            if (process.env.NODE_ENV !== 'production' || this.adminIPWhitelist.length === 0) {
                return next();
            }

            const clientIP = this.getClientIP(req);
            
            if (!this.adminIPWhitelist.includes(clientIP)) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied',
                    message: 'Your IP address is not authorized to access the admin panel'
                });
            }

            next();
        };
    }

    // Get real client IP considering proxies
    getClientIP(req) {
        return req.ip || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
               '0.0.0.0';
    }

    // HTTPS enforcement middleware
    httpsEnforcementMiddleware() {
        return (req, res, next) => {
            // Skip in development
            if (process.env.NODE_ENV !== 'production') {
                return next();
            }

            // Check if request is secure
            const isSecure = req.secure || 
                           req.get('X-Forwarded-Proto') === 'https' ||
                           req.get('X-Forwarded-Ssl') === 'on';

            if (!isSecure) {
                const httpsUrl = `https://${req.get('Host')}${req.originalUrl}`;
                return res.redirect(301, httpsUrl);
            }

            next();
        };
    }

    // Request validation middleware
    validateRequest(schema) {
        return (req, res, next) => {
            const errors = validationResult(req);
            
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            next();
        };
    }

    // Security headers middleware
    securityHeadersMiddleware() {
        return helmet(this.getHelmetConfig());
    }

    // Request sanitization middleware
    requestSanitizationMiddleware() {
        return (req, res, next) => {
            // Sanitize request body
            if (req.body && typeof req.body === 'object') {
                req.body = this.sanitizeObject(req.body);
            }

            // Sanitize query parameters
            if (req.query && typeof req.query === 'object') {
                req.query = this.sanitizeObject(req.query);
            }

            next();
        };
    }

    sanitizeObject(obj) {
        const sanitized = {};
        
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                // Remove potentially dangerous characters
                sanitized[key] = value
                    .replace(/<script[^>]*>.*?<\/script>/gi, '')
                    .replace(/<[^>]*>/g, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '');
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        
        return sanitized;
    }

    // Session security configuration
    getSessionConfig() {
        return {
            secret: process.env.SESSION_SECRET || 'your-super-secret-session-key',
            name: 'fixwell.sid',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                sameSite: 'strict'
            },
            rolling: true // Reset expiration on activity
        };
    }

    // JWT security configuration
    getJWTConfig() {
        return {
            secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
            expiresIn: '24h',
            issuer: 'fixwell-services',
            audience: 'fixwell-users',
            algorithm: 'HS256'
        };
    }

    // Database security configuration
    getDatabaseSecurityConfig() {
        return {
            // Connection pool settings
            pool: {
                min: 2,
                max: 10,
                acquire: 30000,
                idle: 10000
            },
            // Query timeout
            dialectOptions: {
                connectTimeout: 60000,
                acquireTimeout: 60000,
                timeout: 60000
            },
            // Logging configuration
            logging: process.env.NODE_ENV === 'production' ? false : console.log,
            // Disable automatic model synchronization in production
            sync: false
        };
    }

    // File upload security configuration
    getFileUploadConfig() {
        return {
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB
                files: 5,
                fields: 20
            },
            fileFilter: (req, file, cb) => {
                // Allowed file types
                const allowedTypes = [
                    'image/jpeg',
                    'image/png',
                    'image/gif',
                    'image/webp',
                    'application/pdf',
                    'text/plain',
                    'text/csv'
                ];

                if (allowedTypes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new Error('File type not allowed'), false);
                }
            },
            // Sanitize filename
            filename: (req, file, cb) => {
                const sanitizedName = file.originalname
                    .replace(/[^a-zA-Z0-9.-]/g, '_')
                    .toLowerCase();
                cb(null, `${Date.now()}_${sanitizedName}`);
            }
        };
    }
}

module.exports = ProductionSecurityConfig;