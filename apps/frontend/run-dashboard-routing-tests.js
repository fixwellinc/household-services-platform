#!/usr/bin/env node

/**
 * Simple Dashboard Routing Test Runner
 * 
 * Runs only the dashboard routing tests we created
 */

const { execSync } = require('child_process');

const DASHBOARD_ROUTING_TESTS = [
  '__tests__/integration/complete-dashboard-routing-flow.test.tsx',
  '__tests__/e2e/subscription-scenarios-routing.test.tsx',
  '__tests__/integration/error-recovery-fallback-mechanisms.test.tsx',
  '__tests__/performance/dashboard-loading-performance.test.tsx',
  '__tests__/integration/browser-navigation-url-parameters.test.tsx',
];

console.log('🧪 Running Dashboard Routing Tests');
console.log('==================================\n');

let passedTests = 0;
let failedTests = 0;

for (const testFile of DASHBOARD_ROUTING_TESTS) {
  console.log(`📋 Running: ${testFile}`);
  
  try {
    const command = `npx jest "${testFile}" --verbose --no-coverage --testTimeout=30000`;
    
    execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    
    console.log(`  ✅ PASSED\n`);
    passedTests++;
  } catch (error) {
    console.log(`  ❌ FAILED\n`);
    failedTests++;
  }
}

console.log('📊 SUMMARY:');
console.log(`  Total Tests: ${DASHBOARD_ROUTING_TESTS.length}`);
console.log(`  Passed: ${passedTests}`);
console.log(`  Failed: ${failedTests}`);

if (failedTests === 0) {
  console.log('\n🎉 All dashboard routing tests passed!');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${failedTests} test(s) failed.`);
  process.exit(1);
}