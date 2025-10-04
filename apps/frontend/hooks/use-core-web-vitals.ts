"use client";

/**
 * Core Web Vitals React Hook
 * 
 * Provides Core Web Vitals metrics and performance score to React components
 */

import { useState, useEffect, useCallback } from 'react';
import { coreWebVitalsMonitor } from '@/lib/core-web-vitals-monitor';

interface WebVitalMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  navigationType: string;
}

interface PerformanceScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  details: {
    lcp: { value: number; status: 'good' | 'needs-improvement' | 'poor' };
    fid: { value: number; status: 'good' | 'needs-improvement' | 'poor' };
    cls: { value: number; status: 'good' | 'needs-improvement' | 'poor' };
  };
}

interface UseCoreWebVitalsReturn {
  metrics: Map<string, WebVitalMetric>;
  performanceScore: PerformanceScore | null;
  isLoading: boolean;
  error: Error | null;
  refreshMetrics: () => void;
}

export function useCoreWebVitals(): UseCoreWebVitalsReturn {
  const [metrics, setMetrics] = useState<Map<string, WebVitalMetric>>(new Map());
  const [performanceScore, setPerformanceScore] = useState<PerformanceScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshMetrics = useCallback(() => {
    try {
      const currentMetrics = coreWebVitalsMonitor.getMetrics();
      const score = coreWebVitalsMonitor.getPerformanceScore();
      
      setMetrics(currentMetrics);
      setPerformanceScore(score);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh metrics'));
    }
  }, []);

  useEffect(() => {
    // Initialize monitoring
    coreWebVitalsMonitor.init();

    // Set up metric handler
    const originalOnMetric = coreWebVitalsMonitor['config'].onMetric;
    coreWebVitalsMonitor['config'].onMetric = (metric: WebVitalMetric) => {
      // Call original handler if it exists
      if (originalOnMetric) {
        originalOnMetric(metric);
      }
      
      // Update our state
      setMetrics(prev => new Map(prev.set(metric.name, metric)));
      
      // Update performance score
      const score = coreWebVitalsMonitor.getPerformanceScore();
      setPerformanceScore(score);
    };

    // Initial metrics fetch
    refreshMetrics();
    setIsLoading(false);

    // Cleanup
    return () => {
      coreWebVitalsMonitor.destroy();
    };
  }, [refreshMetrics]);

  return {
    metrics,
    performanceScore,
    isLoading,
    error,
    refreshMetrics,
  };
}

/**
 * Hook for getting specific Web Vital metric
 */
export function useWebVitalMetric(metricName: string): {
  metric: WebVitalMetric | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const { metrics, isLoading, error } = useCoreWebVitals();
  const metric = metrics.get(metricName);

  return {
    metric,
    isLoading,
    error,
  };
}

/**
 * Hook for performance score only
 */
export function usePerformanceScore(): {
  score: PerformanceScore | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { performanceScore, isLoading, error } = useCoreWebVitals();

  return {
    score: performanceScore,
    isLoading,
    error,
  };
}
