#!/usr/bin/env node

/**
 * Import Optimization Script
 * Analyzes and optimizes imports for better tree shaking
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ImportOptimizer {
  constructor() {
    this.sourceDir = path.join(__dirname, '..');
    this.optimizations = [];
    this.issues = [];
  }

  /**
   * Analyze all TypeScript/JavaScript files for import optimizations
   */
  async analyzeImports() {
    console.log('🔍 Analyzing imports for tree shaking opportunities...\n');
    
    const files = this.getAllSourceFiles();
    
    for (const file of files) {
      await this.analyzeFile(file);
    }
    
    this.generateReport();
  }

  /**
   * Get all source files to analyze
   */
  getAllSourceFiles() {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    const files = [];
    
    const scanDirectory = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(fullPath);
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    };
    
    scanDirectory(this.sourceDir);
    return files;
  }

  /**
   * Analyze a single file for import optimizations
   */
  async analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(this.sourceDir, filePath);
      
      // Check for problematic import patterns
      this.checkDateFnsImports(content, relativePath);
      this.checkLodashImports(content, relativePath);
      this.checkReactImports(content, relativePath);
      this.checkLucideImports(content, relativePath);
      this.checkRechartsImports(content, relativePath);
      this.checkBarrelImports(content, relativePath);
      
    } catch (error) {
      this.issues.push({
        file: filePath,
        type: 'error',
        message: `Failed to analyze: ${error.message}`,
      });
    }
  }

  /**
   * Check date-fns imports for optimization opportunities
   */
  checkDateFnsImports(content, filePath) {
    // Look for non-optimized date-fns imports
    const dateFnsImports = content.match(/import\s+{[^}]+}\s+from\s+['"]date-fns['"]/g);
    
    if (dateFnsImports) {
      dateFnsImports.forEach(importStatement => {
        const functions = importStatement.match(/{([^}]+)}/)[1]
          .split(',')
          .map(f => f.trim());
        
        if (functions.length === 1) {
          this.optimizations.push({
            file: filePath,
            type: 'date-fns',
            current: importStatement,
            optimized: `import ${functions[0]} from 'date-fns/esm/${functions[0]}';`,
            savings: 'Reduces bundle size by ~50KB',
          });
        }
      });
    }
  }

  /**
   * Check lodash imports for optimization opportunities
   */
  checkLodashImports(content, filePath) {
    const lodashImports = content.match(/import\s+.*\s+from\s+['"]lodash['"]/g);
    
    if (lodashImports) {
      lodashImports.forEach(importStatement => {
        this.optimizations.push({
          file: filePath,
          type: 'lodash',
          current: importStatement,
          optimized: importStatement.replace('lodash', 'lodash-es'),
          savings: 'Enables better tree shaking',
        });
      });
    }
  }

  /**
   * Check React imports for optimization opportunities
   */
  checkReactImports(content, filePath) {
    // Look for full React namespace imports
    const reactNamespaceImports = content.match(/import\s+\*\s+as\s+React\s+from\s+['"]react['"]/g);
    
    if (reactNamespaceImports) {
      // Analyze which React features are actually used
      const reactUsage = this.analyzeReactUsage(content);
      
      if (reactUsage.length > 0 && reactUsage.length < 5) {
        this.optimizations.push({
          file: filePath,
          type: 'react',
          current: reactNamespaceImports[0],
          optimized: `import { ${reactUsage.join(', ')} } from 'react';`,
          savings: 'Reduces React bundle overhead',
        });
      }
    }
  }

  /**
   * Analyze React usage patterns in content
   */
  analyzeReactUsage(content) {
    const reactFeatures = [
      'useState', 'useEffect', 'useContext', 'useReducer', 'useCallback',
      'useMemo', 'useRef', 'useImperativeHandle', 'useLayoutEffect',
      'createContext', 'forwardRef', 'memo', 'Component', 'PureComponent',
      'Suspense', 'lazy', 'Fragment'
    ];
    
    const usedFeatures = [];
    
    reactFeatures.forEach(feature => {
      if (content.includes(`React.${feature}`) || content.includes(feature)) {
        usedFeatures.push(feature);
      }
    });
    
    return usedFeatures;
  }

  /**
   * Check Lucide React imports for optimization
   */
  checkLucideImports(content, filePath) {
    // Look for large lucide-react imports
    const lucideImports = content.match(/import\s+{[^}]+}\s+from\s+['"]lucide-react['"]/g);
    
    if (lucideImports) {
      lucideImports.forEach(importStatement => {
        const icons = importStatement.match(/{([^}]+)}/)[1]
          .split(',')
          .map(i => i.trim());
        
        if (icons.length > 10) {
          this.issues.push({
            file: filePath,
            type: 'warning',
            message: `Large lucide-react import (${icons.length} icons). Consider splitting or lazy loading.`,
          });
        }
      });
    }
  }

  /**
   * Check Recharts imports for optimization
   */
  checkRechartsImports(content, filePath) {
    const rechartsImports = content.match(/import\s+{[^}]+}\s+from\s+['"]recharts['"]/g);
    
    if (rechartsImports) {
      this.optimizations.push({
        file: filePath,
        type: 'recharts',
        current: 'Standard recharts import',
        optimized: 'Consider lazy loading charts or using recharts/es6 imports',
        savings: 'Reduces initial bundle size significantly',
      });
    }
  }

  /**
   * Check for barrel imports that might hurt tree shaking
   */
  checkBarrelImports(content, filePath) {
    // Look for imports from index files that might be barrel exports
    const barrelImports = content.match(/import\s+{[^}]+}\s+from\s+['"][^'"]*\/index['"]/g);
    
    if (barrelImports) {
      barrelImports.forEach(importStatement => {
        this.issues.push({
          file: filePath,
          type: 'warning',
          message: `Potential barrel import detected: ${importStatement}. May hurt tree shaking.`,
        });
      });
    }
  }

  /**
   * Generate optimization report
   */
  generateReport() {
    console.log('📊 Import Optimization Report\n');
    console.log('=' .repeat(50));
    
    // Summary
    console.log(`\n📈 Summary:`);
    console.log(`   Optimizations found: ${this.optimizations.length}`);
    console.log(`   Issues found: ${this.issues.length}`);
    
    // Optimizations by type
    const optimizationsByType = this.groupBy(this.optimizations, 'type');
    console.log(`\n🎯 Optimizations by type:`);
    Object.entries(optimizationsByType).forEach(([type, opts]) => {
      console.log(`   ${type}: ${opts.length} opportunities`);
    });
    
    // Top optimizations
    if (this.optimizations.length > 0) {
      console.log(`\n🔧 Top Optimization Opportunities:`);
      this.optimizations.slice(0, 10).forEach((opt, index) => {
        console.log(`\n${index + 1}. ${opt.file}`);
        console.log(`   Type: ${opt.type}`);
        console.log(`   Current: ${opt.current}`);
        console.log(`   Optimized: ${opt.optimized}`);
        console.log(`   Savings: ${opt.savings}`);
      });
    }
    
    // Issues
    if (this.issues.length > 0) {
      console.log(`\n⚠️  Issues to Review:`);
      this.issues.slice(0, 10).forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.file}`);
        console.log(`   Type: ${issue.type}`);
        console.log(`   Message: ${issue.message}`);
      });
    }
    
    // Recommendations
    console.log(`\n💡 Recommendations:`);
    console.log(`   1. Use specific imports instead of namespace imports`);
    console.log(`   2. Prefer ES modules over CommonJS when available`);
    console.log(`   3. Avoid barrel exports for large libraries`);
    console.log(`   4. Consider lazy loading for heavy components`);
    console.log(`   5. Use webpack-bundle-analyzer to verify optimizations`);
    
    console.log('\n' + '='.repeat(50));
  }

  /**
   * Group array by property
   */
  groupBy(array, property) {
    return array.reduce((groups, item) => {
      const key = item[property];
      groups[key] = groups[key] || [];
      groups[key].push(item);
      return groups;
    }, {});
  }

  /**
   * Apply automatic optimizations where safe
   */
  async applyOptimizations() {
    console.log('🔧 Applying safe optimizations...\n');
    
    let appliedCount = 0;
    
    for (const optimization of this.optimizations) {
      if (this.isSafeOptimization(optimization)) {
        try {
          await this.applyOptimization(optimization);
          appliedCount++;
          console.log(`✅ Applied: ${optimization.file} (${optimization.type})`);
        } catch (error) {
          console.log(`❌ Failed: ${optimization.file} - ${error.message}`);
        }
      }
    }
    
    console.log(`\n🎉 Applied ${appliedCount} optimizations`);
  }

  /**
   * Check if optimization is safe to apply automatically
   */
  isSafeOptimization(optimization) {
    // Only apply certain types of optimizations automatically
    const safeTypes = ['lodash'];
    return safeTypes.includes(optimization.type);
  }

  /**
   * Apply a single optimization
   */
  async applyOptimization(optimization) {
    const filePath = path.join(this.sourceDir, optimization.file);
    const content = fs.readFileSync(filePath, 'utf8');
    const optimizedContent = content.replace(optimization.current, optimization.optimized);
    fs.writeFileSync(filePath, optimizedContent, 'utf8');
  }
}

// CLI interface
if (require.main === module) {
  const optimizer = new ImportOptimizer();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'analyze':
      optimizer.analyzeImports();
      break;
    case 'apply':
      optimizer.analyzeImports().then(() => optimizer.applyOptimizations());
      break;
    default:
      console.log('Usage: node optimize-imports.js [analyze|apply]');
      console.log('  analyze - Analyze imports and show optimization opportunities');
      console.log('  apply   - Analyze and apply safe optimizations');
  }
}

module.exports = ImportOptimizer;