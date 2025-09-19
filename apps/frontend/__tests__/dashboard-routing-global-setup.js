/**
 * Dashboard Routing Global Test Setup
 * 
 * Global setup for dashboard routing tests
 */

module.exports = async () => {
  console.log('🔧 Setting up dashboard routing test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  
  // Mock environment variables for API endpoints
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001/api';
  
  // Set up performance monitoring
  global.__DASHBOARD_ROUTING_TEST_START__ = Date.now();
  
  console.log('✅ Dashboard routing test environment ready');
};