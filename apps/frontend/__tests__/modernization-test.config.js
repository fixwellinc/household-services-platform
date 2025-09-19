/**
 * Test configuration for website modernization validation
 * This configuration defines test environments, performance thresholds,
 * and accessibility requirements for the modernized components.
 */

module.exports = {
  // Test environment configuration
  testEnvironment: 'jsdom',
  
  // Setup files for tests
  setupFilesAfterEnv: [
    '<rootDir>/__tests__/setup/test-setup.js'
  ],
  
  // Module name mapping for imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/styles/(.*)$': '<rootDir>/styles/$1'
  },
  
  // Test patterns for different categories
  testPatterns: {
    visualRegression: [
      '**/__tests__/integration/modernized-*.test.{js,jsx,ts,tsx}',
      '**/__tests__/visual/*.test.{js,jsx,ts,tsx}'
    ],
    performance: [
      '**/__tests__/performance/*.test.{js,jsx,ts,tsx}'
    ],
    accessibility: [
      '**/__tests__/accessibility/*.test.{js,jsx,ts,tsx}'
    ],
    components: [
      '**/__tests__/components/ui/**/*.test.{js,jsx,ts,tsx}'
    ]
  },
  
  // Performance thresholds for validation
  performance: {
    // Rendering performance (milliseconds)
    rendering: {
      componentRender: 50,      // Individual component render time
      pageRender: 150,          // Full page render time
      rerender: 25,             // Component re-render time
      largeList: 200            // Large list rendering (50+ items)
    },
    
    // Interaction performance (milliseconds)
    interactions: {
      buttonClick: 16,          // Button click response time
      hoverEffect: 16,          // Hover effect activation time
      formInput: 50,            // Form input response time
      search: 100,              // Search filtering time
      navigation: 75            // Navigation transition time
    },
    
    // Animation performance
    animations: {
      frameRate: 60,            // Target FPS
      frameTime: 16.67,         // Max frame time (ms) for 60fps
      animationDuration: 600,   // Max animation duration (ms)
      staggerDelay: 100,        // Max stagger delay between items
      scrollAnimation: 400      // Scroll-triggered animation response
    },
    
    // Memory performance
    memory: {
      leakThreshold: 50,        // Max memory increase (%) after cleanup
      componentCleanup: 10,     // Max components before cleanup test
      eventListenerCleanup: true // Ensure event listeners are cleaned up
    }
  },
  
  // Accessibility requirements (WCAG 2.1 AA)
  accessibility: {
    // Color contrast requirements
    colorContrast: {
      normal: 4.5,              // Normal text contrast ratio
      large: 3.0,               // Large text contrast ratio
      nonText: 3.0              // Non-text elements contrast ratio
    },
    
    // Keyboard navigation requirements
    keyboard: {
      focusVisible: true,       // Focus indicators must be visible
      tabOrder: true,           // Logical tab order required
      keyboardTraps: false,     // No keyboard traps allowed
      skipLinks: true           // Skip links for main content
    },
    
    // Screen reader support
    screenReader: {
      headingStructure: true,   // Proper heading hierarchy
      landmarks: true,          // ARIA landmarks required
      labels: true,             // All form elements labeled
      descriptions: true,       // Complex elements described
      liveRegions: true         // Dynamic content announced
    },
    
    // Motion and animation
    motion: {
      reducedMotionSupport: true, // Respect prefers-reduced-motion
      autoplayControl: true,      // User control over autoplay
      parallaxAlternatives: true, // Alternatives to parallax
      vestibularSafety: true      // Avoid vestibular disorders triggers
    },
    
    // Touch and mobile
    touch: {
      targetSize: 44,           // Minimum touch target size (px)
      spacing: 8,               // Minimum spacing between targets (px)
      gestureAlternatives: true, // Alternatives to complex gestures
      orientationSupport: true   // Support both orientations
    }
  },
  
  // Visual regression testing configuration
  visualRegression: {
    // Viewport sizes to test
    viewports: [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1440, height: 900 },
      { name: 'wide', width: 1920, height: 1080 }
    ],
    
    // Browser configurations
    browsers: [
      'chromium',
      'firefox',
      'webkit'
    ],
    
    // Screenshot comparison settings
    comparison: {
      threshold: 0.2,           // Pixel difference threshold (0-1)
      pixelCount: 100,          // Max different pixels allowed
      pixelRatio: 0.01          // Max different pixel ratio (0-1)
    },
    
    // Components to test visually
    components: [
      'EnhancedHeroSection',
      'ModernServiceCard',
      'ProgressiveReveal',
      'StaggeredGrid',
      'ModernizedHomePage',
      'ModernizedServicesPage'
    ]
  },
  
  // Test data and mocks
  testData: {
    // Sample service data for testing
    sampleService: {
      id: 'test-service-1',
      name: 'Test Service',
      description: 'This is a test service for automated testing purposes',
      category: 'CLEANING',
      basePrice: 150,
      complexity: 'MODERATE',
      features: [
        'Professional service',
        'Insured and bonded',
        'Same-day availability',
        'Quality guarantee'
      ],
      rating: 4.8,
      reviewCount: 150,
      estimatedTime: '2-3 hours',
      popularity: 'high',
      contractorPrice: 250,
      savingsPercentage: 40
    },
    
    // Sample user data
    sampleUser: {
      id: 'test-user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'customer',
      subscription: {
        status: 'ACTIVE',
        plan: 'premium'
      }
    },
    
    // Location data for testing
    sampleLocation: {
      city: 'Vancouver',
      province: 'BC',
      country: 'Canada',
      isInBC: true,
      coordinates: {
        lat: 49.2827,
        lng: -123.1207
      }
    }
  },
  
  // Mock configurations
  mocks: {
    // API endpoints to mock
    api: {
      services: '/api/services',
      users: '/api/users',
      plans: '/api/plans'
    },
    
    // Browser APIs to mock
    browserAPIs: [
      'IntersectionObserver',
      'ResizeObserver',
      'matchMedia',
      'requestAnimationFrame',
      'cancelAnimationFrame'
    ],
    
    // Next.js specific mocks
    nextjs: {
      router: true,
      image: true,
      link: true
    }
  },
  
  // Coverage requirements
  coverage: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80,
    
    // Files to include in coverage
    include: [
      'components/ui/**/*.{js,jsx,ts,tsx}',
      'components/ModernizedHomePageClient.tsx',
      'app/services/page.tsx'
    ],
    
    // Files to exclude from coverage
    exclude: [
      '**/__tests__/**',
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.stories.{js,jsx,ts,tsx}',
      '**/node_modules/**'
    ]
  },
  
  // Test timeouts (milliseconds)
  timeouts: {
    default: 5000,              // Default test timeout
    integration: 10000,         // Integration test timeout
    performance: 15000,         // Performance test timeout
    visual: 30000               // Visual regression test timeout
  },
  
  // Retry configuration
  retry: {
    flaky: 2,                   // Retry flaky tests
    performance: 1,             // Retry performance tests once
    visual: 3                   // Retry visual tests (can be flaky)
  },
  
  // Reporting configuration
  reporting: {
    formats: ['html', 'json', 'lcov'],
    outputDir: '__tests__/reports',
    
    // Custom reporters
    reporters: [
      'default',
      ['jest-html-reporters', {
        publicPath: '__tests__/reports/html',
        filename: 'modernization-test-report.html',
        expand: true
      }]
    ]
  },
  
  // Environment variables for testing
  env: {
    NODE_ENV: 'test',
    NEXT_PUBLIC_API_URL: 'http://localhost:3001',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000'
  }
};