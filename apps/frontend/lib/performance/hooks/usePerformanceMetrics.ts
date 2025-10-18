/**
 * usePerformanceMetrics - Hook for accessing performance metrics
 * 
 * Provides real-time access to Web Vitals and bundle performance data
 * with automatic updates and reporting capabilities.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { WebVitalsCollector, WebVitalMetric, PerformanceReport } from '../core/WebVitalsCollector';
import { BundleAnalyzer, BundleReport, ChunkMetrics } from '../core/BundleAnalyzer';

export interface PerformanceMetrics {
  webVitals: {
    lcp?: WebVitalMetric;
    fid?: WebVitalMetric;
    cls?: WebVitalMetric;
    ttfb?: WebVitalMetric;
    fcp?: WebVitalMetric;
    inp?: WebVitalMetric;
  };
  bundle: {
    totalSize: number;
    gzippedSize: number;
    loadTime: number;
    cacheHitRate: number;
    budgetStatus: 'within-budget' | 'approaching-limit' | 'over-budget';
  };
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  isLoading: boolean;
  lastUpdated: number;
}

export interface UsePerformanceMetricsOptions {
  autoUpdate?: boolean;
  updateInterval?: number;
  onMetricUpdate?: (metric: WebVitalMetric) => void;
  onBundleUpdate?: (report: BundleReport) => void;
  enableWebVitals?: boolean;
  enableBundleAnalysis?: boolean;
}

export interface UsePerformanceMetricsReturn {
  metrics: PerformanceMetrics;
  refreshMetrics: () => void;
  getReport: () => PerformanceReport | null;
  getBundleReport: () => BundleReport | null;
  isSupported: boolean;
}

export function usePerformanceMetrics(
  options: UsePerformanceMetricsOptions = {}
): UsePerformanceMetricsReturn {
  const {
    autoUpdate = true,
    updateInterval = 5000, // 5 seconds
    onMetricUpdate,
    onBundleUpdate,
    enableWebVitals = true,
    enableBundleAnalysis = true,
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    webVitals: {},
    bundle: {
      totalSize: 0,
      gzippedSize: 0,
      loadTime: 0,
      cacheHitRate: 0,
      budgetStatus: 'within-budget',
    },
    score: 0,
    grade: 'F',
    isLoading: true,
    lastUpdated: 0,
  });

  const webVitalsCollectorRef = useRef<WebVitalsCollector | null>(null);
  const bundleAnalyzerRef = useRef<BundleAnalyzer | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if performance monitoring is supported
  const isSupported = typeof window !== 'undefined' && 
                     'PerformanceObserver' in window;

  /**
   * Initialize performance collectors
   */
  const initializeCollectors = useCallback(() => {
    if (!isSupported) return;

    try {
      // Initialize Web Vitals collector
      if (enableWebVitals && !webVitalsCollectorRef.current) {
        webVitalsCollectorRef.current = new WebVitalsCollector({
          debug: process.env.NODE_ENV === 'development',
          onMetric: (metric) => {
            onMetricUpdate?.(metric);
            // Trigger metrics update when new metric is received
            updateMetrics();
          },
        });
        webVitalsCollectorRef.current.init();
      }

      // Initialize Bundle analyzer
      if (enableBundleAnalysis && !bundleAnalyzerRef.current) {
        bundleAnalyzerRef.current = new BundleAnalyzer({
          trackingEnabled: true,
          onChunkLoaded: () => {
            // Trigger metrics update when new chunk is loaded
            updateMetrics();
          },
          onBudgetExceeded: (report) => {
            console.warn('Performance budget exceeded:', report);
          },
        });
        bundleAnalyzerRef.current.init();
      }
    } catch (error) {
      console.error('Failed to initialize performance collectors:', error);
    }
  }, [isSupported, enableWebVitals, enableBundleAnalysis, onMetricUpdate]);

  /**
   * Update metrics from collectors
   */
  const updateMetrics = useCallback(() => {
    if (!isSupported) return;

    try {
      const webVitalsData: PerformanceMetrics['webVitals'] = {};
      let bundleData: PerformanceMetrics['bundle'] = {
        totalSize: 0,
        gzippedSize: 0,
        loadTime: 0,
        cacheHitRate: 0,
        budgetStatus: 'within-budget',
      };

      // Get Web Vitals data
      if (webVitalsCollectorRef.current) {
        const vitalsMetrics = webVitalsCollectorRef.current.getMetrics();
        webVitalsData.lcp = vitalsMetrics.get('LCP');
        webVitalsData.fid = vitalsMetrics.get('FID');
        webVitalsData.cls = vitalsMetrics.get('CLS');
        webVitalsData.ttfb = vitalsMetrics.get('TTFB');
        webVitalsData.fcp = vitalsMetrics.get('FCP');
        webVitalsData.inp = vitalsMetrics.get('INP');
      }

      // Get Bundle data
      if (bundleAnalyzerRef.current) {
        const bundleReport = bundleAnalyzerRef.current.analyzeBundleSize();
        bundleData = {
          totalSize: bundleReport.totalSize,
          gzippedSize: bundleReport.gzippedSize,
          loadTime: bundleReport.loadTime,
          cacheHitRate: bundleReport.cacheHitRate,
          budgetStatus: bundleReport.performanceBudget.status,
        };
        onBundleUpdate?.(bundleReport);
      }

      // Calculate overall performance score
      const { score, grade } = calculatePerformanceScore(webVitalsData, bundleData);

      setMetrics({
        webVitals: webVitalsData,
        bundle: bundleData,
        score,
        grade,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      console.error('Failed to update performance metrics:', error);
      setMetrics(prev => ({ ...prev, isLoading: false }));
    }
  }, [isSupported, onBundleUpdate]);

  /**
   * Refresh metrics manually
   */
  const refreshMetrics = useCallback(() => {
    updateMetrics();
  }, [updateMetrics]);

  /**
   * Get full performance report
   */
  const getReport = useCallback((): PerformanceReport | null => {
    if (!webVitalsCollectorRef.current) return null;
    return webVitalsCollectorRef.current.reportMetrics();
  }, []);

  /**
   * Get bundle report
   */
  const getBundleReport = useCallback((): BundleReport | null => {
    if (!bundleAnalyzerRef.current) return null;
    return bundleAnalyzerRef.current.analyzeBundleSize();
  }, []);

  // Initialize collectors on mount
  useEffect(() => {
    initializeCollectors();
    updateMetrics();

    return () => {
      // Cleanup on unmount
      if (webVitalsCollectorRef.current) {
        webVitalsCollectorRef.current.destroy();
        webVitalsCollectorRef.current = null;
      }
      if (bundleAnalyzerRef.current) {
        bundleAnalyzerRef.current.destroy();
        bundleAnalyzerRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [initializeCollectors, updateMetrics]);

  // Setup auto-update interval
  useEffect(() => {
    if (autoUpdate && isSupported) {
      intervalRef.current = setInterval(updateMetrics, updateInterval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [autoUpdate, updateInterval, updateMetrics, isSupported]);

  return {
    metrics,
    refreshMetrics,
    getReport,
    getBundleReport,
    isSupported,
  };
}

/**
 * Calculate overall performance score based on Web Vitals and bundle metrics
 */
function calculatePerformanceScore(
  webVitals: PerformanceMetrics['webVitals'],
  bundle: PerformanceMetrics['bundle']
): { score: number; grade: 'A' | 'B' | 'C' | 'D' | 'F' } {
  let totalScore = 0;
  let metricCount = 0;

  // Score Web Vitals (70% weight)
  const webVitalScores: number[] = [];
  
  if (webVitals.lcp) {
    webVitalScores.push(getMetricScore(webVitals.lcp.rating));
  }
  if (webVitals.fid) {
    webVitalScores.push(getMetricScore(webVitals.fid.rating));
  }
  if (webVitals.cls) {
    webVitalScores.push(getMetricScore(webVitals.cls.rating));
  }
  if (webVitals.fcp) {
    webVitalScores.push(getMetricScore(webVitals.fcp.rating));
  }
  if (webVitals.ttfb) {
    webVitalScores.push(getMetricScore(webVitals.ttfb.rating));
  }

  const webVitalsAverage = webVitalScores.length > 0 
    ? webVitalScores.reduce((sum, score) => sum + score, 0) / webVitalScores.length 
    : 0;

  // Score Bundle metrics (30% weight)
  const bundleScore = getBundleScore(bundle.budgetStatus);

  // Calculate weighted score
  const score = Math.round((webVitalsAverage * 0.7) + (bundleScore * 0.3));

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  return { score, grade };
}

/**
 * Get score for individual metric rating
 */
function getMetricScore(rating: 'good' | 'needs-improvement' | 'poor'): number {
  switch (rating) {
    case 'good': return 100;
    case 'needs-improvement': return 70;
    case 'poor': return 40;
    default: return 0;
  }
}

/**
 * Get score for bundle status
 */
function getBundleScore(status: 'within-budget' | 'approaching-limit' | 'over-budget'): number {
  switch (status) {
    case 'within-budget': return 100;
    case 'approaching-limit': return 70;
    case 'over-budget': return 40;
    default: return 0;
  }
}

export default usePerformanceMetrics;