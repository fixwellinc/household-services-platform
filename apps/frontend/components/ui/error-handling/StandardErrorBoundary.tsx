'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { ErrorBoundaryProps, ErrorFallbackProps } from '@/components/types';
import { cn } from '@/lib/utils';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

/**
 * Standardized Error Boundary Component
 * 
 * Provides consistent error handling across the application with:
 * - Automatic error reporting
 * - Retry functionality
 * - Development debugging tools
 * - Accessibility support
 * - Customizable fallback UI
 */
export class StandardErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: NodeJS.Timeout | null = null;
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.generateErrorId();
    
    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // Log error details
    console.error('StandardErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service
    this.reportError(error, errorInfo, errorId);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange } = this.props;
    const { hasError } = this.state;
    
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private reportError(error: Error, errorInfo: ErrorInfo, errorId: string) {
    // Report to external error tracking service
    if (typeof window !== 'undefined') {
      // Sentry
      if ((window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: {
            errorBoundary: true,
            errorId,
          },
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
        });
      }

      // Google Analytics
      if ((window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: error.message,
          fatal: false,
          custom_map: {
            error_id: errorId,
          },
        });
      }

      // Custom error reporting
      if ((window as any).reportError) {
        (window as any).reportError({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          errorId,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        });
      }
    }
  }

  private resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount < this.maxRetries) {
      this.setState({ retryCount: retryCount + 1 });
      this.resetErrorBoundary();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const { error, errorId } = this.state;
    const bugReportUrl = `mailto:support@fixwell.com?subject=Bug Report - ${errorId}&body=Error: ${error?.message}%0A%0AError ID: ${errorId}%0A%0APlease describe what you were doing when this error occurred:`;
    window.open(bugReportUrl);
  };

  render() {
    const { hasError, error, errorId, retryCount } = this.state;
    const { fallback, className, children } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return React.createElement(fallback, {
          error: error!,
          resetError: this.resetErrorBoundary,
          componentStack: this.state.errorInfo?.componentStack || undefined,
        });
      }

      // Default error UI
      return (
        <div 
          className={cn(
            "min-h-[400px] flex items-center justify-center p-6 bg-gray-50",
            className
          )}
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-lg w-full bg-white rounded-lg shadow-lg border border-red-200 p-6">
            {/* Header */}
            <div className="flex items-center mb-4">
              <AlertTriangle 
                className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" 
                aria-hidden="true"
              />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Something went wrong
                </h2>
                <p className="text-sm text-gray-500">
                  We encountered an unexpected error
                </p>
              </div>
            </div>
            
            {/* Error message */}
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Don't worry, this has been automatically reported to our team. 
                You can try refreshing the page or go back to the homepage.
              </p>

              {errorId && (
                <div className="bg-gray-50 rounded-md p-3 mb-4">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Error ID:</span>{' '}
                    <code className="font-mono bg-gray-200 px-1 rounded">
                      {errorId}
                    </code>
                  </p>
                </div>
              )}

              {retryCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    Retry attempt {retryCount} of {this.maxRetries}
                  </p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleRetry}
                disabled={retryCount >= this.maxRetries}
                className={cn(
                  "flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
                  retryCount >= this.maxRetries
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                )}
                aria-label="Try again"
              >
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                {retryCount >= this.maxRetries ? 'Max retries reached' : 'Try Again'}
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
                aria-label="Go to homepage"
              >
                <Home className="h-4 w-4 mr-2" aria-hidden="true" />
                Go Home
              </button>

              <button
                onClick={this.handleReportBug}
                className="flex items-center justify-center px-4 py-2 bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors font-medium"
                aria-label="Report this bug"
              >
                <Bug className="h-4 w-4 mr-2" aria-hidden="true" />
                Report Bug
              </button>
            </div>

            {/* Development details */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-6">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 font-medium">
                  Show error details (development only)
                </summary>
                <div className="mt-3 p-4 bg-red-50 rounded-md border border-red-200">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-red-800 mb-1">Error Message:</h4>
                      <p className="text-sm text-red-700 font-mono">{error.message}</p>
                    </div>
                    
                    {error.stack && (
                      <div>
                        <h4 className="text-sm font-medium text-red-800 mb-1">Stack Trace:</h4>
                        <pre className="text-xs text-red-700 font-mono bg-red-100 p-2 rounded overflow-auto max-h-40 whitespace-pre-wrap">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <h4 className="text-sm font-medium text-red-800 mb-1">Component Stack:</h4>
                        <pre className="text-xs text-red-700 font-mono bg-red-100 p-2 rounded overflow-auto max-h-40 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Default Error Fallback Component
 */
export const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  componentStack,
}) => (
  <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
    <div className="flex items-center mb-4">
      <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
      <h3 className="text-lg font-medium text-red-800">Component Error</h3>
    </div>
    <p className="text-red-700 mb-4">{error.message}</p>
    <button
      onClick={resetError}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    >
      Try Again
    </button>
  </div>
);

/**
 * Minimal Error Fallback Component
 */
export const MinimalErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
}) => (
  <div className="p-4 bg-gray-100 border border-gray-300 rounded text-center">
    <p className="text-gray-600 mb-2">Unable to load this component</p>
    <button
      onClick={resetError}
      className="text-sm text-blue-600 hover:text-blue-800 underline"
    >
      Retry
    </button>
  </div>
);

/**
 * Inline Error Fallback Component
 */
export const InlineErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
}) => (
  <span className="inline-flex items-center text-red-600 text-sm">
    <AlertTriangle className="h-4 w-4 mr-1" />
    Error loading content
    <button
      onClick={resetError}
      className="ml-2 text-blue-600 hover:text-blue-800 underline"
    >
      retry
    </button>
  </span>
);