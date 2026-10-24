import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{source: '/:path*', headers: [
      {key: 'X-Content-Type-Options', value: 'nosniff'},
      {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
      {key: 'X-Frame-Options', value: 'SAMEORIGIN'},
    ]}, {source: '/api/:path*', headers: [
      {key: 'Cache-Control', value: 'no-store'},
      {key: 'Referrer-Policy', value: 'no-referrer'},
      {key: 'X-Robots-Tag', value: 'noindex, nofollow'},
    ]}];
  },
  allowedDevOrigins: ["192.168.0.100"],
};

export default nextConfig;
