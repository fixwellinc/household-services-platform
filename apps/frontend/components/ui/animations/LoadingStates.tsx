'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const skeletonVariants = cva(
  'animate-pulse rounded-md bg-muted',
  {
    variants: {
      variant: {
        default: 'bg-gray-200',
        shimmer: 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-size-200 animate-shimmer',
        wave: 'bg-gray-200 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent before:animate-wave',
        glow: 'bg-gray-200 animate-glow-pulse',
      },
      size: {
        sm: 'h-4',
        default: 'h-6',
        lg: 'h-8',
        xl: 'h-12',
      },
    },
    defaultVariants: {
      variant: 'shimmer',
      size: 'default',
    },
  }
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({ className, variant, size, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

/**
 * Card skeleton for service cards and content blocks
 */
export function CardSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-4 p-6 border rounded-lg', className)} {...props}>
      <Skeleton className="h-48 w-full rounded-md" variant="shimmer" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4" variant="shimmer" />
        <Skeleton className="h-4 w-full" variant="shimmer" />
        <Skeleton className="h-4 w-2/3" variant="shimmer" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-20" variant="shimmer" />
        <Skeleton className="h-10 w-24 rounded-md" variant="shimmer" />
      </div>
    </div>
  );
}

/**
 * Service card skeleton specifically for service listings
 */
export function ServiceCardSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-4 p-6 border rounded-xl bg-white shadow-sm', className)} {...props}>
      {/* Icon skeleton */}
      <div className="flex items-center space-x-3">
        <Skeleton className="h-12 w-12 rounded-full" variant="shimmer" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-32" variant="shimmer" />
          <Skeleton className="h-3 w-24" variant="shimmer" />
        </div>
      </div>
      
      {/* Description skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" variant="shimmer" />
        <Skeleton className="h-4 w-4/5" variant="shimmer" />
        <Skeleton className="h-4 w-3/5" variant="shimmer" />
      </div>
      
      {/* Price and button skeleton */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" variant="shimmer" />
          <Skeleton className="h-6 w-20" variant="shimmer" />
        </div>
        <Skeleton className="h-10 w-28 rounded-md" variant="shimmer" />
      </div>
    </div>
  );
}

/**
 * Hero section skeleton
 */
export function HeroSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-8 py-20 text-center', className)} {...props}>
      <div className="space-y-4">
        <Skeleton className="h-12 w-3/4 mx-auto" variant="shimmer" />
        <Skeleton className="h-12 w-2/3 mx-auto" variant="shimmer" />
      </div>
      <div className="space-y-2 max-w-2xl mx-auto">
        <Skeleton className="h-6 w-full" variant="shimmer" />
        <Skeleton className="h-6 w-4/5 mx-auto" variant="shimmer" />
      </div>
      <div className="flex justify-center space-x-4">
        <Skeleton className="h-12 w-32 rounded-md" variant="shimmer" />
        <Skeleton className="h-12 w-32 rounded-md" variant="shimmer" />
      </div>
    </div>
  );
}

/**
 * List item skeleton for navigation or feature lists
 */
export function ListItemSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center space-x-3 py-3', className)} {...props}>
      <Skeleton className="h-6 w-6 rounded-full" variant="shimmer" />
      <div className="space-y-1 flex-1">
        <Skeleton className="h-4 w-3/4" variant="shimmer" />
        <Skeleton className="h-3 w-1/2" variant="shimmer" />
      </div>
    </div>
  );
}

/**
 * Progress indicators for loading states
 */
export interface ProgressIndicatorProps {
  progress?: number;
  variant?: 'linear' | 'circular' | 'dots' | 'pulse';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function ProgressIndicator({ 
  progress = 0, 
  variant = 'linear', 
  size = 'default',
  className 
}: ProgressIndicatorProps) {
  const sizeClasses = {
    sm: 'h-1',
    default: 'h-2',
    lg: 'h-3',
  };

  if (variant === 'linear') {
    return (
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', sizeClasses[size], className)}>
        <div 
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    );
  }

  if (variant === 'circular') {
    const radius = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
    const strokeWidth = size === 'sm' ? 2 : size === 'lg' ? 3 : 2.5;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className={cn('relative', className)}>
        <svg 
          className="transform -rotate-90" 
          width={radius * 2 + strokeWidth * 2} 
          height={radius * 2 + strokeWidth * 2}
        >
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="text-primary-500 transition-all duration-500 ease-out"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-600">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex space-x-1', className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'rounded-full bg-primary-500 animate-pulse',
              size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'
            )}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1s',
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn(
        'rounded-full bg-primary-500 animate-pulse',
        size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6',
        className
      )} />
    );
  }

  return null;
}

/**
 * Loading overlay component
 */
export interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  variant?: 'spinner' | 'dots' | 'pulse';
  className?: string;
}

export function LoadingOverlay({ 
  isLoading, 
  children, 
  loadingText = 'Loading...',
  variant = 'spinner',
  className 
}: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="flex flex-col items-center space-y-4">
            <ProgressIndicator variant={variant === 'spinner' ? 'circular' : variant} />
            {loadingText && (
              <p className="text-sm text-gray-600 animate-pulse">{loadingText}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton grid for multiple loading items
 */
export interface SkeletonGridProps {
  count: number;
  variant?: 'card' | 'service' | 'list';
  className?: string;
}

export function SkeletonGrid({ count, variant = 'card', className }: SkeletonGridProps) {
  const SkeletonComponent = {
    card: CardSkeleton,
    service: ServiceCardSkeleton,
    list: ListItemSkeleton,
  }[variant];

  return (
    <div className={cn(
      'grid gap-6',
      variant === 'card' && 'md:grid-cols-2 lg:grid-cols-3',
      variant === 'service' && 'md:grid-cols-2 xl:grid-cols-3',
      variant === 'list' && 'grid-cols-1',
      className
    )}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}

export { Skeleton, skeletonVariants };