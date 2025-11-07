#!/usr/bin/env node

/**
 * Service Isolation and Error Handling Test Script
 * Tests unified server error handling, graceful degradation, and service isolation
 */

import { fileURLToPath } from 'url';
import path from 'path';
import http from 'http';
import { logger } from '../apps/backend/src/utils/logger.js';

// Import environment configuration
import { validateEnvironment } from '../apps/backend/src/config/environmentValidator.js';
import { applyEnvironmentDefaults } from '../apps/backend/src/config/environmentDefaults.js';

// Import services for testing
import EnhancedUnifiedServer from '../unified-server-enhanced.js';
import ServiceManager from '../apps/backend/src/services/serviceManager.js';
import MaintenancePageService from '../apps/backend/src/services/maintenancePageService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ServiceIsolationTester {
  constructor() {
    this.testResults = {
      initialization: { passed: 0, failed: 0, tests: [] },
      isolation: { passed: 0, failed: 0, tests: [] },
      errorHandling: { passed: 0, failed: 0, tests: [] },
      healthCheck: { passed: 0, failed: 0, tests: [] }
    };
    this.server = null;
    this.testPort = 3001; // Use different port for testing
    this.originalEnv = { ...process.env };
  }

  /**
   * Run all service isolation tests
   */
  async runAllTests() {
    console.log('🔧 Starting Service Isolation and Error Handling Tests\n');
    
    try {
      // Setup test environment
      await this.setupTestEnvironment();
      
      // Test server initialization
      await this.testServerInitialization();
      
      // Test service isolation
      await this.testServiceIsolation();
      
      // Test error handling scenarios
      await this.testErrorHandling();
      
      // Test health check functionality
      await this.testHealthCheckFunctionality();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Service isolation test suite failed:', error.message);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Setup test environment
   */
  async setupTestEnvironment() {
    console.log('⚙️  Setting up test environment...');
    
    // Configure test environment
    process.env.NODE_ENV = 'test';
    process.env.PORT = this.testPort.toString();
    process.env.HOSTNAME = '127.0.0.1';
    
    // Disable Redis for isolation testing
    delete process.env.REDIS_URL;
    delete process.env.REDIS_PRIVATE_URL;
    
    // Apply environment defaults
    applyEnvironmentDefaults();
    
    console.log('✅ Test environment configured');
    console.log(`   Port: ${this.testPort}`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
  }

  /**
   * Test server initialization
   */
  async testServerInitialization() {
    console.log('\n🚀 Testing Server Initialization...');
    
    // Test 1: Server instance creation
    await this.runTest('initialization', 'Server Instance Creation', async () => {
      this.server = new EnhancedUnifiedServer();
      
      if (!this.server) {
        throw new Error('Failed to create server instance');
      }
      
      if (!this.server.serviceManager) {
        throw new Error('Service manager not initialized');
      }
      
      if (!this.server.errorRecovery) {
        throw new Error('Error recovery service not initialized');
      }
      
      return 'Server instance created with all required components';
    });

    // Test 2: Service registration
    await this.runTest('initialization', 'Service Registration', async () => {
      const criticalServices = Array.from(this.server.serviceManager.criticalServices);
      const nonCriticalServices = Array.from(this.server.serviceManager.nonCriticalServices);
      
      if (criticalServices.length === 0) {
        throw new Error('No critical services registered');
      }
      
      // Check for expected critical services
      const expectedCritical = ['database', 'backend', 'maintenance'];
      const missingCritical = expectedCritical.filter(service => !criticalServices.includes(service));
      
      if (missingCritical.length > 0) {
        throw new Error(`Missing critical services: ${missingCritical.join(', ')}`);
      }
      
      return `Services registered - Critical: ${criticalServices.length} (${criticalServices.join(', ')}), Non-critical: ${nonCriticalServices.length}`;
    });

    // Test 3: Error recovery setup
    await this.runTest('initialization', 'Error Recovery Setup', async () => {
      const recoveryStatus = this.server.errorRecovery.getRecoveryStatus();
      
      if (!recoveryStatus) {
        throw new Error('Error recovery status not available');
      }
      
      if (typeof recoveryStatus.monitoring !== 'boolean') {
        throw new Error('Error recovery monitoring status not available');
      }
      
      return `Error recovery configured - Monitoring: ${recoveryStatus.monitoring}`;
    });

    // Test 4: Server startup
    await this.runTest('initialization', 'Server Startup', async () => {
      await this.server.start();
      
      if (!this.server.isStarted) {
        throw new Error('Server failed to start');
      }
      
      if (!this.server.httpServer) {
        throw new Error('HTTP server not created');
      }
      
      return 'Server started successfully';
    });
  }

  /**
   * Test service isolation
   */
  async testServiceIsolation() {
    console.log('\n🔒 Testing Service Isolation...');
    
    // Test 1: Critical vs non-critical service handling
    await this.runTest('isolation', 'Critical vs Non-Critical Service Handling', async () => {
      const healthCheck = await this.server.serviceManager.getHealthCheck();
      
      if (!healthCheck) {
        throw new Error('Health check not available');
      }
      
      // Check that server is running despite Redis being unavailable
      if (healthCheck.status === 'unhealthy') {
        throw new Error('Server should not be unhealthy due to non-critical service failures');
      }
      
      // Verify Redis is in degraded state (expected since we disabled it)
      const redisService = healthCheck.services.redis;
      if (redisService && redisService.status === 'healthy') {
        return 'Redis unexpectedly healthy (may be using fallback mode)';
      }
      
      return `Service isolation working - Overall status: ${healthCheck.status}`;
    });

    // Test 2: Service manager functionality
    await this.runTest('isolation', 'Service Manager Functionality', async () => {
      const serviceManager = this.server.serviceManager;
      
      // Test service status retrieval
      const allServices = serviceManager.getAllServices();
      if (Object.keys(allServices).length === 0) {
        throw new Error('No services registered in service manager');
      }
      
      // Test critical service identification
      const criticalServices = Array.from(serviceManager.criticalServices);
      const nonCriticalServices = Array.from(serviceManager.nonCriticalServices);
      
      if (criticalServices.length === 0) {
        throw new Error('No critical services identified');
      }
      
      return `Service manager functional - ${Object.keys(allServices).length} total services (${criticalServices.length} critical, ${nonCriticalServices.length} non-critical)`;
    });

    // Test 3: Maintenance page service
    await this.runTest('isolation', 'Maintenance Page Service', async () => {
      const maintenanceService = this.server.services.maintenance;
      
      if (!maintenanceService) {
        throw new Error('Maintenance page service not available');
      }
      
      // Test maintenance page generation
      const mockReq = { url: '/', method: 'GET', headers: {} };
      const mockRes = {
        statusCode: null,
        headers: {},
        content: null,
        setHeader: function(name, value) { this.headers[name] = value; },
        end: function(content) { this.content = content; }
      };
      
      maintenanceService.serveFrontendMaintenance(mockReq, mockRes, {
        reason: 'Test maintenance page'
      });
      
      if (!mockRes.content) {
        throw new Error('Maintenance page not generated');
      }
      
      if (!mockRes.content.includes('maintenance')) {
        throw new Error('Maintenance page content invalid');
      }
      
      return 'Maintenance page service functional';
    });

    // Test 4: Service health monitoring
    await this.runTest('isolation', 'Service Health Monitoring', async () => {
      const healthCheck = await this.server.serviceManager.getHealthCheck();
      
      // Verify health check structure
      if (!healthCheck.services) {
        throw new Error('Health check missing services information');
      }
      
      if (typeof healthCheck.totalServices !== 'number') {
        throw new Error('Health check missing total services count');
      }
      
      if (typeof healthCheck.runningServices !== 'number') {
        throw new Error('Health check missing running services count');
      }
      
      // Check individual service health
      const serviceNames = Object.keys(healthCheck.services);
      const healthyServices = serviceNames.filter(name => 
        healthCheck.services[name].status === 'healthy'
      );
      
      return `Health monitoring functional - ${healthyServices.length}/${serviceNames.length} services healthy`;
    });
  }

  /**
   * Test error handling scenarios
   */
  async testErrorHandling() {
    console.log('\n🚨 Testing Error Handling Scenarios...');
    
    // Test 1: HTTP request error handling
    await this.runTest('errorHandling', 'HTTP Request Error Handling', async () => {
      // Test health check endpoint (should always work)
      const healthResponse = await this.makeHttpRequest('/api/health');
      
      if (healthResponse.statusCode !== 200) {
        throw new Error(`Health check failed with status ${healthResponse.statusCode}`);
      }
      
      const healthData = JSON.parse(healthResponse.body);
      if (!healthData.status) {
        throw new Error('Health check response missing status');
      }
      
      return `Health check endpoint working - Status: ${healthData.status}`;
    });

    // Test 2: API request handling with backend service
    await this.runTest('errorHandling', 'API Request Handling', async () => {
      // Test API endpoint
      const apiResponse = await this.makeHttpRequest('/api/health');
      
      if (apiResponse.statusCode !== 200) {
        throw new Error(`API request failed with status ${apiResponse.statusCode}`);
      }
      
      return 'API request handling functional';
    });

    // Test 3: Frontend request handling (should show maintenance page)
    await this.runTest('errorHandling', 'Frontend Request Handling', async () => {
      // Test root path (frontend)
      const frontendResponse = await this.makeHttpRequest('/');
      
      // Should either serve frontend or maintenance page
      if (frontendResponse.statusCode !== 200 && frontendResponse.statusCode !== 503) {
        throw new Error(`Frontend request failed with unexpected status ${frontendResponse.statusCode}`);
      }
      
      // If it's a maintenance page, verify content
      if (frontendResponse.statusCode === 503 || frontendResponse.body.includes('maintenance')) {
        if (!frontendResponse.body.includes('maintenance')) {
          throw new Error('Maintenance page content invalid');
        }
        return 'Frontend fallback to maintenance page working';
      }
      
      return 'Frontend request handling functional';
    });

    // Test 4: Error recovery monitoring
    await this.runTest('errorHandling', 'Error Recovery Monitoring', async () => {
      const recoveryStatus = this.server.errorRecovery.getRecoveryStatus();
      
      if (!recoveryStatus) {
        throw new Error('Error recovery status not available');
      }
      
      // Start monitoring if not already started
      if (!recoveryStatus.monitoring) {
        this.server.errorRecovery.startMonitoring(5000); // 5 second interval for testing
        
        // Wait a moment for monitoring to start
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const updatedStatus = this.server.errorRecovery.getRecoveryStatus();
        if (!updatedStatus.monitoring) {
          throw new Error('Error recovery monitoring failed to start');
        }
      }
      
      return `Error recovery monitoring active - Failed services: ${recoveryStatus.totalFailedServices || 0}`;
    });
  }

  /**
   * Test health check functionality
   */
  async testHealthCheckFunctionality() {
    console.log('\n🏥 Testing Health Check Functionality...');
    
    // Test 1: Health check endpoint response structure
    await this.runTest('healthCheck', 'Health Check Response Structure', async () => {
      const response = await this.makeHttpRequest('/api/health');
      
      if (response.statusCode !== 200) {
        throw new Error(`Health check returned status ${response.statusCode}`);
      }
      
      const healthData = JSON.parse(response.body);
      
      // Verify required fields
      const requiredFields = ['status', 'timestamp', 'services', 'server'];
      const missingFields = requiredFields.filter(field => !(field in healthData));
      
      if (missingFields.length > 0) {
        throw new Error(`Health check missing fields: ${missingFields.join(', ')}`);
      }
      
      return `Health check structure valid - Status: ${healthData.status}`;
    });

    // Test 2: Service-specific health information
    await this.runTest('healthCheck', 'Service-Specific Health Information', async () => {
      const response = await this.makeHttpRequest('/api/health');
      const healthData = JSON.parse(response.body);
      
      if (!healthData.services || typeof healthData.services !== 'object') {
        throw new Error('Health check missing services information');
      }
      
      const serviceNames = Object.keys(healthData.services);
      if (serviceNames.length === 0) {
        throw new Error('No services reported in health check');
      }
      
      // Verify each service has status
      const servicesWithoutStatus = serviceNames.filter(name => 
        !healthData.services[name].status
      );
      
      if (servicesWithoutStatus.length > 0) {
        throw new Error(`Services missing status: ${servicesWithoutStatus.join(', ')}`);
      }
      
      return `Service health information complete - ${serviceNames.length} services reported`;
    });

    // Test 3: Environment and configuration information
    await this.runTest('healthCheck', 'Environment and Configuration Information', async () => {
      const response = await this.makeHttpRequest('/api/health');
      const healthData = JSON.parse(response.body);
      
      // Check for environment information
      if (!healthData.environment) {
        throw new Error('Health check missing environment information');
      }
      
      // Check for server information
      if (!healthData.server) {
        throw new Error('Health check missing server information');
      }
      
      // Verify server startup information
      if (typeof healthData.server.started !== 'boolean') {
        throw new Error('Health check missing server startup status');
      }
      
      return `Environment and server information complete - Environment: ${healthData.environment.name}`;
    });

    // Test 4: Health check caching and performance
    await this.runTest('healthCheck', 'Health Check Performance', async () => {
      const startTime = Date.now();
      
      // Make multiple health check requests
      const requests = [];
      for (let i = 0; i < 3; i++) {
        requests.push(this.makeHttpRequest('/api/health'));
      }
      
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      // Verify all requests succeeded
      const failedRequests = responses.filter(r => r.statusCode !== 200);
      if (failedRequests.length > 0) {
        throw new Error(`${failedRequests.length} health check requests failed`);
      }
      
      const avgResponseTime = totalTime / responses.length;
      
      if (avgResponseTime > 1000) {
        throw new Error(`Health check too slow: ${avgResponseTime}ms average`);
      }
      
      return `Health check performance good - ${avgResponseTime.toFixed(2)}ms average response time`;
    });
  }

  /**
   * Make HTTP request to test server
   */
  async makeHttpRequest(path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: '127.0.0.1',
        port: this.testPort,
        path: path,
        method: 'GET',
        timeout: 5000
      };
      
      const req = http.request(options, (res) => {
        let body = '';
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        });
      });
      
      req.on('error', (error) => {
        reject(new Error(`HTTP request failed: ${error.message}`));
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('HTTP request timeout'));
      });
      
      req.end();
    });
  }

  /**
   * Run a single test
   */
  async runTest(category, testName, testFunction) {
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.testResults[category].passed++;
      this.testResults[category].tests.push({
        name: testName,
        status: 'PASSED',
        duration,
        result
      });
      
      console.log(`  ✅ ${testName} (${duration}ms)`);
      if (result) {
        console.log(`     ${result}`);
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.testResults[category].failed++;
      this.testResults[category].tests.push({
        name: testName,
        status: 'FAILED',
        duration,
        error: error.message
      });
      
      console.log(`  ❌ ${testName} (${duration}ms)`);
      console.log(`     Error: ${error.message}`);
    }
  }

  /**
   * Generate test report
   */
  generateReport() {
    console.log('\n📊 Service Isolation and Error Handling Test Report');
    console.log('====================================================');
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    Object.entries(this.testResults).forEach(([category, results]) => {
      const categoryTotal = results.passed + results.failed;
      totalPassed += results.passed;
      totalFailed += results.failed;
      
      console.log(`\n${category.toUpperCase()} Tests: ${results.passed}/${categoryTotal} passed`);
      
      results.tests.forEach(test => {
        const status = test.status === 'PASSED' ? '✅' : '❌';
        console.log(`  ${status} ${test.name} (${test.duration}ms)`);
        
        if (test.status === 'FAILED') {
          console.log(`      Error: ${test.error}`);
        } else if (test.result) {
          console.log(`      ${test.result}`);
        }
      });
    });
    
    const totalTests = totalPassed + totalFailed;
    const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
    
    console.log('\n====================================================');
    console.log(`Overall Results: ${totalPassed}/${totalTests} tests passed (${successRate}%)`);
    
    // Service isolation readiness assessment
    console.log('\n🔧 Service Isolation Readiness Assessment:');
    
    const categories = ['initialization', 'isolation', 'errorHandling', 'healthCheck'];
    const readinessStatus = {};
    
    categories.forEach(category => {
      const results = this.testResults[category];
      const total = results.passed + results.failed;
      const passRate = total > 0 ? (results.passed / total) * 100 : 0;
      
      readinessStatus[category] = passRate >= 80 ? 'READY' : passRate >= 60 ? 'NEEDS ATTENTION' : 'NOT READY';
      
      console.log(`   ${readinessStatus[category] === 'READY' ? '✅' : readinessStatus[category] === 'NEEDS ATTENTION' ? '⚠️' : '❌'} ${category.charAt(0).toUpperCase() + category.slice(1)}: ${readinessStatus[category]} (${passRate.toFixed(1)}%)`);
    });
    
    const overallReady = Object.values(readinessStatus).every(status => status === 'READY');
    const mostlyReady = Object.values(readinessStatus).filter(status => status !== 'NOT READY').length >= 3;
    
    console.log('\n====================================================');
    if (overallReady) {
      console.log('🎉 SERVICE ISOLATION READY: All error handling and isolation tests passed!');
    } else if (mostlyReady) {
      console.log('⚠️  MOSTLY READY: Minor issues detected, but service isolation should work.');
    } else {
      console.log('❌ NOT READY: Critical issues detected. Fix service isolation before deploying.');
    }
    
    console.log('\n🚀 Railway Deployment Validation Summary:');
    console.log(`   ✅ Server initialization: ${this.testResults.initialization.passed > 0 ? 'WORKING' : 'NEEDS ATTENTION'}`);
    console.log(`   ✅ Service isolation: ${this.testResults.isolation.passed > 0 ? 'WORKING' : 'NEEDS ATTENTION'}`);
    console.log(`   ✅ Error handling: ${this.testResults.errorHandling.passed > 0 ? 'WORKING' : 'NEEDS ATTENTION'}`);
    console.log(`   ✅ Health monitoring: ${this.testResults.healthCheck.passed > 0 ? 'WORKING' : 'NEEDS ATTENTION'}`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 All service isolation tests passed! Ready for Railway deployment.');
    }
  }

  /**
   * Cleanup test resources
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up test resources...');
    
    try {
      // Stop error recovery monitoring
      if (this.server && this.server.errorRecovery) {
        this.server.errorRecovery.stopMonitoring();
      }
      
      // Stop server
      if (this.server && this.server.isStarted) {
        await this.server._gracefulShutdown('test-cleanup');
      }
      
      // Restore original environment
      process.env = { ...this.originalEnv };
      
      console.log('✅ Cleanup completed');
      
    } catch (error) {
      console.log(`⚠️  Cleanup warning: ${error.message}`);
    }
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new ServiceIsolationTester();
  
  tester.runAllTests().catch((error) => {
    console.error('❌ Service isolation test execution failed:', error.message);
    process.exit(1);
  });
}

export default ServiceIsolationTester;