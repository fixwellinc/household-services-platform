#!/usr/bin/env node

/**
 * Railway Deployment Validation Script
 * Validates Railway deployment readiness and simulates Railway environment
 */

import { fileURLToPath } from 'url';
import path from 'path';
import { logger } from '../apps/backend/src/utils/logger.js';

// Import environment configuration
import { validateEnvironment } from '../apps/backend/src/config/environmentValidator.js';
import { applyEnvironmentDefaults } from '../apps/backend/src/config/environmentDefaults.js';

// Import services for testing
import EnhancedUnifiedServer from '../unified-server-enhanced.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RailwayDeploymentValidator {
  constructor() {
    this.testResults = {
      environment: { passed: 0, failed: 0, tests: [] },
      docker: { passed: 0, failed: 0, tests: [] },
      services: { passed: 0, failed: 0, tests: [] },
      deployment: { passed: 0, failed: 0, tests: [] }
    };
    this.server = null;
    this.originalEnv = { ...process.env };
  }

  /**
   * Run all Railway deployment validation tests
   */
  async runAllTests() {
    console.log('🚀 Starting Railway Deployment Validation\n');
    
    try {
      // Test environment configuration
      await this.testEnvironmentConfiguration();
      
      // Test Docker build readiness
      await this.testDockerBuildReadiness();
      
      // Test service isolation and error handling
      await this.testServiceIsolation();
      
      // Test deployment scenarios
      await this.testDeploymentScenarios();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Validation suite failed:', error.message);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Test environment configuration for Railway
   */
  async testEnvironmentConfiguration() {
    console.log('⚙️  Testing Environment Configuration...');
    
    // Test 1: Environment variable validation
    await this.runTest('environment', 'Environment Variable Validation', async () => {
      // Apply defaults first
      applyEnvironmentDefaults();
      
      // Validate environment
      validateEnvironment();
      
      return 'Environment validation passed';
    });

    // Test 2: Railway environment simulation
    await this.runTest('environment', 'Railway Environment Simulation', async () => {
      // Simulate Railway environment variables
      process.env.RAILWAY_ENVIRONMENT = 'production';
      process.env.RAILWAY_PROJECT_ID = 'test-project-id';
      process.env.RAILWAY_SERVICE_ID = 'test-service-id';
      process.env.NODE_ENV = 'production';
      process.env.HOSTNAME = '0.0.0.0';
      process.env.PORT = '3000';
      
      // Simulate Redis URLs (Railway format)
      process.env.REDIS_URL = 'redis://redis.railway.internal:6379';
      process.env.REDIS_PRIVATE_URL = 'redis://redis.railway.internal:6379';
      
      // Simulate database URL
      process.env.DATABASE_URL = 'postgresql://user:pass@postgres.railway.internal:5432/db';
      
      // Re-apply defaults with Railway environment
      applyEnvironmentDefaults();
      
      return 'Railway environment simulation configured';
    });

    // Test 3: Required environment variables check
    await this.runTest('environment', 'Required Environment Variables Check', async () => {
      const requiredVars = [
        'NODE_ENV',
        'HOSTNAME', 
        'PORT',
        'DATABASE_URL'
      ];
      
      const missing = requiredVars.filter(varName => !process.env[varName]);
      
      if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
      }
      
      return `All required environment variables present: ${requiredVars.join(', ')}`;
    });

    // Test 4: Railway-specific configuration
    await this.runTest('environment', 'Railway-Specific Configuration', async () => {
      const railwayVars = [
        'RAILWAY_ENVIRONMENT',
        'RAILWAY_PROJECT_ID', 
        'RAILWAY_SERVICE_ID'
      ];
      
      const present = railwayVars.filter(varName => process.env[varName]);
      
      if (present.length === 0) {
        return 'Railway variables simulated (not in actual Railway environment)';
      }
      
      return `Railway environment detected: ${present.join(', ')}`;
    });
  }

  /**
   * Test Docker build readiness
   */
  async testDockerBuildReadiness() {
    console.log('\n🐳 Testing Docker Build Readiness...');
    
    // Test 1: Dockerfile validation
    await this.runTest('docker', 'Dockerfile Validation', async () => {
      const fs = await import('fs/promises');
      
      try {
        const dockerfileContent = await fs.readFile('Dockerfile', 'utf8');
        
        // Check for multi-stage build
        if (!dockerfileContent.includes('FROM node:') || !dockerfileContent.includes('AS ')) {
          throw new Error('Dockerfile should use multi-stage build');
        }
        
        // Check for proper WORKDIR
        if (!dockerfileContent.includes('WORKDIR')) {
          throw new Error('Dockerfile should set WORKDIR');
        }
        
        // Check for EXPOSE port
        if (!dockerfileContent.includes('EXPOSE')) {
          throw new Error('Dockerfile should expose port');
        }
        
        return 'Dockerfile structure validated';
        
      } catch (error) {
        if (error.code === 'ENOENT') {
          throw new Error('Dockerfile not found');
        }
        throw error;
      }
    });

    // Test 2: Package.json validation
    await this.runTest('docker', 'Package.json Validation', async () => {
      const fs = await import('fs/promises');
      
      try {
        const packageContent = await fs.readFile('package.json', 'utf8');
        const packageJson = JSON.parse(packageContent);
        
        // Check for required scripts
        const requiredScripts = ['start'];
        const missingScripts = requiredScripts.filter(script => !packageJson.scripts?.[script]);
        
        if (missingScripts.length > 0) {
          throw new Error(`Missing required scripts: ${missingScripts.join(', ')}`);
        }
        
        // Check for engines specification
        if (!packageJson.engines?.node) {
          return 'Package.json valid (consider adding engines.node specification)';
        }
        
        return 'Package.json validated with proper configuration';
        
      } catch (error) {
        if (error.code === 'ENOENT') {
          throw new Error('Package.json not found');
        }
        throw error;
      }
    });

    // Test 3: Build artifacts check
    await this.runTest('docker', 'Build Artifacts Check', async () => {
      const fs = await import('fs/promises');
      
      // Check for essential files
      const essentialFiles = [
        'unified-server-enhanced.js',
        'apps/backend/package.json',
        'apps/frontend/package.json'
      ];
      
      const missingFiles = [];
      
      for (const file of essentialFiles) {
        try {
          await fs.access(file);
        } catch (error) {
          missingFiles.push(file);
        }
      }
      
      if (missingFiles.length > 0) {
        throw new Error(`Missing essential files: ${missingFiles.join(', ')}`);
      }
      
      return 'All essential build artifacts present';
    });

    // Test 4: Node.js memory optimization
    await this.runTest('docker', 'Node.js Memory Optimization', async () => {
      const nodeOptions = process.env.NODE_OPTIONS || '';
      
      if (!nodeOptions.includes('--max-old-space-size')) {
        return 'Consider setting NODE_OPTIONS=--max-old-space-size=2048 for Railway deployment';
      }
      
      return `Node.js memory optimization configured: ${nodeOptions}`;
    });
  }

  /**
   * Test service isolation and error handling
   */
  async testServiceIsolation() {
    console.log('\n🔧 Testing Service Isolation and Error Handling...');
    
    // Test 1: Server initialization
    await this.runTest('services', 'Server Initialization', async () => {
      this.server = new EnhancedUnifiedServer();
      
      if (!this.server) {
        throw new Error('Failed to create server instance');
      }
      
      return 'Server instance created successfully';
    });

    // Test 2: Service registration
    await this.runTest('services', 'Service Registration', async () => {
      if (!this.server.serviceManager) {
        throw new Error('Service manager not initialized');
      }
      
      const criticalServices = Array.from(this.server.serviceManager.criticalServices);
      const nonCriticalServices = Array.from(this.server.serviceManager.nonCriticalServices);
      
      if (criticalServices.length === 0) {
        throw new Error('No critical services registered');
      }
      
      return `Services registered - Critical: ${criticalServices.length}, Non-critical: ${nonCriticalServices.length}`;
    });

    // Test 3: Error recovery setup
    await this.runTest('services', 'Error Recovery Setup', async () => {
      if (!this.server.errorRecovery) {
        throw new Error('Error recovery service not initialized');
      }
      
      const recoveryStatus = this.server.errorRecovery.getRecoveryStatus();
      
      if (!recoveryStatus) {
        throw new Error('Error recovery status not available');
      }
      
      return `Error recovery configured - Strategies: ${Object.keys(recoveryStatus.services || {}).length}`;
    });

    // Test 4: Health check endpoint
    await this.runTest('services', 'Health Check Endpoint', async () => {
      // Start server briefly to test health check
      try {
        await this.server.start();
        
        // Test health check
        const healthCheck = await this.server.serviceManager.getHealthCheck();
        
        if (!healthCheck) {
          throw new Error('Health check not available');
        }
        
        if (typeof healthCheck.totalServices !== 'number') {
          throw new Error('Health check missing service count');
        }
        
        return `Health check working - ${healthCheck.runningServices}/${healthCheck.totalServices} services`;
        
      } finally {
        // Stop server
        if (this.server.isStarted) {
          await this.server._gracefulShutdown('test');
        }
      }
    });
  }

  /**
   * Test deployment scenarios
   */
  async testDeploymentScenarios() {
    console.log('\n🚀 Testing Deployment Scenarios...');
    
    // Test 1: Production environment startup
    await this.runTest('deployment', 'Production Environment Startup', async () => {
      // Ensure production environment
      process.env.NODE_ENV = 'production';
      
      // Create new server instance for production test
      const prodServer = new EnhancedUnifiedServer();
      
      try {
        await prodServer.start();
        
        if (!prodServer.isStarted) {
          throw new Error('Server failed to start in production mode');
        }
        
        return 'Production startup successful';
        
      } finally {
        if (prodServer.isStarted) {
          await prodServer._gracefulShutdown('test');
        }
      }
    });

    // Test 2: Redis fallback behavior
    await this.runTest('deployment', 'Redis Fallback Behavior', async () => {
      // Temporarily remove Redis URLs to test fallback
      const originalRedisUrl = process.env.REDIS_URL;
      const originalRedisPrivateUrl = process.env.REDIS_PRIVATE_URL;
      
      delete process.env.REDIS_URL;
      delete process.env.REDIS_PRIVATE_URL;
      
      try {
        const fallbackServer = new EnhancedUnifiedServer();
        await fallbackServer.start();
        
        // Check that server started despite Redis being unavailable
        if (!fallbackServer.isStarted) {
          throw new Error('Server should start even without Redis');
        }
        
        // Check health status
        const healthCheck = await fallbackServer.serviceManager.getHealthCheck();
        
        // Should be degraded but not unhealthy
        if (healthCheck.status === 'unhealthy') {
          throw new Error('Server should not be unhealthy due to Redis unavailability');
        }
        
        await fallbackServer._gracefulShutdown('test');
        
        return `Redis fallback working - Status: ${healthCheck.status}`;
        
      } finally {
        // Restore Redis URLs
        if (originalRedisUrl) process.env.REDIS_URL = originalRedisUrl;
        if (originalRedisPrivateUrl) process.env.REDIS_PRIVATE_URL = originalRedisPrivateUrl;
      }
    });

    // Test 3: Frontend build failure handling
    await this.runTest('deployment', 'Frontend Build Failure Handling', async () => {
      // This test validates that the maintenance page service is available
      const maintenanceService = this.server?.services?.maintenance;
      
      if (!maintenanceService) {
        throw new Error('Maintenance page service not available');
      }
      
      // Test that maintenance service can generate pages
      const mockReq = { url: '/', method: 'GET' };
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
      
      return 'Frontend failure handling ready';
    });

    // Test 4: Railway configuration validation
    await this.runTest('deployment', 'Railway Configuration Validation', async () => {
      const fs = await import('fs/promises');
      
      try {
        const railwayConfig = await fs.readFile('railway.toml', 'utf8');
        
        // Check for essential Railway configuration
        if (!railwayConfig.includes('[build]')) {
          throw new Error('Railway config missing build section');
        }
        
        if (!railwayConfig.includes('[deploy]')) {
          throw new Error('Railway config missing deploy section');
        }
        
        if (!railwayConfig.includes('healthcheckPath')) {
          throw new Error('Railway config missing health check path');
        }
        
        return 'Railway configuration validated';
        
      } catch (error) {
        if (error.code === 'ENOENT') {
          throw new Error('railway.toml not found');
        }
        throw error;
      }
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
   * Generate validation report
   */
  generateReport() {
    console.log('\n📊 Railway Deployment Validation Report');
    console.log('=========================================');
    
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
    
    console.log('\n=========================================');
    console.log(`Overall Results: ${totalPassed}/${totalTests} tests passed (${successRate}%)`);
    
    // Railway deployment readiness assessment
    console.log('\n🚀 Railway Deployment Readiness Assessment:');
    
    const categories = ['environment', 'docker', 'services', 'deployment'];
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
    
    console.log('\n=========================================');
    if (overallReady) {
      console.log('🎉 DEPLOYMENT READY: All systems validated for Railway deployment!');
    } else if (mostlyReady) {
      console.log('⚠️  MOSTLY READY: Minor issues detected, but deployment should succeed.');
    } else {
      console.log('❌ NOT READY: Critical issues detected. Address failures before deploying.');
    }
    
    console.log('\nNext Steps:');
    console.log('1. Deploy to Railway with Redis service enabled');
    console.log('2. Monitor health check endpoint: /api/health');
    console.log('3. Verify Redis connectivity in Railway environment');
    console.log('4. Test application functionality end-to-end');
  }

  /**
   * Cleanup test resources
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up validation resources...');
    
    try {
      // Restore original environment
      process.env = { ...this.originalEnv };
      
      // Stop server if running
      if (this.server && this.server.isStarted) {
        await this.server._gracefulShutdown('cleanup');
      }
      
      console.log('✅ Cleanup completed');
      
    } catch (error) {
      console.log(`⚠️  Cleanup warning: ${error.message}`);
    }
  }
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new RailwayDeploymentValidator();
  
  validator.runAllTests().catch((error) => {
    console.error('❌ Validation execution failed:', error.message);
    process.exit(1);
  });
}

export default RailwayDeploymentValidator;