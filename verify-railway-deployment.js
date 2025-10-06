#!/usr/bin/env node

/**
 * Railway Deployment Verification Script
 * 
 * This script checks if your Railway deployment is ready
 * and tests the Stripe integration.
 */

import fetch from 'node-fetch';

const RAILWAY_URL = process.env.RAILWAY_URL || 'https://your-app.railway.app';

console.log('🚀 Railway Deployment Verification');
console.log('=================================');
console.log('');

async function checkDeployment() {
  try {
    console.log(`🔍 Checking deployment at: ${RAILWAY_URL}`);
    console.log('');

    // Check basic health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${RAILWAY_URL}/health`);
    if (healthResponse.ok) {
      console.log('✅ Health endpoint is responding');
    } else {
      console.log('❌ Health endpoint failed');
      return false;
    }

    // Check Stripe test endpoint
    console.log('2. Testing Stripe test endpoint...');
    const stripeResponse = await fetch(`${RAILWAY_URL}/api/stripe-test/test-stripe`);
    if (stripeResponse.ok) {
      const stripeData = await stripeResponse.json();
      console.log('✅ Stripe test endpoint is responding');
      console.log(`   Mode: ${stripeData.mode}`);
      console.log(`   Account ID: ${stripeData.account?.id}`);
    } else {
      console.log('❌ Stripe test endpoint failed');
      return false;
    }

    // Check web interface
    console.log('3. Testing web interface...');
    const webResponse = await fetch(`${RAILWAY_URL}/stripe-test.html`);
    if (webResponse.ok) {
      console.log('✅ Web interface is accessible');
    } else {
      console.log('❌ Web interface failed');
      return false;
    }

    console.log('');
    console.log('🎉 Deployment verification complete!');
    console.log('');
    console.log('🔗 Available testing endpoints:');
    console.log(`   Web Interface: ${RAILWAY_URL}/stripe-test.html`);
    console.log(`   API Test: ${RAILWAY_URL}/api/stripe-test/test-stripe`);
    console.log(`   Health Check: ${RAILWAY_URL}/health`);
    console.log('');
    console.log('💳 Test card numbers:');
    console.log('   4242424242424242 - Visa Success');
    console.log('   4000000000000002 - Card Declined');
    console.log('   4000000000009995 - Insufficient Funds');
    console.log('');
    console.log('🚀 Ready for Stripe testing!');

    return true;

  } catch (error) {
    console.log(`❌ Deployment check failed: ${error.message}`);
    console.log('');
    console.log('💡 Make sure:');
    console.log('   - Railway deployment is complete');
    console.log('   - Environment variables are set');
    console.log('   - Stripe keys are configured');
    console.log('   - RAILWAY_URL is correct');
    return false;
  }
}

// Run the check
checkDeployment().then(success => {
  process.exit(success ? 0 : 1);
});
