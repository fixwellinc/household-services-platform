import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'Security Tests',
    globals: true,
    environment: 'node',
    setupFiles: ['./src/tests/security/security-setup.js'],
    testTimeout: 30000, // Longer timeout for security tests
    hookTimeout: 15000,
    include: [
      'src/tests/security/**/*.test.js',
      'src/tests/**/*.security.test.js'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      '.next/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'src/tests/**',
        '**/*.d.ts',
        '**/*.config.js'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    // Security-specific configuration
    pool: 'forks', // Use separate processes for security tests
    poolOptions: {
      forks: {
        singleFork: true // Prevent test interference
      }
    },
    // Environment variables for security testing
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret-for-security-tests',
      DATABASE_URL: 'file:./test-security.db',
      RATE_LIMIT_ENABLED: 'true',
      SECURITY_HEADERS_ENABLED: 'true'
    },
    // Reporters for security test results
    reporters: [
      'default',
      ['json', { outputFile: 'security-test-results.json' }],
      ['html', { outputFile: 'security-test-report.html' }]
    ]
  },
  // Resolve configuration for security test dependencies
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname
    }
  }
});