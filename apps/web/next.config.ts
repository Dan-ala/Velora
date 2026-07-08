import type { NextConfig } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.startsWith('http')
  ? process.env.NEXT_PUBLIC_API_URL
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dvjfilxjp/**',
      },
    ],
  },
  async rewrites() {
    const apiDest = API_URL || (
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:4000'
        : 'https://velora-api-w930.onrender.com'
    );
    return [
      {
        source: '/api/:path*',
        destination: `${apiDest}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;