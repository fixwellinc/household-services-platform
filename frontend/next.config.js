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
}

module.exports = nextConfig 