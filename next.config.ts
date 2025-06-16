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
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Disable webpack cache in development to prevent corruption
      config.cache = false;
      
      // Improve module resolution
      config.resolve.symlinks = false;
      
      // Prevent memory leaks that can cause corruption
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
        },
      };
    }
    
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
  // Disable file system caching that can get corrupted
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Ensure static files are properly handled
  trailingSlash: false
};

export default nextConfig;
