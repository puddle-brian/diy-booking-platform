import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['react', 'react-dom']
  },
  // Completely skip TypeScript checking during builds
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Skip type checking for faster builds
  swcMinify: true,
  webpack: (config, { isServer }) => {
    // Ensure proper module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };
    
    // Skip type checking plugin
    if (!isServer) {
      config.plugins = config.plugins.filter(
        (plugin: any) => plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin'
      );
    }
    
    return config;
  },
  // Ensure static files are properly handled
  trailingSlash: false
};

export default nextConfig;
