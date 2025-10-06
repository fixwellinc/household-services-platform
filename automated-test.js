#!/usr/bin/env node

/**
 * Automated Railway Deployment & Stripe Integration Test
 * 
 * This script automatically tests your Railway deployment and Stripe integration
 * after deployment completes.
 */

import https from 'https';
import http from 'http';
import { setTimeout } from 'timers/promises';

const RAILWAY_URL = 'https://fixwell.ca';
const TEST_TIMEOUT = 30000; // 30 seconds per test
const MAX_RETRIES = 3;

console.log('🚀 Automated Railway Deployment & Stripe Test');
console.log('============================================');
console.log('');

class DeploymentTester {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, TEST_TIMEOUT);

      const req = client.get(url, (res) => {
        clearTimeout(timeout);
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = data ? JSON.parse(data) : {};
            resolve({
              status: res.statusCode,
              data: jsonData,
              headers: res.headers
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              data: data,
              headers: res.headers
            });
          }
        });
      });

      req.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      req.setTimeout(TEST_TIMEOUT, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async testEndpoint(path, description, expectedStatus = 200) {
    const url = `${RAILWAY_URL}${path}`;
    console.log(`🔍 Testing: ${description}`);
    console.log(`   URL: ${url}`);
    
    try {
      const response = await this.makeRequest(url);
      
      if (response.status === expectedStatus) {
        console.log(`   ✅ Status: ${response.status} - Success`);
        
        // Additional checks for specific endpoints
        if (path.includes('stripe-test')) {
          if (response.data.success !== undefined) {
            console.log(`   📊 Success: ${response.data.success}`);
          }
          if (response.data.mode) {
            console.log(`   🔧 Mode: ${response.data.mode}`);
          }
          if (response.data.account) {
            console.log(`   🏢 Account: ${response.data.account.id}`);
          }
        }
        
        this.results.push({ test: description, status: 'PASS', details: response.status });
        return true;
      } else {
        console.log(`   ❌ Status: ${response.status} - Expected ${expectedStatus}`);
        this.results.push({ test: description, status: 'FAIL', details: `Expected ${expectedStatus}, got ${response.status}` });
        return false;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      this.results.push({ test: description, status: 'FAIL', details: error.message });
      return false;
    }
  }

  async testStripeIntegration() {
    console.log('\n🧪 Testing Stripe Integration...');
    console.log('===============================');
    
    const stripeTests = [
      ['/api/stripe-test/test-stripe', 'Stripe Connection Test'],
      ['/api/stripe-test/test-payment-intent', 'Payment Intent Creation', 200],
      ['/stripe-test.html', 'Stripe Web Interface'],
    ];

    let passed = 0;
    for (const [path, description, expectedStatus] of stripeTests) {
      const success = await this.testEndpoint(path, description, expectedStatus);
      if (success) passed++;
      console.log('');
    }

    return { passed, total: stripeTests.length };
  }

  async testBasicEndpoints() {
    console.log('\n🔗 Testing Basic Endpoints...');
    console.log('============================');
    
    const basicTests = [
      ['/health', 'Health Check'],
      ['/api/auth/me', 'Authentication Endpoint', 401], // Expected to fail without auth
    ];

    let passed = 0;
    for (const [path, description, expectedStatus] of basicTests) {
      const success = await this.testEndpoint(path, description, expectedStatus);
      if (success) passed++;
      console.log('');
    }

    return { passed, total: basicTests.length };
  }

  async testFrontendRoutes() {
    console.log('\n🌐 Testing Frontend Routes...');
    console.log('=============================');
    
    const frontendTests = [
      ['/api/admin/email-templates', 'Email Templates API'],
      ['/api/admin/email-templates/campaigns', 'Email Campaigns API'],
    ];

    let passed = 0;
    for (const [path, description] of frontendTests) {
      const success = await this.testEndpoint(path, description);
      if (success) passed++;
      console.log('');
    }

    return { passed, total: frontendTests.length };
  }

  async waitForDeployment() {
    console.log('⏳ Waiting for deployment to complete...');
    console.log('   This may take 2-5 minutes depending on build time');
    console.log('');
    
    const maxWaitTime = 5 * 60 * 1000; // 5 minutes
    const checkInterval = 30 * 1000; // 30 seconds
    let waited = 0;
    
    while (waited < maxWaitTime) {
      try {
        console.log(`   Checking deployment status... (${Math.round(waited / 1000)}s elapsed)`);
        const response = await this.makeRequest(`${RAILWAY_URL}/health`);
        
        if (response.status === 200) {
          console.log('   ✅ Deployment appears to be ready!');
          console.log('');
          return true;
        }
      } catch (error) {
        console.log(`   ⏳ Still deploying... (${error.message})`);
      }
      
      await setTimeout(checkInterval);
      waited += checkInterval;
    }
    
    console.log('   ⚠️  Deployment check timeout - proceeding with tests anyway');
    console.log('');
    return false;
  }

  async runAllTests() {
    console.log(`🎯 Target URL: ${RAILWAY_URL}`);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    console.log('');

    // Wait for deployment
    await this.waitForDeployment();

    // Run test suites
    const basicResults = await this.testBasicEndpoints();
    const frontendResults = await this.testFrontendRoutes();
    const stripeResults = await this.testStripeIntegration();

    // Calculate overall results
    const totalPassed = basicResults.passed + frontendResults.passed + stripeResults.passed;
    const totalTests = basicResults.total + frontendResults.total + stripeResults.total;

    // Print summary
    this.printSummary(totalPassed, totalTests);
    
    return totalPassed === totalTests;
  }

  printSummary(passed, total) {
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    
    console.log('\n📊 Test Results Summary');
    console.log('======================');
    
    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.status}`);
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
    });
    
    console.log('');
    console.log(`📈 Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${total - passed}`);
    console.log(`📊 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    console.log(`⏱️  Duration: ${duration}s`);
    
    if (passed === total) {
      console.log('\n🎉 All tests passed! Your deployment is working correctly.');
      console.log('');
      console.log('🔗 Available endpoints:');
      console.log(`   Health Check: ${RAILWAY_URL}/health`);
      console.log(`   Stripe Test: ${RAILWAY_URL}/api/stripe-test/test-stripe`);
      console.log(`   Web Interface: ${RAILWAY_URL}/stripe-test.html`);
      console.log(`   Communications: ${RAILWAY_URL}/admin/communications`);
      console.log('');
      console.log('💳 Test card numbers for Stripe testing:');
      console.log('   4242424242424242 - Visa Success');
      console.log('   4000000000000002 - Card Declined');
      console.log('   4000000000009995 - Insufficient Funds');
      console.log('   4000002500003155 - 3D Secure Required');
      console.log('');
      console.log('🚀 Your application is ready for use!');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the error messages above.');
      console.log('');
      console.log('💡 Troubleshooting tips:');
      console.log('   - Wait a few more minutes for deployment to complete');
      console.log('   - Check Railway logs for build errors');
      console.log('   - Verify environment variables are set');
      console.log('   - Ensure Stripe keys are configured');
    }
  }
}

// Main execution
async function main() {
  const tester = new DeploymentTester();
  
  try {
    const success = await tester.runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.log('');
    console.log('💡 Make sure:');
    console.log('   - Railway deployment is complete');
    console.log('   - Environment variables are set');
    console.log('   - Stripe keys are configured');
    console.log('   - RAILWAY_URL is correct');
    process.exit(1);
  }
}

// Run the tests
main().catch(console.error);
