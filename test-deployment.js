#!/usr/bin/env node

/**
 * Quick Railway Deployment Test
 * Tests the Stripe integration endpoints after deployment
 */

const https = require('https');
const http = require('http');

const RAILWAY_URL = 'https://fixwell.ca';

console.log('🚀 Testing Railway Deployment');
console.log('============================');
console.log('');

async function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const url = `${RAILWAY_URL}${path}`;
    console.log(`🔍 Testing: ${description}`);
    console.log(`   URL: ${url}`);
    
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`   ✅ Status: ${res.statusCode} - Success`);
          try {
            const json = JSON.parse(data);
            if (json.success !== undefined) {
              console.log(`   📊 Success: ${json.success}`);
            }
            if (json.mode) {
              console.log(`   🔧 Mode: ${json.mode}`);
            }
          } catch (e) {
            // Not JSON, that's fine
          }
        } else {
          console.log(`   ❌ Status: ${res.statusCode} - Failed`);
        }
        console.log('');
        resolve(res.statusCode === 200);
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}`);
      console.log('');
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      console.log(`   ⏰ Timeout: Request took too long`);
      console.log('');
      req.destroy();
      resolve(false);
    });
  });
}

async function runTests() {
  console.log('⏳ Waiting 30 seconds for deployment to complete...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  console.log('🧪 Running deployment tests...');
  console.log('');
  
  const tests = [
    ['/health', 'Health Check'],
    ['/api/stripe-test/test-stripe', 'Stripe Connection Test'],
    ['/stripe-test.html', 'Stripe Web Interface'],
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const [path, description] of tests) {
    const success = await testEndpoint(path, description);
    if (success) passed++;
  }
  
  console.log('📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}/${total}`);
  console.log(`   📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  console.log('');
  
  if (passed === total) {
    console.log('🎉 All tests passed! Your Stripe testing tools are ready!');
    console.log('');
    console.log('🔗 Available testing endpoints:');
    console.log(`   Web Interface: ${RAILWAY_URL}/stripe-test.html`);
    console.log(`   API Test: ${RAILWAY_URL}/api/stripe-test/test-stripe`);
    console.log(`   Frontend Test: ${RAILWAY_URL}/test-stripe`);
    console.log('');
    console.log('💳 Test card numbers:');
    console.log('   4242424242424242 - Visa Success');
    console.log('   4000000000000002 - Card Declined');
    console.log('   4000000000009995 - Insufficient Funds');
  } else {
    console.log('⚠️  Some tests failed. The deployment might still be in progress.');
    console.log('   Wait a few more minutes and try again.');
  }
}

runTests().catch(console.error);
