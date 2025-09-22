#!/usr/bin/env node

// Comprehensive stability fix for Railway deployments
const fs = require('fs');
const path = require('path');

console.log('🔧 Running deployment stability fixes...');

// 1. Memory optimization
process.env.NODE_OPTIONS = '--max-old-space-size=2048';

// 2. Build environment setup
const requiredEnvVars = {
  NODE_ENV: process.env.NODE_ENV || 'production',
  NEXT_TELEMETRY_DISABLED: '1',
  DISABLE_ESLINT_PLUGIN: 'true',
  SKIP_ENV_VALIDATION: 'true'
};

// Set environment variables
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!process.env[key]) {
    process.env[key] = value;
    console.log(`✅ Set ${key}=${value}`);
  }
});

// 3. Create health check endpoint data
const healthCheck = {
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: require('./package.json').version,
  environment: process.env.NODE_ENV,
  buildId: process.env.RAILWAY_GIT_COMMIT_SHA || 'unknown'
};

// 4. Ensure public directory exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('✅ Created public directory');
}

// 5. Create health check file
fs.writeFileSync(
  path.join(publicDir, 'health.json'),
  JSON.stringify(healthCheck, null, 2)
);

// 6. Create minimal robots.txt if missing
const robotsPath = path.join(publicDir, 'robots.txt');
if (!fs.existsSync(robotsPath)) {
  fs.writeFileSync(robotsPath, 'User-agent: *\nAllow: /\n');
  console.log('✅ Created robots.txt');
}

// 7. Memory and performance monitoring
const logMemoryUsage = () => {
  const used = process.memoryUsage();
  console.log('📊 Memory Usage:');
  for (let key in used) {
    console.log(`   ${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
  }
};

// Log initial memory usage
logMemoryUsage();

// 8. Error handling setup
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log('✅ Stability fixes applied successfully');

module.exports = {
  healthCheck,
  logMemoryUsage
};