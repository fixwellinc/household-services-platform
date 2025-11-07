#!/usr/bin/env node

/**
 * Railway Environment Validation Script
 * Validates environment variables match Railway requirements before deployment
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// Required environment variables for Railway
const REQUIRED_VARS = {
  DATABASE_URL: {
    description: 'PostgreSQL database connection URL',
    validator: (value) => {
      if (!value) return false;
      return value.includes('postgres') && value.includes('://');
    },
    example: 'postgresql://user:password@host:5432/database'
  },
  JWT_SECRET: {
    description: 'JWT token signing secret',
    validator: (value) => value && value.length >= 32,
    example: 'your-super-secret-jwt-key-at-least-32-characters-long'
  }
};

// Optional but recommended variables
const RECOMMENDED_VARS = {
  NODE_ENV: {
    description: 'Node.js environment',
    default: 'production',
    validator: (value) => !value || ['development', 'production', 'test'].includes(value)
  },
  STRIPE_SECRET_KEY: {
    description: 'Stripe secret key for payments',
    validator: (value) => !value || value.startsWith('sk_test_') || value.startsWith('sk_live_')
  },
  STRIPE_PUBLISHABLE_KEY: {
    description: 'Stripe publishable key',
    validator: (value) => !value || value.startsWith('pk_test_') || value.startsWith('pk_live_')
  },
  FRONTEND_URL: {
    description: 'Frontend application URL',
    validator: (value) => !value || value.startsWith('http://') || value.startsWith('https://')
  }
};

// Railway-specific variables (auto-provided)
const RAILWAY_VARS = [
  'RAILWAY_ENVIRONMENT',
  'RAILWAY_PROJECT_ID',
  'RAILWAY_SERVICE_ID',
  'RAILWAY_DEPLOYMENT_ID',
  'RAILWAY_STATIC_URL',
  'RAILWAY_PUBLIC_DOMAIN'
];

function validateVariable(name, config, value) {
  if (!value && config.default) {
    return { valid: true, message: `Using default: ${config.default}`, isDefault: true };
  }

  if (!value && !config.default) {
    return { valid: false, message: 'Missing' };
  }

  if (config.validator && !config.validator(value)) {
    return { valid: false, message: 'Invalid format' };
  }

  return { valid: true, message: 'OK' };
}

function checkEnvFile() {
  const envExamplePath = join(__dirname, '../apps/backend/env.example');
  
  try {
    const envExample = readFileSync(envExamplePath, 'utf8');
    logInfo('Found env.example file');
    return true;
  } catch (error) {
    logWarning('env.example file not found');
    return false;
  }
}

function main() {
  log('\n🔍 Railway Environment Validation\n', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  // Check if running in Railway-like environment
  const isRailway = RAILWAY_VARS.some(varName => process.env[varName]);
  const hasRailwayDatabase = process.env.DATABASE_URL && 
    (process.env.DATABASE_URL.includes('.railway.app') || 
     process.env.DATABASE_URL.includes('railway.internal'));

  if (isRailway || hasRailwayDatabase) {
    logSuccess('Railway environment detected');
  } else {
    logInfo('Local environment detected (simulating Railway validation)');
  }

  log('');

  // Check env.example file
  checkEnvFile();
  log('');

  // Validate required variables
  log('📋 Required Environment Variables:', 'blue');
  log('');

  let hasErrors = false;
  const missingVars = [];
  const invalidVars = [];

  for (const [name, config] of Object.entries(REQUIRED_VARS)) {
    const value = process.env[name];
    const result = validateVariable(name, config, value);

    if (!result.valid) {
      hasErrors = true;
      if (!value) {
        missingVars.push(name);
      } else {
        invalidVars.push(name);
      }
      logError(`${name}: ${result.message}`);
      log(`   Description: ${config.description}`, 'yellow');
      log(`   Example: ${config.example}`, 'yellow');
    } else {
      if (result.isDefault) {
        logWarning(`${name}: ${result.message}`);
      } else {
        logSuccess(`${name}: ${result.message}`);
      }
    }
    log('');
  }

  // Validate recommended variables
  log('📋 Recommended Environment Variables:', 'blue');
  log('');

  for (const [name, config] of Object.entries(RECOMMENDED_VARS)) {
    const value = process.env[name];
    const result = validateVariable(name, config, value);

    if (!result.valid) {
      logWarning(`${name}: ${result.message}`);
      log(`   Description: ${config.description}`, 'yellow');
    } else if (!value && config.default) {
      logInfo(`${name}: ${result.message} (will use default: ${config.default})`);
    } else {
      logSuccess(`${name}: ${result.message}`);
    }
    log('');
  }

  // Summary
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  
  if (hasErrors) {
    logError('\n❌ Validation failed!\n');
    
    if (missingVars.length > 0) {
      logError('Missing required variables:');
      missingVars.forEach(name => {
        log(`   - ${name}`, 'red');
      });
      log('');
    }

    if (invalidVars.length > 0) {
      logError('Invalid variables:');
      invalidVars.forEach(name => {
        log(`   - ${name}`, 'red');
      });
      log('');
    }

    log('💡 To fix:', 'yellow');
    log('   1. Go to Railway project dashboard', 'yellow');
    log('   2. Navigate to Variables tab', 'yellow');
    log('   3. Add the missing/invalid variables listed above', 'yellow');
    log('   4. Redeploy your application', 'yellow');
    log('');

    process.exit(1);
  } else {
    logSuccess('\n✅ All required environment variables are valid!\n');
    
    log('💡 Railway Deployment Checklist:', 'cyan');
    log('   ✅ Required variables set', 'green');
    log('   ✅ Environment validation passed', 'green');
    log('   ✅ Ready for deployment', 'green');
    log('');
    log('🚀 Next steps:', 'cyan');
    log('   1. Run: npm run deploy:railway', 'yellow');
    log('   2. Monitor deployment logs: railway logs', 'yellow');
    log('   3. Check health endpoint: /api/health', 'yellow');
    log('');

    process.exit(0);
  }
}

// Run validation
main();

