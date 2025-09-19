/**
 * Performance monitoring utilities for animations and interactions
 */

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage?: number;
  isLowPerformance: boolean;
  timestamp: number;
}

export interface PerformanceThresholds {
  minFPS: number;
  maxFrameTime: number;
  memoryThreshold?: number;
}

class PerformanceMonitor {
  private isMonitoring = false;
  private frameCount = 0;
  private lastTime = 0;
  private frameTimeSum = 0;
  private callbacks: Array<(metrics: PerformanceMetrics) => void> = [];
  private animationFrameId: number | null = null;
  
  private readonly defaultThresholds: PerformanceThresholds = {
    minFPS: 30,
    maxFrameTime: 33.33, // ~30 FPS
    memoryThreshold: 50 * 1024 * 1024, // 50MB
  };

  private thresholds: PerformanceThresholds;

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = { ...this.defaultThresholds, ...thresholds };
  }

  /**
   * Start monitoring performance
   */
  start(): void {
    if (this.isMonitoring || typeof window === 'undefined') return;
    
    this.isMonitoring = true;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.frameTimeSum = 0;
    
    this.monitorFrame();
  }

  /**
   * Stop monitoring performance
   */
  stop(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Add a callback to receive performance metrics
   */
  onMetrics(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    const fps = this.frameCount > 0 ? 1000 / (this.frameTimeSum / this.frameCount) : 0;
    const frameTime = this.frameCount > 0 ? this.frameTimeSum / this.frameCount : 0;
    
    let memoryUsage: number | undefined;
    if ('memory' in performance) {
      memoryUsage = (performance as any).memory.usedJSHeapSize;
    }

    const isLowPerformance = this.isLowPerformance(fps, frameTime, memoryUsage);

    return {
      fps,
      frameTime,
      memoryUsage,
      isLowPerformance,
      timestamp: now,
    };
  }

  /**
   * Check if current performance is considered low
   */
  private isLowPerformance(fps: number, frameTime: number, memoryUsage?: number): boolean {
    if (fps < this.thresholds.minFPS) return true;
    if (frameTime > this.thresholds.maxFrameTime) return true;
    if (memoryUsage && this.thresholds.memoryThreshold && memoryUsage > this.thresholds.memoryThreshold) {
      return true;
    }
    return false;
  }

  /**
   * Monitor frame performance
   */
  private monitorFrame = (): void => {
    if (!this.isMonitoring) return;

    const now = performance.now();
    const deltaTime = now - this.lastTime;
    
    this.frameCount++;
    this.frameTimeSum += deltaTime;
    
    // Report metrics every 60 frames (roughly every second at 60fps)
    if (this.frameCount >= 60) {
      const metrics = this.getCurrentMetrics();
      this.notifyCallbacks(metrics);
      
      // Reset counters
      this.frameCount = 0;
      this.frameTimeSum = 0;
    }
    
    this.lastTime = now;
    this.animationFrameId = requestAnimationFrame(this.monitorFrame);
  };

  /**
   * Notify all callbacks with current metrics
   */
  private notifyCallbacks(metrics: PerformanceMetrics): void {
    this.callbacks.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error('Error in performance metrics callback:', error);
      }
    });
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Get performance budget recommendations based on device capabilities
   */
  getPerformanceBudget(): PerformanceThresholds {
    if (typeof window === 'undefined') return this.defaultThresholds;

    // Detect device capabilities
    const isLowEndDevice = this.detectLowEndDevice();
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isLowEndDevice) {
      return {
        minFPS: 20,
        maxFrameTime: 50, // 20 FPS
        memoryThreshold: 25 * 1024 * 1024, // 25MB
      };
    }
    
    if (isMobile) {
      return {
        minFPS: 30,
        maxFrameTime: 33.33, // 30 FPS
        memoryThreshold: 40 * 1024 * 1024, // 40MB
      };
    }
    
    return this.defaultThresholds;
  }

  /**
   * Detect if device is low-end based on available information
   */
  private detectLowEndDevice(): boolean {
    if (typeof window === 'undefined') return false;

    // Check hardware concurrency (CPU cores)
    const cores = navigator.hardwareConcurrency || 1;
    if (cores <= 2) return true;

    // Check memory (if available)
    if ('deviceMemory' in navigator) {
      const memory = (navigator as any).deviceMemory;
      if (memory <= 2) return true; // 2GB or less
    }

    // Check connection speed (if available)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        return true;
      }
    }

    return false;
  }
}

// Animation-specific performance monitoring
export class AnimationPerformanceMonitor extends PerformanceMonitor {
  private animationComplexity = 0;
  private maxComplexity = 10;

  /**
   * Register an animation with its complexity level
   */
  registerAnimation(complexity: number = 1): void {
    this.animationComplexity += complexity;
    
    // Auto-adjust thresholds based on complexity
    if (this.animationComplexity > this.maxComplexity) {
      this.updateThresholds({
        minFPS: Math.max(15, this.thresholds.minFPS - 5),
        maxFrameTime: Math.min(66.67, this.thresholds.maxFrameTime + 16.67),
      });
    }
  }

  /**
   * Unregister an animation
   */
  unregisterAnimation(complexity: number = 1): void {
    this.animationComplexity = Math.max(0, this.animationComplexity - complexity);
    
    // Restore thresholds if complexity decreased
    if (this.animationComplexity <= this.maxComplexity) {
      const budget = this.getPerformanceBudget();
      this.updateThresholds(budget);
    }
  }

  /**
   * Get recommended animation settings based on current performance
   */
  getAnimationSettings(): {
    enableAnimations: boolean;
    reduceComplexity: boolean;
    useHardwareAcceleration: boolean;
    maxConcurrentAnimations: number;
  } {
    const metrics = this.getCurrentMetrics();
    
    return {
      enableAnimations: !metrics.isLowPerformance,
      reduceComplexity: metrics.fps < 45,
      useHardwareAcceleration: metrics.fps > 30,
      maxConcurrentAnimations: metrics.isLowPerformance ? 2 : 5,
    };
  }
}

// Export singleton instances
export const performanceMonitor = new PerformanceMonitor();
export const animationPerformanceMonitor = new AnimationPerformanceMonitor();

// Utility functions
export function measurePerformance<T>(
  fn: () => T,
  label?: string
): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  if (label) {
    console.log(`${label}: ${duration.toFixed(2)}ms`);
  }
  
  return { result, duration };
}

export async function measureAsyncPerformance<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  if (label) {
    console.log(`${label}: ${duration.toFixed(2)}ms`);
  }
  
  return { result, duration };
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  if (typeof window === 'undefined') {
    return {
      metrics: null,
      isLowPerformance: false,
      startMonitoring: () => {},
      stopMonitoring: () => {},
    };
  }

  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);

  React.useEffect(() => {
    const unsubscribe = performanceMonitor.onMetrics(setMetrics);
    performanceMonitor.start();

    return () => {
      unsubscribe();
      performanceMonitor.stop();
    };
  }, []);

  return {
    metrics,
    isLowPerformance: metrics?.isLowPerformance ?? false,
    startMonitoring: () => performanceMonitor.start(),
    stopMonitoring: () => performanceMonitor.stop(),
  };
}

// Import React for the hook
import React from 'react';