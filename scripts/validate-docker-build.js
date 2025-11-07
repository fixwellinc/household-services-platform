#!/usr/bin/env node

/**
 * Docker Build Validation Script for Railway Deployment
 * Validates Docker configuration and build process
 */

import { fileURLToPath } from 'url';
import path from 'path';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DockerBuildValidator {
  constructor() {
    this.testResults = {
      configuration: { passed: 0, failed: 0, tests: [] },
      structure: { passed: 0, failed: 0, tests: [] },
      optimization: { passed: 0, failed: 0, tests: [] },
      railway: { passed: 0, failed: 0, tests: [] }
    };
  }

  /**
   * Run all Docker build validation tests
   */
  async runAllTests() {
    console.log('🐳 Starting Docker Build Validation for Railway Deployment\n');
    
    try {
      // Test Docker configuration
      await this.testDockerConfiguration();
      
      // Test project structure
      await this.testProjectStructure();
      
      // Test build optimization
      await this.testBuildOptimization();
      
      // Test Railway compatibility
      await this.testRailwayCompatibility();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Docker validation suite failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Test Docker configuration
   */
  async testDockerConfiguration() {
    console.log('📋 Testing Docker Configuration...');
    
    // Test 1: Dockerfile exists and is valid
    await this.runTest('configuration', 'Dockerfile Validation', async () => {
      try {
        const dockerfileContent = await fs.readFile('Dockerfile', 'utf8');
        
        // Check for multi-stage build
        const fromStatements = dockerfileContent.match(/FROM\s+[\w\-.:\/]+/g) || [];
        if (fromStatements.length < 2) {
          throw new Error('Dockerfile should use multi-stage build (multiple FROM statements)');
        }
        
        // Check for proper stage naming
        if (!dockerfileContent.includes('AS builder') && !dockerfileContent.includes('AS build')) {
          throw new Error('Dockerfile should name build stage (AS builder or AS build)');
        }
        
        if (!dockerfileContent.includes('AS runtime') && !dockerfileContent.includes('AS production')) {
          throw new Error('Dockerfile should name runtime stage (AS runtime or AS production)');
        }
        
        // Check for WORKDIR
        if (!dockerfileContent.includes('WORKDIR')) {
          throw new Error('Dockerfile should set WORKDIR');
        }
        
        // Check for EXPOSE
        if (!dockerfileContent.includes('EXPOSE')) {
          throw new Error('Dockerfile should expose port');
        }
        
        // Check for proper COPY commands
        if (!dockerfileContent.includes('COPY --from=')) {
          throw new Error('Dockerfile should copy artifacts from build stage');
        }
        
        return `Multi-stage Dockerfile validated with ${fromStatements.length} stages`;
        
      } catch (error) {
        if (error.code === 'ENOENT') {
          throw new Error('Dockerfile not found in project root');
        }
        throw error;
      }
    });

    // Test 2: .dockerignore validation
    await this.runTest('configuration', '.dockerignore Validation', async () => {
      try {
        const dockerignoreContent = await fs.readFile('.dockerignore', 'utf8');
        
        const requiredIgnores = ['node_modules', '.git', '*.log', '.env'];
        const missingIgnores = requiredIgnores.filter(ignore => 
          !dockerignoreContent.includes(ignore)
        );
        
        if (missingIgnores.length > 0) {
          return `Missing recommended ignores: ${missingIgnores.join(', ')} (consider adding)`;
        }
        
        return '.dockerignore properly configured';
        
      } catch (error) {
        if (error.code === 'ENOENT') {
          return '.dockerignore not found (consider creating for better build performance)';
        }
        throw error;
      }
    });

    // Test 3: Node.js version consistency
    await this.runTest('configuration', 'Node.js Version Consistency', async () => {
      const dockerfileContent = await fs.readFile('Dockerfile', 'utf8');
      const packageJsonContent = await fs.readFile('package.json', 'utf8');
      const packageJson = JSON.parse(packageJsonContent);
      
      // Extract Node version from Dockerfile
      const nodeVersionMatch = dockerfileContent.match(/FROM\s+node:(\d+)/);
      const dockerNodeVersion = nodeVersionMatch ? nodeVersionMatch[1] : null;
      
      // Check package.json engines
      const engineNodeVersion = packageJson.engines?.node;
      
      if (!dockerNodeVersion) {
        throw new Error('Could not determine Node.js version from Dockerfile');
      }
      
      if (engineNodeVersion && !engineNodeVersion.includes(dockerNodeVersion)) {
        return `Version mismatch: Dockerfile uses Node ${dockerNodeVersion}, package.json specifies ${engineNodeVersion}`;
      }
      
      return `Node.js version ${dockerNodeVersion} consistent across configuration`;
    });

    // Test 4: Build commands validation
    await this.runTest('configuration', 'Build Commands Validation', async () => {
      const dockerfileContent = await fs.readFile('Dockerfile', 'utf8');
      
      // Check for npm ci (preferred over npm install)
      if (dockerfileContent.includes('npm install') && !dockerfileContent.includes('npm ci')) {
        return 'Consider using "npm ci" instead of "npm install" for faster, reliable builds';
      }
      
      // Check for build commands
      if (!dockerfileContent.includes('npm run build') && !dockerfileContent.includes('yarn build')) {
        return 'No explicit build command found (may be handled by start script)';
      }
      
      return 'Build commands properly configured';
    });
  }

  /**
   * Test project structure for Docker build
   */
  async testProjectStructure() {
    console.log('\n📁 Testing Project Structure...');
    
    // Test 1: Essential files exist
    await this.runTest('structure', 'Essential Files Check', async () => {
      const essentialFiles = [
        'package.json',
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
      
      return `All ${essentialFiles.length} essential files present`;
    });

    // Test 2: Package.json scripts
    await this.runTest('structure', 'Package.json Scripts', async () => {
      const packageJsonContent = await fs.readFile('package.json', 'utf8');
      const packageJson = JSON.parse(packageJsonContent);
      
      const requiredScripts = ['start'];
      const recommendedScripts = ['build', 'dev'];
      
      const missingRequired = requiredScripts.filter(script => !packageJson.scripts?.[script]);
      const missingRecommended = recommendedScripts.filter(script => !packageJson.scripts?.[script]);
      
      if (missingRequired.length > 0) {
        throw new Error(`Missing required scripts: ${missingRequired.join(', ')}`);
      }
      
      let result = `Required scripts present: ${requiredScripts.join(', ')}`;
      if (missingRecommended.length > 0) {
        result += ` (missing recommended: ${missingRecommended.join(', ')})`;
      }
      
      return result;
    });

    // Test 3: Monorepo structure validation
    await this.runTest('structure', 'Monorepo Structure Validation', async () => {
      const requiredDirs = ['apps/backend', 'apps/frontend'];
      const optionalDirs = ['packages/shared', 'packages/types', 'packages/utils'];
      
      const missingRequired = [];
      const presentOptional = [];
      
      for (const dir of requiredDirs) {
        try {
          const stat = await fs.stat(dir);
          if (!stat.isDirectory()) {
            missingRequired.push(dir);
          }
        } catch (error) {
          missingRequired.push(dir);
        }
      }
      
      for (const dir of optionalDirs) {
        try {
          const stat = await fs.stat(dir);
          if (stat.isDirectory()) {
            presentOptional.push(dir);
          }
        } catch (error) {
          // Optional directory missing is OK
        }
      }
      
      if (missingRequired.length > 0) {
        throw new Error(`Missing required directories: ${missingRequired.join(', ')}`);
      }
      
      return `Monorepo structure valid - Required: ${requiredDirs.length}, Optional: ${presentOptional.length}`;
    });

    // Test 4: Dependencies structure
    await this.runTest('structure', 'Dependencies Structure', async () => {
      const rootPackage = JSON.parse(await fs.readFile('package.json', 'utf8'));
      const backendPackage = JSON.parse(await fs.readFile('apps/backend/package.json', 'utf8'));
      const frontendPackage = JSON.parse(await fs.readFile('apps/frontend/package.json', 'utf8'));
      
      // Check for workspaces configuration
      if (!rootPackage.workspaces) {
        return 'No workspaces configuration found (may use different monorepo setup)';
      }
      
      // Count dependencies
      const rootDeps = Object.keys(rootPackage.dependencies || {}).length;
      const backendDeps = Object.keys(backendPackage.dependencies || {}).length;
      const frontendDeps = Object.keys(frontendPackage.dependencies || {}).length;
      
      return `Dependencies - Root: ${rootDeps}, Backend: ${backendDeps}, Frontend: ${frontendDeps}`;
    });
  }

  /**
   * Test build optimization
   */
  async testBuildOptimization() {
    console.log('\n⚡ Testing Build Optimization...');
    
    // Test 1: Layer caching optimization
    await this.runTest('optimization', 'Layer Caching Optimization', async () => {
      const dockerfileContent = await fs.readFile('Dockerfile', 'utf8');
      
      // Check if package.json is copied before source code
      const copyCommands = dockerfileContent.match(/COPY\s+[^\n]+/g) || [];
      
      let packageJsonFirst = false;
      let sourceCodeAfter = false;
      
      for (const command of copyCommands) {
        if (command.includes('package*.json') || command.includes('package.json')) {
          packageJsonFirst = true;
        } else if (packageJsonFirst && (command.includes('.') || command.includes('apps/'))) {
          sourceCodeAfter = true;
          break;
        }
      }
      
      if (!packageJsonFirst) {
        return 'Consider copying package.json before source code for better layer caching';
      }
      
      if (!sourceCodeAfter) {
        return 'Package.json copied first (good for caching)';
      }
      
      return 'Layer caching optimized - package.json copied before source code';
    });

    // Test 2: Build size optimization
    await this.runTest('optimization', 'Build Size Optimization', async () => {
      const dockerfileContent = await fs.readFile('Dockerfile', 'utf8');
      
      const optimizations = [];
      
      // Check for alpine images
      if (dockerfileContent.includes('alpine')) {
        optimizations.push('Alpine Linux base image');
      }
      
      // Check for multi-stage build
      if (dockerfileContent.includes('--from=')) {
        optimizations.push('Multi-stage build');
      }
      
      // Check for cleanup commands
      if (dockerfileContent.includes('rm -rf') || dockerfileContent.includes('apt-get clean')) {
        optimizations.push('Cleanup commands');
      }
      
      if (optimizations.length === 0) {
        return 'Consider size optimizations: Alpine images, multi-stage builds, cleanup';
      }
      
      return `Size optimizations: ${optimizations.join(', ')}`;
    });

    // Test 3: Build performance
    await this.runTest('optimization', 'Build Performance Configuration', async () => {
      const dockerfileContent = await fs.readFile('Dockerfile', 'utf8');
      
      const performanceFeatures = [];
      
      // Check for npm ci
      if (dockerfileContent.includes('npm ci')) {
        performanceFeatures.push('npm ci (fast install)');
      }
      
      // Check for build cache
      if (dockerfileContent.includes('--mount=type=cache')) {
        performanceFeatures.push('Build cache mounts');
      }
      
      // Check for parallel builds
      if (dockerfileContent.includes('--jobs') || dockerfileContent.includes('-j')) {
        performanceFeatures.push('Parallel builds');
      }
      
      if (performanceFeatures.length === 0) {
        return 'Consider performance optimizations: npm ci, build cache, parallel builds';
      }
      
      return `Performance features: ${performanceFeatures.join(', ')}`;
    });

    // Test 4: Memory optimization
    await this.runTest('optimization', 'Memory Optimization', async () => {
      const dockerfileContent = await fs.readFile('Dockerfile', 'utf8');
      
      // Check for Node.js memory settings
      if (dockerfileContent.includes('--max-old-space-size')) {
        return 'Node.js memory optimization configured in Dockerfile';
      }
      
      // Check environment variables
      if (dockerfileContent.includes('NODE_OPTIONS')) {
        return 'NODE_OPTIONS configured for memory optimization';
      }
      
      return 'Consider adding NODE_OPTIONS=--max-old-space-size=2048 for Railway deployment';
    });
  }

  /**
   * Test Railway compatibility
   */
  async testRailwayCompatibility() {
    console.log('\n🚀 Testing Railway Compatibility...');
    
    // Test 1: Railway configuration file
    await this.runTest('railway', 'Railway Configuration File', async () => {
      try {
        const railwayConfig = await fs.readFile('railway.toml', 'utf8');
        
        // Check for essential sections
        const requiredSections = ['[build]', '[deploy]'];
        const missingSections = requiredSections.filter(section => 
          !railwayConfig.includes(section)
        );
        
        if (missingSections.length > 0) {
          throw new Error(`Missing required sections: ${missingSections.join(', ')}`);
        }
        
        // Check for health check configuration
        if (!railwayConfig.includes('healthcheckPath')) {
          return 'Railway config valid (consider adding healthcheckPath)';
        }
        
        return 'Railway configuration properly configured';
        
      } catch (error) {
        if (error.code === 'ENOENT') {
          throw new Error('railway.toml not found - required for Railway deployment');
        }
        throw error;
      }
    });

    // Test 2: Port configuration
    await this.runTest('railway', 'Port Configuration', async () => {
      const dockerfileContent = await fs.readFile('Dockerfile', 'utf8');
      const railwayConfig = await fs.readFile('railway.toml', 'utf8');
      
      // Check if port is exposed in Dockerfile
      const exposeMatch = dockerfileContent.match(/EXPOSE\s+(\d+)/);
      const dockerPort = exposeMatch ? exposeMatch[1] : null;
      
      // Check default port in application
      const defaultPort = '3000'; // Standard for this application
      
      if (!dockerPort) {
        return 'No EXPOSE directive found (Railway will use PORT environment variable)';
      }
      
      if (dockerPort !== defaultPort) {
        return `Port ${dockerPort} exposed (ensure Railway PORT env var matches)`;
      }
      
      return `Port ${dockerPort} properly configured for Railway`;
    });

    // Test 3: Environment variable handling
    await this.runTest('railway', 'Environment Variable Handling', async () => {
      const dockerfileContent = await fs.readFile('Dockerfile', 'utf8');
      
      // Check for environment variable configuration
      const envFeatures = [];
      
      if (dockerfileContent.includes('ENV NODE_ENV')) {
        envFeatures.push('NODE_ENV configured');
      }
      
      if (dockerfileContent.includes('ENV PORT') || dockerfileContent.includes('EXPOSE')) {
        envFeatures.push('Port configuration');
      }
      
      // Check unified server for Railway environment detection
      try {
        const serverContent = await fs.readFile('unified-server-enhanced.js', 'utf8');
        if (serverContent.includes('RAILWAY_') || serverContent.includes('process.env.HOSTNAME')) {
          envFeatures.push('Railway environment detection');
        }
      } catch (error) {
        // File might not exist
      }
      
      if (envFeatures.length === 0) {
        return 'Basic environment handling (Railway will inject required variables)';
      }
      
      return `Environment handling: ${envFeatures.join(', ')}`;
    });

    // Test 4: Health check endpoint
    await this.runTest('railway', 'Health Check Endpoint', async () => {
      try {
        const serverContent = await fs.readFile('unified-server-enhanced.js', 'utf8');
        
        // Check for health check endpoint
        if (!serverContent.includes('/health') && !serverContent.includes('/api/health')) {
          throw new Error('No health check endpoint found in server');
        }
        
        // Check Railway config for health check path
        const railwayConfig = await fs.readFile('railway.toml', 'utf8');
        if (!railwayConfig.includes('healthcheckPath')) {
          return 'Health endpoint exists but not configured in railway.toml';
        }
        
        return 'Health check endpoint properly configured for Railway';
        
      } catch (error) {
        if (error.code === 'ENOENT') {
          throw new Error('Server file not found');
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
    console.log('\n📊 Docker Build Validation Report');
    console.log('===================================');
    
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
    
    console.log('\n===================================');
    console.log(`Overall Results: ${totalPassed}/${totalTests} tests passed (${successRate}%)`);
    
    // Docker build readiness assessment
    console.log('\n🐳 Docker Build Readiness Assessment:');
    
    const categories = ['configuration', 'structure', 'optimization', 'railway'];
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
    
    console.log('\n===================================');
    if (overallReady) {
      console.log('🎉 DOCKER BUILD READY: All validations passed for Railway deployment!');
    } else if (mostlyReady) {
      console.log('⚠️  MOSTLY READY: Minor issues detected, but Docker build should succeed.');
    } else {
      console.log('❌ NOT READY: Critical issues detected. Fix Docker configuration before deploying.');
    }
    
    console.log('\nRecommended Next Steps:');
    console.log('1. Test Docker build locally: docker build -t test-app .');
    console.log('2. Test Docker run locally: docker run -p 3000:3000 test-app');
    console.log('3. Deploy to Railway and monitor build logs');
    console.log('4. Verify application starts correctly in Railway environment');
    
    if (totalFailed > 0) {
      console.log('\n⚠️  Address the failed validations above before deploying to Railway.');
    }
  }
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new DockerBuildValidator();
  
  validator.runAllTests().catch((error) => {
    console.error('❌ Docker validation execution failed:', error.message);
    process.exit(1);
  });
}

export default DockerBuildValidator;