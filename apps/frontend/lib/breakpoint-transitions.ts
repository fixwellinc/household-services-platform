'use client';

import { useEffect, useState } from 'react';

export interface BreakpointConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

export const defaultBreakpoints: BreakpointConfig = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export type BreakpointKey = keyof BreakpointConfig;

export interface TransitionConfig {
  duration: number;
  easing: string;
  property: string;
}

export const defaultTransitions: Record<string, TransitionConfig> = {
  layout: {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    property: 'all',
  },
  spacing: {
    duration: 250,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    property: 'padding, margin, gap',
  },
  typography: {
    duration: 200,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    property: 'font-size, line-height, letter-spacing',
  },
  grid: {
    duration: 350,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    property: 'grid-template-columns, grid-template-rows, gap',
  },
  flex: {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    property: 'flex-direction, justify-content, align-items, gap',
  },
};

export class BreakpointTransitionManager {
  private breakpoints: BreakpointConfig;
  private transitions: Record<string, TransitionConfig>;
  private currentBreakpoint: BreakpointKey = 'xs';
  private listeners: Set<(breakpoint: BreakpointKey) => void> = new Set();
  private resizeTimeout: NodeJS.Timeout | null = null;

  constructor(
    breakpoints: BreakpointConfig = defaultBreakpoints,
    transitions: Record<string, TransitionConfig> = defaultTransitions
  ) {
    this.breakpoints = breakpoints;
    this.transitions = transitions;
    
    if (typeof window !== 'undefined') {
      this.updateBreakpoint();
      window.addEventListener('resize', this.handleResize);
    }
  }

  private handleResize = () => {
    // Debounce resize events for better performance
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    this.resizeTimeout = setTimeout(() => {
      this.updateBreakpoint();
    }, 16); // ~60fps
  };

  private updateBreakpoint() {
    const width = window.innerWidth;
    let newBreakpoint: BreakpointKey = 'xs';

    // Find the largest breakpoint that the current width exceeds
    const sortedBreakpoints = Object.entries(this.breakpoints)
      .sort(([, a], [, b]) => b - a) as [BreakpointKey, number][];

    for (const [key, value] of sortedBreakpoints) {
      if (width >= value) {
        newBreakpoint = key;
        break;
      }
    }

    if (newBreakpoint !== this.currentBreakpoint) {
      const previousBreakpoint = this.currentBreakpoint;
      this.currentBreakpoint = newBreakpoint;
      
      // Notify listeners
      this.listeners.forEach(listener => listener(newBreakpoint));
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('breakpointChange', {
        detail: {
          current: newBreakpoint,
          previous: previousBreakpoint,
          width,
        },
      }));
    }
  }

  getCurrentBreakpoint(): BreakpointKey {
    return this.currentBreakpoint;
  }

  subscribe(listener: (breakpoint: BreakpointKey) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getTransitionCSS(type: string = 'layout'): string {
    const config = this.transitions[type] || this.transitions.layout;
    return `transition: ${config.property} ${config.duration}ms ${config.easing};`;
  }

  generateResponsiveCSS(
    property: string,
    values: Partial<Record<BreakpointKey, string | number>>,
    unit: string = ''
  ): string {
    let css = '';
    
    // Base value (xs)
    if (values.xs !== undefined) {
      css += `${property}: ${values.xs}${unit};\n`;
    }

    // Media queries for larger breakpoints
    Object.entries(this.breakpoints).forEach(([key, breakpoint]) => {
      if (key !== 'xs' && values[key as BreakpointKey] !== undefined) {
        css += `@media (min-width: ${breakpoint}px) {\n`;
        css += `  ${property}: ${values[key as BreakpointKey]}${unit};\n`;
        css += `}\n`;
      }
    });

    return css;
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize);
    }
    
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    this.listeners.clear();
  }
}

// Global instance
let globalManager: BreakpointTransitionManager | null = null;

export function getBreakpointManager(): BreakpointTransitionManager {
  if (!globalManager) {
    globalManager = new BreakpointTransitionManager();
  }
  return globalManager;
}

// Hook for using breakpoint transitions
export function useBreakpointTransitions() {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<BreakpointKey>('xs');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const manager = getBreakpointManager();
    setCurrentBreakpoint(manager.getCurrentBreakpoint());

    const unsubscribe = manager.subscribe((breakpoint) => {
      setIsTransitioning(true);
      setCurrentBreakpoint(breakpoint);
      
      // Reset transitioning state after transition duration
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    });

    return unsubscribe;
  }, []);

  return {
    currentBreakpoint,
    isTransitioning,
    getTransitionCSS: (type?: string) => getBreakpointManager().getTransitionCSS(type),
  };
}

// Utility functions for smooth transitions
export function createSmoothTransition(
  element: HTMLElement,
  property: string,
  fromValue: string,
  toValue: string,
  duration: number = 300,
  easing: string = 'cubic-bezier(0.4, 0, 0.2, 1)'
): Promise<void> {
  return new Promise((resolve) => {
    // Set initial value
    element.style.setProperty(property, fromValue);
    
    // Force reflow
    element.offsetHeight;
    
    // Add transition
    element.style.transition = `${property} ${duration}ms ${easing}`;
    
    // Set final value
    element.style.setProperty(property, toValue);
    
    // Clean up after transition
    setTimeout(() => {
      element.style.transition = '';
      resolve();
    }, duration);
  });
}

export function interpolateValue(
  value1: number,
  value2: number,
  progress: number
): number {
  return value1 + (value2 - value1) * progress;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

export function easeOutQuart(t: number): number {
  return 1 - (--t) * t * t * t;
}

// CSS-in-JS helper for responsive values
export function createResponsiveStyles<T>(
  values: Partial<Record<BreakpointKey, T>>,
  transform?: (value: T) => string
): Record<string, any> {
  const styles: Record<string, any> = {};
  const manager = getBreakpointManager();
  
  Object.entries(values).forEach(([breakpoint, value]) => {
    const key = breakpoint as BreakpointKey;
    const breakpointValue = manager['breakpoints'][key];
    const transformedValue = transform ? transform(value) : value;
    
    if (key === 'xs') {
      styles['@media (min-width: 0px)'] = transformedValue;
    } else {
      styles[`@media (min-width: ${breakpointValue}px)`] = transformedValue;
    }
  });
  
  return styles;
}

// Layout integrity utilities
export function maintainLayoutIntegrity(element: HTMLElement): void {
  // Prevent layout shifts during transitions
  const computedStyle = window.getComputedStyle(element);
  const width = computedStyle.width;
  const height = computedStyle.height;
  
  // Temporarily set explicit dimensions
  element.style.width = width;
  element.style.height = height;
  
  // Remove explicit dimensions after a short delay
  setTimeout(() => {
    element.style.width = '';
    element.style.height = '';
  }, 50);
}

export function preventLayoutShift(
  element: HTMLElement,
  callback: () => void
): void {
  const rect = element.getBoundingClientRect();
  
  // Store current position
  element.style.position = 'relative';
  element.style.top = '0px';
  element.style.left = '0px';
  
  // Execute callback
  callback();
  
  // Check for position changes
  requestAnimationFrame(() => {
    const newRect = element.getBoundingClientRect();
    const deltaX = rect.left - newRect.left;
    const deltaY = rect.top - newRect.top;
    
    if (deltaX !== 0 || deltaY !== 0) {
      // Animate back to original position
      element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      element.style.transition = 'transform 200ms ease-out';
      
      requestAnimationFrame(() => {
        element.style.transform = '';
        
        setTimeout(() => {
          element.style.transition = '';
          element.style.position = '';
          element.style.top = '';
          element.style.left = '';
        }, 200);
      });
    }
  });
}

// Performance monitoring for transitions
export class TransitionPerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();
  
  startMeasurement(id: string): void {
    performance.mark(`transition-start-${id}`);
  }
  
  endMeasurement(id: string): number {
    performance.mark(`transition-end-${id}`);
    performance.measure(
      `transition-${id}`,
      `transition-start-${id}`,
      `transition-end-${id}`
    );
    
    const entries = performance.getEntriesByName(`transition-${id}`);
    const duration = entries[entries.length - 1]?.duration || 0;
    
    // Store measurement
    if (!this.measurements.has(id)) {
      this.measurements.set(id, []);
    }
    this.measurements.get(id)!.push(duration);
    
    // Clean up
    performance.clearMarks(`transition-start-${id}`);
    performance.clearMarks(`transition-end-${id}`);
    performance.clearMeasures(`transition-${id}`);
    
    return duration;
  }
  
  getAverageDuration(id: string): number {
    const durations = this.measurements.get(id) || [];
    if (durations.length === 0) return 0;
    
    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  }
  
  getReport(): Record<string, { average: number; count: number; max: number; min: number }> {
    const report: Record<string, any> = {};
    
    this.measurements.forEach((durations, id) => {
      report[id] = {
        average: this.getAverageDuration(id),
        count: durations.length,
        max: Math.max(...durations),
        min: Math.min(...durations),
      };
    });
    
    return report;
  }
}

export const transitionMonitor = new TransitionPerformanceMonitor();