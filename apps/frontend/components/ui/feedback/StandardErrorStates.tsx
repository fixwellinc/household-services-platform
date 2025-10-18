'use client';

import React from 'react';
import { 
  AlertTriangle, 
  XCircle, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  RefreshCw, 
  Home,
  Bug,
  Wifi,
  WifiOff,
  Server,
  Shield
} from 'lucide-react';
import { AlertProps } from '@/components/types';
import { cn } from '@/lib/utils';

/**
 * Standardized Alert Component
 */
export const StandardAlert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  description,
  icon,
  closable = false,
  onClose,
  actions,
  className,
  children,
}) => {
  const variantConfig = {
    info: {
      containerClass: 'bg-blue-50 border-blue-200 text-blue-800',
      iconClass: 'text-blue-500',
      defaultIcon: Info,
    },
    success: {
      containerClass: 'bg-green-50 border-green-200 text-green-800',
      iconClass: 'text-green-500',
      defaultIcon: CheckCircle,
    },
    warning: {
      containerClass: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      iconClass: 'text-yellow-500',
      defaultIcon: AlertTriangle,
    },
    error: {
      containerClass: 'bg-red-50 border-red-200 text-red-800',
      iconClass: 'text-red-500',
      defaultIcon: XCircle,
    },
  };

  const config = variantConfig[variant];
  const IconComponent = icon === true ? config.defaultIcon : icon === false ? null : icon || config.defaultIcon;

  return (
    <div 
      className={cn(
        'border rounded-lg p-4',
        config.containerClass,
        className
      )}
      role="alert"
    >
      <div className="flex">
        {IconComponent && (
          <IconComponent 
            className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconClass)}
            aria-hidden="true"
          />
        )}
        <div className={cn('flex-1', IconComponent && 'ml-3')}>
          {title && (
            <h3 className="text-sm font-medium mb-1">{title}</h3>
          )}
          {description && (
            <p className="text-sm opacity-90">{description}</p>
          )}
          {children}
          {actions && (
            <div className="mt-3">{actions}</div>
          )}
        </div>
        {closable && onClose && (
          <button
            onClick={onClose}
            className="ml-3 flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Close alert"
          >
            <XCircle className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Error State Component for different error types
 */
export interface ErrorStateProps {
  type?: 'network' | 'server' | 'notFound' | 'forbidden' | 'generic' | 'validation';
  title?: string;
  message?: string;
  details?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  onReportBug?: () => void;
  showRetry?: boolean;
  showGoHome?: boolean;
  showReportBug?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  type = 'generic',
  title,
  message,
  details,
  onRetry,
  onGoHome,
  onReportBug,
  showRetry = true,
  showGoHome = true,
  showReportBug = false,
  className,
  size = 'md',
}) => {
  const errorConfig = {
    network: {
      icon: WifiOff,
      defaultTitle: 'Connection Problem',
      defaultMessage: 'Please check your internet connection and try again.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    server: {
      icon: Server,
      defaultTitle: 'Server Error',
      defaultMessage: 'Our servers are experiencing issues. Please try again later.',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    notFound: {
      icon: AlertCircle,
      defaultTitle: 'Not Found',
      defaultMessage: 'The page or resource you\'re looking for doesn\'t exist.',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
    },
    forbidden: {
      icon: Shield,
      defaultTitle: 'Access Denied',
      defaultMessage: 'You don\'t have permission to access this resource.',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    validation: {
      icon: AlertTriangle,
      defaultTitle: 'Validation Error',
      defaultMessage: 'Please check your input and try again.',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    generic: {
      icon: AlertTriangle,
      defaultTitle: 'Something went wrong',
      defaultMessage: 'An unexpected error occurred. Please try again.',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
  };

  const config = errorConfig[type];
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const iconSizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div 
      className={cn(
        'rounded-lg border text-center',
        config.bgColor,
        config.borderColor,
        sizeClasses[size],
        className
      )}
      role="alert"
    >
      <div className="flex flex-col items-center">
        <IconComponent 
          className={cn(
            iconSizes[size],
            config.color,
            'mb-4'
          )}
          aria-hidden="true"
        />
        
        <h3 className={cn(
          'font-semibold mb-2',
          config.color,
          size === 'sm' ? 'text-base' : size === 'md' ? 'text-lg' : 'text-xl'
        )}>
          {title || config.defaultTitle}
        </h3>
        
        <p className={cn(
          'mb-6 max-w-md',
          config.color,
          'opacity-80',
          size === 'sm' ? 'text-sm' : 'text-base'
        )}>
          {message || config.defaultMessage}
        </p>

        {details && (
          <details className="mb-6 text-left w-full max-w-md">
            <summary className={cn(
              'cursor-pointer font-medium',
              config.color,
              'hover:opacity-80'
            )}>
              Show details
            </summary>
            <div className={cn(
              'mt-2 p-3 rounded text-sm font-mono',
              'bg-white bg-opacity-50 border',
              config.borderColor
            )}>
              {details}
            </div>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
          )}
          
          {showGoHome && onGoHome && (
            <button
              onClick={onGoHome}
              className="flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </button>
          )}

          {showReportBug && onReportBug && (
            <button
              onClick={onReportBug}
              className="flex items-center justify-center px-4 py-2 bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors font-medium"
            >
              <Bug className="h-4 w-4 mr-2" />
              Report Issue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Inline Error Component
 */
export const InlineError: React.FC<{
  message: string;
  onRetry?: () => void;
  className?: string;
}> = ({ message, onRetry, className }) => (
  <div className={cn('flex items-center text-red-600 text-sm', className)}>
    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
    <span className="flex-1">{message}</span>
    {onRetry && (
      <button
        onClick={onRetry}
        className="ml-2 text-blue-600 hover:text-blue-800 underline text-sm"
      >
        Retry
      </button>
    )}
  </div>
);

/**
 * Form Field Error Component
 */
export const FieldError: React.FC<{
  message: string;
  className?: string;
}> = ({ message, className }) => (
  <div className={cn('flex items-center text-red-600 text-sm mt-1', className)}>
    <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
    <span>{message}</span>
  </div>
);

/**
 * Network Status Error Component
 */
export const NetworkError: React.FC<{
  isOnline: boolean;
  onRetry?: () => void;
  className?: string;
}> = ({ isOnline, onRetry, className }) => {
  if (isOnline) return null;

  return (
    <div className={cn(
      'fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-3 text-center',
      className
    )}>
      <div className="flex items-center justify-center">
        <WifiOff className="h-4 w-4 mr-2" />
        <span className="text-sm font-medium">
          You're offline. Some features may not work.
        </span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-4 text-sm underline hover:no-underline"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Validation Error Summary Component
 */
export const ValidationErrorSummary: React.FC<{
  errors: string[];
  title?: string;
  className?: string;
}> = ({ errors, title = 'Please fix the following errors:', className }) => {
  if (errors.length === 0) return null;

  return (
    <StandardAlert
      variant="error"
      title={title}
      className={className}
    >
      <ul className="mt-2 text-sm list-disc list-inside space-y-1">
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </StandardAlert>
  );
};

/**
 * API Error Component
 */
export const ApiError: React.FC<{
  error: {
    status?: number;
    message?: string;
    code?: string;
  };
  onRetry?: () => void;
  className?: string;
}> = ({ error, onRetry, className }) => {
  const getErrorType = (status?: number) => {
    if (!status) return 'generic';
    if (status >= 500) return 'server';
    if (status === 404) return 'notFound';
    if (status === 403 || status === 401) return 'forbidden';
    if (status >= 400) return 'validation';
    return 'generic';
  };

  const getErrorMessage = (status?: number, message?: string) => {
    if (message) return message;
    if (!status) return 'An unexpected error occurred';
    
    switch (status) {
      case 400: return 'Bad request. Please check your input.';
      case 401: return 'You need to log in to access this resource.';
      case 403: return 'You don\'t have permission to perform this action.';
      case 404: return 'The requested resource was not found.';
      case 429: return 'Too many requests. Please try again later.';
      case 500: return 'Internal server error. Please try again later.';
      case 502: return 'Bad gateway. The server is temporarily unavailable.';
      case 503: return 'Service unavailable. Please try again later.';
      default: return `Request failed with status ${status}`;
    }
  };

  return (
    <ErrorState
      type={getErrorType(error.status)}
      title={error.code ? `Error ${error.code}` : undefined}
      message={getErrorMessage(error.status, error.message)}
      details={error.status ? `HTTP ${error.status}` : undefined}
      onRetry={onRetry}
      className={className}
    />
  );
};