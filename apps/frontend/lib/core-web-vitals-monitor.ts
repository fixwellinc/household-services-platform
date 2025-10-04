/**
 * Core Web Vitals Monitoring
 * 
 * Monitors and reports Core Web Vitals metrics for dashboard performance
 */

interface WebVitalMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  navigationType: string;
}

interface WebVitalsConfig {
  reportAllChanges?: boolean;
  debug?: boolean;
  onMetric?: (metric: WebVitalMetric) => void;
}

class CoreWebVitalsMonitor {
  private config: WebVitalsConfig;
  private metrics: Map<string, WebVitalMetric> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor(config: WebVitalsConfig = {}) {
    this.config = {
      reportAllChanges: false,
      debug: false,
      ...config
    };
  }

  /**
   * Initialize Core Web Vitals monitoring
   */
  init(): void {
    if (typeof window === 'undefined') return;

    try {
      this.setupLCP();
      this.setupFID();
      this.setupCLS();
      this.setupFCP();
      this.setupTTFB();
      this.setupINP();
      
      if (this.config.debug) {
        console.log('Core Web Vitals monitoring initialized');
      }
    } catch (error) {
      console.error('Failed to initialize Core Web Vitals monitoring:', error);
    }
  }

  /**
   * Setup Largest Contentful Paint (LCP) monitoring
   */
  private setupLCP(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { element?: Element };
      
      const metric: WebVitalMetric = {
        name: 'LCP',
        value: lastEntry.startTime,
        delta: lastEntry.startTime,
        id: this.generateId(),
        navigationType: this.getNavigationType()
      };

      this.recordMetric(metric);
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.push(observer);
  }

  /**
   * Setup First Input Delay (FID) monitoring
   */
  private setupFID(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceEventTiming[];
      
      entries.forEach((entry) => {
        const metric: WebVitalMetric = {
          name: 'FID',
          value: entry.processingStart - entry.startTime,
          delta: entry.processingStart - entry.startTime,
          id: this.generateId(),
          navigationType: this.getNavigationType()
        };

        this.recordMetric(metric);
      });
    });

    observer.observe({ entryTypes: ['first-input'] });
    this.observers.push(observer);
  }

  /**
   * Setup Cumulative Layout Shift (CLS) monitoring
   */
  private setupCLS(): void {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    let clsEntries: PerformanceEntry[] = [];

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceEntry & { hadRecentInput?: boolean; value?: number }[];
      
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value || 0;
          clsEntries.push(entry);
        }
      });

      const metric: WebVitalMetric = {
        name: 'CLS',
        value: clsValue,
        delta: clsValue,
        id: this.generateId(),
        navigationType: this.getNavigationType()
      };

      this.recordMetric(metric);
    });

    observer.observe({ entryTypes: ['layout-shift'] });
    this.observers.push(observer);
  }

  /**
   * Setup First Contentful Paint (FCP) monitoring
   */
  private setupFCP(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0];
      
      const metric: WebVitalMetric = {
        name: 'FCP',
        value: firstEntry.startTime,
        delta: firstEntry.startTime,
        id: this.generateId(),
        navigationType: this.getNavigationType()
      };

      this.recordMetric(metric);
    });

    observer.observe({ entryTypes: ['paint'] });
    this.observers.push(observer);
  }

  /**
   * Setup Time to First Byte (TTFB) monitoring
   */
  private setupTTFB(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const navigationEntry = entries[0] as PerformanceNavigationTiming;
      
      const metric: WebVitalMetric = {
        name: 'TTFB',
        value: navigationEntry.responseStart - navigationEntry.requestStart,
        delta: navigationEntry.responseStart - navigationEntry.requestStart,
        id: this.generateId(),
        navigationType: this.getNavigationType()
      };

      this.recordMetric(metric);
    });

    observer.observe({ entryTypes: ['navigation'] });
    this.observers.push(observer);
  }

  /**
   * Setup Interaction to Next Paint (INP) monitoring
   */
  private setupINP(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceEventTiming[];
      
      entries.forEach((entry) => {
        const metric: WebVitalMetric = {
          name: 'INP',
          value: entry.processingEnd - entry.startTime,
          delta: entry.processingEnd - entry.startTime,
          id: this.generateId(),
          navigationType: this.getNavigationType()
        };

        this.recordMetric(metric);
      });
    });

    observer.observe({ entryTypes: ['event'] });
    this.observers.push(observer);
  }

  /**
   * Record a metric
   */
  private recordMetric(metric: WebVitalMetric): void {
    this.metrics.set(metric.name, metric);
    
    if (this.config.onMetric) {
      this.config.onMetric(metric);
    }

    if (this.config.debug) {
      console.log(`Core Web Vital - ${metric.name}:`, metric.value);
    }

    // Send to analytics service
    this.sendToAnalytics(metric);
  }

  /**
   * Send metric to analytics service
   */
  private sendToAnalytics(metric: WebVitalMetric): void {
    try {
      // Send to your analytics service
      if (typeof gtag !== 'undefined') {
        gtag('event', metric.name, {
          event_category: 'Web Vitals',
          value: Math.round(metric.value),
          non_interaction: true,
        });
      }

      // Send to custom analytics endpoint
      fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metric: metric.name,
          value: metric.value,
          delta: metric.delta,
          id: metric.id,
          navigationType: metric.navigationType,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      }).catch(error => {
        console.warn('Failed to send Web Vitals to analytics:', error);
      });
    } catch (error) {
      console.warn('Failed to send Web Vitals:', error);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): Map<string, WebVitalMetric> {
    return new Map(this.metrics);
  }

  /**
   * Get metric by name
   */
  getMetric(name: string): WebVitalMetric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Get performance score based on Core Web Vitals
   */
  getPerformanceScore(): {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    details: {
      lcp: { value: number; status: 'good' | 'needs-improvement' | 'poor' };
      fid: { value: number; status: 'good' | 'needs-improvement' | 'poor' };
      cls: { value: number; status: 'good' | 'needs-improvement' | 'poor' };
    };
  } {
    const lcp = this.metrics.get('LCP');
    const fid = this.metrics.get('FID');
    const cls = this.metrics.get('CLS');

    const lcpStatus = this.getLCPStatus(lcp?.value || 0);
    const fidStatus = this.getFIDStatus(fid?.value || 0);
    const clsStatus = this.getCLSStatus(cls?.value || 0);

    const scores = [lcpStatus, fidStatus, clsStatus];
    const goodCount = scores.filter(status => status === 'good').length;
    const score = Math.round((goodCount / scores.length) * 100);

    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    return {
      score,
      grade,
      details: {
        lcp: { value: lcp?.value || 0, status: lcpStatus },
        fid: { value: fid?.value || 0, status: fidStatus },
        cls: { value: cls?.value || 0, status: clsStatus },
      }
    };
  }

  /**
   * Get LCP status
   */
  private getLCPStatus(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Get FID status
   */
  private getFIDStatus(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 100) return 'good';
    if (value <= 300) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Get CLS status
   */
  private getCLSStatus(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
   * Cleanup observers
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// Create singleton instance
export const coreWebVitalsMonitor = new CoreWebVitalsMonitor({
  debug: process.env.NODE_ENV === 'development',
  onMetric: (metric) => {
    // Custom metric handler
    console.log(`Web Vital ${metric.name}: ${metric.value}ms`);
  }
});

export default CoreWebVitalsMonitor;
