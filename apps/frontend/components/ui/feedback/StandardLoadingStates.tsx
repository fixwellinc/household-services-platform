'use client';

import React from 'react';
import { Loader2, Heart, Sparkles, Clock, Wifi, WifiOff } from 'lucide-react';
import { LoadingStateProps, SkeletonProps } from '@/components/types';
import { cn } from '@/lib/utils';

/**
 * Standardized Loading Spinner Component
 * 
 * Provides consistent loading indicators across the application
 */
export interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'pulse' | 'bounce' | 'heartbeat' | 'dots';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  text?: string;
  className?: string;
  'aria-label'?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  color = 'primary',
  text,
  className,
  'aria-label': ariaLabel,
}) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    info: 'text-cyan-600',
  };

  const getSpinnerIcon = () => {
    const baseClasses = cn(sizeClasses[size], colorClasses[color]);
    
    switch (variant) {
      case 'heartbeat':
        return <Heart className={cn(baseClasses, 'animate-pulse')} />;
      case 'bounce':
        return <Sparkles className={cn(baseClasses, 'animate-bounce')} />;
      case 'pulse':
        return <Clock className={cn(baseClasses, 'animate-pulse')} />;
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full animate-pulse',
                  size === 'xs' ? 'h-1 w-1' : 
                  size === 'sm' ? 'h-1.5 w-1.5' :
                  size === 'md' ? 'h-2 w-2' :
                  size === 'lg' ? 'h-3 w-3' : 'h-4 w-4',
                  colorClasses[color].replace('text-', 'bg-')
                )}
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        );
      default:
        return <Loader2 className={cn(baseClasses, 'animate-spin')} />;
    }
  };

  return (
    <div 
      className={cn('flex flex-col items-center justify-center', className)}
      role="status"
      aria-label={ariaLabel || 'Loading'}
    >
      {getSpinnerIcon()}
      {text && (
        <p className={cn(
          'mt-2 text-sm animate-pulse',
          colorClasses[color]
        )}>
          {text}
        </p>
      )}
      <span className="sr-only">{ariaLabel || 'Loading'}</span>
    </div>
  );
};

/**
 * Standardized Loading Skeleton Component
 */
export const LoadingSkeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  variant = 'rectangular',
  animation = 'pulse',
  lines = 1,
  className,
}) => {
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse', // Could be enhanced with wave animation
    none: '',
  };

  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full',
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'bg-gray-200',
              animationClasses[animation],
              variantClasses[variant]
            )}
            style={{
              width: i === lines - 1 ? '75%' : '100%',
              height: height || '1rem',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-gray-200',
        animationClasses[animation],
        variantClasses[variant],
        className
      )}
      style={{
        width: width || '100%',
        height: height || '1rem',
      }}
    />
  );
};

/**
 * Standardized Loading State Wrapper
 */
export const LoadingStateWrapper: React.FC<LoadingStateProps> = ({
  isLoading,
  skeleton,
  fallback,
  delay = 0,
  children,
  className,
  error,
}) => {
  const [showLoading, setShowLoading] = React.useState(!delay);

  React.useEffect(() => {
    if (isLoading && delay > 0) {
      const timer = setTimeout(() => setShowLoading(true), delay);
      return () => clearTimeout(timer);
    } else {
      setShowLoading(isLoading);
    }
  }, [isLoading, delay]);

  if (error) {
    return (
      <div className={cn('p-4 bg-red-50 border border-red-200 rounded-md', className)}>
        <p className="text-red-800">Failed to load content</p>
      </div>
    );
  }

  if (isLoading && showLoading) {
    if (skeleton) {
      return React.createElement(skeleton);
    }
    
    if (fallback) {
      return <div className={className}>{fallback}</div>;
    }

    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <LoadingSpinner />
      </div>
    );
  }

  return <div className={className}>{children}</div>;
};

/**
 * Page-level Loading Component
 */
export const LoadingPage: React.FC<{
  title?: string;
  subtitle?: string;
  className?: string;
}> = ({
  title = 'Loading',
  subtitle,
  className,
}) => (
  <div className={cn(
    'min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50',
    className
  )}>
    <div className="text-center max-w-md mx-auto px-6">
      <LoadingSpinner size="xl" variant="default" />
      <h1 className="mt-6 text-2xl font-semibold text-gray-900">{title}</h1>
      {subtitle && (
        <p className="mt-2 text-gray-600">{subtitle}</p>
      )}
    </div>
  </div>
);

/**
 * Card Loading Skeleton
 */
export const CardLoadingSkeleton: React.FC<{
  showImage?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  showActions?: boolean;
  className?: string;
}> = ({
  showImage = true,
  showTitle = true,
  showDescription = true,
  showActions = true,
  className,
}) => (
  <div className={cn('p-6 bg-white rounded-lg border border-gray-200', className)}>
    {showImage && (
      <LoadingSkeleton
        variant="rectangular"
        height="12rem"
        className="mb-4"
      />
    )}
    {showTitle && (
      <LoadingSkeleton
        variant="text"
        height="1.5rem"
        width="60%"
        className="mb-2"
      />
    )}
    {showDescription && (
      <LoadingSkeleton
        variant="text"
        lines={3}
        className="mb-4"
      />
    )}
    {showActions && (
      <div className="flex space-x-2">
        <LoadingSkeleton
          variant="rectangular"
          width="5rem"
          height="2.5rem"
        />
        <LoadingSkeleton
          variant="rectangular"
          width="4rem"
          height="2.5rem"
        />
      </div>
    )}
  </div>
);

/**
 * Table Loading Skeleton
 */
export const TableLoadingSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
}) => (
  <div className={cn('bg-white rounded-lg border border-gray-200 overflow-hidden', className)}>
    {showHeader && (
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, i) => (
            <LoadingSkeleton
              key={i}
              variant="text"
              height="1rem"
              width={`${Math.random() * 40 + 60}%`}
            />
          ))}
        </div>
      </div>
    )}
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <LoadingSkeleton
                key={colIndex}
                variant="text"
                height="1rem"
                width={`${Math.random() * 50 + 50}%`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * List Loading Skeleton
 */
export const ListLoadingSkeleton: React.FC<{
  items?: number;
  showAvatar?: boolean;
  className?: string;
}> = ({
  items = 5,
  showAvatar = true,
  className,
}) => (
  <div className={cn('space-y-4', className)}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
        {showAvatar && (
          <LoadingSkeleton
            variant="circular"
            width="3rem"
            height="3rem"
          />
        )}
        <div className="flex-1 space-y-2">
          <LoadingSkeleton
            variant="text"
            height="1.25rem"
            width="40%"
          />
          <LoadingSkeleton
            variant="text"
            height="1rem"
            width="80%"
          />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Connection Status Indicator
 */
export const ConnectionStatus: React.FC<{
  isOnline?: boolean;
  isConnecting?: boolean;
  className?: string;
}> = ({
  isOnline = true,
  isConnecting = false,
  className,
}) => {
  if (isConnecting) {
    return (
      <div className={cn('flex items-center text-yellow-600', className)}>
        <LoadingSpinner size="xs" variant="default" />
        <span className="ml-2 text-sm">Connecting...</span>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center',
      isOnline ? 'text-green-600' : 'text-red-600',
      className
    )}>
      {isOnline ? (
        <Wifi className="h-4 w-4" />
      ) : (
        <WifiOff className="h-4 w-4" />
      )}
      <span className="ml-2 text-sm">
        {isOnline ? 'Connected' : 'Offline'}
      </span>
    </div>
  );
};

/**
 * Empty State Component
 */
export const EmptyState: React.FC<{
  icon?: React.ComponentType<any>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => (
  <div className={cn('text-center py-12', className)}>
    {Icon && (
      <Icon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
    )}
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    {description && (
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
    )}
    {action}
  </div>
);