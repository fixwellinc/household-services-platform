#!/usr/bin/env node

/**
 * Production Security Setup Script
 * Configures comprehensive security measures for production deployment
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ProductionSecuritySetup {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '../..');
        this.envFile = path.join(this.projectRoot, '.env.production');
        this.securityConfig = {};
    }

    async setupProductionSecurity() {
        console.log('🔒 Setting up production security measures...\n');

        try {
            // Generate secure secrets
            await this.generateSecrets();
            
            // Setup environment variables
            await this.setupEnvironmentVariables();
            
            // Configure security headers
            await this.configureSecurityHeaders();
            
            // Setup SSL/TLS configuration
            await this.setupSSLConfiguration();
            
            // Configure firewall rules
            await this.configureFirewallRules();
            
            // Setup monitoring and alerting
            await this.setupSecurityMonitoring();
            
            // Generate security documentation
            await this.generateSecurityDocumentation();
            
            console.log('✅ Production security setup completed successfully!\n');
            this.displaySecuritySummary();
            
        } catch (error) {
            console.error('❌ Security setup failed:', error.message);
            process.exit(1);
        }
    }

    async generateSecrets() {
        console.log('🔑 Generating secure secrets...');
        
        this.securityConfig.secrets = {
            JWT_SECRET: this.generateSecureSecret(64),
            SESSION_SECRET: this.generateSecureSecret(64),
            ENCRYPTION_KEY: this.generateSecureSecret(32),
            API_KEY_SECRET: this.generateSecureSecret(32),
            WEBHOOK_SECRET: this.generateSecureSecret(32),
            MFA_SECRET_KEY: this.generateSecureSecret(32)
        };
        
        console.log('✓ Secure secrets generated');
    }

    generateSecureSecret(length = 32) {
        return crypto.randomBytes(length).toString('base64');
    }

    async setupEnvironmentVariables() {
        console.log('🌍 Setting up environment variables...');
        
        const envVars = {
            // Node.js environment
            NODE_ENV: 'production',
            
            // Security secrets
            ...this.securityConfig.secrets,
            
            // Database security
            DATABASE_SSL: 'true',
            DATABASE_SSL_REJECT_UNAUTHORIZED: 'true',
            
            // Session configuration
            SESSION_SECURE: 'true',
            SESSION_HTTP_ONLY: 'true',
            SESSION_SAME_SITE: 'strict',
            
            // CORS configuration
            CORS_ORIGIN: process.env.FRONTEND_URL || 'https://your-domain.com',
            CORS_CREDENTIALS: 'true',
            
            // Rate limiting
            RATE_LIMIT_ENABLED: 'true',
            RATE_LIMIT_WINDOW_MS: '900000', // 15 minutes
            RATE_LIMIT_MAX_REQUESTS: '1000',
            
            // Security headers
            SECURITY_HEADERS_ENABLED: 'true',
            HSTS_MAX_AGE: '31536000', // 1 year
            CSP_ENABLED: 'true',
            
            // Admin panel security
            ADMIN_IP_WHITELIST: process.env.ADMIN_IP_WHITELIST || '',
            ADMIN_MFA_REQUIRED: 'true',
            
            // Logging and monitoring
            LOG_LEVEL: 'info',
            SECURITY_LOG_ENABLED: 'true',
            AUDIT_LOG_ENABLED: 'true',
            
            // File upload security
            FILE_UPLOAD_MAX_SIZE: '10485760', // 10MB
            FILE_UPLOAD_ALLOWED_TYPES: 'image/jpeg,image/png,image/gif,application/pdf',
            
            // API security
            API_VERSION: 'v1',
            API_RATE_LIMIT: '100',
            API_TIMEOUT: '30000',
            
            // Encryption
            ENCRYPTION_ALGORITHM: 'aes-256-gcm',
            
            // Password policy
            PASSWORD_MIN_LENGTH: '8',
            PASSWORD_REQUIRE_UPPERCASE: 'true',
            PASSWORD_REQUIRE_LOWERCASE: 'true',
            PASSWORD_REQUIRE_NUMBERS: 'true',
            PASSWORD_REQUIRE_SYMBOLS: 'true',
            
            // Account security
            MAX_LOGIN_ATTEMPTS: '5',
            ACCOUNT_LOCKOUT_DURATION: '900000', // 15 minutes
            
            // Token configuration
            ACCESS_TOKEN_EXPIRY: '15m',
            REFRESH_TOKEN_EXPIRY: '7d',
            
            // Webhook security
            WEBHOOK_TIMEOUT: '10000',
            WEBHOOK_RETRY_ATTEMPTS: '3'
        };

        const envContent = Object.entries(envVars)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        await fs.writeFile(this.envFile, envContent);
        console.log('✓ Environment variables configured');
    }

    async configureSecurityHeaders() {
        console.log('🛡️ Configuring security headers...');
        
        const securityHeadersConfig = {
            helmet: {
                contentSecurityPolicy: {
                    directives: {
                        defaultSrc: ["'self'"],
                        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                        scriptSrc: ["'self'", "https://js.stripe.com"],
                        fontSrc: ["'self'", "https://fonts.gstatic.com"],
                        imgSrc: ["'self'", "data:", "https:"],
                        connectSrc: ["'self'", "https://api.stripe.com"],
                        frameSrc: ["'self'", "https://js.stripe.com"],
                        objectSrc: ["'none'"],
                        upgradeInsecureRequests: []
                    }
                },
                hsts: {
                    maxAge: 31536000,
                    includeSubDomains: true,
                    preload: true
                },
                noSniff: true,
                frameguard: { action: 'deny' },
                xssFilter: true,
                referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
            }
        };

        const configPath = path.join(this.projectRoot, 'apps/backend/src/config/security-headers.json');
        await fs.writeFile(configPath, JSON.stringify(securityHeadersConfig, null, 2));
        
        console.log('✓ Security headers configured');
    }

    async setupSSLConfiguration() {
        console.log('🔐 Setting up SSL/TLS configuration...');
        
        const sslConfig = {
            // SSL/TLS settings for Railway deployment
            railway: {
                httpsRedirect: true,
                hstsEnabled: true,
                tlsVersion: '1.2+'
            },
            
            // Certificate configuration
            certificates: {
                autoRenew: true,
                provider: 'letsencrypt',
                domains: [
                    process.env.DOMAIN || 'your-domain.com',
                    process.env.API_DOMAIN || 'api.your-domain.com',
                    process.env.ADMIN_DOMAIN || 'admin.your-domain.com'
                ]
            },
            
            // Security protocols
            protocols: {
                tls: {
                    minVersion: '1.2',
                    ciphers: [
                        'ECDHE-RSA-AES128-GCM-SHA256',
                        'ECDHE-RSA-AES256-GCM-SHA384',
                        'ECDHE-RSA-AES128-SHA256',
                        'ECDHE-RSA-AES256-SHA384'
                    ]
                }
            }
        };

        const sslConfigPath = path.join(this.projectRoot, 'apps/backend/src/config/ssl-config.json');
        await fs.writeFile(sslConfigPath, JSON.stringify(sslConfig, null, 2));
        
        console.log('✓ SSL/TLS configuration completed');
    }

    async configureFirewallRules() {
        console.log('🔥 Configuring firewall rules...');
        
        const firewallRules = {
            // Railway platform handles most firewall configuration
            // These are application-level rules
            
            ipWhitelist: {
                admin: process.env.ADMIN_IP_WHITELIST?.split(',') || [],
                api: [], // Empty means allow all for API
                webhook: [] // Webhook IPs from payment providers
            },
            
            rateLimiting: {
                global: {
                    windowMs: 900000, // 15 minutes
                    maxRequests: 1000
                },
                auth: {
                    windowMs: 900000, // 15 minutes
                    maxRequests: 10
                },
                admin: {
                    windowMs: 300000, // 5 minutes
                    maxRequests: 100
                },
                api: {
                    windowMs: 60000, // 1 minute
                    maxRequests: 100
                }
            },
            
            blockedUserAgents: [
                'sqlmap',
                'nikto',
                'nessus',
                'burp',
                'nmap',
                'masscan'
            ],
            
            blockedPaths: [
                '/wp-admin',
                '/phpmyadmin',
                '/.env',
                '/config',
                '/.git'
            ]
        };

        const firewallConfigPath = path.join(this.projectRoot, 'apps/backend/src/config/firewall-rules.json');
        await fs.writeFile(firewallConfigPath, JSON.stringify(firewallRules, null, 2));
        
        console.log('✓ Firewall rules configured');
    }

    async setupSecurityMonitoring() {
        console.log('📊 Setting up security monitoring...');
        
        const monitoringConfig = {
            alerts: {
                enabled: true,
                channels: {
                    email: process.env.SECURITY_ALERT_EMAIL || 'security@your-domain.com',
                    slack: process.env.SLACK_WEBHOOK_URL || '',
                    sms: process.env.SMS_ALERT_NUMBER || ''
                }
            },
            
            thresholds: {
                failedLogins: {
                    warning: 10,
                    critical: 50,
                    timeWindow: 300000 // 5 minutes
                },
                errorRate: {
                    warning: 5, // 5%
                    critical: 15, // 15%
                    timeWindow: 300000
                },
                responseTime: {
                    warning: 1000, // 1 second
                    critical: 5000, // 5 seconds
                    timeWindow: 300000
                }
            },
            
            logging: {
                level: 'info',
                auditLog: true,
                securityLog: true,
                errorLog: true,
                accessLog: true
            },
            
            metrics: {
                enabled: true,
                retention: '30d',
                aggregation: '1m'
            }
        };

        const monitoringConfigPath = path.join(this.projectRoot, 'apps/backend/src/config/security-monitoring.json');
        await fs.writeFile(monitoringConfigPath, JSON.stringify(monitoringConfig, null, 2));
        
        console.log('✓ Security monitoring configured');
    }

    async generateSecurityDocumentation() {
        console.log('📚 Generating security documentation...');
        
        const securityDocs = `# Production Security Configuration

## Overview
This document outlines the security measures implemented for the production environment.

## Security Features

### 1. Authentication & Authorization
- JWT-based authentication with short-lived access tokens (15 minutes)
- Refresh tokens with 7-day expiry
- Multi-factor authentication (MFA) support
- Role-based access control (RBAC)
- Permission-based authorization
- Account lockout after failed login attempts

### 2. Network Security
- HTTPS enforcement with HSTS headers
- Content Security Policy (CSP) headers
- IP whitelisting for admin panel access
- Rate limiting on all endpoints
- DDoS protection via Railway platform

### 3. Data Protection
- AES-256-GCM encryption for sensitive data
- Bcrypt password hashing with salt rounds
- Database connection encryption (SSL/TLS)
- Secure session management
- Input validation and sanitization

### 4. Monitoring & Alerting
- Real-time security event monitoring
- Automated threat detection
- Audit logging for all admin actions
- Error tracking and analysis
- Performance monitoring

### 5. API Security
- Request/response validation
- SQL injection prevention
- XSS protection
- CSRF protection
- File upload restrictions

## Security Headers
The following security headers are automatically applied:

- \`Strict-Transport-Security\`: Enforces HTTPS
- \`Content-Security-Policy\`: Prevents XSS attacks
- \`X-Frame-Options\`: Prevents clickjacking
- \`X-Content-Type-Options\`: Prevents MIME sniffing
- \`Referrer-Policy\`: Controls referrer information

## Environment Variables
Key security environment variables:

\`\`\`
JWT_SECRET=<generated-secret>
SESSION_SECRET=<generated-secret>
ENCRYPTION_KEY=<generated-secret>
ADMIN_IP_WHITELIST=<comma-separated-ips>
RATE_LIMIT_ENABLED=true
SECURITY_HEADERS_ENABLED=true
\`\`\`

## Incident Response
In case of security incidents:

1. Check security logs: \`/logs/security.log\`
2. Review monitoring dashboard: \`/admin/monitoring/security\`
3. Block suspicious IPs: \`POST /admin/security/block-ip\`
4. Revoke compromised tokens: \`POST /admin/auth/revoke-tokens\`

## Regular Security Tasks
- Review security logs weekly
- Update dependencies monthly
- Rotate secrets quarterly
- Conduct security audits annually

## Contact
For security issues, contact: security@your-domain.com
`;

        const docsPath = path.join(this.projectRoot, 'PRODUCTION_SECURITY.md');
        await fs.writeFile(docsPath, securityDocs);
        
        console.log('✓ Security documentation generated');
    }

    displaySecuritySummary() {
        console.log('📋 Security Setup Summary');
        console.log('========================');
        console.log('✅ Secure secrets generated');
        console.log('✅ Environment variables configured');
        console.log('✅ Security headers enabled');
        console.log('✅ SSL/TLS configuration completed');
        console.log('✅ Firewall rules configured');
        console.log('✅ Security monitoring enabled');
        console.log('✅ Documentation generated');
        console.log('');
        console.log('🔒 Security Features Enabled:');
        console.log('   • JWT authentication with refresh tokens');
        console.log('   • Multi-factor authentication support');
        console.log('   • Role-based access control');
        console.log('   • IP whitelisting for admin panel');
        console.log('   • Rate limiting and DDoS protection');
        console.log('   • Comprehensive security headers');
        console.log('   • Real-time threat monitoring');
        console.log('   • Audit logging and alerting');
        console.log('');
        console.log('📁 Configuration Files Created:');
        console.log('   • .env.production');
        console.log('   • apps/backend/src/config/security-headers.json');
        console.log('   • apps/backend/src/config/ssl-config.json');
        console.log('   • apps/backend/src/config/firewall-rules.json');
        console.log('   • apps/backend/src/config/security-monitoring.json');
        console.log('   • PRODUCTION_SECURITY.md');
        console.log('');
        console.log('⚠️  Important Notes:');
        console.log('   • Update ADMIN_IP_WHITELIST with your actual IPs');
        console.log('   • Configure alert notification channels');
        console.log('   • Review and customize security thresholds');
        console.log('   • Test all security features before going live');
        console.log('');
        console.log('🚀 Next Steps:');
        console.log('   1. Review generated configuration files');
        console.log('   2. Update environment variables in Railway');
        console.log('   3. Test security features in staging');
        console.log('   4. Deploy to production');
        console.log('   5. Monitor security dashboard');
    }
}

// CLI interface
async function main() {
    const setup = new ProductionSecuritySetup();
    
    console.log('🔒 Production Security Setup');
    console.log('============================\n');
    
    try {
        await setup.setupProductionSecurity();
    } catch (error) {
        console.error('Setup failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = ProductionSecuritySetup;