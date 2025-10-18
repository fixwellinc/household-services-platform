/**
 * PerformanceReporter - Automated performance reporting and trends tracking
 * 
 * Collects, stores, and analyzes performance metrics over time to identify
 * trends, regressions, and optimization opportunities.
 */

import { WebVitalMetric, PerformanceReport } from '../core/WebVitalsCollector';
import { BundleReport, BudgetReport } from '../core/BundleAnalyzer';
import { RenderMetrics } from '../hooks/useRenderTracking';

export interface PerformanceSnapshot {
  id: string;
  timestamp: number;
  sessionId: string;
  route: string;
  userAgent: string;
  viewport: { width: number; height: number };
  connectionType?: string;
  webVitals: Record<string, WebVitalMetric>;
  bundleMetrics?: {
    totalSize: number;
    gzippedSize: number;
    loadTime: number;
    cacheHitRate: number;
    budgetStatus: string;
  };
  componentMetrics: Record<string, RenderMetrics>;
  performanceScore: number;
  performanceGrade: string;
  issues: Array<{
    type: string;
    severity: string;
    message: string;
    value: number;
    threshold: number;
  }>;
}

export interface PerformanceTrend {
  metric: string;
  route: string;
  timeframe: 'hour' | 'day' | 'week' | 'month';
  dataPoints: Array<{
    timestamp: number;
    value: number;
    sessionCount: number;
  }>;
  trend: 'improving' | 'stable' | 'degrading';
  changePercent: number;
  significance: 'low' | 'medium' | 'high';
}

export interface PerformanceAlert {
  id: string;
  timestamp: number;
  type: 'regression' | 'budget_exceeded' | 'threshold_breach';
  severity: 'warning' | 'critical';
  metric: string;
  route: string;
  currentValue: number;
  previousValue?: number;
  threshold: number;
  message: string;
  recommendations: string[];
  acknowledged: boolean;
}

export interface ReportingConfig {
  enableStorage: boolean;
  enableTrendAnalysis: boolean;
  enableAlerts: boolean;
  storageKey: string;
  maxSnapshots: number;
  trendAnalysisWindow: number; // days
  reportingInterval: number; // milliseconds
  alertThresholds: {
    regressionPercent: number;
    significanceThreshold: number;
  };
  onSnapshot?: (snapshot: PerformanceSnapshot) => void;
  onTrendUpdate?: (trends: PerformanceTrend[]) => void;
  onAlert?: (alert: PerformanceAlert) => void;
}

export class PerformanceReporter {
  private config: Required<ReportingConfig>;
  private snapshots: PerformanceSnapshot[] = [];
  private trends: Map<string, PerformanceTrend> = new Map();
  private alerts: PerformanceAlert[] = [];
  private reportingInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor(config?: Partial<ReportingConfig>) {
    this.config = {
      enableStorage: true,
      enableTrendAnalysis: true,
      enableAlerts: true,
      storageKey: 'performance_snapshots',
      maxSnapshots: 1000,
      trendAnalysisWindow: 7, // 7 days
      reportingInterval: 60000, // 1 minute
      alertThresholds: {
        regressionPercent: 20, // 20% regression triggers alert
        significanceThreshold: 0.05, // 5% significance level
      },
      onSnapshot: () => {},
      onTrendUpdate: () => {},
      onAlert: () => {},
      ...config,
    };
  }

  /**
   * Initialize the performance reporter
   */
  public init(): void {
    if (this.isInitialized) return;

    try {
      // Load existing snapshots from storage
      if (this.config.enableStorage) {
        this.loadSnapshots();
      }

      // Start automated reporting
      this.startAutomatedReporting();

      // Initialize trend analysis
      if (this.config.enableTrendAnalysis) {
        this.analyzeTrends();
      }

      this.isInitialized = true;
      console.log('PerformanceReporter initialized');
    } catch (error) {
      console.error('Failed to initialize PerformanceReporter:', error);
    }
  }

  /**
   * Record a performance snapshot
   */
  public recordSnapshot(
    webVitals: Map<string, WebVitalMetric>,
    bundleReport?: BundleReport,
    componentMetrics?: Map<string, RenderMetrics>,
    performanceScore?: number,
    performanceGrade?: string
  ): PerformanceSnapshot {
    const snapshot: PerformanceSnapshot = {
      id: this.generateId(),
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      route: this.getCurrentRoute(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      viewport: this.getViewport(),
      connectionType: this.getConnectionType(),
      webVitals: this.mapToObject(webVitals),
      bundleMetrics: bundleReport ? {
        totalSize: bundleReport.totalSize,
        gzippedSize: bundleReport.gzippedSize,
        loadTime: bundleReport.loadTime,
        cacheHitRate: bundleReport.cacheHitRate,
        budgetStatus: bundleReport.performanceBudget.status,
      } : undefined,
      componentMetrics: componentMetrics ? this.mapToObject(componentMetrics) : {},
      performanceScore: performanceScore || 0,
      performanceGrade: performanceGrade || 'F',
      issues: this.detectIssues(webVitals, bundleReport, componentMetrics),
    };

    // Add to snapshots
    this.snapshots.push(snapshot);

    // Trim snapshots if needed
    if (this.snapshots.length > this.config.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.config.maxSnapshots);
    }

    // Save to storage
    if (this.config.enableStorage) {
      this.saveSnapshots();
    }

    // Trigger callback
    this.config.onSnapshot(snapshot);

    // Update trends
    if (this.config.enableTrendAnalysis) {
      this.updateTrends(snapshot);
    }

    // Check for alerts
    if (this.config.enableAlerts) {
      this.checkForAlerts(snapshot);
    }

    return snapshot;
  }

  /**
   * Get performance trends for a specific metric and route
   */
  public getTrends(metric?: string, route?: string): PerformanceTrend[] {
    const trends = Array.from(this.trends.values());
    
    return trends.filter(trend => {
      if (metric && trend.metric !== metric) return false;
      if (route && trend.route !== route) return false;
      return true;
    });
  }

  /**
   * Get performance alerts
   */
  public getAlerts(acknowledged?: boolean): PerformanceAlert[] {
    return this.alerts.filter(alert => {
      if (acknowledged !== undefined && alert.acknowledged !== acknowledged) return false;
      return true;
    });
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  /**
   * Generate performance report for a time period
   */
  public generateReport(
    startTime: number, 
    endTime: number, 
    route?: string
  ): {
    summary: {
      totalSnapshots: number;
      averageScore: number;
      issueCount: number;
      routes: string[];
    };
    trends: PerformanceTrend[];
    alerts: PerformanceAlert[];
    recommendations: string[];
  } {
    const filteredSnapshots = this.snapshots.filter(snapshot => {
      if (snapshot.timestamp < startTime || snapshot.timestamp > endTime) return false;
      if (route && snapshot.route !== route) return false;
      return true;
    });

    const totalSnapshots = filteredSnapshots.length;
    const averageScore = totalSnapshots > 0 ? 
      filteredSnapshots.reduce((sum, s) => sum + s.performanceScore, 0) / totalSnapshots : 0;
    const issueCount = filteredSnapshots.reduce((sum, s) => sum + s.issues.length, 0);
    const routes = Array.from(new Set(filteredSnapshots.map(s => s.route)));

    const trends = this.getTrends(undefined, route);
    const alerts = this.getAlerts(false).filter(alert => 
      alert.timestamp >= startTime && alert.timestamp <= endTime
    );

    const recommendations = this.generateRecommendations(filteredSnapshots, trends, alerts);

    return {
      summary: {
        totalSnapshots,
        averageScore,
        issueCount,
        routes,
      },
      trends,
      alerts,
      recommendations,
    };
  }

  /**
   * Export performance data
   */
  public exportData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.exportToCSV();
    }
    
    return JSON.stringify({
      snapshots: this.snapshots,
      trends: Array.from(this.trends.values()),
      alerts: this.alerts,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  /**
   * Clear all stored data
   */
  public clearData(): void {
    this.snapshots = [];
    this.trends.clear();
    this.alerts = [];
    
    if (this.config.enableStorage) {
      this.saveSnapshots();
    }
  }

  /**
   * Start automated reporting
   */
  private startAutomatedReporting(): void {
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
    }

    this.reportingInterval = setInterval(() => {
      // This will be triggered by the PerformanceProvider
      // when it calls recordSnapshot
    }, this.config.reportingInterval);
  }

  /**
   * Analyze trends from snapshots
   */
  private analyzeTrends(): void {
    const cutoffTime = Date.now() - (this.config.trendAnalysisWindow * 24 * 60 * 60 * 1000);
    const recentSnapshots = this.snapshots.filter(s => s.timestamp > cutoffTime);

    // Group by metric and route
    const metricGroups = new Map<string, PerformanceSnapshot[]>();
    
    recentSnapshots.forEach(snapshot => {
      // Web Vitals trends
      Object.entries(snapshot.webVitals).forEach(([name, metric]) => {
        const key = `webvital_${name}_${snapshot.route}`;
        if (!metricGroups.has(key)) metricGroups.set(key, []);
        metricGroups.get(key)!.push(snapshot);
      });

      // Bundle size trends
      if (snapshot.bundleMetrics) {
        const key = `bundle_size_${snapshot.route}`;
        if (!metricGroups.has(key)) metricGroups.set(key, []);
        metricGroups.get(key)!.push(snapshot);
      }

      // Performance score trends
      const scoreKey = `performance_score_${snapshot.route}`;
      if (!metricGroups.has(scoreKey)) metricGroups.set(scoreKey, []);
      metricGroups.get(scoreKey)!.push(snapshot);
    });

    // Analyze each metric group
    metricGroups.forEach((snapshots, key) => {
      const trend = this.calculateTrend(key, snapshots);
      if (trend) {
        this.trends.set(key, trend);
      }
    });

    this.config.onTrendUpdate(Array.from(this.trends.values()));
  }

  /**
   * Calculate trend for a metric
   */
  private calculateTrend(key: string, snapshots: PerformanceSnapshot[]): PerformanceTrend | null {
    if (snapshots.length < 3) return null; // Need at least 3 data points

    const [metricType, metricName, route] = key.split('_');
    
    // Extract values
    const dataPoints = snapshots.map(snapshot => {
      let value = 0;
      
      if (metricType === 'webvital') {
        value = snapshot.webVitals[metricName]?.value || 0;
      } else if (metricType === 'bundle' && metricName === 'size') {
        value = snapshot.bundleMetrics?.totalSize || 0;
      } else if (metricType === 'performance' && metricName === 'score') {
        value = snapshot.performanceScore;
      }

      return {
        timestamp: snapshot.timestamp,
        value,
        sessionCount: 1, // Each snapshot represents one session
      };
    }).sort((a, b) => a.timestamp - b.timestamp);

    // Calculate trend direction
    const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
    const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, dp) => sum + dp.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, dp) => sum + dp.value, 0) / secondHalf.length;
    
    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    let trend: 'improving' | 'stable' | 'degrading';
    let significance: 'low' | 'medium' | 'high';
    
    if (Math.abs(changePercent) < 5) {
      trend = 'stable';
      significance = 'low';
    } else if (changePercent > 0) {
      // For performance score, positive is improving; for others, it's degrading
      trend = metricType === 'performance' ? 'improving' : 'degrading';
      significance = Math.abs(changePercent) > 20 ? 'high' : 'medium';
    } else {
      trend = metricType === 'performance' ? 'degrading' : 'improving';
      significance = Math.abs(changePercent) > 20 ? 'high' : 'medium';
    }

    return {
      metric: `${metricType}_${metricName}`,
      route,
      timeframe: 'week',
      dataPoints,
      trend,
      changePercent,
      significance,
    };
  }

  /**
   * Update trends with new snapshot
   */
  private updateTrends(snapshot: PerformanceSnapshot): void {
    // This is called after each snapshot to incrementally update trends
    // For now, we'll re-analyze all trends periodically
    if (this.snapshots.length % 10 === 0) { // Every 10 snapshots
      this.analyzeTrends();
    }
  }

  /**
   * Check for performance alerts
   */
  private checkForAlerts(snapshot: PerformanceSnapshot): void {
    const alerts: PerformanceAlert[] = [];

    // Check for performance score regression
    const recentSnapshots = this.snapshots
      .filter(s => s.route === snapshot.route && s.timestamp > Date.now() - 3600000) // Last hour
      .slice(-10); // Last 10 snapshots

    if (recentSnapshots.length >= 3) {
      const previousAvg = recentSnapshots.slice(0, -1)
        .reduce((sum, s) => sum + s.performanceScore, 0) / (recentSnapshots.length - 1);
      
      const regressionPercent = ((previousAvg - snapshot.performanceScore) / previousAvg) * 100;
      
      if (regressionPercent > this.config.alertThresholds.regressionPercent) {
        alerts.push({
          id: this.generateId(),
          timestamp: Date.now(),
          type: 'regression',
          severity: regressionPercent > 40 ? 'critical' : 'warning',
          metric: 'performance_score',
          route: snapshot.route,
          currentValue: snapshot.performanceScore,
          previousValue: previousAvg,
          threshold: this.config.alertThresholds.regressionPercent,
          message: `Performance score dropped by ${regressionPercent.toFixed(1)}% on ${snapshot.route}`,
          recommendations: [
            'Check recent code changes for performance impact',
            'Review component render times and bundle size',
            'Consider rolling back recent changes if regression is severe',
          ],
          acknowledged: false,
        });
      }
    }

    // Check for budget exceeded alerts
    if (snapshot.bundleMetrics?.budgetStatus === 'over-budget') {
      alerts.push({
        id: this.generateId(),
        timestamp: Date.now(),
        type: 'budget_exceeded',
        severity: 'critical',
        metric: 'bundle_size',
        route: snapshot.route,
        currentValue: snapshot.bundleMetrics.totalSize / 1024, // KB
        threshold: 0, // Will be set by bundle analyzer
        message: `Bundle size budget exceeded on ${snapshot.route}`,
        recommendations: [
          'Implement code splitting for large components',
          'Remove unused dependencies',
          'Enable tree shaking optimization',
        ],
        acknowledged: false,
      });
    }

    // Add alerts and trigger callbacks
    alerts.forEach(alert => {
      this.alerts.push(alert);
      this.config.onAlert(alert);
    });

    // Trim old alerts (keep last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  /**
   * Detect issues in current snapshot
   */
  private detectIssues(
    webVitals: Map<string, WebVitalMetric>,
    bundleReport?: BundleReport,
    componentMetrics?: Map<string, RenderMetrics>
  ): Array<{ type: string; severity: string; message: string; value: number; threshold: number }> {
    const issues: Array<{ type: string; severity: string; message: string; value: number; threshold: number }> = [];

    // Web Vitals issues
    webVitals.forEach((metric) => {
      if (metric.rating === 'poor') {
        issues.push({
          type: 'web-vital',
          severity: 'critical',
          message: `${metric.name} is poor (${metric.value.toFixed(2)}ms)`,
          value: metric.value,
          threshold: this.getWebVitalThreshold(metric.name),
        });
      } else if (metric.rating === 'needs-improvement') {
        issues.push({
          type: 'web-vital',
          severity: 'warning',
          message: `${metric.name} needs improvement (${metric.value.toFixed(2)}ms)`,
          value: metric.value,
          threshold: this.getWebVitalThreshold(metric.name),
        });
      }
    });

    // Bundle issues
    if (bundleReport) {
      if (bundleReport.performanceBudget.status === 'over-budget') {
        issues.push({
          type: 'bundle',
          severity: 'critical',
          message: `Bundle size exceeds budget (${Math.round(bundleReport.totalSize / 1024)}KB)`,
          value: Math.round(bundleReport.totalSize / 1024),
          threshold: bundleReport.performanceBudget.limit,
        });
      }
    }

    // Component issues
    if (componentMetrics) {
      componentMetrics.forEach((metrics, componentName) => {
        if (metrics.averageRenderTime > 33) {
          issues.push({
            type: 'component',
            severity: 'critical',
            message: `${componentName} has very slow render time (${metrics.averageRenderTime.toFixed(2)}ms)`,
            value: metrics.averageRenderTime,
            threshold: 16,
          });
        } else if (metrics.averageRenderTime > 16) {
          issues.push({
            type: 'component',
            severity: 'warning',
            message: `${componentName} has slow render time (${metrics.averageRenderTime.toFixed(2)}ms)`,
            value: metrics.averageRenderTime,
            threshold: 16,
          });
        }
      });
    }

    return issues;
  }

  /**
   * Generate recommendations based on data
   */
  private generateRecommendations(
    snapshots: PerformanceSnapshot[],
    trends: PerformanceTrend[],
    alerts: PerformanceAlert[]
  ): string[] {
    const recommendations: string[] = [];

    // Analyze common issues
    const allIssues = snapshots.flatMap(s => s.issues);
    const issueTypes = new Map<string, number>();
    
    allIssues.forEach(issue => {
      issueTypes.set(issue.type, (issueTypes.get(issue.type) || 0) + 1);
    });

    // Generate recommendations based on most common issues
    if (issueTypes.get('web-vital') && issueTypes.get('web-vital')! > snapshots.length * 0.3) {
      recommendations.push('Web Vitals issues are common - focus on optimizing Core Web Vitals');
    }

    if (issueTypes.get('bundle') && issueTypes.get('bundle')! > snapshots.length * 0.2) {
      recommendations.push('Bundle size issues detected - implement code splitting and tree shaking');
    }

    if (issueTypes.get('component') && issueTypes.get('component')! > snapshots.length * 0.4) {
      recommendations.push('Component performance issues - optimize render times and use memoization');
    }

    // Analyze trends
    const degradingTrends = trends.filter(t => t.trend === 'degrading' && t.significance !== 'low');
    if (degradingTrends.length > 0) {
      recommendations.push(`${degradingTrends.length} metrics are degrading - investigate recent changes`);
    }

    // Analyze alerts
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged);
    if (criticalAlerts.length > 0) {
      recommendations.push(`${criticalAlerts.length} critical alerts need attention`);
    }

    return recommendations;
  }

  /**
   * Utility methods
   */
  private getWebVitalThreshold(name: string): number {
    const thresholds: Record<string, number> = {
      LCP: 2500,
      FID: 100,
      CLS: 0.1,
      TTFB: 800,
      FCP: 1800,
    };
    return thresholds[name] || 0;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentRoute(): string {
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  }

  private getViewport(): { width: number; height: number } {
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    }
    return { width: 0, height: 0 };
  }

  private getConnectionType(): string | undefined {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      return (navigator as any).connection?.effectiveType;
    }
    return undefined;
  }

  private mapToObject<T>(map: Map<string, T>): Record<string, T> {
    const obj: Record<string, T> = {};
    map.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  private loadSnapshots(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.config.storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          this.snapshots = data.snapshots || [];
          this.alerts = data.alerts || [];
        }
      }
    } catch (error) {
      console.warn('Failed to load performance snapshots:', error);
    }
  }

  private saveSnapshots(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = {
          snapshots: this.snapshots,
          alerts: this.alerts,
          savedAt: Date.now(),
        };
        localStorage.setItem(this.config.storageKey, JSON.stringify(data));
      }
    } catch (error) {
      console.warn('Failed to save performance snapshots:', error);
    }
  }

  private exportToCSV(): string {
    const headers = [
      'timestamp',
      'route',
      'performanceScore',
      'performanceGrade',
      'bundleSize',
      'loadTime',
      'issueCount',
    ];

    const rows = this.snapshots.map(snapshot => [
      new Date(snapshot.timestamp).toISOString(),
      snapshot.route,
      snapshot.performanceScore,
      snapshot.performanceGrade,
      snapshot.bundleMetrics?.totalSize || '',
      snapshot.bundleMetrics?.loadTime || '',
      snapshot.issues.length,
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
      this.reportingInterval = null;
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
export const performanceReporter = new PerformanceReporter({
  enableStorage: true,
  enableTrendAnalysis: true,
  enableAlerts: true,
  onAlert: (alert) => {
    console.warn('Performance alert:', alert);
  },
});

export default PerformanceReporter;