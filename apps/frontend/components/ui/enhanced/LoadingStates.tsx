'use client';

import React from 'react';
import { Loader2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Base Skeleton Component
interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export function Skeleton({ className, animate = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gray-200 rounded',
        animate && 'animate-pulse',
        className
      )}
    />
  );
}

// Enhanced Loading Spinner
interface EnhancedLoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'bars' | 'pulse';
  text?: string;
  className?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
}

export function EnhancedLoadingSpinner({
  size = 'md',
  variant = 'default',
  text,
  className,
  color = 'blue'
}: EnhancedLoadingSpinnerProps) {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    gray: 'text-gray-600'
  };

  const getSpinner = () => {
    const baseClasses = cn(sizeClasses[size], colorClasses[color]);

    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full bg-current animate-pulse',
                  size === 'xs' && 'h-1 w-1',
                  size === 'sm' && 'h-1.5 w-1.5',
                  size === 'md' && 'h-2 w-2',
                  size === 'lg' && 'h-3 w-3',
                  size === 'xl' && 'h-4 w-4',
                  colorClasses[color]
                )}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1.4s'
                }}
              />
            ))}
          </div>
        );
      case 'bars':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'bg-current animate-pulse',
                  size === 'xs' && 'h-3 w-0.5',
                  size === 'sm' && 'h-4 w-0.5',
                  size === 'md' && 'h-6 w-1',
                  size === 'lg' && 'h-8 w-1',
                  size === 'xl' && 'h-12 w-1.5',
                  colorClasses[color]
                )}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1.2s'
                }}
              />
            ))}
          </div>
        );
      case 'pulse':
        return (
          <div
            className={cn(
              'rounded-full bg-current animate-ping',
              baseClasses
            )}
          />
        );
      default:
        return <Loader2 className={cn('animate-spin', baseClasses)} />;
    }
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      {getSpinner()}
      {text && (
        <p className={cn(
          'mt-2 text-sm text-gray-600',
          size === 'xs' && 'text-xs',
          size === 'xl' && 'text-base'
        )}>
          {text}
        </p>
      )}
    </div>
  );
}

// Table Skeleton
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  className
}: TableSkeletonProps) {
  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {showHeader && (
        <div className="bg-gray-50 border-b p-4">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
        </div>
      )}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  className={cn(
                    'h-4',
                    colIndex === 0 ? 'w-1/4' : colIndex === 1 ? 'w-1/3' : 'flex-1'
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Card Skeleton
interface CardSkeletonProps {
  showHeader?: boolean;
  lines?: number;
  className?: string;
}

export function CardSkeleton({
  showHeader = true,
  lines = 3,
  className
}: CardSkeletonProps) {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <Skeleton className="h-6 w-1/3 mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                'h-4',
                i === lines - 1 ? 'w-1/2' : 'w-full'
              )}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Stats Grid Skeleton
interface StatsSkeletonProps {
  count?: number;
  className?: string;
}

export function StatsSkeleton({ count = 4, className }: StatsSkeletonProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Form Skeleton
interface FormSkeletonProps {
  fields?: number;
  showTitle?: boolean;
  className?: string;
}

export function FormSkeleton({
  fields = 4,
  showTitle = true,
  className
}: FormSkeletonProps) {
  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-6">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <div className="flex space-x-4 pt-4 border-t">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading State with Retry
interface LoadingStateProps {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  children?: React.ReactNode;
  loadingText?: string;
  emptyText?: string;
  className?: string;
}

export function LoadingState({
  loading = false,
  error = null,
  onRetry,
  children,
  loadingText = 'Loading...',
  emptyText = 'No data available',
  className
}: LoadingStateProps) {
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <EnhancedLoadingSpinner text={loadingText} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
        <p className="text-gray-600 mb-4 max-w-md">{error}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        )}
      </div>
    );
  }

  if (!children) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-gray-600">{emptyText}</p>
      </div>
    );
  }

  return <>{children}</>;
}

// Page Loading Overlay
interface PageLoadingOverlayProps {
  loading: boolean;
  text?: string;
  className?: string;
}

export function PageLoadingOverlay({
  loading,
  text = 'Loading...',
  className
}: PageLoadingOverlayProps) {
  if (!loading) return null;

  return (
    <div className={cn(
      'fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center',
      className
    )}>
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <EnhancedLoadingSpinner size="lg" text={text} />
      </div>
    </div>
  );
}

// Inline Loading Button
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
}

export function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={loading || disabled}
      className={cn('min-w-[120px]', className)}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {loadingText || 'Loading...'}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

// Progressive Loading Component
interface ProgressiveLoadingProps {
  steps: Array<{
    label: string;
    completed: boolean;
    loading?: boolean;
    error?: boolean;
  }>;
  className?: string;
}

export function ProgressiveLoading({ steps, className }: ProgressiveLoadingProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {step.error ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : step.completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : step.loading ? (
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
            )}
          </div>
          <span className={cn(
            'text-sm',
            step.completed ? 'text-green-700' : step.error ? 'text-red-700' : 'text-gray-700'
          )}>
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}