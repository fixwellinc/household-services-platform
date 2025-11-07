// Test setup file for vitest
import { beforeAll, afterAll } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';

// Suppress console logs during tests unless explicitly needed
const originalConsole = { ...console };
beforeAll(() => {
  if (process.env.VITEST_VERBOSE !== 'true') {
    console.log = () => {};
    console.info = () => {};
    console.warn = () => {};
    console.error = () => {};
  }
});

afterAll(() => {
  // Restore console
  Object.assign(console, originalConsole);
});