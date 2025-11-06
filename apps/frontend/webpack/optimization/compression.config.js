/**
 * Advanced Compression and Minification Configuration
 * Optimizes asset loading and caching strategies
 */

const path = require('path');

/**
 * Configure advanced compression for webpack
 * @param {object} config - Webpack configuration
 * @param {boolean} isServer - Whether this is server-side build
 * @param {boolean} dev - Whether this is development mode
 */
function configureCompression(config, { isServer, dev }) {
  if (dev) return config;

  // Enhanced minification settings
  config.optimization = {
    ...config.optimization,
    
    // Advanced minification
    minimize: true,
    minimizer: [
      // Keep existing minimizers and add custom ones
      ...config.optimization.minimizer || [],
    ],
    
    // Optimize runtime chunk
    runtimeChunk: {
      name: 'runtime',
    },
    
    // Optimize module IDs
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
  };

  // Note: Next.js handles most asset optimization automatically
  // We'll only add compression plugins without modifying module rules

  // Add compression plugins
  const plugins = config.plugins || [];
  
  // Compression plugin for gzip
  try {
    const CompressionPlugin = require('compression-webpack-plugin');
    plugins.push(
      new CompressionPlugin({
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 8192,
        minRatio: 0.8,
        filename: '[path][base].gz',
      })
    );
  } catch (error) {
    console.warn('CompressionPlugin not available:', error.message);
  }

  // Brotli compression for better compression ratios
  try {
    const CompressionPlugin = require('compression-webpack-plugin');
    plugins.push(
      new CompressionPlugin({
        algorithm: 'brotliCompress',
        test: /\.(js|css|html|svg)$/,
        compressionOptions: {
          level: 11,
        },
        threshold: 8192,
        minRatio: 0.8,
        filename: '[path][base].br',
      })
    );
  } catch (error) {
    console.warn('Brotli compression not available:', error.message);
  }

  config.plugins = plugins;

  return config;
}

/**
 * Configure asset caching strategies
 */
function configureAssetCaching(config) {
  // Configure output for better caching
  config.output = {
    ...config.output,
    
    // Use content hashes for long-term caching
    filename: 'static/js/[name].[contenthash:8].js',
    chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
    
    // Asset module filename
    assetModuleFilename: 'static/media/[name].[hash:8][ext]',
    
    // Clean output directory
    clean: true,
  };

  return config;
}

/**
 * Configure CSS optimization
 */
function configureCSSOptimization(config) {
  // CSS optimization is handled by Next.js built-in optimization
  // No additional configuration needed to avoid conflicts
  return config;
}

/**
 * Configure JavaScript optimization
 */
function configureJSOptimization(config) {
  // Enhanced terser options for better minification
  try {
    const TerserPlugin = require('terser-webpack-plugin');
    
    config.optimization.minimizer = config.optimization.minimizer || [];
    
    // Find existing TerserPlugin and enhance it
    const existingTerserIndex = config.optimization.minimizer.findIndex(
      plugin => plugin.constructor.name === 'TerserPlugin'
    );
    
    if (existingTerserIndex !== -1) {
      // Replace existing terser with enhanced version
      config.optimization.minimizer[existingTerserIndex] = new TerserPlugin({
        parallel: true,
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug'],
            passes: 2,
          },
          mangle: {
            safari10: true,
          },
          format: {
            comments: false,
          },
        },
        extractComments: false,
      });
    }
  } catch (error) {
    console.warn('TerserPlugin not available:', error.message);
  }

  return config;
}

/**
 * Performance optimization utilities
 */
const performanceOptimizations = {
  // Preload critical resources
  preloadCriticalResources: [
    'framework',
    'main',
    'commons',
  ],
  
  // Prefetch non-critical resources
  prefetchResources: [
    'admin',
    'dashboard',
    'performance',
  ],
  
  // Resource hints configuration
  resourceHints: {
    preload: {
      chunks: ['framework', 'main'],
      include: 'initial',
    },
    prefetch: {
      chunks: ['admin', 'dashboard'],
      include: 'asyncChunks',
    },
  },
};

/**
 * Bundle size monitoring
 */
function addBundleSizeMonitoring(config) {
  // Add bundle size monitoring in production
  if (process.env.NODE_ENV === 'production') {
    const plugins = config.plugins || [];
    
    // Custom plugin to monitor bundle sizes
    plugins.push({
      apply: (compiler) => {
        compiler.hooks.done.tap('BundleSizeMonitor', (stats) => {
          const assets = stats.toJson().assets;
          const jsAssets = assets.filter(asset => asset.name.endsWith('.js'));
          const cssAssets = assets.filter(asset => asset.name.endsWith('.css'));
          
          console.log('\n📦 Bundle Size Report:');
          console.log('JavaScript Assets:');
          jsAssets.forEach(asset => {
            const sizeKB = (asset.size / 1024).toFixed(2);
            console.log(`  ${asset.name}: ${sizeKB} KB`);
          });
          
          console.log('CSS Assets:');
          cssAssets.forEach(asset => {
            const sizeKB = (asset.size / 1024).toFixed(2);
            console.log(`  ${asset.name}: ${sizeKB} KB`);
          });
          
          const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);
          const totalSizeKB = (totalSize / 1024).toFixed(2);
          console.log(`Total Bundle Size: ${totalSizeKB} KB\n`);
        });
      },
    });
    
    config.plugins = plugins;
  }
  
  return config;
}

module.exports = {
  configureCompression,
  configureAssetCaching,
  configureCSSOptimization,
  configureJSOptimization,
  performanceOptimizations,
  addBundleSizeMonitoring,
};