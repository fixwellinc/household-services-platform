'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface ContainerQueryOptions {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

interface ContainerQueryResult {
  matches: boolean;
  width: number;
  height: number;
}

export function useContainerQuery(options: ContainerQueryOptions): [React.RefObject<HTMLElement>, ContainerQueryResult] {
  const ref = useRef<HTMLElement>(null);
  const [result, setResult] = useState<ContainerQueryResult>({
    matches: false,
    width: 0,
    height: 0,
  });

  const checkQuery = useCallback(() => {
    if (!ref.current) return;

    const { clientWidth: width, clientHeight: height } = ref.current;
    
    let matches = true;

    if (options.minWidth !== undefined && width < options.minWidth) {
      matches = false;
    }
    if (options.maxWidth !== undefined && width > options.maxWidth) {
      matches = false;
    }
    if (options.minHeight !== undefined && height < options.minHeight) {
      matches = false;
    }
    if (options.maxHeight !== undefined && height > options.maxHeight) {
      matches = false;
    }

    setResult({ matches, width, height });
  }, [options]);

  useEffect(() => {
    if (!ref.current) return;

    // Check initially
    checkQuery();

    // Use ResizeObserver for better performance
    const resizeObserver = new ResizeObserver(() => {
      checkQuery();
    });

    resizeObserver.observe(ref.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [checkQuery]);

  return [ref, result];
}

interface BreakpointOptions {
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  '2xl'?: number;
}

interface BreakpointResult {
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2Xl: boolean;
  current: string;
  width: number;
}

const defaultBreakpoints: Required<BreakpointOptions> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useBreakpoint(customBreakpoints?: BreakpointOptions): BreakpointResult {
  const breakpoints = { ...defaultBreakpoints, ...customBreakpoints };
  const [result, setResult] = useState<BreakpointResult>({
    isSm: false,
    isMd: false,
    isLg: false,
    isXl: false,
    is2Xl: false,
    current: 'xs',
    width: 0,
  });

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      
      const isSm = width >= breakpoints.sm;
      const isMd = width >= breakpoints.md;
      const isLg = width >= breakpoints.lg;
      const isXl = width >= breakpoints.xl;
      const is2Xl = width >= breakpoints['2xl'];

      let current = 'xs';
      if (is2Xl) current = '2xl';
      else if (isXl) current = 'xl';
      else if (isLg) current = 'lg';
      else if (isMd) current = 'md';
      else if (isSm) current = 'sm';

      setResult({
        isSm,
        isMd,
        isLg,
        isXl,
        is2Xl,
        current,
        width,
      });
    };

    // Check initially
    checkBreakpoint();

    // Listen for resize events
    window.addEventListener('resize', checkBreakpoint);

    return () => {
      window.removeEventListener('resize', checkBreakpoint);
    };
  }, [breakpoints]);

  return result;
}

interface ResponsiveValueOptions<T> {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}

export function useResponsiveValue<T>(values: ResponsiveValueOptions<T>): T | undefined {
  const { current } = useBreakpoint();
  
  // Return the value for the current breakpoint, falling back to smaller breakpoints
  if (current === '2xl' && values['2xl'] !== undefined) return values['2xl'];
  if ((current === '2xl' || current === 'xl') && values.xl !== undefined) return values.xl;
  if ((current === '2xl' || current === 'xl' || current === 'lg') && values.lg !== undefined) return values.lg;
  if ((current === '2xl' || current === 'xl' || current === 'lg' || current === 'md') && values.md !== undefined) return values.md;
  if (current !== 'xs' && values.sm !== undefined) return values.sm;
  
  return values.xs;
}

interface GridColumnsOptions {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  '2xl'?: number;
}

export function useResponsiveGridColumns(columns: GridColumnsOptions): number {
  const currentColumns = useResponsiveValue(columns);
  return currentColumns || 1;
}

interface AspectRatioOptions {
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  '2xl'?: string;
}

export function useResponsiveAspectRatio(ratios: AspectRatioOptions): string {
  const currentRatio = useResponsiveValue(ratios);
  return currentRatio || '1 / 1';
}

// Hook for managing responsive spacing
interface SpacingOptions {
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  '2xl'?: string;
}

export function useResponsiveSpacing(spacing: SpacingOptions): string {
  const currentSpacing = useResponsiveValue(spacing);
  return currentSpacing || '1rem';
}

// Hook for responsive font sizes
interface FontSizeOptions {
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  '2xl'?: string;
}

export function useResponsiveFontSize(sizes: FontSizeOptions): string {
  const currentSize = useResponsiveValue(sizes);
  return currentSize || '1rem';
}

// Hook for detecting container query support
export function useContainerQuerySupport(): boolean {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if container queries are supported
    const supportsContainerQueries = 'container' in document.documentElement.style;
    setIsSupported(supportsContainerQueries);
  }, []);

  return isSupported;
}

// Hook for responsive image sizing
interface ImageSizeOptions {
  xs?: { width: number; height: number };
  sm?: { width: number; height: number };
  md?: { width: number; height: number };
  lg?: { width: number; height: number };
  xl?: { width: number; height: number };
  '2xl'?: { width: number; height: number };
}

export function useResponsiveImageSize(sizes: ImageSizeOptions): { width: number; height: number } {
  const currentSize = useResponsiveValue(sizes);
  return currentSize || { width: 300, height: 200 };
}

// Hook for responsive grid gap
interface GapOptions {
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  '2xl'?: string;
}

export function useResponsiveGap(gaps: GapOptions): string {
  const currentGap = useResponsiveValue(gaps);
  return currentGap || '1rem';
}

// Hook for managing responsive layout direction
interface DirectionOptions {
  xs?: 'row' | 'column';
  sm?: 'row' | 'column';
  md?: 'row' | 'column';
  lg?: 'row' | 'column';
  xl?: 'row' | 'column';
  '2xl'?: 'row' | 'column';
}

export function useResponsiveDirection(directions: DirectionOptions): 'row' | 'column' {
  const currentDirection = useResponsiveValue(directions);
  return currentDirection || 'column';
}

// Hook for responsive visibility
interface VisibilityOptions {
  xs?: boolean;
  sm?: boolean;
  md?: boolean;
  lg?: boolean;
  xl?: boolean;
  '2xl'?: boolean;
}

export function useResponsiveVisibility(visibility: VisibilityOptions): boolean {
  const currentVisibility = useResponsiveValue(visibility);
  return currentVisibility !== undefined ? currentVisibility : true;
}