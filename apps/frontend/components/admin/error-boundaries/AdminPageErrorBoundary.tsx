"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, Download, FileX, Database, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  context?: string;
  pageTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  errorType: 'network' | 'data' | 'permission' | 'component' | 'unknown';
  showDetails: boolean;
}

export class AdminPageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      errorType: 'unknown',
      showDetails: props.showDetails || false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const errorType = AdminPageErrorBoundary.categorizeError(error);
    
    return {
      hasError: true,
      error,
      errorId,
      errorType,
      showDetails: false
    };
  }

  static categorizeError(error: Error): State['errorType'] {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }
    if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'permission';
    }
    if (message.includes('data') || message.includes('parse') || message.includes('json') || stack.includes('api')) {
      return 'data';
    }
    if (stack.includes('react') || stack.includes('component') || message.includes('render')) {
      return 'component';
    }
    return 'unknown';
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
    console.error('Admin Page Error Boundary caught an error:', error, errorInfo);

    // Send error to monitoring service
    this.reportError(error, errorInfo);
  }

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      errorId: this.state.errorId,
      errorType: this.state.errorType,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: this.props.context || 'Unknown',
      pageTitle: this.props.pageTitle,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
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
      errorType: 'unknown',
      showDetails: false
    });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  getErrorIcon = () => {
    switch (this.state.errorType) {
      case 'network':
        return <Wifi className="h-8 w-8 text-red-600" />;
      case 'data':
        return <Database className="h-8 w-8 text-red-600" />;
      case 'permission':
        return <FileX className="h-8 w-8 text-red-600" />;
      case 'component':
        return <Bug className="h-8 w-8 text-red-600" />;
      default:
        return <AlertTriangle className="h-8 w-8 text-red-600" />;
    }
  };

  getErrorTitle = () => {
    switch (this.state.errorType) {
      case 'network':
        return 'Connection Error';
      case 'data':
        return 'Data Loading Error';
      case 'permission':
        return 'Access Denied';
      case 'component':
        return 'Component Error';
      default:
        return 'Something went wrong';
    }
  };

  getErrorMessage = () => {
    switch (this.state.errorType) {
      case 'network':
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      case 'data':
        return 'There was a problem loading the data. The server may be temporarily unavailable.';
      case 'permission':
        return 'You don\'t have permission to access this resource. Please contact your administrator.';
      case 'component':
        return 'A component failed to render properly. This may be a temporary issue.';
      default:
        return 'An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.';
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-red-100 p-3">
                  {this.getErrorIcon()}
                </div>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {this.getErrorTitle()}
              </h1>

              {this.props.pageTitle && (
                <p className="text-sm text-gray-500 mb-2">
                  Page: {this.props.pageTitle}
                </p>
              )}

              <p className="text-gray-600 mb-6">
                {this.getErrorMessage()}
              </p>

              {this.state.errorId && (
                <div className="mb-4">
                  <Badge variant="outline" className="text-xs">
                    Error ID: {this.state.errorId}
                  </Badge>
                </div>
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