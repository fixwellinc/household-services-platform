module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/admin',
        'http://localhost:3000/customer-dashboard',
        'http://localhost:3000/book-appointment',
      ],
      startServerCommand: 'npm start',
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --headless',
      },
    },
    assert: {
      assertions: {
        // Performance budgets aligned with our requirements
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        
        // Core Web Vitals budgets
        'metrics:largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'metrics:first-input-delay': ['error', { maxNumericValue: 100 }],
        'metrics:cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'metrics:first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'metrics:speed-index': ['error', { maxNumericValue: 3000 }],
        'metrics:time-to-interactive': ['error', { maxNumericValue: 3800 }],
        
        // Resource budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 400000 }], // 400KB
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 50000 }], // 50KB
        'resource-summary:image:size': ['error', { maxNumericValue: 1000000 }], // 1MB
        'resource-summary:font:size': ['error', { maxNumericValue: 100000 }], // 100KB
        'resource-summary:total:size': ['error', { maxNumericValue: 2000000 }], // 2MB
        
        // Network budgets
        'resource-summary:total:count': ['error', { maxNumericValue: 50 }],
        
        // Specific performance audits
        'unused-javascript': ['error', { maxNumericValue: 50000 }], // 50KB unused JS
        'unused-css-rules': ['error', { maxNumericValue: 20000 }], // 20KB unused CSS
        'render-blocking-resources': 'error',
        'uses-optimized-images': 'error',
        'uses-webp-images': 'warn',
        'uses-text-compression': 'error',
        'efficient-animated-content': 'warn',
        'preload-lcp-image': 'warn',
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
    server: {
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: '.lighthouseci/database.sql',
      },
    },
  },
};