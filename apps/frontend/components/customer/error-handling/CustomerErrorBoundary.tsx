'use client';

import React from 'react';
import { Button } from '@/components/ui/shared';
import { AlertTriangle, RefreshCw, Home, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/shared';

interface CustomerErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
}

interface CustomerErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void; retryCount: number }>;
  section?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
}

class CustomerErrorBoundary extends React.Component<CustomerErrorBoundaryProps, CustomerErrorBoundaryState> {
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: CustomerErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<CustomerErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Customer Dashboard Error${this.props.section ? ` in ${this.props.section}` : ''}:`, error, errorInfo);
    
    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error reporting service (Sentry, LogRocket, etc.)
      this.logErrorToService(error, errorInfo);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // Placeholder for error reporting service integration
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      section: this.props.section,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console.log('Error logged to service:', errorData);
    // In production, send to your error reporting service
  };

  resetError = () => {
    const newRetryCount = this.state.retryCount + 1;
    const maxRetries = this.props.maxRetries || 3;

    if (newRetryCount > maxRetries) {
      // Too many retries, don't reset
      return;
    }

    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      retryCount: newRetryCount
    });
  };

  autoRetry = () => {
    const maxRetries = this.props.maxRetries || 3;
    if (this.state.retryCount < maxRetries) {
      this.retryTimeout = setTimeout(() => {
        this.resetError();
      }, 2000); // Auto-retry after 2 seconds
    }
  };

  render() {
    if (this.state.hasError) {
      const maxRetries = this.props.maxRetries || 3;
      const canRetry = this.state.retryCount < maxRetries;

      if (this.props.fallback) {
        return (
          <this.props.fallback 
            error={this.state.error!} 
            resetError={this.resetError}
            retryCount={this.state.retryCount}
          />
        );
      }

      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              {this.props.section ? `${this.props.section} Error` : 'Something went wrong'}
            </h3>
            
            <p className="text-red-700 mb-4">
              {canRetry 
                ? "We're having trouble loading this section. Please try again."
                : "This section is temporarily unavailable. Please refresh the page or contact support if the problem persists."
              }
            </p>

            {this.state.retryCount > 0 && (
              <p className="text-sm text-red-600 mb-4">
                Retry attempt {this.state.retryCount} of {maxRetries}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {canRetry && (
                <Button 
                  onClick={this.resetError} 
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </div>

            {!canRetry && (
              <div className="mt-4 pt-4 border-t border-red-200">
                <Button 
                  onClick={() => window.location.href = '/contact'}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            )}

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-red-100 rounded text-xs">
                  <div className="font-semibold text-red-800 mb-2">Error Message:</div>
                  <div className="text-red-700 mb-3">{this.state.error.message}</div>
                  
                  {this.state.error.stack && (
                    <>
                      <div className="font-semibold text-red-800 mb-2">Stack Trace:</div>
                      <pre className="text-red-600 overflow-auto whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </>
                  )}
                  
                  {this.state.errorInfo?.componentStack && (
                    <>
                      <div className="font-semibold text-red-800 mb-2 mt-3">Component Stack:</div>
                      <pre className="text-red-600 overflow-auto whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default CustomerErrorBoundary;