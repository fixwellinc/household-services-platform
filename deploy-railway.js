#!/usr/bin/env node

/**
 * Railway Deployment Script for Flexible Payment Options
 * 
 * This script helps deploy the application to Railway with proper configuration
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting Railway deployment for Flexible Payment Options...');

// Check if Railway CLI is installed
try {
  execSync('railway --version', { stdio: 'pipe' });
  console.log('✅ Railway CLI is installed');
} catch (error) {
  console.error('❌ Railway CLI is not installed. Please install it first:');
  console.error('   npm install -g @railway/cli');
  console.error('   or visit: https://docs.railway.app/develop/cli');
  process.exit(1);
}

// Check if user is logged in to Railway
try {
  execSync('railway whoami', { stdio: 'pipe' });
  console.log('✅ Logged in to Railway');
} catch (error) {
  console.error('❌ Not logged in to Railway. Please login first:');
  console.error('   railway login');
  process.exit(1);
}

// Check if we're in a Railway project
try {
  execSync('railway status', { stdio: 'pipe' });
  console.log('✅ Railway project detected');
} catch (error) {
  console.error('❌ No Railway project found. Please link or create a project:');
  console.error('   railway link   (to link existing project)');
  console.error('   railway login  (to create new project)');
  process.exit(1);
}

console.log('📋 Pre-deployment checklist:');

// Check if Dockerfile exists
if (fs.existsSync('Dockerfile')) {
  console.log('✅ Dockerfile found');
} else {
  console.error('❌ Dockerfile not found');
  process.exit(1);
}

// Check if railway.toml exists
if (fs.existsSync('railway.toml')) {
  console.log('✅ railway.toml configuration found');
} else {
  console.error('❌ railway.toml not found');
  process.exit(1);
}

// Check if package.json exists
if (fs.existsSync('package.json')) {
  console.log('✅ package.json found');
} else {
  console.error('❌ package.json not found');
  process.exit(1);
}

console.log('\n🔧 Environment Variables Setup:');
console.log('Please ensure the following environment variables are set in Railway:');
console.log('');
console.log('Required Variables:');
console.log('- DATABASE_URL (automatically provided by Railway PostgreSQL)');
console.log('- JWT_SECRET (minimum 32 characters)');
console.log('- STRIPE_SECRET_KEY (production key: sk_live_...)');
console.log('- STRIPE_PUBLISHABLE_KEY (production key: pk_live_...)');
console.log('- STRIPE_WEBHOOK_SECRET');
console.log('');
console.log('Optional but Recommended:');
console.log('- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER');
console.log('- SMTP_HOST, SMTP_USER, SMTP_PASS');
console.log('- SENTRY_DSN (for error monitoring)');
console.log('');
console.log('📝 You can set these in Railway dashboard or using:');
console.log('   railway variables set KEY=value');
console.log('');

// Ask for confirmation
const readline = await import('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

const proceed = await askQuestion('Have you set all required environment variables? (y/N): ');
if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
  console.log('⏸️  Deployment cancelled. Please set environment variables first.');
  rl.close();
  process.exit(0);
}

console.log('\n🚀 Starting deployment...');

try {
  // Deploy to Railway
  console.log('📦 Deploying to Railway...');
  execSync('railway up --detach', { stdio: 'inherit' });
  
  console.log('\n✅ Deployment initiated successfully!');
  console.log('');
  console.log('📊 You can monitor the deployment progress:');
  console.log('   railway logs');
  console.log('');
  console.log('🌐 Once deployed, your app will be available at:');
  
  // Get the Railway URL
  try {
    const url = execSync('railway domain', { encoding: 'utf8' }).trim();
    console.log(`   ${url}`);
  } catch (error) {
    console.log('   Check Railway dashboard for your app URL');
  }
  
  console.log('');
  console.log('🔍 Health check endpoint:');
  console.log('   /health (basic health check)');
  console.log('   /health/detailed (detailed component status)');
  console.log('');
  console.log('📋 Post-deployment checklist:');
  console.log('1. ✅ Verify health check endpoints are responding');
  console.log('2. ✅ Test user registration and login');
  console.log('3. ✅ Test Stripe payment integration');
  console.log('4. ✅ Verify email/SMS notifications (if configured)');
  console.log('5. ✅ Test flexible payment options features');
  console.log('');
  console.log('🎉 Flexible Payment Options deployed to Railway!');
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.error('');
  console.error('🔧 Troubleshooting:');
  console.error('1. Check Railway logs: railway logs');
  console.error('2. Verify environment variables: railway variables');
  console.error('3. Check build logs in Railway dashboard');
  console.error('4. Ensure database is connected and accessible');
  process.exit(1);
} finally {
  rl.close();
}