/**
 * PerformanceErrorIntegration - Integration between performance monitoring and error tracking
 * 
 * Connects performance metrics to the existing error reporting system,
 * enabling performance regression detection and alerting.
 */

import { errorTracker } from '@/lib/enhanced-error-tracker';
import { WebVitalMetric, PerformanceReport } from '../core/WebVitalsCollector';
import { BundleReport, BudgetReport } from '../core/BundleAnalyzer';
import { RenderMetrics } from '../hooks/useRenderTracking';

export interface PerformanceThresholds {
  webVitals: {
    lcp: { warning: number; critical: number };
    fid: { warning: number; critical: number };
    cls: { warning: number; critical: number };
    ttfb: { warning: number; critical: number };
    fcp: { warning: number; critical: number };
  };
  bundle: {
    sizeWarning: number; // KB
    sizeCritical: number; // KB
    loadTimeWarning: number; // ms
    loadTimeCritical: number; // ms
  };
  component: {
    renderTimeWarning: number; // ms
    renderTimeCritical: number; // ms
    memoryWarning: number; // MB
    memoryCritical: number; // MB
  };
}

export interface PerformanceRegressionAlert {
  type: 'web-vital' | 'bundle' | 'component';
  severity: 'warning' | 'critical';
  metric: string;
  currentValue: number;
  threshold: number;
  previousValue?: number;
  route: string;
  timestamp: number;
  recommendations: string[];
}

export interface PerformanceIntegrationConfig {
  thresholds: PerformanceThresholds;
  enableRegressionDetection: boolean;
  enableAutomaticReporting: boolean;
  regressionDetectionWindow: number; // minutes
  onRegressionDetected?: (alert: PerformanceRegressionAlert) => void;
}

export class PerformanceErrorIntegration {
  private config: PerformanceIntegrationConfig;
  private performanceHistory: Map<string, Array<{ value: number; timestamp: number }>> = new Map();
  private lastReportTime: number = 0;
  private isInitialized = false;

  constructor(config?: Partial<PerformanceIntegrationConfig>) {
    this.config = {
      thresholds: {
        webVitals: {
          lcp: { warning: 2500, critical: 4000 },
          fid: { warning: 100, critical: 300 },
          cls: { warning: 0.1, critical: 0.25 },
          ttfb: { warning: 800, critical: 1800 },
          fcp: { warning: 1800, critical: 3000 },
        },
        bundle: {
          sizeWarning: 200, // 200KB
          sizeCritical: 300, // 300KB
          loadTimeWarning: 3000, // 3s
          loadTimeCritical: 5000, // 5s
        },
        component: {
          renderTimeWarning: 16, // 60fps threshold
          renderTimeCritical: 33, // 30fps threshold
          memoryWarning: 50, // 50MB
          memoryCritical: 100, // 100MB
        },
      },
      enableRegressionDetection: true,
      enableAutomaticReporting: true,
      regressionDetectionWindow: 30, // 30 minutes
      ...config,
    };
  }

  /**
   * Initialize the integration system
   */
  public init(): void {
    if (this.isInitialized) return;

    try {
      // Set up error tracker context for performance
      errorTracker.setUserContext({
        performanceMonitoring: true,
        performanceIntegrationVersion: '1.0.0',
      });

      // Add breadcrumb for initialization
      errorTracker.addBreadcrumb('performance_integration_initialized', {
        thresholds: this.config.thresholds,
        regressionDetection: this.config.enableRegressionDetection,
      });

      this.isInitialized = true;
      console.log('PerformanceErrorIntegration initialized');
    } catch (error) {
      console.error('Failed to initialize PerformanceErrorIntegration:', error);
    }
  }

  /**
   * Process Web Vitals metrics and detect issues
   */
  public processWebVitalMetric(metric: WebVitalMetric): void {
    if (!this.isInitialized) this.init();

    try {
      // Add breadcrumb for metric collection
      errorTracker.addBreadcrumb('web_vital_collected', {
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        url: metric.url,
      });

      // Check thresholds and report issues
      const threshold = this.config.thresholds.webVitals[metric.name.toLowerCase() as keyof typeof this.config.thresholds.webVitals];
      if (threshold) {
        this.checkWebVitalThreshold(metric, threshold);
      }

      // Store for regression detection
      if (this.config.enableRegressionDetection) {
        this.storeMetricHistory(`webvital_${metric.name}`, metric.value);
        this.detectRegression('web-vital', metric.name, metric.value, threshold?.critical || 0);
      }
    } catch (error) {
      errorTracker.trackError({
        message: 'Failed to process Web Vital metric',
        type: 'custom',
        severity: 'medium',
        metric: metric.name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Process bundle report and detect issues
   */
  public processBundleReport(report: BundleReport): void {
    if (!this.isInitialized) this.init();

    try {
      // Add breadcrumb for bundle analysis
      errorTracker.addBreadcrumb('bundle_analyzed', {
        route: report.route,
        totalSize: Math.round(report.totalSize / 1024), // KB
        loadTime: report.loadTime,
        budgetStatus: report.performanceBudget.status,
      });

      // Check bundle size thresholds
      const sizeKB = Math.round(report.totalSize / 1024);
      this.checkBundleThresholds(report, sizeKB);

      // Store for regression detection
      if (this.config.enableRegressionDetection) {
        this.storeMetricHistory(`bundle_size_${report.route}`, sizeKB);
        this.storeMetricHistory(`bundle_loadtime_${report.route}`, report.loadTime);
        
        this.detectRegression('bundle', 'size', sizeKB, this.config.thresholds.bundle.sizeCritical);
        this.detectRegression('bundle', 'loadTime', report.loadTime, this.config.thresholds.bundle.loadTimeCritical);
      }
    } catch (error) {
      errorTracker.trackError({
        message: 'Failed to process bundle report',
        type: 'custom',
        severity: 'medium',
        route: report.route,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Process budget report and handle violations
   */
  public processBudgetReport(report: BudgetReport): void {
    if (!this.isInitialized) this.init();

    try {
      // Always report budget violations as errors
      if (report.status === 'over-budget') {
        errorTracker.trackCustomError(
          `Performance budget exceeded on ${report.route}`,
          'high',
          {
            route: report.route,
            currentSize: report.currentSize,
            budgetLimit: report.budgetLimit,
            overage: report.currentSize - report.budgetLimit,
            recommendations: report.recommendations,
          }
        );
      } else if (report.status === 'approaching-limit') {
        errorTracker.trackCustomError(
          `Performance budget approaching limit on ${report.route}`,
          'medium',
          {
            route: report.route,
            currentSize: report.currentSize,
            budgetLimit: report.budgetLimit,
            utilizationPercent: Math.round((report.currentSize / report.budgetLimit) * 100),
            recommendations: report.recommendations,
          }
        );
      }

      // Add breadcrumb for budget check
      errorTracker.addBreadcrumb('budget_checked', {
        route: report.route,
        status: report.status,
        currentSize: report.currentSize,
        budgetLimit: report.budgetLimit,
      });
    } catch (error) {
      errorTracker.trackError({
        message: 'Failed to process budget report',
        type: 'custom',
        severity: 'medium',
        route: report.route,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Process component render metrics
   */
  public processComponentMetrics(componentName: string, metrics: RenderMetrics): void {
    if (!this.isInitialized) this.init();

    try {
      // Add breadcrumb for component tracking
      errorTracker.addBreadcrumb('component_tracked', {
        component: componentName,
        renderCount: metrics.renderCount,
        averageRenderTime: metrics.averageRenderTime,
        maxRenderTime: metrics.slowestRenderTime,
      });

      // Check component performance thresholds
      this.checkComponentThresholds(componentName, metrics);

      // Store for regression detection
      if (this.config.enableRegressionDetection) {
        this.storeMetricHistory(`component_render_${componentName}`, metrics.averageRenderTime);
        
        if (metrics.memoryUsage) {
          this.storeMetricHistory(`component_memory_${componentName}`, metrics.memoryUsage);
        }

        this.detectRegression('component', `${componentName}_render`, metrics.averageRenderTime, this.config.thresholds.component.renderTimeCritical);
      }
    } catch (error) {
      errorTracker.trackError({
        message: 'Failed to process component metrics',
        type: 'custom',
        severity: 'medium',
        component: componentName,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Generate comprehensive performance report for error tracking
   */
  public generatePerformanceReport(report: PerformanceReport): void {
    if (!this.isInitialized) this.init();

    try {
      // Only report if significant time has passed or if there are critical issues
      const now = Date.now();
      const timeSinceLastReport = now - this.lastReportTime;
      const hasIssues = report.grade === 'D' || report.grade === 'F';

      if (timeSinceLastReport > 300000 || hasIssues) { // 5 minutes or has issues
        const severity = hasIssues ? 'high' : 'low';
        
        errorTracker.trackCustomError(
          `Performance report: Grade ${report.grade} (Score: ${report.score})`,
          severity,
          {
            performanceScore: report.score,
            performanceGrade: report.grade,
            metricsCount: report.metrics.length,
            sessionId: report.sessionId,
            timestamp: report.timestamp,
            metrics: report.metrics.reduce((acc, metric) => {
              acc[metric.name] = {
                value: metric.value,
                rating: metric.rating,
              };
              return acc;
            }, {} as Record<string, any>),
          }
        );

        this.lastReportTime = now;
      }

      // Always add breadcrumb for report generation
      errorTracker.addBreadcrumb('performance_report_generated', {
        score: report.score,
        grade: report.grade,
        metricsCount: report.metrics.length,
      });
    } catch (error) {
      errorTracker.trackError({
        message: 'Failed to generate performance report',
        type: 'custom',
        severity: 'medium',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check Web Vital thresholds and report issues
   */
  private checkWebVitalThreshold(
    metric: WebVitalMetric, 
    threshold: { warning: number; critical: number }
  ): void {
    if (metric.value > threshold.critical) {
      errorTracker.trackCustomError(
        `Critical Web Vital issue: ${metric.name} (${metric.value}ms) exceeds critical threshold (${threshold.critical}ms)`,
        'critical',
        {
          metric: metric.name,
          value: metric.value,
          threshold: threshold.critical,
          rating: metric.rating,
          url: metric.url,
          navigationType: metric.navigationType,
        }
      );
    } else if (metric.value > threshold.warning) {
      errorTracker.trackCustomError(
        `Web Vital warning: ${metric.name} (${metric.value}ms) exceeds warning threshold (${threshold.warning}ms)`,
        'medium',
        {
          metric: metric.name,
          value: metric.value,
          threshold: threshold.warning,
          rating: metric.rating,
          url: metric.url,
        }
      );
    }
  }

  /**
   * Check bundle thresholds and report issues
   */
  private checkBundleThresholds(report: BundleReport, sizeKB: number): void {
    const { bundle } = this.config.thresholds;

    // Check bundle size
    if (sizeKB > bundle.sizeCritical) {
      errorTracker.trackCustomError(
        `Critical bundle size: ${sizeKB}KB exceeds critical threshold (${bundle.sizeCritical}KB)`,
        'critical',
        {
          route: report.route,
          currentSize: sizeKB,
          threshold: bundle.sizeCritical,
          budgetStatus: report.performanceBudget.status,
          recommendations: this.generateBundleRecommendations(sizeKB, bundle.sizeCritical),
        }
      );
    } else if (sizeKB > bundle.sizeWarning) {
      errorTracker.trackCustomError(
        `Bundle size warning: ${sizeKB}KB exceeds warning threshold (${bundle.sizeWarning}KB)`,
        'medium',
        {
          route: report.route,
          currentSize: sizeKB,
          threshold: bundle.sizeWarning,
        }
      );
    }

    // Check load time
    if (report.loadTime > bundle.loadTimeCritical) {
      errorTracker.trackCustomError(
        `Critical bundle load time: ${report.loadTime}ms exceeds critical threshold (${bundle.loadTimeCritical}ms)`,
        'critical',
        {
          route: report.route,
          loadTime: report.loadTime,
          threshold: bundle.loadTimeCritical,
          cacheHitRate: report.cacheHitRate,
        }
      );
    } else if (report.loadTime > bundle.loadTimeWarning) {
      errorTracker.trackCustomError(
        `Bundle load time warning: ${report.loadTime}ms exceeds warning threshold (${bundle.loadTimeWarning}ms)`,
        'medium',
        {
          route: report.route,
          loadTime: report.loadTime,
          threshold: bundle.loadTimeWarning,
        }
      );
    }
  }

  /**
   * Check component thresholds and report issues
   */
  private checkComponentThresholds(componentName: string, metrics: RenderMetrics): void {
    const { component } = this.config.thresholds;

    // Check render time
    if (metrics.averageRenderTime > component.renderTimeCritical) {
      errorTracker.trackCustomError(
        `Critical component render time: ${componentName} (${metrics.averageRenderTime.toFixed(2)}ms) exceeds critical threshold (${component.renderTimeCritical}ms)`,
        'critical',
        {
          component: componentName,
          averageRenderTime: metrics.averageRenderTime,
          maxRenderTime: metrics.slowestRenderTime,
          renderCount: metrics.renderCount,
          threshold: component.renderTimeCritical,
        }
      );
    } else if (metrics.averageRenderTime > component.renderTimeWarning) {
      errorTracker.trackCustomError(
        `Component render time warning: ${componentName} (${metrics.averageRenderTime.toFixed(2)}ms) exceeds warning threshold (${component.renderTimeWarning}ms)`,
        'medium',
        {
          component: componentName,
          averageRenderTime: metrics.averageRenderTime,
          threshold: component.renderTimeWarning,
        }
      );
    }

    // Check memory usage if available
    if (metrics.memoryUsage) {
      if (metrics.memoryUsage > component.memoryCritical) {
        errorTracker.trackCustomError(
          `Critical component memory usage: ${componentName} (${metrics.memoryUsage}MB) exceeds critical threshold (${component.memoryCritical}MB)`,
          'critical',
          {
            component: componentName,
            memoryUsage: metrics.memoryUsage,
            threshold: component.memoryCritical,
          }
        );
      } else if (metrics.memoryUsage > component.memoryWarning) {
        errorTracker.trackCustomError(
          `Component memory usage warning: ${componentName} (${metrics.memoryUsage}MB) exceeds warning threshold (${component.memoryWarning}MB)`,
          'medium',
          {
            component: componentName,
            memoryUsage: metrics.memoryUsage,
            threshold: component.memoryWarning,
          }
        );
      }
    }
  }

  /**
   * Store metric history for regression detection
   */
  private storeMetricHistory(metricKey: string, value: number): void {
    if (!this.performanceHistory.has(metricKey)) {
      this.performanceHistory.set(metricKey, []);
    }

    const history = this.performanceHistory.get(metricKey)!;
    history.push({ value, timestamp: Date.now() });

    // Keep only recent history (within detection window)
    const cutoffTime = Date.now() - (this.config.regressionDetectionWindow * 60 * 1000);
    const recentHistory = history.filter(entry => entry.timestamp > cutoffTime);
    this.performanceHistory.set(metricKey, recentHistory);
  }

  /**
   * Detect performance regressions
   */
  private detectRegression(
    type: 'web-vital' | 'bundle' | 'component',
    metric: string,
    currentValue: number,
    threshold: number
  ): void {
    const metricKey = `${type}_${metric}`;
    const history = this.performanceHistory.get(metricKey);

    if (!history || history.length < 3) return; // Need at least 3 data points

    // Calculate baseline (average of older values)
    const baseline = history.slice(0, -1).reduce((sum, entry) => sum + entry.value, 0) / (history.length - 1);
    
    // Check for significant regression (20% worse than baseline)
    const regressionThreshold = baseline * 1.2;
    
    if (currentValue > regressionThreshold && currentValue > threshold * 0.8) {
      const alert: PerformanceRegressionAlert = {
        type,
        severity: currentValue > threshold ? 'critical' : 'warning',
        metric,
        currentValue,
        threshold,
        previousValue: baseline,
        route: typeof window !== 'undefined' ? window.location.pathname : '/',
        timestamp: Date.now(),
        recommendations: this.generateRegressionRecommendations(type, metric, currentValue, baseline),
      };

      this.reportRegression(alert);
      this.config.onRegressionDetected?.(alert);
    }
  }

  /**
   * Report performance regression
   */
  private reportRegression(alert: PerformanceRegressionAlert): void {
    errorTracker.trackCustomError(
      `Performance regression detected: ${alert.type} ${alert.metric}`,
      alert.severity,
      {
        regressionType: alert.type,
        metric: alert.metric,
        currentValue: alert.currentValue,
        previousValue: alert.previousValue,
        threshold: alert.threshold,
        route: alert.route,
        regressionPercent: alert.previousValue ? 
          Math.round(((alert.currentValue - alert.previousValue) / alert.previousValue) * 100) : 0,
        recommendations: alert.recommendations,
      }
    );
  }

  /**
   * Generate bundle optimization recommendations
   */
  private generateBundleRecommendations(currentSize: number, threshold: number): string[] {
    const overage = currentSize - threshold;
    const recommendations = [
      `Bundle is ${overage}KB over the ${threshold}KB threshold`,
      'Consider implementing code splitting for large components',
      'Review and remove unused dependencies',
      'Enable tree shaking for better dead code elimination',
    ];

    if (overage > 100) {
      recommendations.push('Consider lazy loading non-critical features');
      recommendations.push('Implement dynamic imports for route-based splitting');
    }

    return recommendations;
  }

  /**
   * Generate regression-specific recommendations
   */
  private generateRegressionRecommendations(
    type: string,
    metric: string,
    currentValue: number,
    baseline: number
  ): string[] {
    const increase = Math.round(((currentValue - baseline) / baseline) * 100);
    
    const recommendations = [
      `${metric} has increased by ${increase}% from baseline (${baseline.toFixed(2)} → ${currentValue.toFixed(2)})`,
    ];

    switch (type) {
      case 'web-vital':
        recommendations.push('Check for recent changes that might affect page performance');
        recommendations.push('Review resource loading and rendering optimizations');
        break;
      case 'bundle':
        recommendations.push('Review recent dependency additions or code changes');
        recommendations.push('Check if new features need code splitting');
        break;
      case 'component':
        recommendations.push('Review component implementation for performance issues');
        recommendations.push('Consider memoization or optimization techniques');
        break;
    }

    return recommendations;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<PerformanceIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get performance history for debugging
   */
  public getPerformanceHistory(): Map<string, Array<{ value: number; timestamp: number }>> {
    return new Map(this.performanceHistory);
  }

  /**
   * Clear performance history
   */
  public clearHistory(): void {
    this.performanceHistory.clear();
  }
}

// Export singleton instance
export const performanceErrorIntegration = new PerformanceErrorIntegration({
  enableRegressionDetection: true,
  enableAutomaticReporting: true,
  onRegressionDetected: (alert) => {
    console.warn('Performance regression detected:', alert);
  },
});

export default PerformanceErrorIntegration;