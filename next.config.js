/** @type {import('next').NextConfig} */
const nextConfig = {
  // Webpack configuration to prevent module resolution issues
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
    
    return config;
  },
  
  // Disable file system caching that can get corrupted
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  
  // Disable SWC minification in development to prevent issues
  swcMinify: false,
}

module.exports = nextConfig; 