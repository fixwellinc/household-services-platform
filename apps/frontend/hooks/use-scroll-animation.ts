import { useEffect, useState } from 'react';
import { useIntersectionObserver, UseIntersectionObserverOptions } from './use-intersection-observer';

export type AnimationType = 
  | 'fade-in'
  | 'fade-in-up'
  | 'fade-in-down'
  | 'fade-in-left'
  | 'fade-in-right'
  | 'scale-in'
  | 'reveal-up'
  | 'reveal-left'
  | 'reveal-right'
  | 'bounce-in'
  | 'slide-in-from-bottom'
  | 'slide-in-from-top'
  | 'slide-in-from-left'
  | 'slide-in-from-right';

export interface UseScrollAnimationOptions extends UseIntersectionObserverOptions {
  /**
   * Animation type to apply
   * @default 'fade-in-up'
   */
  animation?: AnimationType;
  /**
   * Animation delay in milliseconds
   * @default 0
   */
  delay?: number;
  /**
   * Animation duration in milliseconds
   * @default 600
   */
  duration?: number;
  /**
   * Whether to respect user's reduced motion preference
   * @default true
   */
  respectReducedMotion?: boolean;
}

export interface UseScrollAnimationReturn {
  /** Reference to attach to the element */
  ref: React.RefObject<Element>;
  /** Whether the animation should be active */
  isVisible: boolean;
  /** CSS classes to apply for the animation */
  className: string;
  /** Inline styles for the animation */
  style: React.CSSProperties;
}

/**
 * Hook for scroll-triggered animations with proper timing controls
 * Automatically handles reduced motion preferences and performance optimization
 */
export function useScrollAnimation(
  options: UseScrollAnimationOptions = {}
): UseScrollAnimationReturn {
  const {
    animation = 'fade-in-up',
    delay = 0,
    duration = 600,
    respectReducedMotion = true,
    ...intersectionOptions
  } = options;

  const { ref, hasIntersected } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true,
    ...intersectionOptions,
  });

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (!respectReducedMotion) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [respectReducedMotion]);

  // Generate animation classes based on type
  const getAnimationClass = (): string => {
    if (prefersReducedMotion) {
      return hasIntersected ? 'opacity-100' : 'opacity-0';
    }

    const baseClass = hasIntersected ? `animate-${animation}` : 'opacity-0';
    return baseClass;
  };

  // Generate inline styles for timing
  const getAnimationStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {};

    if (delay > 0) {
      style.animationDelay = `${delay}ms`;
    }

    if (duration !== 600) {
      style.animationDuration = `${duration}ms`;
    }

    // For reduced motion, use transition instead of animation
    if (prefersReducedMotion) {
      style.transition = `opacity ${duration}ms ease-out ${delay}ms`;
    }

    return style;
  };

  return {
    ref,
    isVisible: hasIntersected,
    className: getAnimationClass(),
    style: getAnimationStyle(),
  };
}