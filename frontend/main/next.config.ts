import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1';
let apiProtocol: 'http' | 'https' = 'http';
let apiHostname = 'localhost';
let apiPort: string | undefined = '3001';
try {
  const parsed = new URL(API_URL);
  apiProtocol = parsed.protocol.replace(':', '') as 'http' | 'https';
  apiHostname = parsed.hostname;
  apiPort = parsed.port || undefined;
} catch {}

const apiOrigin = apiPort
  ? `${apiProtocol}://${apiHostname}:${apiPort}`
  : `${apiProtocol}://${apiHostname}`;

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: apiProtocol,
        hostname: apiHostname,
        ...(apiPort ? { port: apiPort } : {}),
        pathname: '/uploads/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: isDev
              ? `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: ${apiOrigin}; connect-src 'self' ${apiOrigin} ws://localhost:3000 https://viacep.com.br https://nominatim.openstreetmap.org; frame-src 'none'; object-src 'none';`
              : `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://viacep.com.br https://nominatim.openstreetmap.org; frame-src 'none'; object-src 'none';`,
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
