'use client';

import React, { forwardRef, useEffect, useState } from 'react';
import { useHardwareAcceleration } from '@/hooks/use-hardware-acceleration';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { cn } from '@/lib/utils';

export interface PerformanceOptimizedAnimationProps {
  children: React.ReactNode;
  /**
   * Animation type
   */
  animation: 'fade-in' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale-in' | 'bounce-in';
  /**
   * Animation duration in milliseconds
   * @default 300
   */
  duration?: number;
  /**
   * Animation delay in milliseconds
   * @default 0
   */
  delay?: number;
  /**
   * Animation easing function
   * @default 'ease-out'
   */
  easing?: string;
  /**
   * Whether to trigger animation on scroll into view
   * @default true
   */
  triggerOnScroll?: boolean;
  /**
   * Whether to trigger animation immediately
   * @default false
   */
  immediate?: boolean;
  /**
   * Intersection observer options
   */
  intersectionOptions?: {
    threshold?: number;
    rootMargin?: string;
  };
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Callback when animation starts
   */
  onAnimationStart?: () => void;
  /**
   * Callback when animation ends
   */
  onAnimationEnd?: () => void;
  /**
   * Force hardware acceleration
   * @default false
   */
  forceHardwareAcceleration?: boolean;
}

/**
 * Performance-optimized animation component that respects user preferences
 * and device capabilities
 */
export const PerformanceOptimizedAnimation = forwardRef<
  HTMLDivElement,
  PerformanceOptimizedAnimationProps
>(({
  children,
  animation,
  duration = 300,
  delay = 0,
  easing = 'ease-out',
  triggerOnScroll = true,
  immediate = false,
  intersectionOptions = {},
  className,
  onAnimationStart,
  onAnimationEnd,
  forceHardwareAcceleration = false,
}, ref) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(immediate);

  // Performance and accessibility hooks
  const { 
    useHardwareAcceleration: shouldUseHardwareAcceleration,
    complexityLevel,
    accelerationStyles 
  } = useHardwareAcceleration({
    force: forceHardwareAcceleration,
  });

  const { 
    shouldReduceMotion,
    safeDuration,
    safeDelay,
    getAnimationProps 
  } = useReducedMotion();

  // Intersection observer for scroll-triggered animations
  const { ref: intersectionRef, hasIntersected } = useIntersectionObserver({
    threshold: intersectionOptions.threshold || 0.1,
    rootMargin: intersectionOptions.rootMargin || '0px',
    triggerOnce: true,
    enabled: triggerOnScroll && !immediate,
  });

  // Determine when to start animation
  const shouldAnimate = immediate || (triggerOnScroll ? hasIntersected : hasAnimated);

  useEffect(() => {
    if (shouldAnimate && !hasAnimated) {
      setHasAnimated(true);
      setIsAnimating(true);
      onAnimationStart?.();

      // End animation after duration
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onAnimationEnd?.();
      }, safeDuration(duration) + safeDelay(delay));

      return () => clearTimeout(timer);
    }
  }, [shouldAnimate, hasAnimated, duration, delay, safeDuration, safeDelay, onAnimationStart, onAnimationEnd]);

  // Generate animation styles based on type and performance
  const getAnimationStyles = (): React.CSSProperties => {
    const baseDuration = safeDuration(duration);
    const baseDelay = safeDelay(delay);

    if (shouldReduceMotion) {
      // Reduced motion: only opacity changes
      return {
        opacity: hasAnimated ? 1 : 0,
        transition: baseDuration > 0 ? `opacity ${baseDuration}ms ${easing} ${baseDelay}ms` : 'none',
      };
    }

    // Base animation styles
    let animationStyles: React.CSSProperties = {
      transition: `all ${baseDuration}ms ${easing} ${baseDelay}ms`,
    };

    // Add hardware acceleration if supported
    if (shouldUseHardwareAcceleration) {
      animationStyles = {
        ...animationStyles,
        ...accelerationStyles,
      };
    }

    // Animation-specific transforms
    if (!hasAnimated) {
      switch (animation) {
        case 'fade-in':
          animationStyles.opacity = 0;
          break;
        case 'slide-up':
          animationStyles.opacity = 0;
          animationStyles.transform = shouldUseHardwareAcceleration 
            ? 'translateZ(0) translateY(20px)' 
            : 'translateY(20px)';
          break;
        case 'slide-down':
          animationStyles.opacity = 0;
          animationStyles.transform = shouldUseHardwareAcceleration 
            ? 'translateZ(0) translateY(-20px)' 
            : 'translateY(-20px)';
          break;
        case 'slide-left':
          animationStyles.opacity = 0;
          animationStyles.transform = shouldUseHardwareAcceleration 
            ? 'translateZ(0) translateX(20px)' 
            : 'translateX(20px)';
          break;
        case 'slide-right':
          animationStyles.opacity = 0;
          animationStyles.transform = shouldUseHardwareAcceleration 
            ? 'translateZ(0) translateX(-20px)' 
            : 'translateX(-20px)';
          break;
        case 'scale-in':
          animationStyles.opacity = 0;
          animationStyles.transform = shouldUseHardwareAcceleration 
            ? 'translateZ(0) scale(0.95)' 
            : 'scale(0.95)';
          break;
        case 'bounce-in':
          animationStyles.opacity = 0;
          animationStyles.transform = shouldUseHardwareAcceleration 
            ? 'translateZ(0) scale(0.8)' 
            : 'scale(0.8)';
          if (complexityLevel === 'enhanced') {
            animationStyles.transition = `all ${baseDuration}ms cubic-bezier(0.68, -0.55, 0.265, 1.55) ${baseDelay}ms`;
          }
          break;
      }
    } else {
      // Animated state
      animationStyles.opacity = 1;
      animationStyles.transform = shouldUseHardwareAcceleration 
        ? 'translateZ(0) translateX(0) translateY(0) scale(1)' 
        : 'translateX(0) translateY(0) scale(1)';
    }

    return animationStyles;
  };

  return (
    <div
      ref={(node) => {
        // Handle both refs
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
        
        if (triggerOnScroll && intersectionRef) {
          if (typeof intersectionRef === 'function') {
            intersectionRef(node);
          } else {
            intersectionRef.current = node;
          }
        }
      }}
      className={cn(
        'performance-optimized-animation',
        isAnimating && 'animating',
        hasAnimated && 'animated',
        className
      )}
      style={getAnimationStyles()}
    >
      {children}
    </div>
  );
});

PerformanceOptimizedAnimation.displayName = 'PerformanceOptimizedAnimation';

/**
 * Simplified fade-in animation component
 */
export function FadeIn({
  children,
  ...props
}: Omit<PerformanceOptimizedAnimationProps, 'animation'>) {
  return (
    <PerformanceOptimizedAnimation animation="fade-in" {...props}>
      {children}
    </PerformanceOptimizedAnimation>
  );
}

/**
 * Simplified slide-up animation component
 */
export function SlideUp({
  children,
  ...props
}: Omit<PerformanceOptimizedAnimationProps, 'animation'>) {
  return (
    <PerformanceOptimizedAnimation animation="slide-up" {...props}>
      {children}
    </PerformanceOptimizedAnimation>
  );
}

/**
 * Simplified scale-in animation component
 */
export function ScaleIn({
  children,
  ...props
}: Omit<PerformanceOptimizedAnimationProps, 'animation'>) {
  return (
    <PerformanceOptimizedAnimation animation="scale-in" {...props}>
      {children}
    </PerformanceOptimizedAnimation>
  );
}