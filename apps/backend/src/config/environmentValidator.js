/**
 * Environment Variable Validation Service
 * Validates required environment variables on startup with Railway-specific handling
 */

import { logger } from '../utils/logger.js';

/**
 * Environment variable validation configuration
 */
const ENV_CONFIG = {
  // Critical environment variables (must be present)
  required: {
    // Database
    DATABASE_URL: {
      description: 'PostgreSQL database connection URL',
      validator: (value) => {
        if (!value) return false;
        // Accept various PostgreSQL URL formats (Railway, standard, etc.)
        return value.startsWith('postgresql://') || 
               value.startsWith('postgres://') ||
               value.startsWith('postgresql+ssl://') ||
               (value.includes('postgres') && value.includes('://'));
      },
      errorMessage: 'DATABASE_URL must be a valid PostgreSQL connection string'
    },
    
    // JWT Authentication
    JWT_SECRET: {
      description: 'JWT token signing secret',
      validator: (value) => value && value.length >= 32,
      errorMessage: 'JWT_SECRET must be at least 32 characters long'
    }
  },

  // Optional environment variables with defaults
  optional: {
    // Server Configuration
    NODE_ENV: {
      description: 'Node.js environment',
      default: 'development',
      validator: (value) => ['development', 'production', 'test'].includes(value),
      errorMessage: 'NODE_ENV must be one of: development, production, test'
    },
    
    HOSTNAME: {
      description: 'Server hostname',
      default: '0.0.0.0',
      validator: (value) => value && value.length > 0,
      errorMessage: 'HOSTNAME must be a valid hostname or IP address'
    },
    
    PORT: {
      description: 'Server port',
      default: '3000',
      validator: (value) => {
        const port = parseInt(value, 10);
        return !isNaN(port) && port > 0 && port <= 65535;
      },
      errorMessage: 'PORT must be a valid port number between 1 and 65535'
    },

    // Logging
    LOG_LEVEL: {
      description: 'Winston log level',
      default: 'info',
      validator: (value) => ['error', 'warn', 'info', 'debug'].includes(value),
      errorMessage: 'LOG_LEVEL must be one of: error, warn, info, debug'
    },

    // Redis (optional but validated if present)
    REDIS_URL: {
      description: 'Redis connection URL (Railway managed)',
      default: null,
      validator: (value) => !value || value.startsWith('redis://') || value.startsWith('rediss://'),
      errorMessage: 'REDIS_URL must be a valid Redis connection string'
    },

    REDIS_PRIVATE_URL: {
      description: 'Redis private connection URL (Railway managed)',
      default: null,
      validator: (value) => !value || value.startsWith('redis://') || value.startsWith('rediss://'),
      errorMessage: 'REDIS_PRIVATE_URL must be a valid Redis connection string'
    },

    // Stripe (optional but validated if present)
    STRIPE_SECRET_KEY: {
      description: 'Stripe secret key for payments',
      default: null,
      validator: (value) => !value || (value.startsWith('sk_test_') || value.startsWith('sk_live_')),
      errorMessage: 'STRIPE_SECRET_KEY must start with sk_test_ or sk_live_'
    },

    STRIPE_PUBLISHABLE_KEY: {
      description: 'Stripe publishable key for frontend',
      default: null,
      validator: (value) => !value || (value.startsWith('pk_test_') || value.startsWith('pk_live_')),
      errorMessage: 'STRIPE_PUBLISHABLE_KEY must start with pk_test_ or pk_live_'
    },

    STRIPE_WEBHOOK_SECRET: {
      description: 'Stripe webhook endpoint secret',
      default: null,
      validator: (value) => !value || value.startsWith('whsec_'),
      errorMessage: 'STRIPE_WEBHOOK_SECRET must start with whsec_'
    },

    // CORS and Frontend
    FRONTEND_URL: {
      description: 'Frontend application URL',
      default: 'http://localhost:3000',
      validator: (value) => value && (value.startsWith('http://') || value.startsWith('https://')),
      errorMessage: 'FRONTEND_URL must be a valid HTTP or HTTPS URL'
    },

    CORS_ORIGINS: {
      description: 'Comma-separated list of allowed CORS origins',
      default: null,
      validator: (value) => {
        if (!value) return true;
        const origins = value.split(',');
        return origins.every(origin => 
          origin.trim().startsWith('http://') || 
          origin.trim().startsWith('https://') ||
          origin.trim() === 'localhost'
        );
      },
      errorMessage: 'CORS_ORIGINS must be comma-separated HTTP/HTTPS URLs'
    },

    // Twilio (optional)
    TWILIO_ACCOUNT_SID: {
      description: 'Twilio account SID for SMS',
      default: null,
      validator: (value) => !value || value.startsWith('AC'),
      errorMessage: 'TWILIO_ACCOUNT_SID must start with AC'
    },

    TWILIO_AUTH_TOKEN: {
      description: 'Twilio authentication token',
      default: null,
      validator: (value) => !value || value.length >= 32,
      errorMessage: 'TWILIO_AUTH_TOKEN must be at least 32 characters long'
    },

    TWILIO_PHONE_NUMBER: {
      description: 'Twilio phone number for SMS',
      default: null,
      validator: (value) => !value || value.startsWith('+'),
      errorMessage: 'TWILIO_PHONE_NUMBER must be in international format starting with +'
    },

    // Node.js optimization
    NODE_OPTIONS: {
      description: 'Node.js runtime options',
      default: '--max-old-space-size=2048',
      validator: (value) => value && value.includes('--'),
      errorMessage: 'NODE_OPTIONS must contain valid Node.js flags'
    },

    // Next.js configuration
    NEXT_TELEMETRY_DISABLED: {
      description: 'Disable Next.js telemetry',
      default: '1',
      validator: (value) => ['0', '1', 'true', 'false'].includes(value),
      errorMessage: 'NEXT_TELEMETRY_DISABLED must be 0, 1, true, or false'
    },

    DISABLE_ESLINT_PLUGIN: {
      description: 'Disable ESLint plugin during build',
      default: 'true',
      validator: (value) => ['true', 'false'].includes(value),
      errorMessage: 'DISABLE_ESLINT_PLUGIN must be true or false'
    }
  },

  // Railway-specific environment variables (auto-detected)
  railway: {
    RAILWAY_ENVIRONMENT: {
      description: 'Railway deployment environment',
      validator: (value) => !value || ['production', 'staging', 'development'].includes(value),
      errorMessage: 'RAILWAY_ENVIRONMENT must be production, staging, or development'
    },
    
    RAILWAY_PROJECT_ID: {
      description: 'Railway project identifier',
      validator: (value) => !value || value.length > 0,
      errorMessage: 'RAILWAY_PROJECT_ID must be a valid project ID'
    },
    
    RAILWAY_SERVICE_ID: {
      description: 'Railway service identifier',
      validator: (value) => !value || value.length > 0,
      errorMessage: 'RAILWAY_SERVICE_ID must be a valid service ID'
    },
    
    RAILWAY_DEPLOYMENT_ID: {
      description: 'Railway deployment identifier',
      validator: (value) => !value || value.length > 0,
      errorMessage: 'RAILWAY_DEPLOYMENT_ID must be a valid deployment ID'
    }
  }
};

/**
 * Environment Variable Validator Class
 */
class EnvironmentValidator {
  constructor() {
    this.validationResults = {
      valid: true,
      errors: [],
      warnings: [],
      environment: 'unknown',
      isRailway: false,
      appliedDefaults: []
    };
  }

  /**
   * Detect if running on Railway platform
   */
  detectRailwayEnvironment() {
    const railwayIndicators = [
      'RAILWAY_ENVIRONMENT',
      'RAILWAY_PROJECT_ID',
      'RAILWAY_SERVICE_ID',
      'RAILWAY_DEPLOYMENT_ID',
      'RAILWAY_STATIC_URL',
      'RAILWAY_PUBLIC_DOMAIN'
    ];

    // Also check for Railway-provided DATABASE_URL pattern
    const databaseUrl = process.env.DATABASE_URL || '';
    const isRailwayDatabase = databaseUrl.includes('.railway.app') || 
                             databaseUrl.includes('railway.internal');

    this.validationResults.isRailway = railwayIndicators.some(
      indicator => process.env[indicator]
    ) || isRailwayDatabase;

    if (this.validationResults.isRailway) {
      logger.info('🚂 Railway deployment environment detected');
      this.validationResults.environment = process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV || 'production';
    } else {
      this.validationResults.environment = process.env.NODE_ENV || 'development';
      logger.info(`🖥️  Local/other deployment environment detected: ${this.validationResults.environment}`);
    }

    return this.validationResults.isRailway;
  }

  /**
   * Validate a single environment variable
   */
  validateVariable(name, config, value) {
    const result = {
      name,
      value,
      valid: true,
      error: null,
      appliedDefault: false
    };

    // Apply default if value is missing and default exists
    if (!value && config.default !== undefined) {
      process.env[name] = config.default;
      result.value = config.default;
      result.appliedDefault = true;
      this.validationResults.appliedDefaults.push({
        name,
        default: config.default,
        description: config.description
      });
    }

    // Validate the value (or applied default)
    const finalValue = result.value || value;
    if (config.validator && !config.validator(finalValue)) {
      result.valid = false;
      result.error = config.errorMessage || `Invalid value for ${name}`;
    }

    return result;
  }

  /**
   * Validate all required environment variables
   */
  validateRequired() {
    logger.info('🔍 Validating required environment variables...');
    
    for (const [name, config] of Object.entries(ENV_CONFIG.required)) {
      const value = process.env[name];
      const result = this.validateVariable(name, config, value);

      if (!result.valid || !result.value) {
        this.validationResults.valid = false;
        this.validationResults.errors.push({
          type: 'REQUIRED_MISSING',
          variable: name,
          description: config.description,
          error: result.error || `Required environment variable ${name} is missing`,
          suggestion: this.getSuggestionForVariable(name)
        });
      }
    }
  }

  /**
   * Validate all optional environment variables
   */
  validateOptional() {
    logger.info('🔧 Validating optional environment variables...');
    
    for (const [name, config] of Object.entries(ENV_CONFIG.optional)) {
      const value = process.env[name];
      const result = this.validateVariable(name, config, value);

      if (!result.valid) {
        this.validationResults.warnings.push({
          type: 'OPTIONAL_INVALID',
          variable: name,
          description: config.description,
          error: result.error,
          suggestion: this.getSuggestionForVariable(name)
        });
      }
    }
  }

  /**
   * Validate Railway-specific environment variables
   */
  validateRailway() {
    if (!this.validationResults.isRailway) {
      return;
    }

    logger.info('🚂 Validating Railway-specific environment variables...');
    
    for (const [name, config] of Object.entries(ENV_CONFIG.railway)) {
      const value = process.env[name];
      const result = this.validateVariable(name, config, value);

      if (!result.valid && value) { // Only warn if value exists but is invalid
        this.validationResults.warnings.push({
          type: 'RAILWAY_INVALID',
          variable: name,
          description: config.description,
          error: result.error,
          suggestion: 'This is managed by Railway and should not be manually set'
        });
      }
    }
  }

  /**
   * Get suggestion for fixing environment variable issues
   */
  getSuggestionForVariable(name) {
    const suggestions = {
      DATABASE_URL: 'Set up a PostgreSQL database and provide the connection URL',
      JWT_SECRET: 'Generate a secure random string of at least 32 characters',
      REDIS_URL: 'Add a Redis service in Railway or provide a Redis connection URL',
      STRIPE_SECRET_KEY: 'Get your Stripe secret key from the Stripe dashboard',
      FRONTEND_URL: 'Set to your frontend application URL (e.g., https://your-app.railway.app)',
      CORS_ORIGINS: 'Set to comma-separated list of allowed origins for CORS'
    };

    return suggestions[name] || `Check the documentation for ${name} configuration`;
  }

  /**
   * Perform comprehensive environment validation
   */
  validate() {
    logger.info('🔍 Starting environment variable validation...');
    
    // Reset validation results
    this.validationResults = {
      valid: true,
      errors: [],
      warnings: [],
      environment: 'unknown',
      isRailway: false,
      appliedDefaults: []
    };

    // Detect environment
    this.detectRailwayEnvironment();

    // Validate all categories
    this.validateRequired();
    this.validateOptional();
    this.validateRailway();

    // Log results
    this.logValidationResults();

    return this.validationResults;
  }

  /**
   * Log validation results
   */
  logValidationResults() {
    const { valid, errors, warnings, appliedDefaults, isRailway, environment } = this.validationResults;

    // Log environment info
    logger.info(`🌍 Environment: ${environment}${isRailway ? ' (Railway)' : ''}`);

    // Log applied defaults
    if (appliedDefaults.length > 0) {
      logger.info(`⚙️  Applied ${appliedDefaults.length} default values:`);
      appliedDefaults.forEach(({ name, default: defaultValue, description }) => {
        logger.info(`   ${name} = "${defaultValue}" (${description})`);
      });
    }

    // Log warnings
    if (warnings.length > 0) {
      logger.warn(`⚠️  Found ${warnings.length} environment variable warnings:`);
      warnings.forEach(({ variable, error, suggestion }) => {
        logger.warn(`   ${variable}: ${error}`);
        logger.warn(`   💡 Suggestion: ${suggestion}`);
      });
    }

    // Log errors
    if (errors.length > 0) {
      logger.error(`❌ Found ${errors.length} critical environment variable errors:`);
      errors.forEach(({ variable, error, suggestion }) => {
        logger.error(`   ${variable}: ${error}`);
        logger.error(`   💡 Suggestion: ${suggestion}`);
      });
    }

    // Log success
    if (valid) {
      logger.info('✅ Environment variable validation passed');
    } else {
      logger.error('❌ Environment variable validation failed - application cannot start');
    }
  }

  /**
   * Fail fast if validation fails
   */
  failFast() {
    if (!this.validationResults.valid) {
      logger.error('💥 Critical environment variables are missing or invalid');
      logger.error('🛑 Application startup aborted');
      
      // Log detailed error information
      logger.error('\n📋 Missing or Invalid Required Variables:');
      this.validationResults.errors.forEach(({ variable, error, suggestion }) => {
        logger.error(`   ❌ ${variable}: ${error}`);
        logger.error(`      💡 ${suggestion}`);
      });
      
      // Log specific instructions for Railway
      if (this.validationResults.isRailway) {
        logger.error('\n🚂 Railway deployment detected. To fix:');
        logger.error('   1. Go to your Railway project dashboard');
        logger.error('   2. Navigate to Variables tab');
        logger.error('   3. Add the missing required variables listed above');
        logger.error('   4. Redeploy your application');
        logger.error('\n📝 Required variables:');
        this.validationResults.errors.forEach(({ variable }) => {
          logger.error(`   - ${variable}`);
        });
      } else {
        logger.error('\n🖥️  Local development detected. To fix:');
        logger.error('   1. Check your .env file in apps/backend/');
        logger.error('   2. Add the missing required variables listed above');
        logger.error('   3. Restart your development server');
      }

      process.exit(1);
    }
  }

  /**
   * Get validation summary for health checks
   */
  getValidationSummary() {
    return {
      valid: this.validationResults.valid,
      environment: this.validationResults.environment,
      isRailway: this.validationResults.isRailway,
      errorCount: this.validationResults.errors.length,
      warningCount: this.validationResults.warnings.length,
      defaultsApplied: this.validationResults.appliedDefaults.length,
      errors: this.validationResults.errors,
      warnings: this.validationResults.warnings
    };
  }
}

// Create singleton instance
const environmentValidator = new EnvironmentValidator();

// Export the validator and validation function
export default environmentValidator;

/**
 * Validate environment variables and fail fast if critical issues found
 */
export const validateEnvironment = () => {
  const results = environmentValidator.validate();
  environmentValidator.failFast();
  return results;
};

/**
 * Get current validation status (for health checks)
 */
export const getEnvironmentStatus = () => {
  return environmentValidator.getValidationSummary();
};

/**
 * Check if running on Railway
 */
export const isRailwayEnvironment = () => {
  return environmentValidator.detectRailwayEnvironment();
};