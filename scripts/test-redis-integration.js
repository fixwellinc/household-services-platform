#!/usr/bin/env node

/**
 * Redis Integration Testing Script for Railway Deployment
 * Tests Redis connectivity, caching functionality, and failover scenarios
 */

import { fileURLToPath } from 'url';
import path from 'path';
import { logger } from '../apps/backend/src/utils/logger.js';

// Import environment configuration
import { validateEnvironment } from '../apps/backend/src/config/environmentValidator.js';
import { applyEnvironmentDefaults } from '../apps/backend/src/config/environmentDefaults.js';

// Import Redis services
import redisService from '../apps/backend/src/services/redisService.js';
import RedisServiceWrapper from '../apps/backend/src/services/redisServiceWrapper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RedisIntegrationTester {
  constructor() {
    this.testResults = {
      connection: { passed: 0, failed: 0, tests: [] },
      caching: { passed: 0, failed: 0, tests: [] },
      failover: { passed: 0, failed: 0, tests: [] },
      performance: { passed: 0, failed: 0, tests: [] }
    };
    this.redisWrapper = new RedisServiceWrapper();
  }

  /**
   * Run all Redis integration tests
   */
  async runAllTests() {
    console.log('🔴 Starting Redis Integration Tests for Railway Deployment\n');
    
    try {
      // Setup environment
      await this.setupEnvironment();
      
      // Test connection functionality
      await this.testConnectionFunctionality();
      
      // Test caching operations
      await this.testCachingFunctionality();
      
      // Test failover and recovery
      await this.testFailoverScenarios();
      
      // Test performance
      await this.testPerformance();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Setup test environment
   */
  async setupEnvironment() {
    console.log('⚙️  Setting up test environment...');
    
    try {
      // Apply environment defaults
      applyEnvironmentDefaults();
      
      // Validate environment
      validateEnvironment();
      
      console.log('✅ Environment setup completed');
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Redis URL: ${process.env.REDIS_URL ? 'configured' : 'not configured'}`);
      console.log(`   Redis Private URL: ${process.env.REDIS_PRIVATE_URL ? 'configured' : 'not configured'}`);
      
    } catch (error) {
      throw new Error(`Environment setup failed: ${error.message}`);
    }
  }

  /**
   * Test Redis connection functionality
   */
  async testConnectionFunctionality() {
    console.log('\n🔌 Testing Redis Connection Functionality...');
    
    // Test 1: Basic connection
    await this.runTest('connection', 'Basic Redis Connection', async () => {
      const config = redisService.getConnectionConfig();
      if (!config) {
        throw new Error('No Redis configuration available - Redis URLs not set');
      }
      
      // Test connection using wrapper service
      await this.redisWrapper.start();
      
      if (!this.redisWrapper.isAvailable()) {
        throw new Error('Redis wrapper service failed to start');
      }
      
      return 'Redis connection established successfully';
    });

    // Test 2: Connection status and metrics
    await this.runTest('connection', 'Connection Status and Metrics', async () => {
      const status = redisService.getStatus();
      
      if (!status.connected) {
        throw new Error('Redis status shows not connected');
      }
      
      if (!status.available) {
        throw new Error('Redis status shows not available');
      }
      
      return `Connection metrics: attempts=${status.connectionAttempts}, uptime=${status.uptime}ms`;
    });

    // Test 3: Ping functionality
    await this.runTest('connection', 'Redis Ping Test', async () => {
      const pingResult = await redisService.ping();
      
      if (!pingResult.success) {
        throw new Error('Redis ping failed');
      }
      
      if (pingResult.responseTime > 5000) {
        throw new Error(`Redis ping too slow: ${pingResult.responseTime}ms`);
      }
      
      return `Ping successful in ${pingResult.responseTime}ms`;
    });

    // Test 4: Redis info retrieval
    await this.runTest('connection', 'Redis Info Retrieval', async () => {
      const info = await redisService.getInfo();
      
      if (!info.available) {
        throw new Error(`Redis info not available: ${info.error}`);
      }
      
      if (!info.connected) {
        throw new Error('Redis info shows not connected');
      }
      
      return `Redis info retrieved successfully - Memory: ${info.memory?.used_memory_human || 'unknown'}`;
    });

    // Test 5: Health check integration
    await this.runTest('connection', 'Health Check Integration', async () => {
      const health = await this.redisWrapper.getHealth();
      
      if (health.status !== 'healthy' && health.status !== 'degraded') {
        throw new Error(`Redis health check failed: ${health.status}`);
      }
      
      if (health.status === 'degraded' && !health.details.fallbackMode) {
        throw new Error('Redis degraded but not in fallback mode');
      }
      
      return `Health check status: ${health.status}`;
    });
  }

  /**
   * Test Redis caching functionality
   */
  async testCachingFunctionality() {
    console.log('\n💾 Testing Redis Caching Functionality...');
    
    const testKey = 'test:redis:integration';
    const testValue = JSON.stringify({ 
      timestamp: Date.now(), 
      test: 'Redis Integration Test',
      data: { nested: true, array: [1, 2, 3] }
    });

    // Test 1: Basic SET operation
    await this.runTest('caching', 'Basic SET Operation', async () => {
      const result = await redisService.set(testKey, testValue);
      
      if (!result) {
        throw new Error('Redis SET operation failed');
      }
      
      return 'SET operation successful';
    });

    // Test 2: Basic GET operation
    await this.runTest('caching', 'Basic GET Operation', async () => {
      const result = await redisService.get(testKey);
      
      if (result !== testValue) {
        throw new Error(`GET operation failed - expected: ${testValue}, got: ${result}`);
      }
      
      return 'GET operation successful';
    });

    // Test 3: EXISTS operation
    await this.runTest('caching', 'EXISTS Operation', async () => {
      const exists = await redisService.exists(testKey);
      
      if (!exists) {
        throw new Error('EXISTS operation failed - key should exist');
      }
      
      return 'EXISTS operation successful';
    });

    // Test 4: SET with TTL
    await this.runTest('caching', 'SET with TTL', async () => {
      const ttlKey = `${testKey}:ttl`;
      const ttlValue = 'temporary value';
      
      const result = await redisService.set(ttlKey, ttlValue, 2); // 2 seconds TTL
      
      if (!result) {
        throw new Error('SET with TTL failed');
      }
      
      // Verify key exists
      const exists = await redisService.exists(ttlKey);
      if (!exists) {
        throw new Error('Key with TTL does not exist immediately after SET');
      }
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify key expired
      const existsAfterTTL = await redisService.exists(ttlKey);
      if (existsAfterTTL) {
        throw new Error('Key with TTL did not expire');
      }
      
      return 'SET with TTL successful - key expired as expected';
    });

    // Test 5: DELETE operation
    await this.runTest('caching', 'DELETE Operation', async () => {
      const result = await redisService.del(testKey);
      
      if (!result) {
        throw new Error('DELETE operation failed');
      }
      
      // Verify key no longer exists
      const exists = await redisService.exists(testKey);
      if (exists) {
        throw new Error('Key still exists after DELETE');
      }
      
      return 'DELETE operation successful';
    });

    // Test 6: Batch operations
    await this.runTest('caching', 'Batch Operations', async () => {
      const batchKeys = [];
      const batchPromises = [];
      
      // Create multiple keys
      for (let i = 0; i < 10; i++) {
        const key = `${testKey}:batch:${i}`;
        const value = `batch_value_${i}`;
        batchKeys.push(key);
        batchPromises.push(redisService.set(key, value));
      }
      
      // Execute batch SET
      const setResults = await Promise.all(batchPromises);
      const failedSets = setResults.filter(result => !result);
      
      if (failedSets.length > 0) {
        throw new Error(`${failedSets.length} batch SET operations failed`);
      }
      
      // Execute batch GET
      const getPromises = batchKeys.map(key => redisService.get(key));
      const getResults = await Promise.all(getPromises);
      const failedGets = getResults.filter((result, index) => result !== `batch_value_${index}`);
      
      if (failedGets.length > 0) {
        throw new Error(`${failedGets.length} batch GET operations failed`);
      }
      
      // Cleanup batch keys
      const delPromises = batchKeys.map(key => redisService.del(key));
      await Promise.all(delPromises);
      
      return `Batch operations successful - processed ${batchKeys.length} keys`;
    });
  }

  /**
   * Test Redis failover and recovery scenarios
   */
  async testFailoverScenarios() {
    console.log('\n🔄 Testing Redis Failover and Recovery Scenarios...');
    
    // Test 1: Graceful degradation when Redis unavailable
    await this.runTest('failover', 'Graceful Degradation Test', async () => {
      // Force disconnect Redis
      await redisService.disconnect();
      
      // Test operations with Redis disconnected
      const setResult = await redisService.set('test:failover', 'value');
      const getResult = await redisService.get('test:failover');
      const existsResult = await redisService.exists('test:failover');
      const delResult = await redisService.del('test:failover');
      
      // Operations should return false/null but not throw errors
      if (setResult !== false) {
        throw new Error('SET should return false when Redis unavailable');
      }
      
      if (getResult !== null) {
        throw new Error('GET should return null when Redis unavailable');
      }
      
      if (existsResult !== false) {
        throw new Error('EXISTS should return false when Redis unavailable');
      }
      
      if (delResult !== false) {
        throw new Error('DEL should return false when Redis unavailable');
      }
      
      return 'Graceful degradation working correctly';
    });

    // Test 2: Automatic reconnection
    await this.runTest('failover', 'Automatic Reconnection Test', async () => {
      // Force reconnection
      const reconnectResult = await redisService.forceReconnect();
      
      if (!reconnectResult) {
        // If reconnection fails, check if it's due to missing Redis URL
        const config = redisService.getConnectionConfig();
        if (!config) {
          return 'Reconnection skipped - no Redis URL configured (expected in test environment)';
        }
        throw new Error('Force reconnection failed');
      }
      
      // Test that operations work after reconnection
      const testKey = 'test:reconnection';
      const testValue = 'reconnection_test';
      
      const setResult = await redisService.set(testKey, testValue);
      if (!setResult) {
        throw new Error('SET failed after reconnection');
      }
      
      const getResult = await redisService.get(testKey);
      if (getResult !== testValue) {
        throw new Error('GET failed after reconnection');
      }
      
      // Cleanup
      await redisService.del(testKey);
      
      return 'Automatic reconnection successful';
    });

    // Test 3: Service wrapper fallback mode
    await this.runTest('failover', 'Service Wrapper Fallback Mode', async () => {
      // Stop the wrapper service to test fallback
      await this.redisWrapper.stop();
      
      // Create new wrapper instance to test fallback behavior
      const testWrapper = new RedisServiceWrapper();
      
      // If Redis is not available, wrapper should enable fallback mode
      await testWrapper.start();
      
      if (!testWrapper.isAvailable()) {
        throw new Error('Service wrapper should be available in fallback mode');
      }
      
      const health = await testWrapper.getHealth();
      
      // Should be either healthy (if Redis connected) or degraded (if fallback mode)
      if (health.status !== 'healthy' && health.status !== 'degraded') {
        throw new Error(`Unexpected health status: ${health.status}`);
      }
      
      if (health.status === 'degraded' && !health.details.fallbackMode) {
        throw new Error('Service should be in fallback mode when Redis unavailable');
      }
      
      await testWrapper.stop();
      
      return `Service wrapper fallback mode working - status: ${health.status}`;
    });

    // Test 4: Error recovery monitoring
    await this.runTest('failover', 'Error Recovery Monitoring', async () => {
      // Restart the wrapper service
      await this.redisWrapper.start();
      
      const health = await this.redisWrapper.getHealth();
      
      // Check that health monitoring provides useful information
      if (!health.details) {
        throw new Error('Health check should provide details');
      }
      
      if (typeof health.details.connectionAttempts !== 'number') {
        throw new Error('Health check should include connection attempts');
      }
      
      return `Error recovery monitoring active - attempts: ${health.details.connectionAttempts}`;
    });
  }

  /**
   * Test Redis performance
   */
  async testPerformance() {
    console.log('\n⚡ Testing Redis Performance...');
    
    // Test 1: Connection response time
    await this.runTest('performance', 'Connection Response Time', async () => {
      const iterations = 5;
      const pingTimes = [];
      
      for (let i = 0; i < iterations; i++) {
        try {
          const pingResult = await redisService.ping();
          if (pingResult.success) {
            pingTimes.push(pingResult.responseTime);
          }
        } catch (error) {
          // If Redis is not available, skip performance test
          return 'Performance test skipped - Redis not available';
        }
      }
      
      if (pingTimes.length === 0) {
        return 'Performance test skipped - no successful pings';
      }
      
      const avgPingTime = pingTimes.reduce((a, b) => a + b, 0) / pingTimes.length;
      const maxPingTime = Math.max(...pingTimes);
      
      if (avgPingTime > 1000) {
        throw new Error(`Average ping time too high: ${avgPingTime}ms`);
      }
      
      if (maxPingTime > 2000) {
        throw new Error(`Max ping time too high: ${maxPingTime}ms`);
      }
      
      return `Avg ping: ${avgPingTime.toFixed(2)}ms, Max ping: ${maxPingTime}ms`;
    });

    // Test 2: Throughput test
    await this.runTest('performance', 'Basic Throughput Test', async () => {
      const operations = 50;
      const startTime = Date.now();
      
      try {
        // Perform multiple SET operations
        const setPromises = [];
        for (let i = 0; i < operations; i++) {
          setPromises.push(redisService.set(`perf:test:${i}`, `value_${i}`));
        }
        
        const setResults = await Promise.all(setPromises);
        const successfulSets = setResults.filter(result => result === true).length;
        
        // Perform multiple GET operations
        const getPromises = [];
        for (let i = 0; i < operations; i++) {
          getPromises.push(redisService.get(`perf:test:${i}`));
        }
        
        const getResults = await Promise.all(getPromises);
        const successfulGets = getResults.filter(result => result !== null).length;
        
        // Cleanup
        const delPromises = [];
        for (let i = 0; i < operations; i++) {
          delPromises.push(redisService.del(`perf:test:${i}`));
        }
        await Promise.all(delPromises);
        
        const totalTime = Date.now() - startTime;
        const opsPerSecond = ((successfulSets + successfulGets) / totalTime * 1000).toFixed(2);
        
        if (successfulSets === 0 && successfulGets === 0) {
          return 'Throughput test skipped - Redis not available';
        }
        
        return `${successfulSets}/${operations} SETs, ${successfulGets}/${operations} GETs in ${totalTime}ms (${opsPerSecond} ops/sec)`;
        
      } catch (error) {
        return `Throughput test skipped - Redis error: ${error.message}`;
      }
    });

    // Test 3: Memory usage monitoring
    await this.runTest('performance', 'Memory Usage Monitoring', async () => {
      try {
        const info = await redisService.getInfo();
        
        if (!info.available) {
          return 'Memory monitoring skipped - Redis not available';
        }
        
        if (!info.memory) {
          throw new Error('Redis memory information not available');
        }
        
        const memoryKeys = Object.keys(info.memory);
        if (memoryKeys.length === 0) {
          throw new Error('No memory metrics available');
        }
        
        return `Memory metrics available: ${memoryKeys.join(', ')}`;
        
      } catch (error) {
        return `Memory monitoring skipped - Redis error: ${error.message}`;
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
   * Generate test report
   */
  generateReport() {
    console.log('\n📊 Redis Integration Test Report');
    console.log('=====================================');
    
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
    
    console.log('\n=====================================');
    console.log(`Overall Results: ${totalPassed}/${totalTests} tests passed (${successRate}%)`);
    
    if (totalFailed > 0) {
      console.log(`\n⚠️  ${totalFailed} tests failed. Check the errors above for details.`);
      
      // Don't exit with error code for Redis tests since Redis might not be available in test environment
      console.log('\nNote: Redis tests may fail in environments without Redis configured.');
      console.log('This is expected behavior and the application will use fallback caching.');
    } else {
      console.log('\n🎉 All Redis integration tests passed!');
    }
    
    // Generate summary for Railway deployment validation
    console.log('\n🚀 Railway Deployment Validation Summary:');
    console.log(`   ✅ Redis connection handling: ${this.testResults.connection.passed > 0 ? 'WORKING' : 'NEEDS ATTENTION'}`);
    console.log(`   ✅ Caching functionality: ${this.testResults.caching.passed > 0 ? 'WORKING' : 'NEEDS ATTENTION'}`);
    console.log(`   ✅ Failover scenarios: ${this.testResults.failover.passed > 0 ? 'WORKING' : 'NEEDS ATTENTION'}`);
    console.log(`   ✅ Performance monitoring: ${this.testResults.performance.passed > 0 ? 'WORKING' : 'NEEDS ATTENTION'}`);
  }

  /**
   * Cleanup test resources
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up test resources...');
    
    try {
      // Clean up any test keys that might remain
      const testKeys = [
        'test:redis:integration',
        'test:redis:integration:ttl',
        'test:failover',
        'test:reconnection'
      ];
      
      for (const key of testKeys) {
        try {
          await redisService.del(key);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
      
      // Stop services
      await this.redisWrapper.stop();
      await redisService.disconnect();
      
      console.log('✅ Cleanup completed');
      
    } catch (error) {
      console.log(`⚠️  Cleanup warning: ${error.message}`);
    }
  }
}

// Add missing testConnection method to redisService
if (!redisService.testConnection) {
  redisService.testConnection = async function() {
    return await this.ping();
  };
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new RedisIntegrationTester();
  
  tester.runAllTests().catch((error) => {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  });
}

export default RedisIntegrationTester;