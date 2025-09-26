/**
 * Performance monitoring hook for tracking component render times and user interactions
 */

import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'render' | 'interaction' | 'navigation' | 'api';
  metadata?: Record<string, any>;
}

class PerformanceTracker {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Observe navigation timing
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.addMetric({
                name: 'page_load',
                value: navEntry.loadEventEnd - navEntry.navigationStart,
                timestamp: Date.now(),
                type: 'navigation',
                metadata: {
                  domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.navigationStart,
                  firstPaint: navEntry.responseEnd - navEntry.navigationStart,
                }
              });
            }
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);
      } catch (error) {
        console.warn('Navigation timing observer not supported:', error);
      }

      // Observe largest contentful paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.addMetric({
            name: 'largest_contentful_paint',
            value: lastEntry.startTime,
            timestamp: Date.now(),
            type: 'render'
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('LCP observer not supported:', error);
      }

      // Observe first input delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.addMetric({
              name: 'first_input_delay',
              value: entry.processingStart - entry.startTime,
              timestamp: Date.now(),
              type: 'interaction'
            });
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('FID observer not supported:', error);
      }
    }
  }

  addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Send critical performance issues to monitoring service
    if (this.isCriticalMetric(metric)) {
      this.reportCriticalMetric(metric);
    }
  }

  private isCriticalMetric(metric: PerformanceMetric): boolean {
    switch (metric.name) {
      case 'largest_contentful_paint':
        return metric.value > 2500; // LCP > 2.5s is poor
      case 'first_input_delay':
        return metric.value > 100; // FID > 100ms is poor
      case 'component_render':
        return metric.value > 16; // > 16ms might cause frame drops
      case 'api_call':
        return metric.value > 5000; // API calls > 5s are concerning
      default:
        return false;
    }
  }

  private async reportCriticalMetric(metric: PerformanceMetric) {
    try {
      // Only report from admin pages to avoid 403s on protected endpoints
      if (typeof window !== 'undefined') {
        const path = window.location.pathname || '';
        const isAdminPage = path.startsWith('/admin');
        if (!isAdminPage) {
          return; // Skip reporting from non-admin pages (e.g., salesman dashboard)
        }
      }

      await fetch('/api/admin/monitoring/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.warn('Failed to report performance metric:', error);
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getMetricsByType(type: PerformanceMetric['type']): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.type === type);
  }

  getAverageMetric(name: string): number {
    const metrics = this.metrics.filter(metric => metric.name === name);
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, metric) => sum + metric.value, 0) / metrics.length;
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
  }
}

// Global performance tracker instance
let performanceTracker: PerformanceTracker | null = null;

const getPerformanceTracker = () => {
  if (!performanceTracker) {
    performanceTracker = new PerformanceTracker();
  }
  return performanceTracker;
};

// Hook for component performance monitoring
export const usePerformanceMonitoring = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const tracker = getPerformanceTracker();

  useEffect(() => {
    renderStartTime.current = performance.now();
    
    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      tracker.addMetric({
        name: 'component_render',
        value: renderTime,
        timestamp: Date.now(),
        type: 'render',
        metadata: { componentName }
      });
    };
  });

  const trackInteraction = useCallback((interactionName: string, startTime?: number) => {
    const endTime = performance.now();
    const duration = startTime ? endTime - startTime : 0;
    
    tracker.addMetric({
      name: 'user_interaction',
      value: duration,
      timestamp: Date.now(),
      type: 'interaction',
      metadata: { 
        componentName, 
        interactionName,
        duration: duration > 0 ? duration : undefined
      }
    });
  }, [componentName, tracker]);

  const trackApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    apiName: string
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      tracker.addMetric({
        name: 'api_call',
        value: duration,
        timestamp: Date.now(),
        type: 'api',
        metadata: { 
          apiName,
          success: true,
          componentName
        }
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      tracker.addMetric({
        name: 'api_call',
        value: duration,
        timestamp: Date.now(),
        type: 'api',
        metadata: { 
          apiName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          componentName
        }
      });
      
      throw error;
    }
  }, [componentName, tracker]);

  return {
    trackInteraction,
    trackApiCall,
    getMetrics: () => tracker.getMetrics(),
    getComponentMetrics: () => tracker.getMetrics().filter(
      metric => metric.metadata?.componentName === componentName
    )
  };
};

// Hook for performance analytics
export const usePerformanceAnalytics = () => {
  const tracker = getPerformanceTracker();

  const getPerformanceSummary = useCallback(() => {
    const metrics = tracker.getMetrics();
    
    return {
      totalMetrics: metrics.length,
      averageRenderTime: tracker.getAverageMetric('component_render'),
      averageApiTime: tracker.getAverageMetric('api_call'),
      largestContentfulPaint: tracker.getAverageMetric('largest_contentful_paint'),
      firstInputDelay: tracker.getAverageMetric('first_input_delay'),
      criticalIssues: metrics.filter(metric => 
        tracker['isCriticalMetric'](metric)
      ).length
    };
  }, [tracker]);

  const exportMetrics = useCallback(() => {
    const metrics = tracker.getMetrics();
    const summary = getPerformanceSummary();
    
    return {
      summary,
      metrics,
      exportedAt: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Unknown'
    };
  }, [tracker, getPerformanceSummary]);

  return {
    getPerformanceSummary,
    exportMetrics,
    getMetrics: () => tracker.getMetrics()
  };
};

// Cleanup function for when the app unmounts
export const cleanupPerformanceTracking = () => {
  if (performanceTracker) {
    performanceTracker.cleanup();
    performanceTracker = null;
  }
};