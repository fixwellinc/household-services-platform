#!/usr/bin/env node

/**
 * Quick Railway Deployment Test
 * 
 * Simple automated test for Railway deployment
 */

import https from 'https';
import http from 'http';

const RAILWAY_URL = 'https://fixwell.ca';

console.log('🚀 Quick Railway Deployment Test');
console.log('================================');
console.log('');

async function testEndpoint(url, description) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`🔍 ${description}: ${res.statusCode === 200 ? '✅' : '❌'} (${res.statusCode})`);
        resolve(res.statusCode === 200);
      });
    });
    
    req.on('error', () => {
      console.log(`🔍 ${description}: ❌ (Error)`);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`🔍 ${description}: ❌ (Timeout)`);
      resolve(false);
    });
  });
}

async function runQuickTest() {
  console.log(`🎯 Testing: ${RAILWAY_URL}`);
  console.log('');
  
  const tests = [
    [`${RAILWAY_URL}/health`, 'Health Check'],
    [`${RAILWAY_URL}/api/stripe-test/test-stripe`, 'Stripe Connection'],
    [`${RAILWAY_URL}/api/admin/email-templates/campaigns`, 'Email Campaigns'],
    [`${RAILWAY_URL}/stripe-test.html`, 'Stripe Web Interface'],
  ];
  
  let passed = 0;
  
  for (const [url, description] of tests) {
    const success = await testEndpoint(url, description);
    if (success) passed++;
  }
  
  console.log('');
  console.log(`📊 Results: ${passed}/${tests.length} tests passed`);
  
  if (passed === tests.length) {
    console.log('🎉 All tests passed! Deployment is working.');
    console.log('');
    console.log('🔗 Test your Stripe integration:');
    console.log(`   ${RAILWAY_URL}/stripe-test.html`);
  } else {
    console.log('⚠️  Some tests failed. Deployment may still be in progress.');
  }
}

runQuickTest().catch(console.error);
