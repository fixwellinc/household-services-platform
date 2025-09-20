const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

// Accessibility-specific Jest configuration
const accessibilityJestConfig = {
  displayName: 'Accessibility Tests',
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/__tests__/utils/accessibility-setup.js'
  ],
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '<rootDir>/__tests__/accessibility/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/__tests__/components/**/*.accessibility.test.{js,jsx,ts,tsx}'
  ],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  // Accessibility-specific settings
  testTimeout: 30000, // Longer timeout for accessibility tests
  setupFiles: ['<rootDir>/__tests__/utils/accessibility-polyfills.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    // Mock heavy dependencies for faster accessibility tests
    '^react-window$': '<rootDir>/__tests__/__mocks__/react-window.js',
    '^socket.io-client$': '<rootDir>/__tests__/__mocks__/socket.io-client.js'
  }
}

module.exports = createJestConfig(accessibilityJestConfig)