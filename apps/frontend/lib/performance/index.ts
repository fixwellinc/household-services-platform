/**
 * Performance Monitoring System - Main Export
 * 
 * Centralized exports for all performance monitoring components,
 * hooks, and utilities.
 */

// Core collectors
export { 
  WebVitalsCollector, 
  webVitalsCollector,
  type WebVitalMetric,
  type PerformanceReport,
  type WebVitalsConfig 
} from './core/WebVitalsCollector';

export { 
  BundleAnalyzer, 
  bundleAnalyzer,
  type ChunkMetrics,
  type BundleReport,
  type BudgetReport,
  type BundleConfig 
} from './core/BundleAnalyzer';

// Hooks
export { 
  usePerformanceMetrics,
  type UsePerformanceMetricsOptions,
  type UsePerformanceMetricsReturn,
  type PerformanceMetrics 
} from './hooks/usePerformanceMetrics';

export { 
  useRenderTracking,
  withRenderTracking,
  useMultiComponentTracking,
  PerformanceProfiler,
  type RenderMetrics,
  type RenderTrackingOptions,
  type UseRenderTrackingReturn,
  type PerformanceProfilerProps 
} from './hooks/useRenderTracking';

// Context and Provider
export { 
  PerformanceProvider,
  usePerformanceContext,
  useComponentTracking,
  type PerformanceContextValue,
  type PerformanceConfig,
  type PerformanceProviderProps 
} from './components/PerformanceProvider';

// Integration and Reporting
export { 
  PerformanceErrorIntegration,
  performanceErrorIntegration,
  type PerformanceThresholds,
  type PerformanceRegressionAlert,
  type PerformanceIntegrationConfig 
} from './integration/PerformanceErrorIntegration';

export { 
  PerformanceReporter,
  performanceReporter,
  type PerformanceSnapshot,
  type PerformanceTrend,
  type PerformanceAlert,
  type ReportingConfig 
} from './reporting/PerformanceReporter';

export { TrendsDashboard } from './reporting/TrendsDashboard';

// Debug Tools (development only)
export { 
  PerformanceDebugger,
  PerformanceChart,
  PerformanceProfiler,
  PerformanceDevTools 
} from './debug';

// Re-export singleton instances for convenience
export const performanceMonitoring = {
  webVitals: webVitalsCollector,
  bundle: bundleAnalyzer,
  errorIntegration: performanceErrorIntegration,
  reporter: performanceReporter,
};

export default performanceMonitoring;