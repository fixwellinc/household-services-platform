/**
 * Performance Monitoring Example
 * 
 * Demonstrates how to use the performance monitoring system
 * in a React component.
 */

'use client';

import React from 'react';
import { 
  PerformanceProvider, 
  usePerformanceMetrics, 
  useRenderTracking,
  PerformanceProfiler 
} from '../index';

// Example component that uses render tracking
function ExampleComponent() {
  const { metrics } = useRenderTracking({
    componentName: 'ExampleComponent',
    slowRenderThreshold: 16,
    onSlowRender: (metrics) => {
      console.warn('Slow render detected:', metrics);
    },
  });

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-semibold">Example Component</h3>
      <p>Render count: {metrics.renderCount}</p>
      <p>Average render time: {metrics.averageRenderTime.toFixed(2)}ms</p>
      <p>Last render time: {metrics.lastRenderTime.toFixed(2)}ms</p>
    </div>
  );
}

// Example component that displays performance metrics
function PerformanceDashboard() {
  const { metrics, refreshMetrics } = usePerformanceMetrics({
    autoUpdate: true,
    updateInterval: 5000,
  });

  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Performance Dashboard</h2>
        <button 
          onClick={refreshMetrics}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Metrics
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Performance Score */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold text-gray-700">Performance Score</h3>
          <div className="text-2xl font-bold text-blue-600">
            {metrics.score} ({metrics.grade})
          </div>
        </div>

        {/* Web Vitals */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold text-gray-700">Web Vitals</h3>
          <div className="space-y-1 text-sm">
            {metrics.webVitals.lcp && (
              <div>LCP: {metrics.webVitals.lcp.value.toFixed(0)}ms ({metrics.webVitals.lcp.rating})</div>
            )}
            {metrics.webVitals.fid && (
              <div>FID: {metrics.webVitals.fid.value.toFixed(0)}ms ({metrics.webVitals.fid.rating})</div>
            )}
            {metrics.webVitals.cls && (
              <div>CLS: {metrics.webVitals.cls.value.toFixed(3)} ({metrics.webVitals.cls.rating})</div>
            )}
          </div>
        </div>

        {/* Bundle Info */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold text-gray-700">Bundle Size</h3>
          <div className="space-y-1 text-sm">
            <div>Total: {Math.round(metrics.bundle.totalSize / 1024)}KB</div>
            <div>Gzipped: {Math.round(metrics.bundle.gzippedSize / 1024)}KB</div>
            <div>Status: {metrics.bundle.budgetStatus}</div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {metrics.isLoading && (
        <div className="mt-4 text-center text-gray-500">
          Loading performance metrics...
        </div>
      )}
    </div>
  );
}

// Main example component with provider
export function PerformanceMonitoringExample() {
  return (
    <PerformanceProvider
      config={{
        enableWebVitals: true,
        enableBundleAnalysis: true,
        enableComponentTracking: true,
        debug: true,
        performanceBudgets: {
          '/': 150,
          '/dashboard': 200,
          default: 180,
        },
        onPerformanceReport: (report) => {
          console.log('Performance report:', report);
        },
        onBudgetExceeded: (report) => {
          console.warn('Budget exceeded:', report);
        },
      }}
    >
      <div className="space-y-6">
        <PerformanceDashboard />
        
        <PerformanceProfiler id="example-section" enableLogging={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ExampleComponent />
            <ExampleComponent />
          </div>
        </PerformanceProfiler>
      </div>
    </PerformanceProvider>
  );
}

export default PerformanceMonitoringExample;