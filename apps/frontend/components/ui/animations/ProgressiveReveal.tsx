'use client';

import React from 'react';
import { useScrollAnimation, AnimationType } from '@/hooks/use-scroll-animation';
import { cn } from '@/lib/utils';

export interface ProgressiveRevealProps {
  children: React.ReactNode;
  /**
   * Animation type to use
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
   * Intersection threshold (0-1)
   * @default 0.1
   */
  threshold?: number;
  /**
   * Root margin for intersection observer
   * @default '0px'
   */
  rootMargin?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * HTML element type to render
   * @default 'div'
   */
  as?: keyof JSX.IntrinsicElements;
  /**
   * Whether to trigger animation only once
   * @default true
   */
  triggerOnce?: boolean;
}

/**
 * Progressive reveal animation component
 * Automatically animates children when they enter the viewport
 */
export function ProgressiveReveal({
  children,
  animation = 'fade-in-up',
  delay = 0,
  duration = 600,
  threshold = 0.1,
  rootMargin = '0px',
  className,
  as: Component = 'div',
  triggerOnce = true,
}: ProgressiveRevealProps) {
  const { ref, className: animationClass, style } = useScrollAnimation({
    animation,
    delay,
    duration,
    threshold,
    rootMargin,
    triggerOnce,
  });

  return (
    <Component
      ref={ref as any}
      className={cn(animationClass, className)}
      style={style}
    >
      {children}
    </Component>
  );
}

/**
 * Preset components for common use cases
 */
export const RevealOnScroll = {
  /**
   * Fade in from bottom with slight scale
   */
  FadeUp: (props: Omit<ProgressiveRevealProps, 'animation'>) => (
    <ProgressiveReveal {...props} animation="fade-in-up" />
  ),

  /**
   * Fade in from left
   */
  FadeLeft: (props: Omit<ProgressiveRevealProps, 'animation'>) => (
    <ProgressiveReveal {...props} animation="fade-in-left" />
  ),

  /**
   * Fade in from right
   */
  FadeRight: (props: Omit<ProgressiveRevealProps, 'animation'>) => (
    <ProgressiveReveal {...props} animation="fade-in-right" />
  ),

  /**
   * Scale in with bounce effect
   */
  BounceIn: (props: Omit<ProgressiveRevealProps, 'animation'>) => (
    <ProgressiveReveal {...props} animation="bounce-in" />
  ),

  /**
   * Reveal with blur effect (premium feel)
   */
  RevealUp: (props: Omit<ProgressiveRevealProps, 'animation'>) => (
    <ProgressiveReveal {...props} animation="reveal-up" />
  ),

  /**
   * Slide in from bottom
   */
  SlideUp: (props: Omit<ProgressiveRevealProps, 'animation'>) => (
    <ProgressiveReveal {...props} animation="slide-in-from-bottom" />
  ),
};