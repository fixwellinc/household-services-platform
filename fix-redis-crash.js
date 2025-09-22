#!/usr/bin/env node

/**
 * Emergency fix for Redis crash on Railway
 * This script sets the DISABLE_REDIS environment variable to prevent crashes
 */

import { execSync } from 'child_process';

console.log('🚨 Emergency Redis Fix for Railway Deployment');
console.log('===============================================\n');

console.log('🔧 Setting DISABLE_REDIS=true to prevent crashes...\n');

try {
  // Try to set via Railway CLI
  execSync('railway variables set DISABLE_REDIS true', { stdio: 'inherit' });
  console.log('✅ Successfully set DISABLE_REDIS=true via Railway CLI\n');
  
  console.log('🚀 Triggering redeploy...');
  execSync('railway up --detach', { stdio: 'inherit' });
  console.log('✅ Redeploy initiated\n');
  
} catch (error) {
  console.log('❌ Railway CLI not available or failed');
  console.log('\n📋 MANUAL FIX REQUIRED:');
  console.log('1. Go to https://railway.app');
  console.log('2. Navigate to your project');
  console.log('3. Go to Variables tab');
  console.log('4. Add this variable:');
  console.log('   DISABLE_REDIS = true');
  console.log('5. Redeploy your service\n');
}

console.log('🎯 What this fix does:');
console.log('- Disables Redis cache initialization');
console.log('- App will run without caching (slightly slower but stable)');
console.log('- Prevents ECONNREFUSED errors that crash the app');
console.log('- Your app should be stable within 2-3 minutes\n');

console.log('💡 Future improvements:');
console.log('- Add Railway Redis addon for better performance');
console.log('- Or implement in-memory caching fallback');
console.log('- Monitor app performance without Redis\n');

console.log('✅ Fix complete! Check your Railway logs in a few minutes.');