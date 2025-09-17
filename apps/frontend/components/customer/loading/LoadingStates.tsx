'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/shared';
import { 
  Loader2, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  AlertCircle,
  CheckCircle,
  Clock,
  Download
} from 'lucide-react';

// Basic loading spinner
export function LoadingSpinner({ 
  size = 'default',
  className = ''
}: {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 
      className={`animate-spin text-primary ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

// Inline loading indicator
export function InlineLoader({ 
  text = 'Loading...',
  className = ''
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center space-x-2 text-gray-600 ${className}`}>
      <LoadingSpinner size="sm" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

// Full page loading
export function FullPageLoader({ 
  message = 'Loading dashboard...',
  submessage
}: {
  message?: string;
  submessage?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{message}</h2>
        {submessage && (
          <p className="text-gray-600">{submessage}</p>
        )}
      </div>
    </div>
  );
}

// Section loading overlay
export function SectionLoader({ 
  message = 'Loading...',
  className = ''
}: {
  message?: string;
  className?: string;
}) {
  return (
    <Card className={`border-0 shadow-lg ${className}`}>
      <CardContent className="p-8 text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </CardContent>
    </Card>
  );
}

// Data loading with progress
export function DataLoader({ 
  progress,
  message = 'Loading data...',
  className = ''
}: {
  progress?: number;
  message?: string;
  className?: string;
}) {
  return (
    <div className={`text-center p-6 ${className}`}>
      <LoadingSpinner size="lg" className="mx-auto mb-4" />
      <p className="text-gray-900 font-medium mb-2">{message}</p>
      {progress !== undefined && (
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
      {progress !== undefined && (
        <p className="text-sm text-gray-600">{Math.round(progress)}% complete</p>
      )}
    </div>
  );
}

// Refresh loading state
export function RefreshLoader({ 
  isRefreshing,
  onRefresh,
  lastUpdated,
  className = ''
}: {
  isRefreshing: boolean;
  onRefresh: () => void;
  lastUpdated?: Date;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        {lastUpdated && (
          <>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Updated {lastUpdated.toLocaleTimeString()}</span>
          </>
        )}
      </div>
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex items-center space-x-1 text-sm text-primary hover:text-primary-dark disabled:opacity-50"
        aria-label={isRefreshing ? 'Refreshing...' : 'Refresh data'}
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
      </button>
    </div>
  );
}

// Connection status indicator
export function ConnectionStatus({ 
  isConnected,
  isReconnecting = false,
  className = ''
}: {
  isConnected: boolean;
  isReconnecting?: boolean;
  className?: string;
}) {
  if (isReconnecting) {
    return (
      <div className={`flex items-center space-x-2 text-yellow-600 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Reconnecting...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${
      isConnected ? 'text-green-600' : 'text-red-600'
    } ${className}`}>
      {isConnected ? (
        <Wifi className="h-4 w-4" />
      ) : (
        <WifiOff className="h-4 w-4" />
      )}
      <span className="text-sm">
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
}

// Async operation status
export function AsyncOperationStatus({ 
  status,
  message,
  className = ''
}: {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  className?: string;
}) {
  const statusConfig = {
    idle: {
      icon: Clock,
      color: 'text-gray-600',
      defaultMessage: 'Ready'
    },
    loading: {
      icon: Loader2,
      color: 'text-blue-600',
      defaultMessage: 'Processing...',
      animate: true
    },
    success: {
      icon: CheckCircle,
      color: 'text-green-600',
      defaultMessage: 'Completed'
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-600',
      defaultMessage: 'Error occurred'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center space-x-2 ${config.color} ${className}`}>
      <Icon className={`h-4 w-4 ${config.animate ? 'animate-spin' : ''}`} />
      <span className="text-sm">{message || config.defaultMessage}</span>
    </div>
  );
}

// Loading overlay for existing content
export function LoadingOverlay({ 
  isLoading,
  children,
  message = 'Loading...',
  blur = true
}: {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  blur?: boolean;
}) {
  return (
    <div className="relative">
      <div className={isLoading && blur ? 'filter blur-sm pointer-events-none' : ''}>
        {children}
      </div>
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-2" />
            <p className="text-gray-600">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Staggered loading for lists
export function StaggeredLoader({ 
  items,
  isLoading,
  renderItem,
  renderSkeleton,
  staggerDelay = 100
}: {
  items: any[];
  isLoading: boolean;
  renderItem: (item: any, index: number) => React.ReactNode;
  renderSkeleton: (index: number) => React.ReactNode;
  staggerDelay?: number;
}) {
  const [visibleCount, setVisibleCount] = React.useState(0);

  React.useEffect(() => {
    if (!isLoading && items.length > 0) {
      const timer = setInterval(() => {
        setVisibleCount(prev => {
          if (prev >= items.length) {
            clearInterval(timer);
            return prev;
          }
          return prev + 1;
        });
      }, staggerDelay);

      return () => clearInterval(timer);
    } else {
      setVisibleCount(0);
    }
  }, [isLoading, items.length, staggerDelay]);

  if (isLoading) {
    return (
      <>
        {Array.from({ length: Math.max(3, items.length) }).map((_, index) => (
          <div key={index}>{renderSkeleton(index)}</div>
        ))}
      </>
    );
  }

  return (
    <>
      {items.slice(0, visibleCount).map((item, index) => (
        <div key={index} className="animate-fade-in">
          {renderItem(item, index)}
        </div>
      ))}
      {visibleCount < items.length && (
        <div className="text-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </>
  );
}

// Button loading state
export function LoadingButton({ 
  isLoading,
  children,
  loadingText = 'Loading...',
  disabled,
  onClick,
  className = '',
  ...props
}: {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  [key: string]: any;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Download progress indicator
export function DownloadProgress({ 
  progress,
  fileName,
  className = ''
}: {
  progress: number;
  fileName?: string;
  className?: string;
}) {
  return (
    <div className={`bg-white border rounded-lg p-4 shadow-lg ${className}`}>
      <div className="flex items-center space-x-3 mb-3">
        <Download className="h-5 w-5 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            {fileName ? `Downloading ${fileName}` : 'Downloading...'}
          </p>
          <p className="text-xs text-gray-600">{Math.round(progress)}% complete</p>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}