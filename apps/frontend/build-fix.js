#!/usr/bin/env node

// Build fix script to ensure Next.js has proper buildId
const fs = require('fs');
const path = require('path');

console.log('🔧 Running Next.js build fix...');

// Ensure environment variables are set
const buildId = process.env.RAILWAY_GIT_COMMIT_SHA || 
               process.env.VERCEL_GIT_COMMIT_SHA || 
               process.env.GITHUB_SHA ||
               process.env.RAILWAY_DEPLOYMENT_ID ||
               'build-' + Date.now();

const deploymentId = process.env.RAILWAY_DEPLOYMENT_ID || 
                    process.env.VERCEL_DEPLOYMENT_ID ||
                    'deployment-' + Date.now();

console.log('Build ID:', buildId);
console.log('Deployment ID:', deploymentId);

// Set environment variables for the build
process.env.NEXT_BUILD_ID = buildId;
process.env.NEXT_DEPLOYMENT_ID = deploymentId;

// Create a build info file
const buildInfo = {
  buildId,
  deploymentId,
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'production'
};

fs.writeFileSync(
  path.join(__dirname, 'build-info.json'), 
  JSON.stringify(buildInfo, null, 2)
);

console.log('✅ Build fix completed');
console.log('📄 Build info saved to build-info.json');

module.exports = buildInfo;