/**
 * PerformanceDebugger - Development-only performance debugging component
 * 
 * Provides real-time performance metrics visualization and debugging tools
 * for developers to identify and resolve performance issues.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePerformanceContext } from '../components/PerformanceProvider';
import { performanceErrorIntegration } from '../integration/PerformanceErrorIntegration';

interface DebuggerProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  minimized?: boolean;
  showOnlyIssues?: boolean;
}

interface PerformanceIssue {
  type: 'web-vital' | 'bundle' | 'component';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

export function PerformanceDebugger({ 
  position = 'bottom-right', 
  minimized: initialMinimized = true,
  showOnlyIssues = false 
}: DebuggerProps) {
  const {
    webVitals,
    bundleReport,
    componentMetrics,
    performanceScore,
    performanceGrade,
    isInitialized,
    refreshMetrics,
  } = usePerformanceContext();

  const [minimized, setMinimized] = useState(initialMinimized);
  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'bundle' | 'components' | 'issues'>('overview');
  const [issues, setIssues] = useState<PerformanceIssue[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Position styles
  const positionStyles = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  // Auto-refresh metrics
  useEffect(() => {
    if (autoRefresh && !minimized) {
      intervalRef.current = setInterval(() => {
        refreshMetrics();
      }, 5000); // Refresh every 5 seconds

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefresh, minimized, refreshMetrics]);

  // Detect performance issues
  useEffect(() => {
    const newIssues: PerformanceIssue[] = [];

    // Check Web Vitals
    webVitals.forEach((metric) => {
      if (metric.rating === 'poor') {
        newIssues.push({
          type: 'web-vital',
          severity: 'critical',
          message: `${metric.name}: ${metric.value.toFixed(2)}ms (Poor)`,
          value: metric.value,
          threshold: getWebVitalThreshold(metric.name),
          timestamp: metric.timestamp,
        });
      } else if (metric.rating === 'needs-improvement') {
        newIssues.push({
          type: 'web-vital',
          severity: 'warning',
          message: `${metric.name}: ${metric.value.toFixed(2)}ms (Needs Improvement)`,
          value: metric.value,
          threshold: getWebVitalThreshold(metric.name),
          timestamp: metric.timestamp,
        });
      }
    });

    // Check Bundle issues
    if (bundleReport) {
      const sizeKB = Math.round(bundleReport.totalSize / 1024);
      if (bundleReport.performanceBudget.status === 'over-budget') {
        newIssues.push({
          type: 'bundle',
          severity: 'critical',
          message: `Bundle size: ${sizeKB}KB exceeds budget (${bundleReport.performanceBudget.limit}KB)`,
          value: sizeKB,
          threshold: bundleReport.performanceBudget.limit,
          timestamp: bundleReport.timestamp,
        });
      } else if (bundleReport.performanceBudget.status === 'approaching-limit') {
        newIssues.push({
          type: 'bundle',
          severity: 'warning',
          message: `Bundle size: ${sizeKB}KB approaching budget limit (${bundleReport.performanceBudget.limit}KB)`,
          value: sizeKB,
          threshold: bundleReport.performanceBudget.limit,
          timestamp: bundleReport.timestamp,
        });
      }
    }

    // Check Component issues
    componentMetrics.forEach((metrics, componentName) => {
      if (metrics.averageRenderTime > 33) { // 30fps threshold
        newIssues.push({
          type: 'component',
          severity: 'critical',
          message: `${componentName}: ${metrics.averageRenderTime.toFixed(2)}ms avg render time`,
          value: metrics.averageRenderTime,
          threshold: 16, // 60fps threshold
          timestamp: Date.now(),
        });
      } else if (metrics.averageRenderTime > 16) { // 60fps threshold
        newIssues.push({
          type: 'component',
          severity: 'warning',
          message: `${componentName}: ${metrics.averageRenderTime.toFixed(2)}ms avg render time`,
          value: metrics.averageRenderTime,
          threshold: 16,
          timestamp: Date.now(),
        });
      }
    });

    setIssues(newIssues);
  }, [webVitals, bundleReport, componentMetrics]);

  const getWebVitalThreshold = (name: string): number => {
    const thresholds: Record<string, number> = {
      LCP: 2500,
      FID: 100,
      CLS: 0.1,
      TTFB: 800,
      FCP: 1800,
    };
    return thresholds[name] || 0;
  };

  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case 'A': return 'text-green-500';
      case 'B': return 'text-blue-500';
      case 'C': return 'text-yellow-500';
      case 'D': return 'text-orange-500';
      case 'F': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getSeverityColor = (severity: string): string => {
    return severity === 'critical' ? 'text-red-500' : 'text-yellow-500';
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'web-vital': return '⚡';
      case 'bundle': return '📦';
      case 'component': return '🧩';
      default: return '⚠️';
    }
  };

  if (showOnlyIssues && issues.length === 0) {
    return null;
  }

  return (
    <div className={`fixed ${positionStyles[position]} z-50 font-mono text-xs`}>
      {minimized ? (
        <button
          onClick={() => setMinimized(false)}
          className={`
            bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg border border-gray-700
            hover:bg-gray-800 transition-colors flex items-center gap-2
            ${issues.length > 0 ? 'border-red-500' : ''}
          `}
        >
          <span className={`text-lg ${getGradeColor(performanceGrade)}`}>
            {performanceGrade}
          </span>
          <span>{performanceScore}</span>
          {issues.length > 0 && (
            <span className="bg-red-500 text-white px-1 rounded text-xs">
              {issues.length}
            </span>
          )}
        </button>
      ) : (
        <div className="bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700 w-96 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-blue-400">🔍</span>
              <span className="font-semibold">Performance Debugger</span>
              <span className={`text-lg ${getGradeColor(performanceGrade)}`}>
                {performanceGrade}
              </span>
              <span className="text-gray-400">({performanceScore})</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-2 py-1 rounded text-xs ${
                  autoRefresh ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                {autoRefresh ? '🔄' : '⏸️'}
              </button>
              <button
                onClick={() => setMinimized(true)}
                className="text-gray-400 hover:text-white"
              >
                ➖
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            {['overview', 'vitals', 'bundle', 'components', 'issues'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`
                  px-3 py-2 text-xs capitalize border-r border-gray-700 last:border-r-0
                  ${activeTab === tab ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}
                  ${tab === 'issues' && issues.length > 0 ? 'text-red-400' : ''}
                `}
              >
                {tab}
                {tab === 'issues' && issues.length > 0 && (
                  <span className="ml-1 bg-red-500 text-white px-1 rounded text-xs">
                    {issues.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-3 max-h-64 overflow-y-auto">
            {!isInitialized ? (
              <div className="text-gray-400 text-center py-4">
                Initializing performance monitoring...
              </div>
            ) : (
              <>
                {activeTab === 'overview' && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Score:</span>
                      <span className={getGradeColor(performanceGrade)}>
                        {performanceScore} ({performanceGrade})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Web Vitals:</span>
                      <span>{webVitals.size} metrics</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bundle Size:</span>
                      <span>
                        {bundleReport ? `${Math.round(bundleReport.totalSize / 1024)}KB` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Components:</span>
                      <span>{componentMetrics.size} tracked</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Issues:</span>
                      <span className={issues.length > 0 ? 'text-red-400' : 'text-green-400'}>
                        {issues.length}
                      </span>
                    </div>
                  </div>
                )}

                {activeTab === 'vitals' && (
                  <div className="space-y-2">
                    {Array.from(webVitals.values()).map((metric) => (
                      <div key={metric.name} className="flex justify-between items-center">
                        <span>{metric.name}:</span>
                        <div className="flex items-center gap-2">
                          <span>{metric.value.toFixed(2)}ms</span>
                          <span className={`
                            px-1 rounded text-xs
                            ${metric.rating === 'good' ? 'bg-green-600' : 
                              metric.rating === 'needs-improvement' ? 'bg-yellow-600' : 'bg-red-600'}
                          `}>
                            {metric.rating === 'good' ? '✓' : 
                             metric.rating === 'needs-improvement' ? '⚠' : '✗'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {webVitals.size === 0 && (
                      <div className="text-gray-400 text-center">No Web Vitals data yet</div>
                    )}
                  </div>
                )}

                {activeTab === 'bundle' && (
                  <div className="space-y-2">
                    {bundleReport ? (
                      <>
                        <div className="flex justify-between">
                          <span>Total Size:</span>
                          <span>{Math.round(bundleReport.totalSize / 1024)}KB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Gzipped:</span>
                          <span>{Math.round(bundleReport.gzippedSize / 1024)}KB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Load Time:</span>
                          <span>{bundleReport.loadTime.toFixed(2)}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cache Hit Rate:</span>
                          <span>{(bundleReport.cacheHitRate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Budget Status:</span>
                          <span className={`
                            ${bundleReport.performanceBudget.status === 'within-budget' ? 'text-green-400' :
                              bundleReport.performanceBudget.status === 'approaching-limit' ? 'text-yellow-400' : 'text-red-400'}
                          `}>
                            {bundleReport.performanceBudget.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                          Chunks: {bundleReport.chunks.length}
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-400 text-center">No bundle data yet</div>
                    )}
                  </div>
                )}

                {activeTab === 'components' && (
                  <div className="space-y-2">
                    {Array.from(componentMetrics.entries()).map(([name, metrics]) => (
                      <div key={name} className="border-b border-gray-700 pb-2 last:border-b-0">
                        <div className="flex justify-between items-center">
                          <span className="truncate max-w-48">{name}:</span>
                          <span className={`
                            ${metrics.averageRenderTime > 16 ? 'text-red-400' : 'text-green-400'}
                          `}>
                            {metrics.averageRenderTime.toFixed(2)}ms
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 flex justify-between">
                          <span>Renders: {metrics.renderCount}</span>
                          <span>Max: {metrics.slowestRenderTime.toFixed(2)}ms</span>
                        </div>
                      </div>
                    ))}
                    {componentMetrics.size === 0 && (
                      <div className="text-gray-400 text-center">No component data yet</div>
                    )}
                  </div>
                )}

                {activeTab === 'issues' && (
                  <div className="space-y-2">
                    {issues.map((issue, index) => (
                      <div key={index} className="border-b border-gray-700 pb-2 last:border-b-0">
                        <div className="flex items-center gap-2">
                          <span>{getTypeIcon(issue.type)}</span>
                          <span className={getSeverityColor(issue.severity)}>
                            {issue.severity.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs mt-1">{issue.message}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Threshold: {issue.threshold} | Current: {issue.value.toFixed(2)}
                        </div>
                      </div>
                    ))}
                    {issues.length === 0 && (
                      <div className="text-green-400 text-center">
                        ✓ No performance issues detected
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-700 p-2 text-xs text-gray-400 flex justify-between">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            <button
              onClick={refreshMetrics}
              className="text-blue-400 hover:text-blue-300"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PerformanceDebugger;