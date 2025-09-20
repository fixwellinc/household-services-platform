import 'jest-axe/extend-expect';
import { configure } from '@testing-library/react';

// Configure testing library for accessibility
configure({
  // Increase timeout for accessibility tests
  asyncUtilTimeout: 5000,
  
  // Configure queries to be more accessibility-focused
  defaultHidden: true,
  
  // Custom test ID attribute for accessibility testing
  testIdAttribute: 'data-testid'
});

// Mock IntersectionObserver for accessibility tests
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver for accessibility tests
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia for accessibility preference tests
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

// Mock getComputedStyle for style-based accessibility tests
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: (prop) => {
      // Return default values for common accessibility-related properties
      const defaults = {
        'font-size': '16px',
        'line-height': '1.5',
        'color': '#000000',
        'background-color': '#ffffff',
        'border-width': '1px',
        'animation-duration': '0.3s',
        'transition-duration': '0.3s'
      };
      return defaults[prop] || '';
    }
  })
});

// Mock focus and blur methods
HTMLElement.prototype.focus = jest.fn();
HTMLElement.prototype.blur = jest.fn();

// Mock scrollIntoView for keyboard navigation tests
HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock getBoundingClientRect for touch target size tests
HTMLElement.prototype.getBoundingClientRect = jest.fn(() => ({
  width: 44,
  height: 44,
  top: 0,
  left: 0,
  bottom: 44,
  right: 44,
  x: 0,
  y: 0
}));

// Mock performance API for timing tests
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => [])
  }
});

// Mock speech synthesis for screen reader tests
Object.defineProperty(window, 'speechSynthesis', {
  value: {
    speak: jest.fn(),
    cancel: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    getVoices: jest.fn(() => [])
  }
});

// Global accessibility test helpers
global.accessibilityHelpers = {
  // Helper to simulate keyboard navigation
  simulateKeyboardNavigation: (element, keys) => {
    keys.forEach(key => {
      element.dispatchEvent(new KeyboardEvent('keydown', { key }));
    });
  },
  
  // Helper to check if element is focusable
  isFocusable: (element) => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    return focusableSelectors.some(selector => element.matches(selector));
  },
  
  // Helper to get all focusable elements
  getFocusableElements: (container) => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');
    
    return container.querySelectorAll(focusableSelectors);
  },
  
  // Helper to simulate screen reader announcement
  simulateScreenReaderAnnouncement: (element) => {
    const announcement = element.getAttribute('aria-label') || 
                        element.getAttribute('aria-labelledby') ||
                        element.textContent;
    return announcement;
  },
  
  // Helper to check color contrast
  checkColorContrast: (foreground, background) => {
    // Simplified contrast ratio calculation
    // In real implementation, this would use proper color contrast algorithms
    const fgLuminance = getLuminance(foreground);
    const bgLuminance = getLuminance(background);
    
    const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                  (Math.min(fgLuminance, bgLuminance) + 0.05);
    
    return {
      ratio,
      passesAA: ratio >= 4.5,
      passesAAA: ratio >= 7
    };
  }
};

// Helper function for luminance calculation
function getLuminance(color) {
  // Simplified luminance calculation
  // In real implementation, this would properly parse color values
  const rgb = color.match(/\d+/g);
  if (!rgb) return 0;
  
  const [r, g, b] = rgb.map(c => {
    c = parseInt(c) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Console warnings for accessibility issues during tests
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  const message = args.join(' ');
  
  // Fail tests on accessibility warnings
  if (message.includes('accessibility') || 
      message.includes('aria-') || 
      message.includes('role') ||
      message.includes('tabindex')) {
    throw new Error(`Accessibility warning: ${message}`);
  }
  
  originalConsoleWarn.apply(console, args);
};

// Set up axe-core configuration for consistent testing
import { configureAxe } from 'jest-axe';

const axe = configureAxe({
  rules: {
    // Enable all accessibility rules
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'focus-management': { enabled: true },
    'aria-usage': { enabled: true },
    'semantic-markup': { enabled: true }
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']
});

global.axe = axe;