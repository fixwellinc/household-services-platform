/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix for missing buildId and deploymentId errors
  generateBuildId: async () => {
    const buildId = process.env.NEXT_BUILD_ID ||
                   process.env.RAILWAY_GIT_COMMIT_SHA || 
                   process.env.VERCEL_GIT_COMMIT_SHA || 
                   process.env.GITHUB_SHA ||
                   process.env.RAILWAY_DEPLOYMENT_ID ||
                   'build-' + Date.now();
    console.log('🔧 Generated buildId:', buildId);
    return buildId;
  },
  // Environment variables for build context
  env: {
    NEXT_BUILD_ID: process.env.NEXT_BUILD_ID || 'build-' + Date.now(),
    RAILWAY_DEPLOYMENT_ID: process.env.RAILWAY_DEPLOYMENT_ID,
    RAILWAY_GIT_COMMIT_SHA: process.env.RAILWAY_GIT_COMMIT_SHA,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fixwell-services-platform-production.up.railway.app',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'fixwell.up.railway.app',
      },
      {
        protocol: 'https',
        hostname: 'roasted-key-production.up.railway.app',
      }
    ],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Cache-Control', value: 'no-cache, no-store' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { 
            key: 'Content-Security-Policy', 
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://m.stripe.network; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com https://roasted-key-production.up.railway.app; frame-src https://js.stripe.com https://hooks.stripe.com; frame-ancestors 'none';"
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ];
  },
  // Configure for production deployment stability with custom server
  // Note: Using custom unified server, so not using standalone output
  staticPageGenerationTimeout: 120,
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  
  // External packages for server components
  serverExternalPackages: ['sharp'],
  
  // Experimental features for optimization
  experimental: {
    // Keep minimal experimental features for stability
  },
  
  // Build optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    // Enable SWC transforms for better performance
    styledComponents: true,
  },
  
  // Performance budgets
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  
  // Development mode settings for better error messages
  ...(process.env.NODE_ENV === 'development' && {
    reactStrictMode: false, // Disable strict mode to reduce hydration warnings
    swcMinify: false,
  }),
  
  // Stability settings
  poweredByHeader: false,
  generateEtags: false,
  compress: true,
  
  // Error handling
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Advanced webpack configuration for bundle optimization
  webpack: (config, { isServer, dev }) => {
    // Import optimization configurations
    const { configureTreeShaking } = require('./webpack/optimization/tree-shaking.config');
    const { 
      configureCompression, 
      configureAssetCaching, 
      configureCSSOptimization,
      configureJSOptimization,
      addBundleSizeMonitoring 
    } = require('./webpack/optimization/compression.config');
    
    // Basic fallbacks for Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Apply advanced tree shaking configuration
    config = configureTreeShaking(config, { isServer, dev });

    // Advanced optimization settings for production
    if (!dev) {
      // Apply compression and caching optimizations
      config = configureCompression(config, { isServer, dev });
      config = configureAssetCaching(config);
      config = configureCSSOptimization(config);
      config = configureJSOptimization(config);
      config = addBundleSizeMonitoring(config);
      // Advanced code splitting configuration
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          // Vendor libraries with tree shaking
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
          // React and Next.js framework
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            name: 'framework',
            chunks: 'all',
            priority: 40,
            reuseExistingChunk: true,
          },
          // Date utilities (optimized for tree shaking)
          dateUtils: {
            test: /[\\/]node_modules[\\/](date-fns)[\\/]/,
            name: 'date-utils',
            chunks: 'all',
            priority: 30,
            reuseExistingChunk: true,
          },
          // UI libraries (optimized for tree shaking)
          uiLibs: {
            test: /[\\/]node_modules[\\/](lucide-react|@radix-ui|recharts)[\\/]/,
            name: 'ui-libs',
            chunks: 'all',
            priority: 25,
            reuseExistingChunk: true,
          },
          // Common shared code
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Admin dashboard chunks
          admin: {
            test: /[\\/](components|app)[\\/]admin[\\/]/,
            name: 'admin',
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true,
          },
          // Customer dashboard chunks
          dashboard: {
            test: /[\\/](components|app)[\\/](dashboard|customer)[\\/]/,
            name: 'dashboard',
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true,
          },
          // Performance monitoring chunks
          performance: {
            test: /[\\/]lib[\\/]performance[\\/]/,
            name: 'performance',
            chunks: 'all',
            priority: 15,
            reuseExistingChunk: true,
          },
        },
      };

      // Enable compression
      config.plugins = config.plugins || [];
      
      // Add bundle analyzer in development mode when ANALYZE=true
      if (process.env.ANALYZE === 'true') {
        try {
          const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
          config.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              openAnalyzer: false,
              reportFilename: '../bundle-analyzer-report.html',
            })
          );
        } catch (error) {
          console.warn('Bundle analyzer not available:', error.message);
        }
      }
    }
    
    return config;
  },
}

module.exports = nextConfig 