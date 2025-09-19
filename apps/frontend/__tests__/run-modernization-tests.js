#!/usr/bin/env node

/**
 * Comprehensive test runner for website modernization validation
 * This script runs all tests related to the modernized components and validates
 * visual regression, performance, and accessibility requirements.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test categories and their corresponding test files
const testCategories = {
  'Visual Regression Tests': [
    '__tests__/integration/modernized-homepage.test.tsx',
    '__tests__/integration/modernized-services-page.test.tsx'
  ],
  'Performance Benchmarks': [
    '__tests__/performance/animation-performance.test.tsx'
  ],
  'Accessibility Tests': [
    '__tests__/accessibility/enhanced-components-accessibility.test.tsx'
  ],
  'Component Integration Tests': [
    '__tests__/components/ui/hero/EnhancedHeroSection.test.tsx',
    '__tests__/components/ui/cards/ModernServiceCard.test.tsx',
    '__tests__/components/ui/animations/ProgressiveReveal.test.tsx',
    '__tests__/components/ui/animations/StaggeredGrid.test.tsx'
  ]
};

// Performance thresholds
const performanceThresholds = {
  renderTime: 150, // ms
  interactionTime: 50, // ms
  animationFrameTime: 16.67, // ms (60fps)
  memoryLeakThreshold: 50 // % increase
};

// Accessibility requirements
const accessibilityRequirements = {
  wcagLevel: 'AA',
  colorContrastRatio: 4.5,
  keyboardNavigation: true,
  screenReaderSupport: true,
  reducedMotionSupport: true
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${message}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSubHeader(message) {
  log(`\n${colors.yellow}${message}${colors.reset}`);
  log('-'.repeat(message.length), 'yellow');
}

function runCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      cwd: process.cwd(),
      ...options
    });
    return { success: true, output: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      output: error.stdout || error.stderr || ''
    };
  }
}

function checkTestFileExists(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  return fs.existsSync(fullPath);
}

function runTestCategory(categoryName, testFiles) {
  logSubHeader(`Running ${categoryName}`);
  
  const existingFiles = testFiles.filter(checkTestFileExists);
  const missingFiles = testFiles.filter(file => !checkTestFileExists(file));
  
  if (missingFiles.length > 0) {
    log(`⚠️  Missing test files:`, 'yellow');
    missingFiles.forEach(file => log(`   - ${file}`, 'yellow'));
  }
  
  if (existingFiles.length === 0) {
    log(`❌ No test files found for ${categoryName}`, 'red');
    return { success: false, tests: 0, passed: 0, failed: 0 };
  }
  
  const testPattern = existingFiles.join('|');
  const command = `npm test -- --testPathPattern="${testPattern}" --verbose --coverage=false`;
  
  log(`Running tests: ${existingFiles.join(', ')}`, 'blue');
  const result = runCommand(command);
  
  if (result.success) {
    log(`✅ ${categoryName} completed successfully`, 'green');
    return { success: true, tests: existingFiles.length, passed: existingFiles.length, failed: 0 };
  } else {
    log(`❌ ${categoryName} failed`, 'red');
    if (result.output) {
      log('Error output:', 'red');
      log(result.output, 'red');
    }
    return { success: false, tests: existingFiles.length, passed: 0, failed: existingFiles.length };
  }
}

function validatePerformanceRequirements() {
  logSubHeader('Validating Performance Requirements');
  
  log('Performance Thresholds:', 'blue');
  Object.entries(performanceThresholds).forEach(([key, value]) => {
    log(`  - ${key}: ${value}${key.includes('Time') ? 'ms' : key.includes('memory') ? '%' : ''}`, 'blue');
  });
  
  // Run performance-specific tests
  const performanceTestCommand = 'npm test -- --testPathPattern="performance" --verbose';
  const result = runCommand(performanceTestCommand);
  
  if (result.success) {
    log('✅ Performance requirements validated', 'green');
    return true;
  } else {
    log('❌ Performance requirements not met', 'red');
    return false;
  }
}

function validateAccessibilityRequirements() {
  logSubHeader('Validating Accessibility Requirements');
  
  log('Accessibility Requirements:', 'blue');
  Object.entries(accessibilityRequirements).forEach(([key, value]) => {
    log(`  - ${key}: ${value}`, 'blue');
  });
  
  // Run accessibility-specific tests
  const accessibilityTestCommand = 'npm test -- --testPathPattern="accessibility" --verbose';
  const result = runCommand(accessibilityTestCommand);
  
  if (result.success) {
    log('✅ Accessibility requirements validated', 'green');
    return true;
  } else {
    log('❌ Accessibility requirements not met', 'red');
    return false;
  }
}

function runVisualRegressionTests() {
  logSubHeader('Running Visual Regression Tests');
  
  // Check if visual regression testing tools are available
  const hasPlaywright = checkTestFileExists('playwright.config.js') || checkTestFileExists('playwright.config.ts');
  const hasStorybook = checkTestFileExists('.storybook/main.js') || checkTestFileExists('.storybook/main.ts');
  
  if (hasPlaywright) {
    log('Running Playwright visual regression tests...', 'blue');
    const result = runCommand('npx playwright test --project=chromium');
    if (result.success) {
      log('✅ Playwright visual regression tests passed', 'green');
    } else {
      log('❌ Playwright visual regression tests failed', 'red');
    }
  }
  
  if (hasStorybook) {
    log('Running Storybook visual regression tests...', 'blue');
    const result = runCommand('npm run test-storybook');
    if (result.success) {
      log('✅ Storybook visual regression tests passed', 'green');
    } else {
      log('❌ Storybook visual regression tests failed', 'red');
    }
  }
  
  if (!hasPlaywright && !hasStorybook) {
    log('⚠️  No visual regression testing tools configured', 'yellow');
    log('   Consider setting up Playwright or Storybook for comprehensive visual testing', 'yellow');
  }
  
  // Run component-level visual tests
  const componentTestCommand = 'npm test -- --testPathPattern="integration.*modernized" --verbose';
  const result = runCommand(componentTestCommand);
  
  return result.success;
}

function generateTestReport(results) {
  logSubHeader('Test Report Summary');
  
  const totalTests = results.reduce((sum, result) => sum + result.tests, 0);
  const totalPassed = results.reduce((sum, result) => sum + result.passed, 0);
  const totalFailed = results.reduce((sum, result) => sum + result.failed, 0);
  const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
  
  log(`Total Tests: ${totalTests}`, 'blue');
  log(`Passed: ${totalPassed}`, 'green');
  log(`Failed: ${totalFailed}`, totalFailed > 0 ? 'red' : 'green');
  log(`Success Rate: ${successRate}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');
  
  // Detailed results by category
  log('\nResults by Category:', 'blue');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const rate = result.tests > 0 ? ((result.passed / result.tests) * 100).toFixed(1) : 0;
    log(`  ${status} ${result.category}: ${result.passed}/${result.tests} (${rate}%)`, 
        result.success ? 'green' : 'red');
  });
  
  return {
    totalTests,
    totalPassed,
    totalFailed,
    successRate: parseFloat(successRate),
    allPassed: totalFailed === 0
  };
}

function checkPrerequisites() {
  logSubHeader('Checking Prerequisites');
  
  // Check if npm test command is available
  const testCommand = runCommand('npm test -- --version', { silent: true });
  if (!testCommand.success) {
    log('❌ npm test command not available', 'red');
    return false;
  }
  
  // Check if required dependencies are installed
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log('❌ package.json not found', 'red');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = ['@testing-library/react', '@testing-library/jest-dom', 'jest'];
  const missingDeps = requiredDeps.filter(dep => 
    !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
  );
  
  if (missingDeps.length > 0) {
    log('❌ Missing required dependencies:', 'red');
    missingDeps.forEach(dep => log(`   - ${dep}`, 'red'));
    return false;
  }
  
  log('✅ All prerequisites met', 'green');
  return true;
}

async function main() {
  logHeader('Website Modernization Test Suite');
  
  log('This test suite validates the implementation of modernized components', 'blue');
  log('including visual regression, performance, and accessibility requirements.\n', 'blue');
  
  // Check prerequisites
  if (!checkPrerequisites()) {
    log('\n❌ Prerequisites not met. Please install required dependencies.', 'red');
    process.exit(1);
  }
  
  const results = [];
  
  // Run test categories
  for (const [categoryName, testFiles] of Object.entries(testCategories)) {
    const result = runTestCategory(categoryName, testFiles);
    results.push({
      category: categoryName,
      ...result
    });
  }
  
  // Run specialized validation
  logHeader('Specialized Validation');
  
  const performanceValid = validatePerformanceRequirements();
  const accessibilityValid = validateAccessibilityRequirements();
  const visualRegressionValid = runVisualRegressionTests();
  
  // Generate final report
  logHeader('Final Report');
  
  const report = generateTestReport(results);
  
  // Overall validation status
  const overallSuccess = report.allPassed && performanceValid && accessibilityValid && visualRegressionValid;
  
  if (overallSuccess) {
    log('\n🎉 All modernization tests passed!', 'green');
    log('✅ Visual regression tests: PASSED', 'green');
    log('✅ Performance benchmarks: PASSED', 'green');
    log('✅ Accessibility tests: PASSED', 'green');
    log('\nThe website modernization implementation meets all requirements.', 'green');
  } else {
    log('\n⚠️  Some tests failed or requirements not met:', 'yellow');
    if (!report.allPassed) log('❌ Component tests: FAILED', 'red');
    if (!performanceValid) log('❌ Performance benchmarks: FAILED', 'red');
    if (!accessibilityValid) log('❌ Accessibility tests: FAILED', 'red');
    if (!visualRegressionValid) log('❌ Visual regression tests: FAILED', 'red');
    log('\nPlease review the test results and fix any issues.', 'yellow');
  }
  
  // Recommendations
  logSubHeader('Recommendations');
  
  if (report.successRate < 90) {
    log('• Improve test coverage and fix failing tests', 'yellow');
  }
  
  if (!performanceValid) {
    log('• Optimize component rendering and animation performance', 'yellow');
  }
  
  if (!accessibilityValid) {
    log('• Address accessibility issues and improve WCAG compliance', 'yellow');
  }
  
  if (!visualRegressionValid) {
    log('• Set up comprehensive visual regression testing with Playwright or Storybook', 'yellow');
  }
  
  log('\n📊 Test execution completed.', 'blue');
  
  // Exit with appropriate code
  process.exit(overallSuccess ? 0 : 1);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`\n❌ Uncaught exception: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`\n❌ Unhandled rejection at: ${promise}, reason: ${reason}`, 'red');
  process.exit(1);
});

// Run the test suite
main().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});