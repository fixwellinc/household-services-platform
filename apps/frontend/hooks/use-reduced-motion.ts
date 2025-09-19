import { useEffect, useState } from 'react';

export interface UseReducedMotionOptions {
  /**
   * Default value when media query is not supported
   * @default false
   */
  defaultValue?: boolean;
  /**
   * Whether to respect the user's preference
   * @default true
   */
  respectPreference?: boolean;
}

export interface UseReducedMotionReturn {
  /** Whether user prefers reduced motion */
  prefersReducedMotion: boolean;
  /** Whether animations should be disabled */
  shouldReduceMotion: boolean;
  /** Safe animation duration (0 if reduced motion) */
  safeDuration: (duration: number) => number;
  /** Safe animation delay (0 if reduced motion) */
  safeDelay: (delay: number) => number;
  /** Get animation-safe CSS properties */
  getAnimationProps: (props: React.CSSProperties) => React.CSSProperties;
}

/**
 * Hook for respecting user's reduced motion preferences
 * Provides utilities for creating accessible animations
 */
export function useReducedMotion(
  options: UseReducedMotionOptions = {}
): UseReducedMotionReturn {
  const {
    defaultValue = false,
    respectPreference = true,
  } = options;

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(defaultValue);

  useEffect(() => {
    if (!respectPreference || typeof window === 'undefined') {
      return;
    }

    // Check if media queries are supported
    if (!window.matchMedia) {
      setPrefersReducedMotion(defaultValue);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [defaultValue, respectPreference]);

  const shouldReduceMotion = respectPreference && prefersReducedMotion;

  const safeDuration = (duration: number): number => {
    return shouldReduceMotion ? 0 : duration;
  };

  const safeDelay = (delay: number): number => {
    return shouldReduceMotion ? 0 : delay;
  };

  const getAnimationProps = (props: React.CSSProperties): React.CSSProperties => {
    if (!shouldReduceMotion) {
      return props;
    }

    // Remove or modify animation-related properties for reduced motion
    const safeProps = { ...props };

    // Remove animations and transitions
    delete safeProps.animation;
    delete safeProps.transition;
    delete safeProps.transform;

    // Keep opacity changes but make them instant
    if (props.opacity !== undefined) {
      safeProps.opacity = props.opacity;
    }

    // Keep visibility changes
    if (props.visibility !== undefined) {
      safeProps.visibility = props.visibility;
    }

    return safeProps;
  };

  return {
    prefersReducedMotion,
    shouldReduceMotion,
    safeDuration,
    safeDelay,
    getAnimationProps,
  };
}

/**
 * Hook for creating motion-safe CSS transitions
 */
export interface UseMotionSafeTransitionOptions {
  /**
   * CSS properties to transition
   */
  properties: string | string[];
  /**
   * Transition duration in milliseconds
   * @default 300
   */
  duration?: number;
  /**
   * Transition easing function
   * @default 'ease-out'
   */
  easing?: string;
  /**
   * Transition delay in milliseconds
   * @default 0
   */
  delay?: number;
}

export function useMotionSafeTransition(
  options: UseMotionSafeTransitionOptions
): React.CSSProperties {
  const { properties, duration = 300, easing = 'ease-out', delay = 0 } = options;
  const { shouldReduceMotion, safeDuration, safeDelay } = useReducedMotion();

  if (shouldReduceMotion) {
    return {};
  }

  const props = Array.isArray(properties) ? properties.join(', ') : properties;
  
  return {
    transition: `${props} ${safeDuration(duration)}ms ${easing} ${safeDelay(delay)}ms`,
  };
}

/**
 * Hook for creating motion-safe animations with fallbacks
 */
export interface UseMotionSafeAnimationOptions {
  /**
   * Animation keyframes or name
   */
  animation: string;
  /**
   * Animation duration in milliseconds
   * @default 300
   */
  duration?: number;
  /**
   * Animation easing function
   * @default 'ease-out'
   */
  easing?: string;
  /**
   * Animation delay in milliseconds
   * @default 0
   */
  delay?: number;
  /**
   * Animation iteration count
   * @default 1
   */
  iterationCount?: number | 'infinite';
  /**
   * Fallback styles for reduced motion
   */
  reducedMotionFallback?: React.CSSProperties;
}

export function useMotionSafeAnimation(
  options: UseMotionSafeAnimationOptions
): React.CSSProperties {
  const {
    animation,
    duration = 300,
    easing = 'ease-out',
    delay = 0,
    iterationCount = 1,
    reducedMotionFallback = {},
  } = options;

  const { shouldReduceMotion, safeDuration, safeDelay } = useReducedMotion();

  if (shouldReduceMotion) {
    return reducedMotionFallback;
  }

  return {
    animation: `${animation} ${safeDuration(duration)}ms ${easing} ${safeDelay(delay)}ms ${iterationCount}`,
  };
}