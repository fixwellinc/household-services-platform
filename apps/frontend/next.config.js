/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
            domains: ['localhost', 'fixwell-services-platform-production.up.railway.app'],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  // Configure for production deployment
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Disable static optimization and force server-side rendering
  staticPageGenerationTimeout: 0,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Force all pages to be server-side rendered
  output: 'standalone',
}

module.exports = nextConfig 