/**
 * Dashboard Routing Test Configuration
 * 
 * Specialized Jest configuration for dashboard routing tests
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: '../',
});

const dashboardRoutingTestConfig = {
  displayName: 'Dashboard Routing Tests',
  testMatch: [
    '<rootDir>/__tests__/integration/complete-dashboard-routing-flow.test.tsx',
    '<rootDir>/__tests__/e2e/subscription-scenarios-routing.test.tsx',
    '<rootDir>/__tests__/integration/error-recovery-fallback-mechanisms.test.tsx',
    '<rootDir>/__tests__/performance/dashboard-loading-performance.test.tsx',
    '<rootDir>/__tests__/integration/browser-navigation-url-parameters.test.tsx',
    '<rootDir>/__tests__/integration/dashboard-route-consolidation.test.tsx',
    '<rootDir>/__tests__/integration/dashboard-error-handling.test.tsx',
    '<rootDir>/__tests__/integration/dashboard-transition-states.test.tsx',
    '<rootDir>/__tests__/e2e/customer-dashboard-journey.test.tsx',
  ],
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/__tests__/dashboard-routing-test-setup.js',
  ],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
  collectCoverageFrom: [
    'hooks/use-dashboard-routing.ts',
    'hooks/use-subscription-status.ts',
    'components/dashboard/DashboardRouteGuard.tsx',
    'components/dashboard/DashboardTransitions.tsx',
    'components/dashboard/DashboardErrorBoundary.tsx',
    'app/(dashboard)/dashboard/page.tsx',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
  ],
  coverageDirectory: '<rootDir>/__tests__/coverage/dashboard-routing',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './hooks/use-dashboard-routing.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './hooks/use-subscription-status.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  testTimeout: 30000, // 30 seconds for comprehensive tests
  maxWorkers: 4,
  verbose: true,
  bail: false, // Continue running tests even if some fail
  errorOnDeprecated: true,
  
  // Performance monitoring
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/__tests__/reports',
        outputName: 'dashboard-routing-test-results.xml',
        suiteName: 'Dashboard Routing Tests',
      },
    ],
  ],
  
  // Custom test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  
  // Global setup and teardown
  globalSetup: '<rootDir>/__tests__/dashboard-routing-global-setup.js',
  globalTeardown: '<rootDir>/__tests__/dashboard-routing-global-teardown.js',
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Collect coverage from specific files only
  collectCoverage: true,
  
  // Custom matchers and utilities
  setupFiles: [
    '<rootDir>/__tests__/dashboard-routing-polyfills.js',
  ],
};

module.exports = createJestConfig(dashboardRoutingTestConfig);