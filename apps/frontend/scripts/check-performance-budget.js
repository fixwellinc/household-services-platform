#!/usr/bin/env node

/**
 * Performance Budget Checker
 * Validates bundle sizes against performance budgets
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PerformanceBudgetChecker {
  constructor() {
    this.buildDir = path.join(__dirname, '..', '.next');
    this.budgets = {
      // Performance budgets in KB
      maxBundleSize: 500, // Total bundle size
      maxChunkSize: 150,  // Individual chunk size
      maxCSSSize: 50,     // CSS bundle size
      maxImageSize: 100,  // Image assets size
      
      // Core Web Vitals budgets
      maxLCP: 2500,       // Largest Contentful Paint (ms)
      maxFID: 100,        // First Input Delay (ms)
      maxCLS: 0.1,        // Cumulative Layout Shift
      maxTTFB: 600,       // Time to First Byte (ms)
    };
    
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
    };
  }

  /**
   * Check all performance budgets
   */
  async checkBudgets() {
    console.log('🎯 Checking Performance Budgets...\n');
    
    try {
      await this.checkBundleSizes();
      await this.checkAssetSizes();
      await this.generateReport();
    } catch (error) {
      console.error('❌ Error checking budgets:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check JavaScript and CSS bundle sizes
   */
  async checkBundleSizes() {
    const buildManifest = this.getBuildManifest();
    
    if (!buildManifest) {
      this.results.warnings.push('Build manifest not found. Run `npm run build` first.');
      return;
    }

    // Check JavaScript bundles
    const jsFiles = this.getJavaScriptFiles();
    const totalJSSize = this.calculateTotalSize(jsFiles);
    
    console.log('📊 JavaScript Bundle Analysis:');
    jsFiles.forEach(file => {
      const sizeKB = (file.size / 1024).toFixed(2);
      console.log(`  ${file.name}: ${sizeKB} KB`);
      
      // Check individual chunk size
      if (file.size / 1024 > this.budgets.maxChunkSize) {
        this.results.failed.push({
          type: 'chunk-size',
          file: file.name,
          actual: `${sizeKB} KB`,
          budget: `${this.budgets.maxChunkSize} KB`,
          message: `Chunk exceeds size budget`,
        });
      } else {
        this.results.passed.push({
          type: 'chunk-size',
          file: file.name,
          actual: `${sizeKB} KB`,
          budget: `${this.budgets.maxChunkSize} KB`,
        });
      }
    });

    // Check total bundle size
    const totalJSSizeKB = totalJSSize / 1024;
    console.log(`\nTotal JavaScript: ${totalJSSizeKB.toFixed(2)} KB`);
    
    if (totalJSSizeKB > this.budgets.maxBundleSize) {
      this.results.failed.push({
        type: 'total-bundle-size',
        actual: `${totalJSSizeKB.toFixed(2)} KB`,
        budget: `${this.budgets.maxBundleSize} KB`,
        message: 'Total bundle size exceeds budget',
      });
    } else {
      this.results.passed.push({
        type: 'total-bundle-size',
        actual: `${totalJSSizeKB.toFixed(2)} KB`,
        budget: `${this.budgets.maxBundleSize} KB`,
      });
    }

    // Check CSS bundles
    const cssFiles = this.getCSSFiles();
    const totalCSSSize = this.calculateTotalSize(cssFiles);
    const totalCSSSizeKB = totalCSSSize / 1024;
    
    console.log(`\n🎨 CSS Bundle Analysis:`);
    console.log(`Total CSS: ${totalCSSSizeKB.toFixed(2)} KB`);
    
    if (totalCSSSizeKB > this.budgets.maxCSSSize) {
      this.results.failed.push({
        type: 'css-size',
        actual: `${totalCSSSizeKB.toFixed(2)} KB`,
        budget: `${this.budgets.maxCSSSize} KB`,
        message: 'CSS bundle size exceeds budget',
      });
    } else {
      this.results.passed.push({
        type: 'css-size',
        actual: `${totalCSSSizeKB.toFixed(2)} KB`,
        budget: `${this.budgets.maxCSSSize} KB`,
      });
    }
  }

  /**
   * Check asset sizes (images, fonts, etc.)
   */
  async checkAssetSizes() {
    const staticDir = path.join(this.buildDir, 'static');
    
    if (!fs.existsSync(staticDir)) {
      this.results.warnings.push('Static assets directory not found.');
      return;
    }

    const assetFiles = this.getAssetFiles(staticDir);
    const totalAssetSize = this.calculateTotalSize(assetFiles);
    const totalAssetSizeKB = totalAssetSize / 1024;
    
    console.log(`\n🖼️  Asset Analysis:`);
    console.log(`Total Assets: ${totalAssetSizeKB.toFixed(2)} KB`);
    
    // Check individual large assets
    assetFiles.forEach(file => {
      const sizeKB = file.size / 1024;
      if (sizeKB > 50) { // Flag assets larger than 50KB
        this.results.warnings.push({
          type: 'large-asset',
          file: file.name,
          size: `${sizeKB.toFixed(2)} KB`,
          message: 'Large asset detected - consider optimization',
        });
      }
    });

    if (totalAssetSizeKB > this.budgets.maxImageSize) {
      this.results.failed.push({
        type: 'asset-size',
        actual: `${totalAssetSizeKB.toFixed(2)} KB`,
        budget: `${this.budgets.maxImageSize} KB`,
        message: 'Total asset size exceeds budget',
      });
    } else {
      this.results.passed.push({
        type: 'asset-size',
        actual: `${totalAssetSizeKB.toFixed(2)} KB`,
        budget: `${this.budgets.maxImageSize} KB`,
      });
    }
  }

  /**
   * Get build manifest
   */
  getBuildManifest() {
    const manifestPath = path.join(this.buildDir, 'build-manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
      return null;
    }
    
    try {
      return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (error) {
      console.warn('Failed to parse build manifest:', error.message);
      return null;
    }
  }

  /**
   * Get JavaScript files from build
   */
  getJavaScriptFiles() {
    const staticJsDir = path.join(this.buildDir, 'static', 'js');
    
    if (!fs.existsSync(staticJsDir)) {
      return [];
    }
    
    return fs.readdirSync(staticJsDir)
      .filter(file => file.endsWith('.js'))
      .map(file => {
        const filePath = path.join(staticJsDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
        };
      });
  }

  /**
   * Get CSS files from build
   */
  getCSSFiles() {
    const staticCssDir = path.join(this.buildDir, 'static', 'css');
    
    if (!fs.existsSync(staticCssDir)) {
      return [];
    }
    
    return fs.readdirSync(staticCssDir)
      .filter(file => file.endsWith('.css'))
      .map(file => {
        const filePath = path.join(staticCssDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
        };
      });
  }

  /**
   * Get asset files recursively
   */
  getAssetFiles(dir) {
    const files = [];
    
    const scanDirectory = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          scanDirectory(fullPath);
        } else {
          files.push({
            name: path.relative(dir, fullPath),
            path: fullPath,
            size: stats.size,
          });
        }
      }
    };
    
    scanDirectory(dir);
    return files;
  }

  /**
   * Calculate total size of files
   */
  calculateTotalSize(files) {
    return files.reduce((total, file) => total + file.size, 0);
  }

  /**
   * Generate performance budget report
   */
  async generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 Performance Budget Report');
    console.log('='.repeat(60));
    
    // Summary
    const totalChecks = this.results.passed.length + this.results.failed.length;
    const passRate = totalChecks > 0 ? (this.results.passed.length / totalChecks * 100).toFixed(1) : 0;
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total Checks: ${totalChecks}`);
    console.log(`   Passed: ${this.results.passed.length} (${passRate}%)`);
    console.log(`   Failed: ${this.results.failed.length}`);
    console.log(`   Warnings: ${this.results.warnings.length}`);
    
    // Failed checks
    if (this.results.failed.length > 0) {
      console.log(`\n❌ Failed Checks:`);
      this.results.failed.forEach((failure, index) => {
        console.log(`\n${index + 1}. ${failure.type.toUpperCase()}`);
        if (failure.file) console.log(`   File: ${failure.file}`);
        console.log(`   Actual: ${failure.actual}`);
        console.log(`   Budget: ${failure.budget}`);
        console.log(`   Message: ${failure.message}`);
      });
    }
    
    // Warnings
    if (this.results.warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`);
      this.results.warnings.forEach((warning, index) => {
        console.log(`\n${index + 1}. ${warning.type ? warning.type.toUpperCase() : 'WARNING'}`);
        if (warning.file) console.log(`   File: ${warning.file}`);
        if (warning.size) console.log(`   Size: ${warning.size}`);
        console.log(`   Message: ${warning.message || warning}`);
      });
    }
    
    // Recommendations
    console.log(`\n💡 Recommendations:`);
    
    if (this.results.failed.some(f => f.type === 'total-bundle-size')) {
      console.log(`   • Enable code splitting for large routes`);
      console.log(`   • Implement lazy loading for heavy components`);
      console.log(`   • Use dynamic imports for non-critical features`);
    }
    
    if (this.results.failed.some(f => f.type === 'chunk-size')) {
      console.log(`   • Split large chunks into smaller pieces`);
      console.log(`   • Move vendor libraries to separate chunks`);
      console.log(`   • Consider tree shaking optimizations`);
    }
    
    if (this.results.warnings.some(w => w.type === 'large-asset')) {
      console.log(`   • Optimize large images with next/image`);
      console.log(`   • Use WebP format for better compression`);
      console.log(`   • Implement progressive image loading`);
    }
    
    console.log(`   • Run 'npm run build:analyze' for detailed bundle analysis`);
    console.log(`   • Use 'npm run optimize-imports' to optimize imports`);
    
    console.log('\n' + '='.repeat(60));
    
    // Exit with error code if any checks failed
    if (this.results.failed.length > 0) {
      console.log('❌ Performance budget checks failed!');
      process.exit(1);
    } else {
      console.log('✅ All performance budget checks passed!');
    }
  }

  /**
   * Save detailed report to file
   */
  saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      budgets: this.budgets,
      results: this.results,
      summary: {
        totalChecks: this.results.passed.length + this.results.failed.length,
        passed: this.results.passed.length,
        failed: this.results.failed.length,
        warnings: this.results.warnings.length,
      },
    };
    
    const reportPath = path.join(__dirname, '..', 'performance-budget-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);
  }
}

// CLI interface
if (require.main === module) {
  const checker = new PerformanceBudgetChecker();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'check':
    case undefined:
      checker.checkBudgets();
      break;
    case 'report':
      checker.checkBudgets().then(() => checker.saveDetailedReport());
      break;
    default:
      console.log('Usage: node check-performance-budget.js [check|report]');
      console.log('  check  - Check performance budgets (default)');
      console.log('  report - Check budgets and save detailed report');
  }
}

module.exports = PerformanceBudgetChecker;