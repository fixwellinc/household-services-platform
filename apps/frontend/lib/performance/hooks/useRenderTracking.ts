/**
 * useRenderTracking - Hook for tracking component render performance
 * 
 * Provides detailed tracking of component render times, re-render counts,
 * and performance metrics for optimization insights.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

export interface RenderMetrics {
  componentName: string;
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  lastRenderTime: number;
  slowestRenderTime: number;
  fastestRenderTime: number;
  memoryUsage?: number;
  timestamp: number;
}

export interface RenderTrackingOptions {
  componentName?: string;
  enableMemoryTracking?: boolean;
  slowRenderThreshold?: number; // milliseconds
  onSlowRender?: (metrics: RenderMetrics) => void;
  onRenderComplete?: (metrics: RenderMetrics) => void;
  trackingEnabled?: boolean;
}

export interface UseRenderTrackingReturn {
  metrics: RenderMetrics;
  startRender: () => void;
  endRender: () => void;
  resetMetrics: () => void;
  isTracking: boolean;
}

export function useRenderTracking(
  options: RenderTrackingOptions = {}
): UseRenderTrackingReturn {
  const {
    componentName = 'UnnamedComponent',
    enableMemoryTracking = false,
    slowRenderThreshold = 16, // 16ms (60fps threshold)
    onSlowRender,
    onRenderComplete,
    trackingEnabled = process.env.NODE_ENV === 'development',
  } = options;

  const [metrics, setMetrics] = useState<RenderMetrics>({
    componentName,
    renderCount: 0,
    totalRenderTime: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    slowestRenderTime: 0,
    fastestRenderTime: Infinity,
    timestamp: Date.now(),
  });

  const renderStartTimeRef = useRef<number | null>(null);
  const isTrackingRef = useRef(false);
  const renderTimesRef = useRef<number[]>([]);

  /**
   * Start tracking a render cycle
   */
  const startRender = useCallback(() => {
    if (!trackingEnabled) return;

    renderStartTimeRef.current = performance.now();
    isTrackingRef.current = true;
  }, [trackingEnabled]);

  /**
   * End tracking a render cycle and update metrics
   */
  const endRender = useCallback(() => {
    if (!trackingEnabled || !isTrackingRef.current || renderStartTimeRef.current === null) {
      return;
    }

    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTimeRef.current;
    
    // Update render times array
    renderTimesRef.current.push(renderTime);
    
    // Keep only last 100 render times for memory efficiency
    if (renderTimesRef.current.length > 100) {
      renderTimesRef.current = renderTimesRef.current.slice(-100);
    }

    const newMetrics: RenderMetrics = {
      componentName,
      renderCount: metrics.renderCount + 1,
      totalRenderTime: metrics.totalRenderTime + renderTime,
      averageRenderTime: (metrics.totalRenderTime + renderTime) / (metrics.renderCount + 1),
      lastRenderTime: renderTime,
      slowestRenderTime: Math.max(metrics.slowestRenderTime, renderTime),
      fastestRenderTime: Math.min(metrics.fastestRenderTime === Infinity ? renderTime : metrics.fastestRenderTime, renderTime),
      timestamp: Date.now(),
    };

    // Add memory usage if enabled
    if (enableMemoryTracking && 'memory' in performance) {
      const memoryInfo = (performance as any).memory;
      newMetrics.memoryUsage = memoryInfo.usedJSHeapSize;
    }

    setMetrics(newMetrics);

    // Check for slow render
    if (renderTime > slowRenderThreshold) {
      onSlowRender?.(newMetrics);
      
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms (threshold: ${slowRenderThreshold}ms)`
        );
      }
    }

    // Notify render completion
    onRenderComplete?.(newMetrics);

    // Reset tracking state
    renderStartTimeRef.current = null;
    isTrackingRef.current = false;
  }, [
    trackingEnabled,
    componentName,
    metrics,
    enableMemoryTracking,
    slowRenderThreshold,
    onSlowRender,
    onRenderComplete,
  ]);

  /**
   * Reset all metrics
   */
  const resetMetrics = useCallback(() => {
    setMetrics({
      componentName,
      renderCount: 0,
      totalRenderTime: 0,
      averageRenderTime: 0,
      lastRenderTime: 0,
      slowestRenderTime: 0,
      fastestRenderTime: Infinity,
      timestamp: Date.now(),
    });
    renderTimesRef.current = [];
  }, [componentName]);

  // Auto-track renders using useEffect
  useEffect(() => {
    if (trackingEnabled) {
      startRender();
      return () => {
        endRender();
      };
    }
  });

  return {
    metrics,
    startRender,
    endRender,
    resetMetrics,
    isTracking: isTrackingRef.current,
  };
}

/**
 * Higher-order component for automatic render tracking
 */
export function withRenderTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: RenderTrackingOptions = {}
): React.ComponentType<P> {
  const componentName = options.componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const TrackedComponent = (props: P) => {
    const { startRender, endRender } = useRenderTracking({
      ...options,
      componentName,
    });

    useEffect(() => {
      startRender();
      return () => {
        endRender();
      };
    });

    return React.createElement(WrappedComponent, props);
  };

  TrackedComponent.displayName = `withRenderTracking(${componentName})`;
  return TrackedComponent;
}

/**
 * Hook for tracking multiple components' render performance
 */
export function useMultiComponentTracking() {
  const [componentsMetrics, setComponentsMetrics] = useState<Map<string, RenderMetrics>>(new Map());

  const trackComponent = useCallback((componentName: string, options: RenderTrackingOptions = {}) => {
    return useRenderTracking({
      ...options,
      componentName,
      onRenderComplete: (metrics) => {
        setComponentsMetrics(prev => new Map(prev.set(componentName, metrics)));
        options.onRenderComplete?.(metrics);
      },
    });
  }, []);

  const getComponentMetrics = useCallback((componentName: string): RenderMetrics | undefined => {
    return componentsMetrics.get(componentName);
  }, [componentsMetrics]);

  const getAllMetrics = useCallback((): RenderMetrics[] => {
    return Array.from(componentsMetrics.values());
  }, [componentsMetrics]);

  const getSlowComponents = useCallback((threshold?: number): RenderMetrics[] => {
    const thresholdValue = threshold || 16;
    return Array.from(componentsMetrics.values())
      .filter(metrics => metrics.averageRenderTime > thresholdValue)
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime);
  }, [componentsMetrics]);

  const getTotalRenderTime = useCallback((): number => {
    return Array.from(componentsMetrics.values())
      .reduce((total, metrics) => total + metrics.totalRenderTime, 0);
  }, [componentsMetrics]);

  const resetAllMetrics = useCallback(() => {
    setComponentsMetrics(new Map());
  }, []);

  return {
    trackComponent,
    getComponentMetrics,
    getAllMetrics,
    getSlowComponents,
    getTotalRenderTime,
    resetAllMetrics,
    componentsCount: componentsMetrics.size,
  };
}

/**
 * Performance profiler component for wrapping and tracking child components
 */
export interface PerformanceProfilerProps {
  id: string;
  children: React.ReactNode;
  onRender?: (id: string, phase: 'mount' | 'update', actualDuration: number) => void;
  enableLogging?: boolean;
}

export function PerformanceProfiler({ 
  id, 
  children, 
  onRender,
  enableLogging = process.env.NODE_ENV === 'development' 
}: PerformanceProfilerProps) {
  const handleRender = useCallback((
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    if (enableLogging) {
      console.log(`Component ${id} ${phase}:`, {
        actualDuration: `${actualDuration.toFixed(2)}ms`,
        baseDuration: `${baseDuration.toFixed(2)}ms`,
        startTime: `${startTime.toFixed(2)}ms`,
        commitTime: `${commitTime.toFixed(2)}ms`,
      });
    }

    onRender?.(id, phase, actualDuration);
  }, [onRender, enableLogging]);

  // Use React's built-in Profiler if available
  if (typeof React !== 'undefined' && 'Profiler' in React) {
    const ProfilerComponent = (React as any).Profiler;
    return React.createElement(
      ProfilerComponent,
      { id, onRender: handleRender },
      children
    );
  }

  // Fallback to simple wrapper
  return children as React.ReactElement;
}

export default useRenderTracking;