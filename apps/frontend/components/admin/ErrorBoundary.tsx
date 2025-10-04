"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  showDetails: boolean;
}

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      showDetails: props.showDetails || false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId,
      showDetails: false
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error for debugging
    console.error('Admin Error Boundary caught an error:', error, errorInfo);

    // Send error to monitoring service
    this.reportError(error, errorInfo);
  }

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: this.props.context || 'Unknown',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Send to error reporting service
    fetch('/api/admin/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorReport)
    }).catch(err => {
      console.error('Failed to report error:', err);
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      showDetails: false
    });
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  copyErrorDetails = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      context: this.props.context,
      timestamp: new Date().toISOString()
    };
    
    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
  };

  downloadErrorReport = () => {
    const errorReport = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      context: this.props.context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const blob = new Blob([JSON.stringify(errorReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${this.state.errorId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>

              <p className="text-gray-600 mb-6">
                An error occurred in the admin dashboard. Please try refreshing the page or contact support if the problem persists.
              </p>

              {this.state.errorId && (
                <div className="mb-4">
                  <Badge variant="outline" className="text-xs">
                    Error ID: {this.state.errorId}
                  </Badge>
                </div>
              )}

              {(process.env.NODE_ENV === 'development' || this.state.showDetails) && this.state.error && (
                <div className="text-left bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-red-900 flex items-center">
                      <Bug className="h-4 w-4 mr-2" />
                      Error Details
                    </h3>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={this.copyErrorDetails}
                        title="Copy error details"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={this.downloadErrorReport}
                        title="Download error report"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-red-800 font-mono">
                    <p className="font-semibold mb-1">{this.state.error.name}:</p>
                    <p className="mb-2">{this.state.error.message}</p>
                    
                    {this.state.error.stack && (
                      <details className="mb-2">
                        <summary className="cursor-pointer text-red-600 hover:text-red-800">
                          Stack Trace
                        </summary>
                        <pre className="mt-2 text-xs overflow-auto bg-red-100 p-2 rounded border max-h-32">
                          {this.state.error.stack}
                        </pre>
                      </details>
                    )}
                    
                    {this.state.errorInfo?.componentStack && (
                      <details>
                        <summary className="cursor-pointer text-red-600 hover:text-red-800">
                          Component Stack
                        </summary>
                        <pre className="mt-2 text-xs overflow-auto bg-red-100 p-2 rounded border max-h-32">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              {process.env.NODE_ENV === 'production' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={this.toggleDetails}
                  className="mb-4"
                >
                  <Bug className="h-4 w-4 mr-2" />
                  {this.state.showDetails ? 'Hide' : 'Show'} Error Details
                </Button>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>

                <Button
                  onClick={this.handleRefresh}
                  className="flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Page
                </Button>

                <Button
                  onClick={() => window.location.href = '/admin'}
                  variant="ghost"
                  className="flex items-center"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by error handler:', error, errorInfo);

    // You can add custom error reporting here
    // e.g., send to analytics service, logging service, etc.

    // For now, just log to console
    if (errorInfo) {
      console.error('Error Info:', errorInfo);
    }
  };
}

// Simple error fallback component
export function AdminErrorFallback({
  error,
  resetError
}: {
  error: Error;
  resetError: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Component Error
          </h3>
          <p className="text-sm text-red-700 mt-1">
            {error.message || 'An unexpected error occurred'}
          </p>
        </div>
        <Button
          onClick={resetError}
          variant="outline"
          size="sm"
          className="ml-4"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    </div>
  );
}