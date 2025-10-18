/**
 * Performance Budget Enforcement System
 * Monitors and enforces performance budgets for bundle sizes and metrics
 */

// =============================================================================
// PERFORMANCE BUDGET CONFIGURATION
// =============================================================================

export interface PerformanceBudget {
  // Bundle size budgets (in bytes)
  bundles: {
    main: number;
    vendor: number;
    admin: number;
    customer: number;
    total: number;
  };
  
  // Asset size budgets (in bytes)
  assets: {
    images: number;
    fonts: number;
    css: number;
    js: number;
  };
  
  // Performance metrics budgets (in milliseconds)
  metrics: {
    lcp: number;  // Largest Contentful Paint
    fid: number;  // First Input Delay
    cls: number;  // Cumulative Layout Shift (score)
    ttfb: number; // Time to First Byte
    fcp: number;  // First Contentful Paint
  };
  
  // Network budgets
  network: {
    maxRequests: number;
    maxTransferSize: number;
  };
}

// Default performance budgets based on requirements
export const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudget = {
  bundles: {
    main: 150 * 1024,      // 150KB gzipped for critical paths
    vendor: 200 * 1024,    // 200KB for vendor libraries
    admin: 300 * 1024,     // 300KB for admin dashboard
    customer: 250 * 1024,  // 250KB for customer dashboard
    total: 500 * 1024,     // 500KB total initial load
  },
  
  assets: {
    images: 1024 * 1024,   // 1MB for images
    fonts: 100 * 1024,     // 100KB for fonts
    css: 50 * 1024,        // 50KB for CSS
    js: 400 * 1024,        // 400KB for JavaScript
  },
  
  metrics: {
    lcp: 2500,  // 2.5 seconds
    fid: 100,   // 100ms
    cls: 0.1,   // 0.1 score
    ttfb: 800,  // 800ms
    fcp: 1800,  // 1.8 seconds
  },
  
  network: {
    maxRequests: 50,
    maxTransferSize: 1024 * 1024, // 1MB
  },
};

// =============================================================================
// BUDGET ENFORCEMENT CLASS
// =============================================================================

export class PerformanceBudgetEnforcer {
  private budget: PerformanceBudget;
  private violations: BudgetViolation[] = [];

  constructor(budget: PerformanceBudget = DEFAULT_PERFORMANCE_BUDGET) {
    this.budget = budget;
  }

  /**
   * Check bundle sizes against budget
   */
  checkBundleSizes(bundleStats: BundleStats): BudgetViolation[] {
    const violations: BudgetViolation[] = [];

    // Check individual bundle sizes
    Object.entries(this.budget.bundles).forEach(([bundleName, limit]) => {
      const actualSize = bundleStats[bundleName as keyof BundleStats];
      if (actualSize && actualSize > limit) {
        violations.push({
          type: 'bundle',
          name: bundleName,
          actual: actualSize,
          budget: limit,
          severity: this.calculateSeverity(actualSize, limit),
          message: `Bundle ${bundleName} exceeds budget: ${this.formatBytes(actualSize)} > ${this.formatBytes(limit)}`
        });
      }
    });

    return violations;
  }

  /**
   * Check performance metrics against budget
   */
  checkPerformanceMetrics(metrics: PerformanceMetrics): BudgetViolation[] {
    const violations: BudgetViolation[] = [];

    Object.entries(this.budget.metrics).forEach(([metricName, limit]) => {
      const actualValue = metrics[metricName as keyof PerformanceMetrics];
      if (actualValue && actualValue > limit) {
        violations.push({
          type: 'metric',
          name: metricName,
          actual: actualValue,
          budget: limit,
          severity: this.calculateSeverity(actualValue, limit),
          message: `Performance metric ${metricName} exceeds budget: ${actualValue}${this.getMetricUnit(metricName)} > ${limit}${this.getMetricUnit(metricName)}`
        });
      }
    });

    return violations;
  }

  /**
   * Check asset sizes against budget
   */
  checkAssetSizes(assetStats: AssetStats): BudgetViolation[] {
    const violations: BudgetViolation[] = [];

    Object.entries(this.budget.assets).forEach(([assetType, limit]) => {
      const actualSize = assetStats[assetType as keyof AssetStats];
      if (actualSize && actualSize > limit) {
        violations.push({
          type: 'asset',
          name: assetType,
          actual: actualSize,
          budget: limit,
          severity: this.calculateSeverity(actualSize, limit),
          message: `Asset type ${assetType} exceeds budget: ${this.formatBytes(actualSize)} > ${this.formatBytes(limit)}`
        });
      }
    });

    return violations;
  }

  /**
   * Generate comprehensive budget report
   */
  generateReport(stats: {
    bundles: BundleStats;
    metrics: PerformanceMetrics;
    assets: AssetStats;
  }): BudgetReport {
    const bundleViolations = this.checkBundleSizes(stats.bundles);
    const metricViolations = this.checkPerformanceMetrics(stats.metrics);
    const assetViolations = this.checkAssetSizes(stats.assets);

    const allViolations = [...bundleViolations, ...metricViolations, ...assetViolations];
    
    return {
      passed: allViolations.length === 0,
      violations: allViolations,
      summary: {
        total: allViolations.length,
        critical: allViolations.filter(v => v.severity === 'critical').length,
        warning: allViolations.filter(v => v.severity === 'warning').length,
        info: allViolations.filter(v => v.severity === 'info').length,
      },
      recommendations: this.generateRecommendations(allViolations),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate violation severity
   */
  private calculateSeverity(actual: number, budget: number): 'critical' | 'warning' | 'info' {
    const ratio = actual / budget;
    if (ratio > 1.5) return 'critical';
    if (ratio > 1.2) return 'warning';
    return 'info';
  }

  /**
   * Generate recommendations based on violations
   */
  private generateRecommendations(violations: BudgetViolation[]): string[] {
    const recommendations: string[] = [];

    violations.forEach(violation => {
      switch (violation.type) {
        case 'bundle':
          if (violation.name === 'vendor') {
            recommendations.push('Consider splitting vendor bundle or removing unused dependencies');
          } else if (violation.name === 'main') {
            recommendations.push('Implement code splitting for main bundle');
          }
          break;
        case 'metric':
          if (violation.name === 'lcp') {
            recommendations.push('Optimize images and critical rendering path for LCP');
          } else if (violation.name === 'fid') {
            recommendations.push('Reduce JavaScript execution time and optimize event handlers');
          }
          break;
        case 'asset':
          if (violation.name === 'images') {
            recommendations.push('Compress images and implement lazy loading');
          }
          break;
      }
    });

    return Array.from(new Set(recommendations)); // Remove duplicates
  }

  /**
   * Format bytes for display
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get metric unit
   */
  private getMetricUnit(metricName: string): string {
    if (metricName === 'cls') return '';
    return 'ms';
  }
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface BundleStats {
  main: number;
  vendor: number;
  admin: number;
  customer: number;
  total: number;
}

export interface PerformanceMetrics {
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
  fcp: number;
}

export interface AssetStats {
  images: number;
  fonts: number;
  css: number;
  js: number;
}

export interface BudgetViolation {
  type: 'bundle' | 'metric' | 'asset';
  name: string;
  actual: number;
  budget: number;
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

export interface BudgetReport {
  passed: boolean;
  violations: BudgetViolation[];
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
  };
  recommendations: string[];
  timestamp: string;
}

// =============================================================================
// CI/CD INTEGRATION
// =============================================================================

export class CIBudgetChecker {
  private enforcer: PerformanceBudgetEnforcer;

  constructor(budget?: PerformanceBudget) {
    this.enforcer = new PerformanceBudgetEnforcer(budget);
  }

  /**
   * Check budget and exit with appropriate code for CI
   */
  async checkAndExit(statsPath: string): Promise<void> {
    try {
      const stats = await this.loadStats(statsPath);
      const report = this.enforcer.generateReport(stats);

      // Output report
      console.log('\n📊 Performance Budget Report');
      console.log('================================');
      
      if (report.passed) {
        console.log('✅ All performance budgets passed!');
        process.exit(0);
      } else {
        console.log(`❌ ${report.summary.total} budget violations found:`);
        
        report.violations.forEach(violation => {
          const icon = violation.severity === 'critical' ? '🚨' : 
                      violation.severity === 'warning' ? '⚠️' : 'ℹ️';
          console.log(`${icon} ${violation.message}`);
        });

        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => {
          console.log(`   • ${rec}`);
        });

        // Exit with error code if critical violations
        const hasCritical = report.summary.critical > 0;
        process.exit(hasCritical ? 1 : 0);
      }
    } catch (error) {
      console.error('Failed to check performance budget:', error);
      process.exit(1);
    }
  }

  /**
   * Load stats from file
   */
  private async loadStats(statsPath: string): Promise<{
    bundles: BundleStats;
    metrics: PerformanceMetrics;
    assets: AssetStats;
  }> {
    // This would load actual stats from webpack-bundle-analyzer or similar
    // For now, return mock data
    return {
      bundles: {
        main: 120 * 1024,
        vendor: 180 * 1024,
        admin: 250 * 1024,
        customer: 200 * 1024,
        total: 450 * 1024,
      },
      metrics: {
        lcp: 2200,
        fid: 80,
        cls: 0.08,
        ttfb: 600,
        fcp: 1600,
      },
      assets: {
        images: 800 * 1024,
        fonts: 80 * 1024,
        css: 40 * 1024,
        js: 350 * 1024,
      },
    };
  }
}

// =============================================================================
// WEBPACK PLUGIN FOR BUDGET ENFORCEMENT
// =============================================================================

export class PerformanceBudgetPlugin {
  private budget: PerformanceBudget;

  constructor(budget: PerformanceBudget = DEFAULT_PERFORMANCE_BUDGET) {
    this.budget = budget;
  }

  apply(compiler: any) {
    compiler.hooks.afterEmit.tapAsync('PerformanceBudgetPlugin', (compilation: any, callback: any) => {
      const stats = this.extractStats(compilation);
      const enforcer = new PerformanceBudgetEnforcer(this.budget);
      const bundleViolations = enforcer.checkBundleSizes(stats.bundles);

      if (bundleViolations.length > 0) {
        const criticalViolations = bundleViolations.filter(v => v.severity === 'critical');
        
        bundleViolations.forEach(violation => {
          const level = violation.severity === 'critical' ? 'error' : 'warning';
          compilation[level + 's'].push(new Error(violation.message));
        });

        if (criticalViolations.length > 0) {
          callback(new Error(`Performance budget exceeded with ${criticalViolations.length} critical violations`));
          return;
        }
      }

      callback();
    });
  }

  private extractStats(compilation: any): { bundles: BundleStats } {
    const assets = compilation.assets;
    const chunks = compilation.chunks;

    // Extract bundle sizes from webpack compilation
    const bundleSizes: Partial<BundleStats> = {};
    
    chunks.forEach((chunk: any) => {
      const size = chunk.files.reduce((total: number, file: string) => {
        return total + (assets[file]?.size() || 0);
      }, 0);

      if (chunk.name?.includes('vendor')) {
        bundleSizes.vendor = size;
      } else if (chunk.name?.includes('admin')) {
        bundleSizes.admin = size;
      } else if (chunk.name?.includes('customer')) {
        bundleSizes.customer = size;
      } else if (chunk.name === 'main') {
        bundleSizes.main = size;
      }
    });

    bundleSizes.total = Object.values(bundleSizes).reduce((sum, size) => sum + (size || 0), 0);

    return {
      bundles: bundleSizes as BundleStats
    };
  }
}

// =============================================================================
// RUNTIME BUDGET MONITORING
// =============================================================================

export class RuntimeBudgetMonitor {
  private enforcer: PerformanceBudgetEnforcer;
  private isMonitoring = false;

  constructor(budget?: PerformanceBudget) {
    this.enforcer = new PerformanceBudgetEnforcer(budget);
  }

  /**
   * Start monitoring performance metrics
   */
  startMonitoring(): void {
    if (this.isMonitoring || typeof window === 'undefined') return;

    this.isMonitoring = true;

    // Monitor Core Web Vitals
    this.monitorWebVitals();

    // Monitor bundle loading
    this.monitorBundleLoading();

    // Check periodically
    setInterval(() => {
      this.checkCurrentMetrics();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
  }

  private monitorWebVitals(): void {
    // This would integrate with web-vitals library
    // For now, simulate monitoring
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const value = (entry as any).value || entry.duration;
          this.reportMetric(entry.name, value);
        }
      });

      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
    }
  }

  private monitorBundleLoading(): void {
    // Monitor resource loading
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;
          if (entry.name.includes('.js') && resourceEntry.transferSize) {
            this.reportBundleSize(entry.name, resourceEntry.transferSize);
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  private checkCurrentMetrics(): void {
    // Get current performance metrics and check against budget
    const metrics = this.getCurrentMetrics();
    const violations = this.enforcer.checkPerformanceMetrics(metrics);

    if (violations.length > 0) {
      this.reportViolations(violations);
    }
  }

  private getCurrentMetrics(): PerformanceMetrics {
    // This would collect actual metrics from the browser
    return {
      lcp: 0,
      fid: 0,
      cls: 0,
      ttfb: 0,
      fcp: 0,
    };
  }

  private reportMetric(name: string, value: number): void {
    console.log(`Performance metric: ${name} = ${value}`);
  }

  private reportBundleSize(name: string, size: number): void {
    console.log(`Bundle loaded: ${name} = ${size} bytes`);
  }

  private reportViolations(violations: BudgetViolation[]): void {
    console.warn('Performance budget violations detected:', violations);
    
    // Report to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      violations.forEach(violation => {
        (window as any).gtag('event', 'performance_budget_violation', {
          violation_type: violation.type,
          violation_name: violation.name,
          severity: violation.severity,
          actual_value: violation.actual,
          budget_value: violation.budget
        });
      });
    }
  }
}