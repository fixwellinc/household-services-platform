#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates environment variables without starting the full server
 */

import { validateEnvironment, getEnvironmentStatus } from '../apps/backend/src/config/environmentValidator.js';
import { applyEnvironmentDefaults, getConfigurationStatus } from '../apps/backend/src/config/environmentDefaults.js';
import { logger } from '../apps/backend/src/utils/logger.js';

/**
 * Main validation function
 */
async function main() {
  try {
    console.log('🔍 Environment Validation Tool');
    console.log('================================\n');

    // Apply defaults first
    console.log('⚙️  Applying environment defaults...');
    const defaultsResult = applyEnvironmentDefaults();
    
    console.log(`✅ Applied ${defaultsResult.appliedDefaults.length} defaults`);
    console.log(`🚂 Railway environment: ${defaultsResult.isRailway ? 'Yes' : 'No'}`);
    console.log(`🌍 Environment: ${defaultsResult.environment}\n`);

    // Validate environment
    console.log('🔍 Validating environment variables...');
    const validationResult = validateEnvironment();
    
    // Get status summaries
    const envStatus = getEnvironmentStatus();
    const configStatus = getConfigurationStatus();

    // Display results
    console.log('\n📊 Validation Results:');
    console.log('======================');
    console.log(`Overall Status: ${envStatus.valid ? '✅ VALID' : '❌ INVALID'}`);
    console.log(`Environment: ${envStatus.environment}${envStatus.isRailway ? ' (Railway)' : ''}`);
    console.log(`Errors: ${envStatus.errorCount}`);
    console.log(`Warnings: ${envStatus.warningCount}`);
    console.log(`Defaults Applied: ${envStatus.defaultsApplied}`);

    console.log('\n🔧 Configuration Status:');
    console.log('========================');
    console.log(`Database: ${configStatus.autoConfigured.database ? '✅' : '❌'}`);
    console.log(`Redis: ${configStatus.autoConfigured.redis ? '✅' : '⚠️  Disabled'}`);
    console.log(`Stripe: ${configStatus.autoConfigured.stripe ? '✅' : '⚠️  Mock Mode'}`);
    console.log(`Twilio: ${configStatus.autoConfigured.twilio ? '✅' : '⚠️  Disabled'}`);

    if (envStatus.errors.length > 0) {
      console.log('\n❌ Critical Errors:');
      console.log('==================');
      envStatus.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.variable}: ${error.error}`);
        console.log(`   💡 ${error.suggestion}`);
      });
    }

    if (envStatus.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      console.log('=============');
      envStatus.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.variable}: ${warning.error}`);
        console.log(`   💡 ${warning.suggestion}`);
      });
    }

    // Display Railway-specific information
    if (envStatus.isRailway) {
      console.log('\n🚂 Railway Information:');
      console.log('=======================');
      console.log(`Project ID: ${process.env.RAILWAY_PROJECT_ID || 'Not set'}`);
      console.log(`Service ID: ${process.env.RAILWAY_SERVICE_ID || 'Not set'}`);
      console.log(`Environment: ${process.env.RAILWAY_ENVIRONMENT || 'Not set'}`);
      console.log(`Deployment ID: ${process.env.RAILWAY_DEPLOYMENT_ID || 'Not set'}`);
    }

    // Exit with appropriate code
    if (envStatus.valid) {
      console.log('\n✅ Environment validation passed - ready to start server');
      process.exit(0);
    } else {
      console.log('\n❌ Environment validation failed - fix errors before starting server');
      process.exit(1);
    }

  } catch (error) {
    logger.error('💥 Environment validation script failed:', error);
    console.error('\n💥 Validation script error:', error.message);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  console.log(`
Environment Validation Tool
===========================

Usage: node scripts/validate-environment.js [options]

Options:
  --help, -h    Show this help message

Description:
  Validates environment variables and configuration without starting the server.
  Useful for debugging deployment issues and verifying configuration.

Exit Codes:
  0 - Validation passed
  1 - Validation failed or script error

Examples:
  node scripts/validate-environment.js
  npm run validate-env
`);
  process.exit(0);
}

// Run the validation
main().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});