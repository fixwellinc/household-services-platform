'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle, XCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface MobileLoadingStatesProps {
  state: 'loading' | 'success' | 'error' | 'offline' | 'idle';
  message?: string;
  progress?: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  hapticFeedback?: boolean;
  className?: string;
}

export const MobileLoadingStates: React.FC<MobileLoadingStatesProps> = ({
  state,
  message,
  progress = 0,
  showProgress = false,
  size = 'md',
  hapticFeedback = true,
  className,
}) => {
  const [displayMessage, setDisplayMessage] = React.useState(message);

  const triggerHapticFeedback = React.useCallback((type: 'success' | 'error' | 'light' = 'light') => {
    if (hapticFeedback && 'vibrate' in navigator) {
      const patterns = {
        success: [10, 50, 10],
        error: [50, 100, 50],
        light: 10,
      };
      navigator.vibrate(patterns[type]);
    }
  }, [hapticFeedback]);

  // Trigger haptic feedback on state changes
  React.useEffect(() => {
    switch (state) {
      case 'success':
        triggerHapticFeedback('success');
        break;
      case 'error':
        triggerHapticFeedback('error');
        break;
      case 'loading':
        triggerHapticFeedback('light');
        break;
    }
  }, [state, triggerHapticFeedback]);

  // Update display message with animation
  React.useEffect(() => {
    if (message !== displayMessage) {
      const timer = setTimeout(() => setDisplayMessage(message), 150);
      return () => clearTimeout(timer);
    }
  }, [message, displayMessage]);

  const sizeClasses = {
    sm: {
      container: 'p-3',
      icon: 'w-4 h-4',
      text: 'text-sm',
      progress: 'h-1',
    },
    md: {
      container: 'p-4',
      icon: 'w-6 h-6',
      text: 'text-base',
      progress: 'h-2',
    },
    lg: {
      container: 'p-6',
      icon: 'w-8 h-8',
      text: 'text-lg',
      progress: 'h-3',
    },
  };

  const currentSize = sizeClasses[size];

  const getStateConfig = () => {
    switch (state) {
      case 'loading':
        return {
          icon: <Loader2 className={cn(currentSize.icon, 'animate-spin text-blue-500')} />,
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          textColor: 'text-blue-700 dark:text-blue-300',
          borderColor: 'border-blue-200 dark:border-blue-800',
          defaultMessage: 'Loading...',
        };
      case 'success':
        return {
          icon: <CheckCircle className={cn(currentSize.icon, 'text-green-500 animate-bounce-in')} />,
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          textColor: 'text-green-700 dark:text-green-300',
          borderColor: 'border-green-200 dark:border-green-800',
          defaultMessage: 'Success!',
        };
      case 'error':
        return {
          icon: <XCircle className={cn(currentSize.icon, 'text-red-500 animate-shake')} />,
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          textColor: 'text-red-700 dark:text-red-300',
          borderColor: 'border-red-200 dark:border-red-800',
          defaultMessage: 'Something went wrong',
        };
      case 'offline':
        return {
          icon: <WifiOff className={cn(currentSize.icon, 'text-gray-500 animate-pulse')} />,
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          textColor: 'text-gray-700 dark:text-gray-300',
          borderColor: 'border-gray-200 dark:border-gray-800',
          defaultMessage: 'No internet connection',
        };
      default:
        return {
          icon: <AlertCircle className={cn(currentSize.icon, 'text-gray-400')} />,
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          textColor: 'text-gray-600 dark:text-gray-400',
          borderColor: 'border-gray-200 dark:border-gray-800',
          defaultMessage: 'Ready',
        };
    }
  };

  const config = getStateConfig();

  if (state === 'idle' && !message) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-lg border transition-all duration-300 ease-out',
        config.bgColor,
        config.borderColor,
        currentSize.container,
        'touch-manipulation select-none',
        className
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Message */}
          <div
            className={cn(
              'font-medium transition-opacity duration-150',
              config.textColor,
              currentSize.text
            )}
          >
            {displayMessage || config.defaultMessage}
          </div>

          {/* Progress Bar */}
          {showProgress && state === 'loading' && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className={cn('w-full bg-gray-200 dark:bg-gray-700 rounded-full', currentSize.progress)}>
                <div
                  className={cn(
                    'bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out',
                    currentSize.progress
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Skeleton loading component for mobile
interface MobileSkeletonProps {
  lines?: number;
  showAvatar?: boolean;
  showButton?: boolean;
  className?: string;
}

export const MobileSkeleton: React.FC<MobileSkeletonProps> = ({
  lines = 3,
  showAvatar = false,
  showButton = false,
  className,
}) => {
  return (
    <div className={cn('animate-pulse space-y-4', className)}>
      {/* Header with optional avatar */}
      <div className="flex items-center space-x-3">
        {showAvatar && (
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
        )}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>

      {/* Content lines */}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'h-3 bg-gray-200 dark:bg-gray-700 rounded',
              index === lines - 1 ? 'w-2/3' : 'w-full'
            )}
          />
        ))}
      </div>

      {/* Optional button */}
      {showButton && (
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-full" />
      )}
    </div>
  );
};

// Pull-to-refresh indicator
interface PullToRefreshProps {
  isRefreshing: boolean;
  pullDistance: number;
  threshold: number;
  onRefresh: () => void;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  isRefreshing,
  pullDistance,
  threshold,
  onRefresh,
  className,
}) => {
  const progress = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold && !isRefreshing;

  React.useEffect(() => {
    if (shouldTrigger) {
      onRefresh();
    }
  }, [shouldTrigger, onRefresh]);

  return (
    <div
      className={cn(
        'flex items-center justify-center py-4 transition-all duration-200',
        className
      )}
      style={{
        transform: `translateY(${Math.min(pullDistance * 0.5, 60)}px)`,
        opacity: Math.min(progress * 2, 1),
      }}
    >
      <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
        {isRefreshing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Refreshing...</span>
          </>
        ) : (
          <>
            <div
              className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full transition-transform duration-200"
              style={{
                transform: `rotate(${progress * 360}deg)`,
              }}
            />
            <span className="text-sm font-medium">
              {progress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

// Network status indicator
export const NetworkStatus: React.FC<{ className?: string }> = ({ className }) => {
  const [isOnline, setIsOnline] = React.useState(true);
  const [showStatus, setShowStatus] = React.useState(false);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showStatus) return null;

  return (
    <div
      className={cn(
        'fixed top-4 left-4 right-4 z-50 mx-auto max-w-sm',
        'transform transition-all duration-300 ease-out',
        showStatus ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center space-x-2 px-4 py-2 rounded-lg shadow-lg',
          isOnline
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        )}
      >
        {isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {isOnline ? 'Back online' : 'No internet connection'}
        </span>
      </div>
    </div>
  );
};

export default MobileLoadingStates;