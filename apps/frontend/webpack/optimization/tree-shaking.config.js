/**
 * Advanced Tree Shaking Configuration
 * Optimizes bundle size by eliminating unused code paths and dependencies
 */

const path = require('path');

/**
 * Configure advanced tree shaking for webpack
 * @param {object} config - Webpack configuration
 * @param {boolean} isServer - Whether this is server-side build
 * @param {boolean} dev - Whether this is development mode
 */
function configureTreeShaking(config, { isServer, dev }) {
  if (dev) return config;

  // Enhanced tree shaking configuration
  config.optimization = {
    ...config.optimization,
    usedExports: true,
    sideEffects: false,
    
    // Module concatenation for better tree shaking
    concatenateModules: true,
    
    // Provide better names for modules in production
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
    
    // Advanced dead code elimination
    innerGraph: true,
    
    // Optimize module resolution
    providedExports: true,
    
    // Remove empty chunks
    removeEmptyChunks: true,
    
    // Merge duplicate chunks
    mergeDuplicateChunks: true,
    
    // Flag dependency usage
    flagIncludedChunks: true,
  };

  // Configure module resolution for better tree shaking
  // Note: Avoid aliasing date-fns as it breaks react-day-picker compatibility
  // Instead, rely on package.json sideEffects configuration

  // Add plugins for better tree shaking
  const plugins = config.plugins || [];
  
  // Webpack Bundle Analyzer for tree shaking analysis
  if (process.env.ANALYZE_TREE_SHAKING === 'true') {
    try {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: '../tree-shaking-analysis.html',
          generateStatsFile: true,
          statsFilename: '../tree-shaking-stats.json',
        })
      );
    } catch (error) {
      console.warn('Bundle analyzer not available for tree shaking analysis:', error.message);
    }
  }

  config.plugins = plugins;

  return config;
}

/**
 * Package-specific optimizations for common libraries
 */
const packageOptimizations = {
  // Date-fns optimization - use specific imports
  'date-fns': {
    transform: (importPath) => {
      // Transform: import { format } from 'date-fns'
      // To: import format from 'date-fns/format'
      return importPath.replace(/date-fns$/, 'date-fns/esm');
    },
  },
  
  // Lodash optimization - prefer lodash-es
  'lodash': {
    transform: (importPath) => {
      return importPath.replace(/^lodash$/, 'lodash-es');
    },
  },
  
  // React optimization - specific imports
  'react': {
    sideEffects: false,
  },
  
  // Lucide React optimization
  'lucide-react': {
    sideEffects: false,
  },
  
  // Recharts optimization
  'recharts': {
    sideEffects: false,
  },
};

/**
 * Babel plugin to optimize imports for better tree shaking
 */
const createImportOptimizationPlugin = () => {
  return {
    visitor: {
      ImportDeclaration(path) {
        const source = path.node.source.value;
        
        // Optimize date-fns imports
        if (source === 'date-fns') {
          const specifiers = path.node.specifiers;
          if (specifiers.length === 1 && specifiers[0].type === 'ImportSpecifier') {
            const importName = specifiers[0].imported.name;
            path.node.source.value = `date-fns/esm/${importName}`;
            path.node.specifiers = [{
              type: 'ImportDefaultSpecifier',
              local: specifiers[0].local,
            }];
          }
        }
        
        // Optimize lodash imports
        if (source === 'lodash') {
          path.node.source.value = 'lodash-es';
        }
      },
    },
  };
};

module.exports = {
  configureTreeShaking,
  packageOptimizations,
  createImportOptimizationPlugin,
};