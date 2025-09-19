/**
 * Dashboard Routing Test Setup
 * 
 * Additional setup specifically for dashboard routing tests
 */

// Performance monitoring setup
global.performance = global.performance || {
  now: () => Date.now(),
  mark: () => {},
  measure: () => {},
  getEntriesByName: () => [],
  getEntriesByType: () => [],
  clearMarks: () => {},
  clearMeasures: () => {},
};

// Mock IntersectionObserver for loading state tests
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver for responsive tests
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage for parameter persistence tests
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset localStorage and sessionStorage
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
  
  // Mock console methods to avoid noise unless explicitly testing error handling
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  
  // Clean up any timers
  jest.clearAllTimers();
  
  // Clean up DOM
  document.body.innerHTML = '';
});

// Custom matchers for dashboard routing tests
expect.extend({
  toHaveBeenCalledWithRoute(received, expectedRoute) {
    const pass = received.mock.calls.some(call => 
      call.some(arg => typeof arg === 'string' && arg.includes(expectedRoute))
    );
    
    if (pass) {
      return {
        message: () => `expected ${received} not to have been called with route ${expectedRoute}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to have been called with route ${expectedRoute}`,
        pass: false,
      };
    }
  },
  
  toHavePreservedParameters(received, expectedParams) {
    const pass = received.mock.calls.some(call => 
      call.some(arg => {
        if (typeof arg !== 'string') return false;
        const url = new URL(arg, 'http://localhost:3000');
        return expectedParams.every(param => url.searchParams.has(param));
      })
    );
    
    if (pass) {
      return {
        message: () => `expected ${received} not to have preserved parameters ${expectedParams.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to have preserved parameters ${expectedParams.join(', ')}`,
        pass: false,
      };
    }
  },
  
  toHaveLoadedWithinTime(received, maxTime) {
    const actualTime = received;
    const pass = actualTime <= maxTime;
    
    if (pass) {
      return {
        message: () => `expected loading time ${actualTime}ms not to be within ${maxTime}ms`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected loading time ${actualTime}ms to be within ${maxTime}ms`,
        pass: false,
      };
    }
  },
});

// Test utilities for dashboard routing
global.dashboardTestUtils = {
  // Create mock user with different roles and subscription states
  createMockUser: (role = 'CUSTOMER', subscriptionStatus = 'ACTIVE') => ({
    id: `user_${Date.now()}`,
    role,
    email: `${role.toLowerCase()}@test.com`,
    name: `${role} User`,
    createdAt: new Date().toISOString(),
    subscription: subscriptionStatus !== 'NONE' ? {
      id: `sub_${Date.now()}`,
      status: subscriptionStatus,
      tier: 'HOMECARE',
      createdAt: new Date().toISOString(),
    } : null,
  }),
  
  // Create mock subscription data
  createMockSubscriptionData: (status = 'ACTIVE', hasPlan = true) => ({
    success: true,
    hasPlan,
    subscription: hasPlan ? {
      id: `sub_${Date.now()}`,
      status,
      tier: 'HOMECARE',
      createdAt: new Date().toISOString(),
    } : null,
    plan: hasPlan ? {
      id: `plan_${Date.now()}`,
      name: 'HomeCare Plan',
      monthlyPrice: 4999,
    } : null,
  }),
  
  // Wait for async operations with timeout
  waitForAsync: (condition, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkCondition = () => {
        if (condition()) {
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Condition not met within ${timeout}ms`));
        } else {
          setTimeout(checkCondition, 100);
        }
      };
      checkCondition();
    });
  },
  
  // Simulate network delays
  simulateNetworkDelay: (ms = 100) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  // Create URL with parameters
  createUrlWithParams: (path, params = {}) => {
    const url = new URL(path, 'http://localhost:3000');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return url.toString();
  },
};

// Performance measurement utilities
global.performanceUtils = {
  measureTime: (fn) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    return {
      result,
      duration: end - start,
    };
  },
  
  measureAsyncTime: async (fn) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return {
      result,
      duration: end - start,
    };
  },
};

// Error simulation utilities
global.errorUtils = {
  createNetworkError: (message = 'Network error') => {
    const error = new Error(message);
    error.name = 'NetworkError';
    return error;
  },
  
  createTimeoutError: (message = 'Request timeout') => {
    const error = new Error(message);
    error.name = 'TimeoutError';
    return error;
  },
  
  createAuthError: (message = 'Authentication failed') => {
    const error = new Error(message);
    error.name = 'AuthenticationError';
    return error;
  },
};