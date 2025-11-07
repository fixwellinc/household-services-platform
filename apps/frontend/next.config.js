/** @type {import('next').NextConfig} */
const nextConfig = {
  // Simplified build ID generation for Railway
  generateBuildId: async () => {
    const buildId = process.env.RAILWAY_GIT_COMMIT_SHA || 
                   process.env.RAILWAY_DEPLOYMENT_ID ||
                   'build-' + Date.now();
    console.log('🔧 Generated buildId:', buildId);
    return buildId;
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
  
  // Explicitly configure for App Router only (disable Pages Router detection)
  // This prevents Next.js from looking for _document, _app, etc.
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  
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
  
  // Simplified webpack configuration for Railway deployment
  webpack: (config, { isServer }) => {
    // Basic fallbacks for Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
}

module.exports = nextConfig 