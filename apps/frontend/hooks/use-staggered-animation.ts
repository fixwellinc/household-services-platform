import { useEffect, useState, useRef } from 'react';
import { useIntersectionObserver, UseIntersectionObserverOptions } from './use-intersection-observer';

export interface UseStaggeredAnimationOptions extends UseIntersectionObserverOptions {
  /**
   * Number of items to animate
   */
  itemCount: number;
  /**
   * Delay between each item animation in milliseconds
   * @default 100
   */
  staggerDelay?: number;
  /**
   * Base animation delay in milliseconds
   * @default 0
   */
  baseDelay?: number;
  /**
   * Animation duration for each item in milliseconds
   * @default 600
   */
  duration?: number;
  /**
   * Whether to respect user's reduced motion preference
   * @default true
   */
  respectReducedMotion?: boolean;
}

export interface StaggeredAnimationItem {
  /** CSS classes for this item */
  className: string;
  /** Inline styles for this item */
  style: React.CSSProperties;
  /** Whether this item should be visible */
  isVisible: boolean;
  /** The delay for this specific item */
  delay: number;
}

export interface UseStaggeredAnimationReturn {
  /** Reference to attach to the container element */
  ref: React.RefObject<Element>;
  /** Animation data for each item */
  items: StaggeredAnimationItem[];
  /** Whether the container is visible and animations should start */
  isVisible: boolean;
}

/**
 * Hook for creating staggered animations across multiple items
 * Perfect for card grids and content blocks that should animate in sequence
 */
export function useStaggeredAnimation(
  options: UseStaggeredAnimationOptions
): UseStaggeredAnimationReturn {
  const {
    itemCount,
    staggerDelay = 100,
    baseDelay = 0,
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
  const [animationStarted, setAnimationStarted] = useState(false);

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

  useEffect(() => {
    if (hasIntersected && !animationStarted) {
      setAnimationStarted(true);
    }
  }, [hasIntersected, animationStarted]);

  // Generate animation data for each item
  const items: StaggeredAnimationItem[] = Array.from({ length: itemCount }, (_, index) => {
    const itemDelay = baseDelay + (index * staggerDelay);
    
    const getClassName = (): string => {
      if (prefersReducedMotion) {
        return animationStarted ? 'opacity-100' : 'opacity-0';
      }
      
      return animationStarted ? 'animate-reveal-up' : 'opacity-0';
    };

    const getStyle = (): React.CSSProperties => {
      const style: React.CSSProperties = {};

      if (prefersReducedMotion) {
        style.transition = `opacity ${duration}ms ease-out ${itemDelay}ms`;
      } else {
        style.animationDelay = `${itemDelay}ms`;
        style.animationDuration = `${duration}ms`;
        style.animationFillMode = 'both';
      }

      return style;
    };

    return {
      className: getClassName(),
      style: getStyle(),
      isVisible: animationStarted,
      delay: itemDelay,
    };
  });

  return {
    ref,
    items,
    isVisible: animationStarted,
  };
}

/**
 * Utility function to create staggered animation classes
 * Useful when you need to apply staggered animations via CSS classes
 */
export function createStaggeredClasses(
  itemCount: number,
  staggerDelay: number = 100,
  baseDelay: number = 0
): string[] {
  return Array.from({ length: itemCount }, (_, index) => {
    const delay = baseDelay + (index * staggerDelay);
    return `animate-reveal-up [animation-delay:${delay}ms]`;
  });
}

/**
 * Hook for simple staggered reveal animations using CSS classes
 * Lighter weight alternative when you don't need full control
 */
export function useStaggeredReveal(itemCount: number, staggerDelay: number = 100) {
  const { ref, hasIntersected } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true,
  });

  const classes = Array.from({ length: itemCount }, (_, index) => {
    const delay = index * staggerDelay;
    const baseClass = hasIntersected ? 'animate-reveal-up' : 'opacity-0';
    return `${baseClass} [animation-delay:${delay}ms] [animation-fill-mode:both]`;
  });

  return {
    ref,
    classes,
    isVisible: hasIntersected,
  };
}