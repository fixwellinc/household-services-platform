#!/usr/bin/env node

/**
 * Test script for Admin Dashboard API endpoints
 * Run with: node test-admin-api.js
 */

const BASE_URL = 'http://localhost:5000';

// Test endpoints
const testEndpoints = [
  { path: '/api/admin/dashboard/stats', method: 'GET' },
  { path: '/api/admin/dashboard/users', method: 'GET' },
  { path: '/api/admin/dashboard/revenue', method: 'GET' },
  { path: '/api/admin/dashboard/bookings', method: 'GET' },
  { path: '/api/admin/dashboard/alerts', method: 'GET' },
  { path: '/api/admin/dashboard/subscriptions', method: 'GET' },
  { path: '/api/admin/dashboard/layouts?userId=admin', method: 'GET' },
  { path: '/api/admin/audit-logs?page=1&limit=10', method: 'GET' },
  { path: '/api/admin/audit-logs/stats', method: 'GET' }
];

async function testEndpoint(endpoint) {
  try {
    console.log(`\n🔍 Testing ${endpoint.method} ${endpoint.path}`);

    const response = await fetch(`${BASE_URL}${endpoint.path}`, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        // Add any required auth headers here
      }
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success`);

      // Log structure without full data
      if (data.success !== undefined) {
        console.log(`   Success flag: ${data.success}`);
      }

      if (data.stats) {
        console.log(`   Stats keys: ${Object.keys(data.stats).join(', ')}`);
      }

      if (data.auditLogs) {
        console.log(`   Audit logs count: ${data.auditLogs.length}`);
      }

      if (data.pagination) {
        console.log(`   Pagination: page ${data.pagination.page}, total ${data.pagination.totalCount}`);
      }

      if (data.layouts) {
        console.log(`   Layouts count: ${data.layouts.length}`);
      }

      // For other endpoints, just log basic structure
      if (!data.success && !data.stats && !data.auditLogs && !data.layouts) {
        console.log(`   Data keys: ${Object.keys(data).join(', ')}`);
      }

    } else {
      console.log(`   ❌ Failed`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
    }

  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Admin Dashboard API Tests');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Note: This assumes the backend server is running on port 5000`);

  for (const endpoint of testEndpoints) {
    await testEndpoint(endpoint);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n✨ Tests completed!');
  console.log('\nTo run with a live server:');
  console.log('1. Start the backend: npm run dev:backend');
  console.log('2. Run this script: node test-admin-api.js');
}

// Check if this is being run directly
if (import.meta.url === new URL(import.meta.url).href) {
  runTests().catch(console.error);
}

export { testEndpoints, testEndpoint, runTests };