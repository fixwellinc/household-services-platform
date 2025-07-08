/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'household-services-platform-production.up.railway.app'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? 'https://household-services-platform-production.up.railway.app/api/:path*'
          : 'http://localhost:5000/api/:path*',
      },
    ];
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
  experimental: {
    serverComponentsExternalPackages: [],
  },
}

module.exports = nextConfig 