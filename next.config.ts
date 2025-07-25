import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure pages directory
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // DISABLE ESLINT DURING BUILD
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // API routes configuration
  async rewrites() {
    return [];
  },

  // Environment configuration
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Production optimizations
  compress: true,
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0'
          }
        ]
      }
    ];
  },

  // Turbopack configuration (stable)
  turbopack: {
    rules: {
      '*.svg': ['@svgr/webpack'],
    },
  },
};

export default nextConfig;
