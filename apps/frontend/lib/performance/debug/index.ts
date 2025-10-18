/**
 * Performance Debugging Tools
 * 
 * Development-only tools for performance monitoring, visualization,
 * and debugging. These components help developers identify and resolve
 * performance issues during development.
 */

export { PerformanceDebugger } from './PerformanceDebugger';
export { PerformanceChart } from './PerformanceChart';
export { PerformanceProfiler } from './PerformanceProfiler';

// Re-export for convenience
export { usePerformanceContext, usePerformanceMetrics, useComponentTracking } from '../components/PerformanceProvider';
export { performanceErrorIntegration } from '../integration/PerformanceErrorIntegration';

// Development-only wrapper component
import React from 'react';
import { PerformanceDebugger } from './PerformanceDebugger';

export function PerformanceDevTools() {
  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return React.createElement(PerformanceDebugger, { position: 'bottom-right' });
}

export default {
  PerformanceDebugger,
  PerformanceChart,
  PerformanceProfiler,
  PerformanceDevTools,
};