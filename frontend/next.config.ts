import type { NextConfig } from "next";
import fs from "fs";

const isDocker = fs.existsSync("/.dockerenv");
const defaultBackend = isDocker ? "http://clinic_api:4000" : "http://localhost:4000";

const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  async rewrites() {
    const backendUrl =
      process.env.INTERNAL_API_URL ||
      process.env.API_URL ||
      defaultBackend;
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
