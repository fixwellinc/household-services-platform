'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
  children: React.ReactNode;
  variant?: 'default' | 'services' | 'testimonials' | 'pricing' | 'features' | 'dashboard' | 'adaptive';
  className?: string;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  minItemWidth?: string;
  containerQuery?: boolean;
}

export function ResponsiveGrid({
  children,
  variant = 'default',
  className,
  gap = 'md',
  minItemWidth = '300px',
  containerQuery = false,
}: ResponsiveGridProps) {
  const baseClasses = 'grid';
  
  const variantClasses = {
    default: 'grid-responsive',
    services: 'grid-services',
    testimonials: 'grid-testimonials',
    pricing: 'grid-pricing',
    features: 'grid-features',
    dashboard: 'grid-dashboard',
    adaptive: 'grid-adaptive',
  };

  const gapClasses = {
    sm: 'gap-fluid-sm',
    md: 'gap-fluid-md',
    lg: 'gap-fluid-lg',
    xl: 'gap-fluid-xl',
  };

  const containerQueryClass = containerQuery ? 'container-query' : '';

  const customStyle = variant === 'default' ? {
    gridTemplateColumns: `repeat(auto-fit, minmax(min(${minItemWidth}, 100%), 1fr))`,
  } : {};

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        gapClasses[gap],
        containerQueryClass,
        'smooth-breakpoint',
        className
      )}
      style={customStyle}
    >
      {children}
    </div>
  );
}

interface ResponsiveContainerProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
  fluid?: boolean;
}

export function ResponsiveContainer({
  children,
  size = 'xl',
  className,
  fluid = false,
}: ResponsiveContainerProps) {
  const sizeClasses = {
    xs: 'container-xs',
    sm: 'container-sm',
    md: 'container-md',
    lg: 'container-lg',
    xl: 'container-xl',
    '2xl': 'container-2xl',
    full: 'w-full px-fluid-md',
  };

  const fluidClass = fluid ? 'container-fluid' : sizeClasses[size];

  return (
    <div className={cn(fluidClass, 'smooth-breakpoint', className)}>
      {children}
    </div>
  );
}

interface ResponsiveSectionProps {
  children: React.ReactNode;
  spacing?: 'sm' | 'md' | 'lg';
  className?: string;
  background?: 'none' | 'subtle' | 'gradient';
}

export function ResponsiveSection({
  children,
  spacing = 'md',
  className,
  background = 'none',
}: ResponsiveSectionProps) {
  const spacingClasses = {
    sm: 'section-spacing-sm',
    md: 'section-spacing',
    lg: 'section-spacing-lg',
  };

  const backgroundClasses = {
    none: '',
    subtle: 'bg-gradient-to-br from-gray-50/50 to-blue-50/30',
    gradient: 'bg-gradient-mesh-1',
  };

  return (
    <section
      className={cn(
        spacingClasses[spacing],
        backgroundClasses[background],
        'smooth-breakpoint',
        className
      )}
    >
      {children}
    </section>
  );
}

interface FlexResponsiveProps {
  children: React.ReactNode;
  direction?: 'normal' | 'reverse';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function FlexResponsive({
  children,
  direction = 'normal',
  align = 'center',
  justify = 'start',
  gap = 'md',
  className,
}: FlexResponsiveProps) {
  const directionClasses = {
    normal: 'flex-responsive',
    reverse: 'flex-responsive-reverse',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  const gapClasses = {
    sm: 'gap-fluid-sm',
    md: 'gap-fluid-md',
    lg: 'gap-fluid-lg',
    xl: 'gap-fluid-xl',
  };

  return (
    <div
      className={cn(
        directionClasses[direction],
        alignClasses[align],
        justifyClasses[justify],
        gapClasses[gap],
        'smooth-breakpoint',
        className
      )}
    >
      {children}
    </div>
  );
}

interface GridAreaLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function GridAreaLayout({ children, className }: GridAreaLayoutProps) {
  return (
    <div className={cn('grid-layout-main', 'smooth-breakpoint', className)}>
      {children}
    </div>
  );
}

export function GridAreaHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <header className={cn('grid-area-header', className)}>{children}</header>;
}

export function GridAreaMain({ children, className }: { children: React.ReactNode; className?: string }) {
  return <main className={cn('grid-area-main', className)}>{children}</main>;
}

export function GridAreaSidebar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <aside className={cn('grid-area-sidebar', className)}>{children}</aside>;
}

export function GridAreaFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <footer className={cn('grid-area-footer', className)}>{children}</footer>;
}

interface ResponsiveShowProps {
  children: React.ReactNode;
  on: 'mobile' | 'tablet' | 'desktop';
  className?: string;
}

export function ResponsiveShow({ children, on, className }: ResponsiveShowProps) {
  const showClasses = {
    mobile: 'responsive-show-mobile',
    tablet: 'responsive-show-tablet',
    desktop: 'responsive-show-desktop',
  };

  return (
    <div className={cn(showClasses[on], className)}>
      {children}
    </div>
  );
}

interface HierarchySpacingProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function HierarchySpacing({ children, size = 'md', className }: HierarchySpacingProps) {
  const spacingClasses = {
    sm: 'hierarchy-spacing-sm',
    md: 'hierarchy-spacing',
    lg: 'hierarchy-spacing-lg',
  };

  return (
    <div className={cn(spacingClasses[size], className)}>
      {children}
    </div>
  );
}