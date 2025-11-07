#!/usr/bin/env node

/**
 * Test script for the Enhanced Unified Server
 * Tests service isolation and error handling capabilities
 */

import http from 'http';
import { logger } from '../apps/backend/src/utils/logger.js';

const SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3000';
const TIMEOUT = 10000; // 10 seconds

console.log('🧪 Testing Enhanced Unified Server...');
console.log(`📡 Server URL: ${SERVER_URL}`);

/**
 * Make HTTP request with timeout
 */
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SERVER_URL);
    const requestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: TIMEOUT
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            json: null
          };
          
          // Try to parse JSON
          if (res.headers['content-type']?.includes('application/json')) {
            try {
              result.json = JSON.parse(data);
            } catch (e) {
              // Not valid JSON, keep as string
            }
          }
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * Test cases
 */
const tests = [
  {
    name: 'Health Check Endpoint',
    path: '/api/health',
    expectedStatus: [200, 503],
    validate: (response) => {
      if (!response.json) {
        throw new Error('Health check should return JSON');
      }
      
      const required = ['status', 'timestamp', 'services', 'summary'];
      for (const field of required) {
        if (!(field in response.json)) {
          throw new Error(`Health check missing field: ${field}`);
        }
      }
      
      return true;
    }
  },
  {
    name: 'API Endpoint Availability',
    path: '/api/health',
    expectedStatus: [200, 503],
    validate: (response) => {
      // API should always be reachable, even if degraded
      return response.statusCode !== 404;
    }
  },
  {
    name: 'Frontend Maintenance Page',
    path: '/',
    expectedStatus: [200, 503],
    validate: (response) => {
      if (response.statusCode === 503) {
        // Should be maintenance page
        return response.body.includes('Fixwell Services') && 
               response.body.includes('maintenance');
      }
      // If 200, should be the actual frontend
      return true;
    }
  },
  {
    name: 'Service Status Information',
    path: '/api/health',
    expectedStatus: [200, 503],
    validate: (response) => {
      if (!response.json || !response.json.services) {
        throw new Error('Health check should include services information');
      }
      
      const services = response.json.services;
      const expectedServices = ['database', 'backend', 'maintenance'];
      
      for (const service of expectedServices) {
        if (!(service in services)) {
          throw new Error(`Missing critical service: ${service}`);
        }
      }
      
      return true;
    }
  },
  {
    name: 'Error Recovery Information',
    path: '/api/health',
    expectedStatus: [200, 503],
    validate: (response) => {
      if (!response.json || !response.json.recovery) {
        throw new Error('Health check should include recovery information');
      }
      
      const recovery = response.json.recovery;
      const required = ['monitoring', 'failedServices', 'services'];
      
      for (const field of required) {
        if (!(field in recovery)) {
          throw new Error(`Recovery info missing field: ${field}`);
        }
      }
      
      return true;
    }
  }
];

/**
 * Run tests
 */
async function runTests() {
  let passed = 0;
  let failed = 0;
  
  console.log(`\n🧪 Running ${tests.length} tests...\n`);
  
  for (const test of tests) {
    try {
      console.log(`⏳ ${test.name}...`);
      
      const response = await makeRequest(test.path);
      
      // Check status code
      if (!test.expectedStatus.includes(response.statusCode)) {
        throw new Error(`Expected status ${test.expectedStatus.join(' or ')}, got ${response.statusCode}`);
      }
      
      // Run custom validation
      if (test.validate) {
        test.validate(response);
      }
      
      console.log(`✅ ${test.name} - PASSED`);
      passed++;
      
    } catch (error) {
      console.log(`❌ ${test.name} - FAILED: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Test Results:`);
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Enhanced server is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the server logs for more details.');
  }
  
  return failed === 0;
}

/**
 * Check if server is running
 */
async function checkServerRunning() {
  try {
    await makeRequest('/api/health');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Check if server is running
    console.log('🔍 Checking if server is running...');
    const isRunning = await checkServerRunning();
    
    if (!isRunning) {
      console.log('❌ Server is not running or not responding');
      console.log('💡 Start the server with: npm start');
      process.exit(1);
    }
    
    console.log('✅ Server is running');
    
    // Run tests
    const success = await runTests();
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runTests, checkServerRunning };