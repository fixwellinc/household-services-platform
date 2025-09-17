'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

interface MobileNavigationProps {
  children: React.ReactNode;
  className?: string;
}

// Main responsive layout wrapper
export function ResponsiveLayout({ children, className }: ResponsiveLayoutProps) {
  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50",
      className
    )}>
      {children}
    </div>
  );
}

// Responsive grid system
export function ResponsiveGrid({ 
  children, 
  className, 
  cols = { default: 1, md: 2, lg: 3 } 
}: ResponsiveGridProps) {
  const gridClasses = cn(
    "grid gap-4",
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}

// Responsive container with max-width and padding
export function ResponsiveContainer({ 
  children, 
  className, 
  maxWidth = 'full',
  padding = 'md'
}: ResponsiveContainerProps) {
  const containerClasses = cn(
    "mx-auto w-full",
    {
      'max-w-sm': maxWidth === 'sm',
      'max-w-md': maxWidth === 'md',
      'max-w-lg': maxWidth === 'lg',
      'max-w-xl': maxWidth === 'xl',
      'max-w-2xl': maxWidth === '2xl',
      'max-w-full': maxWidth === 'full',
    },
    {
      'px-0': padding === 'none',
      'px-2 sm:px-4': padding === 'sm',
      'px-4 sm:px-6': padding === 'md',
      'px-6 sm:px-8': padding === 'lg',
    },
    className
  );

  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
}

// Mobile-first navigation component
export function MobileNavigation({ children, className }: MobileNavigationProps) {
  return (
    <div className={cn(
      "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
      className
    )}>
      {children}
    </div>
  );
}

// Mobile-friendly card stack
interface ResponsiveCardStackProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg';
}

export function ResponsiveCardStack({ 
  children, 
  className, 
  spacing = 'md' 
}: ResponsiveCardStackProps) {
  const stackClasses = cn(
    "space-y-4",
    {
      'space-y-2': spacing === 'sm',
      'space-y-4': spacing === 'md',
      'space-y-6': spacing === 'lg',
    },
    className
  );

  return (
    <div className={stackClasses}>
      {children}
    </div>
  );
}

// Touch-friendly button wrapper
interface TouchFriendlyButtonProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function TouchFriendlyButton({ 
  children, 
  className, 
  size = 'md',
  fullWidth = false 
}: TouchFriendlyButtonProps) {
  const buttonClasses = cn(
    "inline-flex items-center justify-center rounded-md font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-95 transition-transform duration-150", // Touch feedback
    {
      'h-8 px-3 text-sm': size === 'sm',
      'h-10 px-4 py-2': size === 'md',
      'h-12 px-6 py-3 text-lg': size === 'lg',
    },
    {
      'w-full': fullWidth,
    },
    className
  );

  return (
    <button className={buttonClasses}>
      {children}
    </button>
  );
}

// Responsive section wrapper
interface ResponsiveSectionProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  spacing?: 'sm' | 'md' | 'lg';
}

export function ResponsiveSection({ 
  children, 
  className, 
  title, 
  subtitle,
  spacing = 'md' 
}: ResponsiveSectionProps) {
  const sectionClasses = cn(
    {
      'mb-4': spacing === 'sm',
      'mb-6': spacing === 'md',
      'mb-8': spacing === 'lg',
    },
    className
  );

  return (
    <section className={sectionClasses}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-gray-600 text-sm sm:text-base">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

// Mobile-optimized stats grid
interface MobileStatsGridProps {
  stats: Array<{
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    color?: string;
    updated?: string;
  }>;
  className?: string;
}

export function MobileStatsGrid({ stats, className }: MobileStatsGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
      className
    )}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 truncate">
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stat.value}
              </p>
              {stat.updated && (
                <p className="text-xs text-gray-500 mt-1">
                  {stat.updated}
                </p>
              )}
            </div>
            {stat.icon && (
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center ml-3",
                stat.color || "bg-blue-100"
              )}>
                {stat.icon}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}