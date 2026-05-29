import type { NextConfig } from "next";

const API_HOST = 'me-indica-la.onrender.com';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: API_HOST,
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    const apiOrigin = `https://${API_HOST}`;
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development'
              ? `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: http://localhost:3001 ${apiOrigin}; font-src 'self'; connect-src 'self' http://localhost:3001 ws://localhost:3000 https://viacep.com.br https://nominatim.openstreetmap.org; frame-src 'none'; object-src 'none';`
              : `default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: ${apiOrigin} https://*.cloudinary.com; font-src 'self'; connect-src 'self' ${apiOrigin} https://viacep.com.br https://nominatim.openstreetmap.org; frame-src 'none'; object-src 'none';`,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
