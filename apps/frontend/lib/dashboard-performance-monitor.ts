'use client';

/**
 * Dashboard Performance Monitor
 * 
 * Provides performance monitoring specifically for dashboard routing and subscription data loading.
 * Tracks key metrics and provides optimization insights.
 */

export interface PerformanceMetrics {
  routingTime: number;
  subscriptionLoadTime: number;
  totalDashboardLoadTime: number;
  cacheHitRate: number;
  errorRate: number;
  retryCount: number;
}

export interface PerformanceThresholds {
  routingTime: number;        // Max acceptable routing time (ms)
  subscriptionLoad: number;   // Max acceptable subscription load time (ms)
  totalLoad: number;         // Max acceptable total load time (ms)
  cacheHitRate: number;      // Min acceptable cache hit rate (%)
  errorRate: number;         // Max acceptable error rate (%)
}

class DashboardPerformanceMonitor {
  private metrics: Map<string, number> = new Map();
  private timers: Map<string, number> = new Map();
  private counters: Map<string, number> = new Map();
  
  // Performance thresholds
  private thresholds: PerformanceThresholds = {
    routingTime: 500,        // 500ms max for routing
    subscriptionLoad: 2000,  // 2s max for subscription data
    totalLoad: 3000,         // 3s max for complete dashboard load
    cacheHitRate: 80,        // 80% cache hit rate minimum
    errorRate: 5,            // 5% error rate maximum
  };

  /**
   * Start timing a performance metric
   */
  startTiming(metricName: string): void {
    this.timers.set(metricName, performance.now());
  }

  /**
   * End timing and record the metric
   */
  endTiming(metricName: string): number {
    const startTime = this.timers.get(metricName);
    if (!startTime) {
      console.warn(`No start time found for metric: ${metricName}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.set(metricName, duration);
    this.timers.delete(metricName);

    // Log performance warnings
    this.checkPerformanceThreshold(metricName, duration);

    return duration;
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(counterName: string): void {
    const current = this.counters.get(counterName) || 0;
    this.counters.set(counterName, current + 1);
  }

  /**
   * Record a custom metric value
   */
  recordMetric(metricName: string, value: number): void {
    this.metrics.set(metricName, value);
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      routingTime: this.metrics.get('dashboard-routing') || 0,
      subscriptionLoadTime: this.metrics.get('subscription-load') || 0,
      totalDashboardLoadTime: this.metrics.get('total-dashboard-load') || 0,
      cacheHitRate: this.calculateCacheHitRate(),
      errorRate: this.calculateErrorRate(),
      retryCount: this.counters.get('retry-attempts') || 0,
    };
  }

  /**
   * Check if a metric exceeds performance thresholds
   */
  private checkPerformanceThreshold(metricName: string, value: number): void {
    let threshold: number | undefined;
    let metricType: string;

    switch (metricName) {
      case 'dashboard-routing':
        threshold = this.thresholds.routingTime;
        metricType = 'routing';
        break;
      case 'subscription-load':
        threshold = this.thresholds.subscriptionLoad;
        metricType = 'subscription loading';
        break;
      case 'total-dashboard-load':
        threshold = this.thresholds.totalLoad;
        metricType = 'total dashboard loading';
        break;
    }

    if (threshold && value > threshold) {
      console.warn(`Performance threshold exceeded for ${metricType}: ${value}ms (threshold: ${threshold}ms)`);
      
      // Record performance issue
      this.incrementCounter('performance-warnings');
      
      // Suggest optimizations
      this.suggestOptimizations(metricName, value);
    }
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(): number {
    const hits = this.counters.get('cache-hits') || 0;
    const misses = this.counters.get('cache-misses') || 0;
    const total = hits + misses;
    
    return total > 0 ? (hits / total) * 100 : 0;
  }

  /**
   * Calculate error rate
   */
  private calculateErrorRate(): number {
    const errors = this.counters.get('errors') || 0;
    const total = this.counters.get('total-requests') || 0;
    
    return total > 0 ? (errors / total) * 100 : 0;
  }

  /**
   * Suggest performance optimizations based on metrics
   */
  private suggestOptimizations(metricName: string, value: number): void {
    const suggestions: string[] = [];

    switch (metricName) {
      case 'dashboard-routing':
        if (value > this.thresholds.routingTime) {
          suggestions.push('Consider preloading subscription data');
          suggestions.push('Implement route-level code splitting');
          suggestions.push('Cache routing decisions');
        }
        break;
      case 'subscription-load':
        if (value > this.thresholds.subscriptionLoad) {
          suggestions.push('Implement subscription data caching');
          suggestions.push('Use optimistic updates for subscription changes');
          suggestions.push('Consider background data refresh');
        }
        break;
      case 'total-dashboard-load':
        if (value > this.thresholds.totalLoad) {
          suggestions.push('Implement progressive loading');
          suggestions.push('Use skeleton screens during loading');
          suggestions.push('Optimize component bundle sizes');
        }
        break;
    }

    if (suggestions.length > 0) {
      console.group(`Performance Optimization Suggestions for ${metricName}:`);
      suggestions.forEach(suggestion => console.log(`• ${suggestion}`));
      console.groupEnd();
    }
  }

  /**
   * Record cache hit
   */
  recordCacheHit(): void {
    this.incrementCounter('cache-hits');
    this.incrementCounter('total-requests');
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(): void {
    this.incrementCounter('cache-misses');
    this.incrementCounter('total-requests');
  }

  /**
   * Record error
   */
  recordError(): void {
    this.incrementCounter('errors');
    this.incrementCounter('total-requests');
  }

  /**
   * Record retry attempt
   */
  recordRetry(): void {
    this.incrementCounter('retry-attempts');
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    metrics: PerformanceMetrics;
    status: 'good' | 'warning' | 'critical';
    recommendations: string[];
  } {
    const metrics = this.getMetrics();
    const recommendations: string[] = [];
    let status: 'good' | 'warning' | 'critical' = 'good';

    // Check routing performance
    if (metrics.routingTime > this.thresholds.routingTime) {
      status = metrics.routingTime > this.thresholds.routingTime * 2 ? 'critical' : 'warning';
      recommendations.push('Optimize dashboard routing performance');
    }

    // Check subscription loading performance
    if (metrics.subscriptionLoadTime > this.thresholds.subscriptionLoad) {
      status = metrics.subscriptionLoadTime > this.thresholds.subscriptionLoad * 2 ? 'critical' : 'warning';
      recommendations.push('Improve subscription data loading speed');
    }

    // Check cache performance
    if (metrics.cacheHitRate < this.thresholds.cacheHitRate) {
      status = metrics.cacheHitRate < this.thresholds.cacheHitRate / 2 ? 'critical' : 'warning';
      recommendations.push('Improve caching strategy');
    }

    // Check error rate
    if (metrics.errorRate > this.thresholds.errorRate) {
      status = metrics.errorRate > this.thresholds.errorRate * 2 ? 'critical' : 'warning';
      recommendations.push('Reduce error rate and improve reliability');
    }

    return {
      metrics,
      status,
      recommendations,
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.timers.clear();
    this.counters.clear();
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    const summary = this.getPerformanceSummary();
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      ...summary,
      rawMetrics: Object.fromEntries(this.metrics),
      counters: Object.fromEntries(this.counters),
    }, null, 2);
  }
}

// Singleton instance
export const dashboardPerformanceMonitor = new DashboardPerformanceMonitor();

/**
 * Hook for using dashboard performance monitoring
 */
export function useDashboardPerformanceMonitor() {
  return {
    startTiming: (metric: string) => dashboardPerformanceMonitor.startTiming(metric),
    endTiming: (metric: string) => dashboardPerformanceMonitor.endTiming(metric),
    recordCacheHit: () => dashboardPerformanceMonitor.recordCacheHit(),
    recordCacheMiss: () => dashboardPerformanceMonitor.recordCacheMiss(),
    recordError: () => dashboardPerformanceMonitor.recordError(),
    recordRetry: () => dashboardPerformanceMonitor.recordRetry(),
    getMetrics: () => dashboardPerformanceMonitor.getMetrics(),
    getPerformanceSummary: () => dashboardPerformanceMonitor.getPerformanceSummary(),
    exportMetrics: () => dashboardPerformanceMonitor.exportMetrics(),
  };
}