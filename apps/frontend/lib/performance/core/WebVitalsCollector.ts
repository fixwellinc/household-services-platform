/**
 * WebVitalsCollector - Core Web Vitals tracking system
 * 
 * Provides comprehensive tracking of Core Web Vitals metrics including
 * LCP, FID, CLS, TTFB, and FCP with enhanced reporting capabilities.
 */

export interface WebVitalMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'FCP' | 'INP';
  value: number;
  delta: number;
  id: string;
  navigationType: string;
  timestamp: number;
  url: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export interface PerformanceReport {
  metrics: WebVitalMetric[];
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  timestamp: number;
  sessionId: string;
}

export interface WebVitalsConfig {
  reportAllChanges?: boolean;
  debug?: boolean;
  onMetric?: (metric: WebVitalMetric) => void;
  onReport?: (report: PerformanceReport) => void;
  thresholds?: {
    lcp: { good: number; poor: number };
    fid: { good: number; poor: number };
    cls: { good: number; poor: number };
    ttfb: { good: number; poor: number };
    fcp: { good: number; poor: number };
  };
}

export class WebVitalsCollector {
  private config: Required<WebVitalsConfig>;
  private metrics: Map<string, WebVitalMetric> = new Map();
  private observers: PerformanceObserver[] = [];
  private sessionId: string;
  private isInitialized = false;

  constructor(config: WebVitalsConfig = {}) {
    this.sessionId = this.generateSessionId();
    this.config = {
      reportAllChanges: false,
      debug: false,
      onMetric: () => {},
      onReport: () => {},
      thresholds: {
        lcp: { good: 2500, poor: 4000 },
        fid: { good: 100, poor: 300 },
        cls: { good: 0.1, poor: 0.25 },
        ttfb: { good: 800, poor: 1800 },
        fcp: { good: 1800, poor: 3000 },
      },
      ...config,
    };
  }

  /**
   * Initialize Web Vitals collection
   */
  public init(): void {
    if (typeof window === 'undefined' || this.isInitialized) return;

    try {
      this.collectLCP();
      this.collectFID();
      this.collectCLS();
      this.collectTTFB();
      this.collectFCP();
      this.collectINP();
      
      this.isInitialized = true;
      
      if (this.config.debug) {
        console.log('WebVitalsCollector initialized with session:', this.sessionId);
      }

      // Set up page visibility change handler for final report
      this.setupVisibilityChangeHandler();
    } catch (error) {
      console.error('Failed to initialize WebVitalsCollector:', error);
    }
  }

  /**
   * Collect Largest Contentful Paint (LCP) metrics
   */
  public collectLCP(): void {
    if (!this.isPerformanceObserverSupported()) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry;
      
      const metric: WebVitalMetric = {
        name: 'LCP',
        value: lastEntry.startTime,
        delta: lastEntry.startTime,
        id: this.generateMetricId(),
        navigationType: this.getNavigationType(),
        timestamp: Date.now(),
        url: window.location.href,
        rating: this.getRating('lcp', lastEntry.startTime),
      };

      this.recordMetric(metric);
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('LCP observation failed:', error);
    }
  }

  /**
   * Collect First Input Delay (FID) metrics
   */
  public collectFID(): void {
    if (!this.isPerformanceObserverSupported()) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceEventTiming[];
      
      entries.forEach((entry) => {
        const delay = entry.processingStart - entry.startTime;
        const metric: WebVitalMetric = {
          name: 'FID',
          value: delay,
          delta: delay,
          id: this.generateMetricId(),
          navigationType: this.getNavigationType(),
          timestamp: Date.now(),
          url: window.location.href,
          rating: this.getRating('fid', delay),
        };

        this.recordMetric(metric);
      });
    });

    try {
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FID observation failed:', error);
    }
  }

  /**
   * Collect Cumulative Layout Shift (CLS) metrics
   */
  public collectCLS(): void {
    if (!this.isPerformanceObserverSupported()) return;

    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries: PerformanceEntry[] = [];

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as (PerformanceEntry & { 
        hadRecentInput?: boolean; 
        value?: number;
      })[];
      
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          const entryValue = entry.value || 0;
          sessionValue += entryValue;
          sessionEntries.push(entry);

          // Update CLS value (using session window approach)
          if (sessionValue > clsValue) {
            clsValue = sessionValue;
          }
        }
      });

      const metric: WebVitalMetric = {
        name: 'CLS',
        value: clsValue,
        delta: clsValue,
        id: this.generateMetricId(),
        navigationType: this.getNavigationType(),
        timestamp: Date.now(),
        url: window.location.href,
        rating: this.getRating('cls', clsValue),
      };

      this.recordMetric(metric);
    });

    try {
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('CLS observation failed:', error);
    }
  }

  /**
   * Collect Time to First Byte (TTFB) metrics
   */
  public collectTTFB(): void {
    if (!this.isPerformanceObserverSupported()) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const navigationEntry = entries[0] as PerformanceNavigationTiming;
      
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        const metric: WebVitalMetric = {
          name: 'TTFB',
          value: ttfb,
          delta: ttfb,
          id: this.generateMetricId(),
          navigationType: this.getNavigationType(),
          timestamp: Date.now(),
          url: window.location.href,
          rating: this.getRating('ttfb', ttfb),
        };

        this.recordMetric(metric);
      }
    });

    try {
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('TTFB observation failed:', error);
    }
  }

  /**
   * Collect First Contentful Paint (FCP) metrics
   */
  public collectFCP(): void {
    if (!this.isPerformanceObserverSupported()) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      
      if (fcpEntry) {
        const metric: WebVitalMetric = {
          name: 'FCP',
          value: fcpEntry.startTime,
          delta: fcpEntry.startTime,
          id: this.generateMetricId(),
          navigationType: this.getNavigationType(),
          timestamp: Date.now(),
          url: window.location.href,
          rating: this.getRating('fcp', fcpEntry.startTime),
        };

        this.recordMetric(metric);
      }
    });

    try {
      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FCP observation failed:', error);
    }
  }

  /**
   * Collect Interaction to Next Paint (INP) metrics
   */
  public collectINP(): void {
    if (!this.isPerformanceObserverSupported()) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceEventTiming[];
      
      entries.forEach((entry) => {
        const duration = entry.processingEnd - entry.startTime;
        const metric: WebVitalMetric = {
          name: 'INP',
          value: duration,
          delta: duration,
          id: this.generateMetricId(),
          navigationType: this.getNavigationType(),
          timestamp: Date.now(),
          url: window.location.href,
          rating: this.getRating('fid', duration), // Use FID thresholds for INP
        };

        this.recordMetric(metric);
      });
    });

    try {
      observer.observe({ entryTypes: ['event'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('INP observation failed:', error);
    }
  }

  /**
   * Generate performance report
   */
  public reportMetrics(): PerformanceReport {
    const metrics = Array.from(this.metrics.values());
    const score = this.calculatePerformanceScore(metrics);
    const grade = this.getPerformanceGrade(score);

    const report: PerformanceReport = {
      metrics,
      score,
      grade,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.config.onReport(report);
    return report;
  }

  /**
   * Get current metrics
   */
  public getMetrics(): Map<string, WebVitalMetric> {
    return new Map(this.metrics);
  }

  /**
   * Get specific metric by name
   */
  public getMetric(name: string): WebVitalMetric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Record a metric
   */
  private recordMetric(metric: WebVitalMetric): void {
    // Only update if this is a new metric or if reportAllChanges is enabled
    const existingMetric = this.metrics.get(metric.name);
    if (!existingMetric || this.config.reportAllChanges) {
      this.metrics.set(metric.name, metric);
      this.config.onMetric(metric);

      if (this.config.debug) {
        console.log(`WebVital ${metric.name}:`, {
          value: metric.value,
          rating: metric.rating,
          timestamp: metric.timestamp,
        });
      }
    }
  }

  /**
   * Get rating for a metric value
   */
  private getRating(
    metricName: 'lcp' | 'fid' | 'cls' | 'ttfb' | 'fcp', 
    value: number
  ): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = this.config.thresholds[metricName];
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(metrics: WebVitalMetric[]): number {
    if (metrics.length === 0) return 0;

    const goodCount = metrics.filter(metric => metric.rating === 'good').length;
    return Math.round((goodCount / metrics.length) * 100);
  }

  /**
   * Get performance grade based on score
   */
  private getPerformanceGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Check if PerformanceObserver is supported
   */
  private isPerformanceObserverSupported(): boolean {
    return typeof window !== 'undefined' && 'PerformanceObserver' in window;
  }

  /**
   * Generate unique metric ID
   */
  private generateMetricId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get navigation type
   */
  private getNavigationType(): string {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return navigation?.type || 'unknown';
    }
    return 'unknown';
  }

  /**
   * Setup visibility change handler for final reporting
   */
  private setupVisibilityChangeHandler(): void {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        this.reportMetrics();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also report on page unload
    window.addEventListener('beforeunload', () => {
      this.reportMetrics();
    });
  }

  /**
   * Cleanup observers and event listeners
   */
  public destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const webVitalsCollector = new WebVitalsCollector({
  debug: process.env.NODE_ENV === 'development',
});

export default WebVitalsCollector;