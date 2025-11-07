/**
 * Environment Defaults and Railway-Specific Configuration
 * Provides sensible defaults and Railway platform optimizations
 */

import { logger } from '../utils/logger.js';

/**
 * Environment-specific default configurations
 */
const ENVIRONMENT_DEFAULTS = {
  development: {
    NODE_ENV: 'development',
    HOSTNAME: 'localhost',
    PORT: '3000',
    LOG_LEVEL: 'debug',
    FRONTEND_URL: 'http://localhost:3000',
    CORS_ORIGINS: 'http://localhost:3000,http://localhost:3001',
    NEXT_TELEMETRY_DISABLED: '1',
    DISABLE_ESLINT_PLUGIN: 'true',
    NODE_OPTIONS: '--max-old-space-size=2048'
  },

  production: {
    NODE_ENV: 'production',
    HOSTNAME: '0.0.0.0',
    PORT: '3000',
    LOG_LEVEL: 'info',
    NEXT_TELEMETRY_DISABLED: '1',
    DISABLE_ESLINT_PLUGIN: 'true',
    NODE_OPTIONS: '--max-old-space-size=2048'
  },

  test: {
    NODE_ENV: 'test',
    HOSTNAME: 'localhost',
    PORT: '3001',
    LOG_LEVEL: 'error',
    NEXT_TELEMETRY_DISABLED: '1',
    DISABLE_ESLINT_PLUGIN: 'true'
  }
};

/**
 * Railway-specific optimizations and defaults
 */
const RAILWAY_DEFAULTS = {
  // Server configuration optimized for Railway
  HOSTNAME: '0.0.0.0', // Railway requires binding to all interfaces
  PORT: '3000', // Railway typically uses port 3000
  
  // Node.js optimizations for Railway's memory limits
  NODE_OPTIONS: '--max-old-space-size=2048 --optimize-for-size',
  
  // Build optimizations
  NEXT_TELEMETRY_DISABLED: '1',
  DISABLE_ESLINT_PLUGIN: 'true',
  
  // Logging optimized for Railway
  LOG_LEVEL: 'info',
  
  // Performance optimizations
  NODE_ENV: 'production'
};

/**
 * Railway environment variable mappings
 * Maps Railway-provided variables to application variables
 */
const RAILWAY_MAPPINGS = {
  // Railway provides these automatically
  PORT: 'PORT', // Railway sets this automatically
  
  // Database URL mapping (Railway PostgreSQL)
  DATABASE_URL: 'DATABASE_URL', // Railway sets this for PostgreSQL service
  
  // Redis URL mapping (Railway Redis)
  REDIS_URL: 'REDIS_URL', // Railway sets this for Redis service
  REDIS_PRIVATE_URL: 'REDIS_PRIVATE_URL', // Railway internal Redis URL
  
  // Frontend URL construction from Railway domain
  RAILWAY_STATIC_URL: 'FRONTEND_URL', // Use Railway's provided URL as frontend URL
  RAILWAY_PUBLIC_DOMAIN: 'FRONTEND_URL' // Alternative Railway domain variable
};

/**
 * Environment Configuration Manager
 */
class EnvironmentDefaults {
  constructor() {
    this.appliedDefaults = [];
    this.railwayMappings = [];
    this.environment = this.detectEnvironment();
    this.isRailway = this.detectRailway();
  }

  /**
   * Detect current environment
   */
  detectEnvironment() {
    // Check Railway environment first
    if (process.env.RAILWAY_ENVIRONMENT) {
      return process.env.RAILWAY_ENVIRONMENT;
    }
    
    // Check NODE_ENV
    if (process.env.NODE_ENV) {
      return process.env.NODE_ENV;
    }
    
    // Default to development
    return 'development';
  }

  /**
   * Detect if running on Railway
   */
  detectRailway() {
    const railwayIndicators = [
      'RAILWAY_ENVIRONMENT',
      'RAILWAY_PROJECT_ID',
      'RAILWAY_SERVICE_ID',
      'RAILWAY_DEPLOYMENT_ID',
      'RAILWAY_STATIC_URL',
      'RAILWAY_PUBLIC_DOMAIN'
    ];

    // Check for Railway environment variables
    const hasRailwayVars = railwayIndicators.some(indicator => process.env[indicator]);
    
    // Also check for Railway-provided DATABASE_URL pattern
    const databaseUrl = process.env.DATABASE_URL || '';
    const isRailwayDatabase = databaseUrl.includes('.railway.app') || 
                             databaseUrl.includes('railway.internal');

    return hasRailwayVars || isRailwayDatabase;
  }

  /**
   * Apply Railway-specific environment variable mappings
   */
  applyRailwayMappings() {
    if (!this.isRailway) {
      return;
    }

    logger.info('🚂 Applying Railway environment variable mappings...');

    for (const [railwayVar, appVar] of Object.entries(RAILWAY_MAPPINGS)) {
      const railwayValue = process.env[railwayVar];
      const currentValue = process.env[appVar];

      if (railwayValue && !currentValue) {
        // Special handling for URL construction
        if (appVar === 'FRONTEND_URL') {
          const frontendUrl = this.constructFrontendUrl(railwayValue);
          process.env[appVar] = frontendUrl;
          
          this.railwayMappings.push({
            from: railwayVar,
            to: appVar,
            value: frontendUrl,
            constructed: true
          });
        } else {
          process.env[appVar] = railwayValue;
          
          this.railwayMappings.push({
            from: railwayVar,
            to: appVar,
            value: railwayValue,
            constructed: false
          });
        }
      }
    }

    // Set CORS origins based on frontend URL if not set
    if (process.env.FRONTEND_URL && !process.env.CORS_ORIGINS) {
      process.env.CORS_ORIGINS = process.env.FRONTEND_URL;
      
      this.railwayMappings.push({
        from: 'FRONTEND_URL',
        to: 'CORS_ORIGINS',
        value: process.env.FRONTEND_URL,
        constructed: true
      });
    }

    if (this.railwayMappings.length > 0) {
      logger.info(`✅ Applied ${this.railwayMappings.length} Railway environment mappings`);
    }
  }

  /**
   * Construct frontend URL from Railway domain
   */
  constructFrontendUrl(railwayDomain) {
    // Railway domains are typically provided as full URLs or just domains
    if (railwayDomain.startsWith('http://') || railwayDomain.startsWith('https://')) {
      return railwayDomain;
    }
    
    // Assume HTTPS for Railway domains
    return `https://${railwayDomain}`;
  }

  /**
   * Apply environment-specific defaults
   */
  applyEnvironmentDefaults() {
    const defaults = ENVIRONMENT_DEFAULTS[this.environment] || ENVIRONMENT_DEFAULTS.development;
    
    logger.info(`🌍 Applying ${this.environment} environment defaults...`);

    for (const [key, defaultValue] of Object.entries(defaults)) {
      if (!process.env[key]) {
        process.env[key] = defaultValue;
        
        this.appliedDefaults.push({
          variable: key,
          value: defaultValue,
          source: `${this.environment} defaults`
        });
      }
    }
  }

  /**
   * Apply Railway-specific optimizations
   */
  applyRailwayDefaults() {
    if (!this.isRailway) {
      return;
    }

    logger.info('🚂 Applying Railway-specific optimizations...');

    for (const [key, defaultValue] of Object.entries(RAILWAY_DEFAULTS)) {
      // Only apply if not already set and not conflicting with environment defaults
      if (!process.env[key]) {
        process.env[key] = defaultValue;
        
        this.appliedDefaults.push({
          variable: key,
          value: defaultValue,
          source: 'Railway optimizations'
        });
      } else if (key === 'NODE_OPTIONS') {
        // Special handling for NODE_OPTIONS - merge with existing
        const existing = process.env[key];
        if (!existing.includes('--optimize-for-size')) {
          process.env[key] = `${existing} --optimize-for-size`;
          
          this.appliedDefaults.push({
            variable: key,
            value: process.env[key],
            source: 'Railway optimizations (merged)'
          });
        }
      }
    }
  }

  /**
   * Apply automatic environment detection and configuration
   */
  applyAutoConfiguration() {
    logger.info('🔧 Applying automatic environment configuration...');

    // Auto-detect production environment on Railway
    if (this.isRailway && !process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production';
      
      this.appliedDefaults.push({
        variable: 'NODE_ENV',
        value: 'production',
        source: 'Railway auto-detection'
      });
    }

    // Auto-configure Redis fallback
    if (!process.env.REDIS_URL && !process.env.REDIS_PRIVATE_URL) {
      logger.info('ℹ️  No Redis configuration found - Redis features will be disabled');
    }

    // Auto-configure Stripe fallback
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.info('ℹ️  No Stripe configuration found - payment features will use mock mode');
    }

    // Auto-configure Twilio fallback
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      logger.info('ℹ️  No Twilio configuration found - SMS features will be disabled');
    }
  }

  /**
   * Apply all defaults and configurations
   */
  applyDefaults() {
    logger.info('⚙️  Applying environment defaults and configurations...');
    
    // Reset tracking arrays
    this.appliedDefaults = [];
    this.railwayMappings = [];

    // Apply in order of precedence
    this.applyRailwayMappings();      // 1. Railway mappings (highest precedence)
    this.applyRailwayDefaults();      // 2. Railway optimizations
    this.applyEnvironmentDefaults();  // 3. Environment-specific defaults
    this.applyAutoConfiguration();    // 4. Auto-detection and fallbacks

    // Log summary
    this.logAppliedDefaults();

    return {
      appliedDefaults: this.appliedDefaults,
      railwayMappings: this.railwayMappings,
      environment: this.environment,
      isRailway: this.isRailway
    };
  }

  /**
   * Log applied defaults summary
   */
  logAppliedDefaults() {
    if (this.appliedDefaults.length > 0) {
      logger.info(`✅ Applied ${this.appliedDefaults.length} environment defaults:`);
      
      // Group by source
      const bySource = this.appliedDefaults.reduce((acc, item) => {
        if (!acc[item.source]) acc[item.source] = [];
        acc[item.source].push(item);
        return acc;
      }, {});

      for (const [source, items] of Object.entries(bySource)) {
        logger.info(`   ${source}:`);
        items.forEach(({ variable, value }) => {
          // Mask sensitive values
          const displayValue = this.maskSensitiveValue(variable, value);
          logger.info(`     ${variable} = "${displayValue}"`);
        });
      }
    }

    if (this.railwayMappings.length > 0) {
      logger.info(`🚂 Applied ${this.railwayMappings.length} Railway mappings:`);
      this.railwayMappings.forEach(({ from, to, value, constructed }) => {
        const displayValue = this.maskSensitiveValue(to, value);
        const suffix = constructed ? ' (constructed)' : '';
        logger.info(`   ${from} → ${to} = "${displayValue}"${suffix}`);
      });
    }
  }

  /**
   * Mask sensitive environment variable values for logging
   */
  maskSensitiveValue(variable, value) {
    const sensitivePatterns = [
      'SECRET', 'KEY', 'TOKEN', 'PASSWORD', 'AUTH', 'PRIVATE'
    ];

    const isSensitive = sensitivePatterns.some(pattern => 
      variable.toUpperCase().includes(pattern)
    );

    if (isSensitive && value && value.length > 8) {
      return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
    }

    return value;
  }

  /**
   * Get configuration summary for health checks
   */
  getConfigurationSummary() {
    return {
      environment: this.environment,
      isRailway: this.isRailway,
      appliedDefaults: this.appliedDefaults.length,
      railwayMappings: this.railwayMappings.length,
      autoConfigured: {
        redis: !!(process.env.REDIS_URL || process.env.REDIS_PRIVATE_URL),
        stripe: !!process.env.STRIPE_SECRET_KEY,
        twilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
        database: !!process.env.DATABASE_URL
      }
    };
  }
}

// Create singleton instance
const environmentDefaults = new EnvironmentDefaults();

// Export the defaults manager and utility functions
export default environmentDefaults;

/**
 * Apply all environment defaults and configurations
 */
export const applyEnvironmentDefaults = () => {
  return environmentDefaults.applyDefaults();
};

/**
 * Get current configuration status
 */
export const getConfigurationStatus = () => {
  return environmentDefaults.getConfigurationSummary();
};

/**
 * Check if running on Railway
 */
export const isRailwayEnvironment = () => {
  return environmentDefaults.isRailway;
};

/**
 * Get current environment
 */
export const getCurrentEnvironment = () => {
  return environmentDefaults.environment;
};