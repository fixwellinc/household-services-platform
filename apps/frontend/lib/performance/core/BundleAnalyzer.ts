/**
 * BundleAnalyzer - Bundle size monitoring and analysis system
 * 
 * Provides comprehensive tracking of bundle sizes, chunk analysis,
 * and performance budget enforcement for optimal loading performance.
 */

export interface ChunkMetrics {
  name: string;
  size: number;
  gzippedSize?: number;
  loadTime: number;
  cached: boolean;
  timestamp: number;
  route?: string;
}

export interface BundleReport {
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkMetrics[];
  loadTime: number;
  cacheHitRate: number;
  timestamp: number;
  route: string;
  performanceBudget: {
    limit: number;
    current: number;
    status: 'within-budget' | 'approaching-limit' | 'over-budget';
  };
}

export interface BudgetReport {
  route: string;
  budgetLimit: number;
  currentSize: number;
  status: 'within-budget' | 'approaching-limit' | 'over-budget';
  recommendations: string[];
  timestamp: number;
}

export interface BundleConfig {
  performanceBudgets: Record<string, number>; // route -> max size in KB
  warningThreshold: number; // percentage of budget (e.g., 0.8 for 80%)
  trackingEnabled: boolean;
  reportInterval: number; // milliseconds
  onBudgetExceeded?: (report: BudgetReport) => void;
  onChunkLoaded?: (chunk: ChunkMetrics) => void;
}

export class BundleAnalyzer {
  private config: Required<BundleConfig>;
  private chunks: Map<string, ChunkMetrics> = new Map();
  private loadTimes: Map<string, number> = new Map();
  private observer?: PerformanceObserver;
  private isInitialized = false;

  constructor(config: Partial<BundleConfig> = {}) {
    this.config = {
      performanceBudgets: {
        '/': 150, // 150KB for homepage
        '/dashboard': 200, // 200KB for dashboard
        '/admin': 250, // 250KB for admin
        default: 180, // Default budget for other routes
      },
      warningThreshold: 0.8,
      trackingEnabled: true,
      reportInterval: 30000, // 30 seconds
      onBudgetExceeded: () => {},
      onChunkLoaded: () => {},
      ...config,
    };
  }

  /**
   * Initialize bundle analysis
   */
  public init(): void {
    if (typeof window === 'undefined' || this.isInitialized) return;

    try {
      this.setupResourceObserver();
      this.trackInitialBundles();
      this.setupPeriodicReporting();
      
      this.isInitialized = true;
      console.log('BundleAnalyzer initialized');
    } catch (error) {
      console.error('Failed to initialize BundleAnalyzer:', error);
    }
  }

  /**
   * Analyze current bundle size and generate report
   */
  public analyzeBundleSize(): BundleReport {
    const currentRoute = this.getCurrentRoute();
    const chunks = Array.from(this.chunks.values());
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const gzippedSize = chunks.reduce((sum, chunk) => sum + (chunk.gzippedSize || chunk.size * 0.3), 0);
    const totalLoadTime = chunks.reduce((sum, chunk) => sum + chunk.loadTime, 0);
    const cachedChunks = chunks.filter(chunk => chunk.cached).length;
    const cacheHitRate = chunks.length > 0 ? cachedChunks / chunks.length : 0;

    const budgetLimit = this.getBudgetForRoute(currentRoute);
    const budgetStatus = this.getBudgetStatus(totalSize / 1024, budgetLimit); // Convert to KB

    const report: BundleReport = {
      totalSize,
      gzippedSize,
      chunks,
      loadTime: totalLoadTime,
      cacheHitRate,
      timestamp: Date.now(),
      route: currentRoute,
      performanceBudget: {
        limit: budgetLimit,
        current: Math.round(totalSize / 1024), // KB
        status: budgetStatus,
      },
    };

    // Check if budget is exceeded
    if (budgetStatus !== 'within-budget') {
      this.handleBudgetIssue(report);
    }

    return report;
  }

  /**
   * Track chunk loading metrics
   */
  public trackChunkLoading(): ChunkMetrics {
    const chunks = Array.from(this.chunks.values());
    const latestChunk = chunks[chunks.length - 1];
    
    if (latestChunk) {
      this.config.onChunkLoaded(latestChunk);
      return latestChunk;
    }

    // Return empty metrics if no chunks found
    return {
      name: 'unknown',
      size: 0,
      loadTime: 0,
      cached: false,
      timestamp: Date.now(),
    };
  }

  /**
   * Enforce performance budget for current route
   */
  public enforcePerformanceBudget(): BudgetReport {
    const currentRoute = this.getCurrentRoute();
    const budgetLimit = this.getBudgetForRoute(currentRoute);
    const currentSize = this.getCurrentBundleSize();
    const status = this.getBudgetStatus(currentSize, budgetLimit);
    
    const recommendations = this.generateRecommendations(status, currentSize, budgetLimit);

    const report: BudgetReport = {
      route: currentRoute,
      budgetLimit,
      currentSize,
      status,
      recommendations,
      timestamp: Date.now(),
    };

    if (status !== 'within-budget') {
      this.config.onBudgetExceeded(report);
    }

    return report;
  }

  /**
   * Get current bundle size in KB
   */
  public getCurrentBundleSize(): number {
    const chunks = Array.from(this.chunks.values());
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    return Math.round(totalSize / 1024); // Convert to KB
  }

  /**
   * Get chunk metrics by name
   */
  public getChunkMetrics(chunkName: string): ChunkMetrics | undefined {
    return this.chunks.get(chunkName);
  }

  /**
   * Get all tracked chunks
   */
  public getAllChunks(): ChunkMetrics[] {
    return Array.from(this.chunks.values());
  }

  /**
   * Setup resource observer for tracking bundle loads
   */
  private setupResourceObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    this.observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];
      
      entries.forEach((entry) => {
        if (this.isJavaScriptResource(entry.name)) {
          const chunkMetrics = this.createChunkMetrics(entry);
          this.chunks.set(chunkMetrics.name, chunkMetrics);
          this.config.onChunkLoaded(chunkMetrics);
        }
      });
    });

    try {
      this.observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Resource observation failed:', error);
    }
  }

  /**
   * Track initial bundles that were already loaded
   */
  private trackInitialBundles(): void {
    if (typeof window === 'undefined' || !window.performance) return;

    const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    resources.forEach((resource) => {
      if (this.isJavaScriptResource(resource.name)) {
        const chunkMetrics = this.createChunkMetrics(resource);
        this.chunks.set(chunkMetrics.name, chunkMetrics);
      }
    });
  }

  /**
   * Create chunk metrics from performance entry
   */
  private createChunkMetrics(entry: PerformanceResourceTiming): ChunkMetrics {
    const name = this.extractChunkName(entry.name);
    const size = entry.transferSize || entry.encodedBodySize || 0;
    const loadTime = entry.responseEnd - entry.startTime;
    const cached = entry.transferSize === 0 && entry.decodedBodySize > 0;

    return {
      name,
      size,
      gzippedSize: entry.encodedBodySize,
      loadTime,
      cached,
      timestamp: Date.now(),
      route: this.getCurrentRoute(),
    };
  }

  /**
   * Check if resource is a JavaScript bundle
   */
  private isJavaScriptResource(url: string): boolean {
    return url.includes('.js') && 
           (url.includes('/_next/') || url.includes('/static/') || url.includes('/chunks/'));
  }

  /**
   * Extract chunk name from URL
   */
  private extractChunkName(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('?')[0]; // Remove query parameters
  }

  /**
   * Get current route
   */
  private getCurrentRoute(): string {
    if (typeof window === 'undefined') return '/';
    return window.location.pathname;
  }

  /**
   * Get budget limit for route
   */
  private getBudgetForRoute(route: string): number {
    return this.config.performanceBudgets[route] || this.config.performanceBudgets.default;
  }

  /**
   * Get budget status
   */
  private getBudgetStatus(currentSize: number, budgetLimit: number): 'within-budget' | 'approaching-limit' | 'over-budget' {
    if (currentSize > budgetLimit) return 'over-budget';
    if (currentSize > budgetLimit * this.config.warningThreshold) return 'approaching-limit';
    return 'within-budget';
  }

  /**
   * Generate recommendations based on budget status
   */
  private generateRecommendations(
    status: 'within-budget' | 'approaching-limit' | 'over-budget',
    currentSize: number,
    budgetLimit: number
  ): string[] {
    const recommendations: string[] = [];

    if (status === 'over-budget') {
      recommendations.push(`Bundle size (${currentSize}KB) exceeds budget (${budgetLimit}KB)`);
      recommendations.push('Consider implementing code splitting for large components');
      recommendations.push('Review and remove unused dependencies');
      recommendations.push('Enable tree shaking for better dead code elimination');
    } else if (status === 'approaching-limit') {
      recommendations.push(`Bundle size (${currentSize}KB) is approaching budget limit (${budgetLimit}KB)`);
      recommendations.push('Monitor bundle growth and consider optimization strategies');
      recommendations.push('Implement lazy loading for non-critical components');
    } else {
      recommendations.push(`Bundle size (${currentSize}KB) is within budget (${budgetLimit}KB)`);
    }

    // Add general recommendations based on chunk analysis
    const largeChunks = Array.from(this.chunks.values()).filter(chunk => chunk.size > 50000); // 50KB
    if (largeChunks.length > 0) {
      recommendations.push(`Found ${largeChunks.length} large chunks that could benefit from splitting`);
    }

    const uncachedChunks = Array.from(this.chunks.values()).filter(chunk => !chunk.cached);
    if (uncachedChunks.length > 0) {
      recommendations.push(`${uncachedChunks.length} chunks are not cached - consider cache optimization`);
    }

    return recommendations;
  }

  /**
   * Handle budget issues
   */
  private handleBudgetIssue(report: BundleReport): void {
    const budgetReport: BudgetReport = {
      route: report.route,
      budgetLimit: report.performanceBudget.limit,
      currentSize: report.performanceBudget.current,
      status: report.performanceBudget.status,
      recommendations: this.generateRecommendations(
        report.performanceBudget.status,
        report.performanceBudget.current,
        report.performanceBudget.limit
      ),
      timestamp: report.timestamp,
    };

    this.config.onBudgetExceeded(budgetReport);
  }

  /**
   * Setup periodic reporting
   */
  private setupPeriodicReporting(): void {
    setInterval(() => {
      if (this.config.trackingEnabled) {
        this.analyzeBundleSize();
        this.enforcePerformanceBudget();
      }
    }, this.config.reportInterval);
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<BundleConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
    this.chunks.clear();
    this.loadTimes.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const bundleAnalyzer = new BundleAnalyzer({
  trackingEnabled: process.env.NODE_ENV === 'development',
  onBudgetExceeded: (report) => {
    console.warn('Performance budget exceeded:', report);
  },
  onChunkLoaded: (chunk) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Chunk loaded:', chunk.name, `${Math.round(chunk.size / 1024)}KB`);
    }
  },
});

export default BundleAnalyzer;