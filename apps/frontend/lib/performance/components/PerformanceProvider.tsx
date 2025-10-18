/**
 * PerformanceProvider - Centralized performance monitoring context
 * 
 * Provides application-wide performance monitoring, data collection,
 * and reporting capabilities through React context.
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { WebVitalsCollector, WebVitalMetric, PerformanceReport } from '../core/WebVitalsCollector';
import { BundleAnalyzer, BundleReport, BudgetReport } from '../core/BundleAnalyzer';
import { RenderMetrics } from '../hooks/useRenderTracking';
import { performanceErrorIntegration } from '../integration/PerformanceErrorIntegration';
import { performanceReporter } from '../reporting/PerformanceReporter';

export interface PerformanceContextValue {
  // Web Vitals
  webVitals: Map<string, WebVitalMetric>;
  webVitalsReport: PerformanceReport | null;
  
  // Bundle Analysis
  bundleReport: BundleReport | null;
  budgetReport: BudgetReport | null;
  
  // Component Tracking
  componentMetrics: Map<string, RenderMetrics>;
  
  // Overall Performance
  performanceScore: number;
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  
  // Status
  isInitialized: boolean;
  isSupported: boolean;
  
  // Actions
  refreshMetrics: () => void;
  trackComponent: (componentName: string, metrics: RenderMetrics) => void;
  reportPerformance: () => PerformanceReport | null;
  
  // Configuration
  config: PerformanceConfig;
  updateConfig: (newConfig: Partial<PerformanceConfig>) => void;
}

export interface PerformanceConfig {
  enableWebVitals: boolean;
  enableBundleAnalysis: boolean;
  enableComponentTracking: boolean;
  enableReporting: boolean;
  reportingInterval: number; // milliseconds
  debug: boolean;
  performanceBudgets: Record<string, number>;
  onPerformanceReport?: (report: PerformanceReport) => void;
  onBudgetExceeded?: (report: BudgetReport) => void;
  onSlowComponent?: (metrics: RenderMetrics) => void;
}

export interface PerformanceProviderProps {
  children: React.ReactNode;
  config?: Partial<PerformanceConfig>;
}

const defaultConfig: PerformanceConfig = {
  enableWebVitals: true,
  enableBundleAnalysis: true,
  enableComponentTracking: process.env.NODE_ENV === 'development',
  enableReporting: true,
  reportingInterval: 30000, // 30 seconds
  debug: process.env.NODE_ENV === 'development',
  performanceBudgets: {
    '/': 150, // 150KB for homepage
    '/dashboard': 200, // 200KB for dashboard
    '/admin': 250, // 250KB for admin
    default: 180, // Default budget
  },
};

const PerformanceContext = createContext<PerformanceContextValue | null>(null);

export function PerformanceProvider({ children, config: userConfig = {} }: PerformanceProviderProps) {
  const [config, setConfig] = useState<PerformanceConfig>({
    ...defaultConfig,
    ...userConfig,
  });

  const [webVitals, setWebVitals] = useState<Map<string, WebVitalMetric>>(new Map());
  const [webVitalsReport, setWebVitalsReport] = useState<PerformanceReport | null>(null);
  const [bundleReport, setBundleReport] = useState<BundleReport | null>(null);
  const [budgetReport, setBudgetReport] = useState<BudgetReport | null>(null);
  const [componentMetrics, setComponentMetrics] = useState<Map<string, RenderMetrics>>(new Map());
  const [performanceScore, setPerformanceScore] = useState(0);
  const [performanceGrade, setPerformanceGrade] = useState<'A' | 'B' | 'C' | 'D' | 'F'>('F');
  const [isInitialized, setIsInitialized] = useState(false);

  const webVitalsCollectorRef = useRef<WebVitalsCollector | null>(null);
  const bundleAnalyzerRef = useRef<BundleAnalyzer | null>(null);
  const reportingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if performance monitoring is supported
  const isSupported = typeof window !== 'undefined' && 'PerformanceObserver' in window;

  /**
   * Initialize performance monitoring systems
   */
  const initializeMonitoring = useCallback(() => {
    if (!isSupported) {
      console.warn('Performance monitoring not supported in this environment');
      return;
    }

    try {
      // Initialize performance error integration
      performanceErrorIntegration.init();

      // Initialize performance reporter
      performanceReporter.init();

      // Initialize Web Vitals collector
      if (config.enableWebVitals && !webVitalsCollectorRef.current) {
        webVitalsCollectorRef.current = new WebVitalsCollector({
          debug: config.debug,
          onMetric: (metric) => {
            setWebVitals(prev => new Map(prev.set(metric.name, metric)));
            
            // Integrate with error tracking
            performanceErrorIntegration.processWebVitalMetric(metric);
            
            if (config.debug) {
              console.log('Web Vital received:', metric);
            }
          },
          onReport: (report) => {
            setWebVitalsReport(report);
            
            // Integrate with error tracking
            performanceErrorIntegration.generatePerformanceReport(report);
            
            config.onPerformanceReport?.(report);
          },
        });
        webVitalsCollectorRef.current.init();
      }

      // Initialize Bundle analyzer
      if (config.enableBundleAnalysis && !bundleAnalyzerRef.current) {
        bundleAnalyzerRef.current = new BundleAnalyzer({
          performanceBudgets: config.performanceBudgets,
          trackingEnabled: true,
          onBudgetExceeded: (report) => {
            setBudgetReport(report);
            
            // Integrate with error tracking
            performanceErrorIntegration.processBudgetReport(report);
            
            config.onBudgetExceeded?.(report);
            
            if (config.debug) {
              console.warn('Performance budget exceeded:', report);
            }
          },
          onChunkLoaded: (chunk) => {
            if (config.debug) {
              console.log('Chunk loaded:', chunk.name, `${Math.round(chunk.size / 1024)}KB`);
            }
          },
        });
        bundleAnalyzerRef.current.init();
      }

      setIsInitialized(true);
      
      if (config.debug) {
        console.log('Performance monitoring initialized');
      }
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error);
    }
  }, [config, isSupported]);

  /**
   * Refresh all performance metrics
   */
  const refreshMetrics = useCallback(() => {
    if (!isSupported || !isInitialized) return;

    try {
      // Update Web Vitals
      if (webVitalsCollectorRef.current) {
        const vitals = webVitalsCollectorRef.current.getMetrics();
        setWebVitals(new Map(vitals));
        
        const report = webVitalsCollectorRef.current.reportMetrics();
        setWebVitalsReport(report);
      }

      // Update Bundle metrics
      if (bundleAnalyzerRef.current) {
        const bundle = bundleAnalyzerRef.current.analyzeBundleSize();
        setBundleReport(bundle);
        
        // Integrate with error tracking
        performanceErrorIntegration.processBundleReport(bundle);
        
        const budget = bundleAnalyzerRef.current.enforcePerformanceBudget();
        setBudgetReport(budget);
      }

      // Calculate overall performance score
      updatePerformanceScore();
    } catch (error) {
      console.error('Failed to refresh performance metrics:', error);
    }
  }, [isSupported, isInitialized]);

  /**
   * Track component performance metrics
   */
  const trackComponent = useCallback((componentName: string, metrics: RenderMetrics) => {
    if (!config.enableComponentTracking) return;

    setComponentMetrics(prev => new Map(prev.set(componentName, metrics)));

    // Integrate with error tracking
    performanceErrorIntegration.processComponentMetrics(componentName, metrics);

    // Check for slow components
    if (metrics.averageRenderTime > 16) { // 60fps threshold
      config.onSlowComponent?.(metrics);
      
      if (config.debug) {
        console.warn(`Slow component detected: ${componentName} (${metrics.averageRenderTime.toFixed(2)}ms avg)`);
      }
    }
  }, [config]);

  /**
   * Generate comprehensive performance report
   */
  const reportPerformance = useCallback((): PerformanceReport | null => {
    if (!webVitalsCollectorRef.current) return null;
    
    const report = webVitalsCollectorRef.current.reportMetrics();
    
    // Add additional context
    const enhancedReport = {
      ...report,
      bundleMetrics: bundleReport,
      componentMetrics: Array.from(componentMetrics.values()),
      overallScore: performanceScore,
      grade: performanceGrade,
    };

    if (config.debug) {
      console.log('Performance report generated:', enhancedReport);
    }

    return report;
  }, [bundleReport, componentMetrics, performanceScore, performanceGrade, config.debug]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<PerformanceConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  /**
   * Calculate overall performance score
   */
  const updatePerformanceScore = useCallback(() => {
    let totalScore = 0;
    let metricCount = 0;

    // Score Web Vitals (60% weight)
    const vitalsArray = Array.from(webVitals.values());
    if (vitalsArray.length > 0) {
      const vitalsScore = vitalsArray.reduce((sum, metric) => {
        const score = metric.rating === 'good' ? 100 : metric.rating === 'needs-improvement' ? 70 : 40;
        return sum + score;
      }, 0) / vitalsArray.length;
      
      totalScore += vitalsScore * 0.6;
      metricCount += 0.6;
    }

    // Score Bundle performance (30% weight)
    if (bundleReport) {
      const bundleScore = bundleReport.performanceBudget.status === 'within-budget' ? 100 :
                         bundleReport.performanceBudget.status === 'approaching-limit' ? 70 : 40;
      
      totalScore += bundleScore * 0.3;
      metricCount += 0.3;
    }

    // Score Component performance (10% weight)
    const components = Array.from(componentMetrics.values());
    if (components.length > 0) {
      const slowComponents = components.filter(c => c.averageRenderTime > 16).length;
      const componentScore = Math.max(0, 100 - (slowComponents / components.length) * 100);
      
      totalScore += componentScore * 0.1;
      metricCount += 0.1;
    }

    const finalScore = metricCount > 0 ? Math.round(totalScore / metricCount) : 0;
    setPerformanceScore(finalScore);

    // Determine grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (finalScore >= 90) grade = 'A';
    else if (finalScore >= 80) grade = 'B';
    else if (finalScore >= 70) grade = 'C';
    else if (finalScore >= 60) grade = 'D';
    else grade = 'F';
    
    setPerformanceGrade(grade);
  }, [webVitals, bundleReport, componentMetrics]);

  // Initialize monitoring on mount
  useEffect(() => {
    initializeMonitoring();
    
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
      if (reportingIntervalRef.current) {
        clearInterval(reportingIntervalRef.current);
        reportingIntervalRef.current = null;
      }
    };
  }, [initializeMonitoring]);

  // Setup periodic reporting
  useEffect(() => {
    if (config.enableReporting && isInitialized) {
      reportingIntervalRef.current = setInterval(() => {
        refreshMetrics();
        reportPerformance();
        
        // Record performance snapshot for trends tracking
        performanceReporter.recordSnapshot(
          webVitals,
          bundleReport || undefined,
          componentMetrics,
          performanceScore,
          performanceGrade
        );
      }, config.reportingInterval);

      return () => {
        if (reportingIntervalRef.current) {
          clearInterval(reportingIntervalRef.current);
          reportingIntervalRef.current = null;
        }
      };
    }
  }, [config.enableReporting, config.reportingInterval, isInitialized, refreshMetrics, reportPerformance, webVitals, bundleReport, componentMetrics, performanceScore, performanceGrade]);

  // Update performance score when metrics change
  useEffect(() => {
    updatePerformanceScore();
  }, [webVitals, bundleReport, componentMetrics, updatePerformanceScore]);

  const contextValue: PerformanceContextValue = {
    webVitals,
    webVitalsReport,
    bundleReport,
    budgetReport,
    componentMetrics,
    performanceScore,
    performanceGrade,
    isInitialized,
    isSupported,
    refreshMetrics,
    trackComponent,
    reportPerformance,
    config,
    updateConfig,
  };

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
}

/**
 * Hook to access performance context
 */
export function usePerformanceContext(): PerformanceContextValue {
  const context = useContext(PerformanceContext);
  
  if (!context) {
    throw new Error('usePerformanceContext must be used within a PerformanceProvider');
  }
  
  return context;
}

/**
 * Hook to access specific performance metrics
 */
export function usePerformanceMetrics() {
  const context = usePerformanceContext();
  
  return {
    webVitals: context.webVitals,
    bundleReport: context.bundleReport,
    performanceScore: context.performanceScore,
    performanceGrade: context.performanceGrade,
    refreshMetrics: context.refreshMetrics,
  };
}

/**
 * Hook to track component performance
 */
export function useComponentTracking(componentName: string) {
  const context = usePerformanceContext();
  
  const trackRender = useCallback((metrics: RenderMetrics) => {
    context.trackComponent(componentName, metrics);
  }, [context, componentName]);
  
  const getMetrics = useCallback(() => {
    return context.componentMetrics.get(componentName);
  }, [context.componentMetrics, componentName]);
  
  return {
    trackRender,
    getMetrics,
    isEnabled: context.config.enableComponentTracking,
  };
}

export default PerformanceProvider;