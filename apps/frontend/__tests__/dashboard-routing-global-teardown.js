/**
 * Dashboard Routing Global Test Teardown
 * 
 * Global teardown for dashboard routing tests
 */

module.exports = async () => {
  console.log('🧹 Cleaning up dashboard routing test environment...');
  
  // Calculate total test time
  const totalTime = Date.now() - global.__DASHBOARD_ROUTING_TEST_START__;
  console.log(`⏱️  Total test execution time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
  
  // Clean up any global resources
  delete global.__DASHBOARD_ROUTING_TEST_START__;
  
  console.log('✅ Dashboard routing test cleanup complete');
};