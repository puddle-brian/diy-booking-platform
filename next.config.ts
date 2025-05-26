import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['react', 'react-dom']
  },
  webpack: (config, { isServer }) => {
    // Ensure proper module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };
    
    return config;
  },
  // Ensure static files are properly handled
  trailingSlash: false,
  // Optimize for Vercel deployment
  output: 'standalone'
};

export default nextConfig;
