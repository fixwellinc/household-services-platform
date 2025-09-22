/** @type {import('next').NextConfig} */
const nextConfig = {
  // Development mode settings
  ...(process.env.NODE_ENV === 'development' && {
    reactStrictMode: false, // Disable strict mode to reduce hydration warnings
    swcMinify: false,
    compiler: {
      removeConsole: false,
    },
  }),
  
  // Production mode settings
  ...(process.env.NODE_ENV === 'production' && {
    reactStrictMode: true,
    swcMinify: true,
    compiler: {
      removeConsole: true,
    },
  }),
  
  // Error handling
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Prevent hydration issues
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Custom error pages
  async rewrites() {
    return [
      {
        source: '/500',
        destination: '/error',
      },
    ];
  },
  
  // Headers for better error handling
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
