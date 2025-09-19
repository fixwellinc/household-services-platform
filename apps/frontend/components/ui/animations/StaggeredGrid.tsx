'use client';

import React from 'react';
import { useStaggeredAnimation } from '@/hooks/use-staggered-animation';
import { cn } from '@/lib/utils';

export interface StaggeredGridProps {
  children: React.ReactNode[];
  /**
   * Delay between each item animation in milliseconds
   * @default 100
   */
  staggerDelay?: number;
  /**
   * Base delay before starting animations in milliseconds
   * @default 0
   */
  baseDelay?: number;
  /**
   * Animation duration for each item in milliseconds
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
   * CSS classes for the container
   */
  className?: string;
  /**
   * CSS classes for each item
   */
  itemClassName?: string;
  /**
   * HTML element type for container
   * @default 'div'
   */
  as?: keyof JSX.IntrinsicElements;
  /**
   * HTML element type for each item wrapper
   * @default 'div'
   */
  itemAs?: keyof JSX.IntrinsicElements;
}

/**
 * Staggered grid animation component
 * Animates children in sequence when they enter the viewport
 */
export function StaggeredGrid({
  children,
  staggerDelay = 100,
  baseDelay = 0,
  duration = 600,
  threshold = 0.1,
  rootMargin = '0px',
  className,
  itemClassName,
  as: Container = 'div',
  itemAs: ItemWrapper = 'div',
}: StaggeredGridProps) {
  const childrenArray = React.Children.toArray(children);
  
  const { ref, items } = useStaggeredAnimation({
    itemCount: childrenArray.length,
    staggerDelay,
    baseDelay,
    duration,
    threshold,
    rootMargin,
    triggerOnce: true,
  });

  return (
    <Container ref={ref as any} className={className}>
      {childrenArray.map((child, index) => (
        <ItemWrapper
          key={index}
          className={cn(items[index].className, itemClassName)}
          style={items[index].style}
        >
          {child}
        </ItemWrapper>
      ))}
    </Container>
  );
}

/**
 * Preset grid layouts with common configurations
 */
export const AnimatedGrids = {
  /**
   * Card grid with standard stagger timing
   */
  Cards: (props: Omit<StaggeredGridProps, 'staggerDelay' | 'className'>) => (
    <StaggeredGrid
      {...props}
      staggerDelay={150}
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
    />
  ),

  /**
   * Feature list with faster stagger
   */
  Features: (props: Omit<StaggeredGridProps, 'staggerDelay' | 'className'>) => (
    <StaggeredGrid
      {...props}
      staggerDelay={100}
      className="space-y-4"
    />
  ),

  /**
   * Service grid with slower, more dramatic timing
   */
  Services: (props: Omit<StaggeredGridProps, 'staggerDelay' | 'duration' | 'className'>) => (
    <StaggeredGrid
      {...props}
      staggerDelay={200}
      duration={800}
      className="grid gap-8 md:grid-cols-2 xl:grid-cols-3"
    />
  ),

  /**
   * Testimonial carousel with gentle timing
   */
  Testimonials: (props: Omit<StaggeredGridProps, 'staggerDelay' | 'className'>) => (
    <StaggeredGrid
      {...props}
      staggerDelay={120}
      className="flex flex-col space-y-6 md:flex-row md:space-x-6 md:space-y-0"
    />
  ),
};