"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Database, RefreshCw, AlertTriangle, Wifi, FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  dataSource?: string;
  showRetry?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  maxRetries: number;
}

export class AdminDataErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      maxRetries: 3
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
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
    console.error(`Admin Data Error (${this.props.dataSource || 'Unknown source'}):`, error, errorInfo);

    // Send error to monitoring service
    this.reportError(error, errorInfo);
  }

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      errorId: `data_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      errorType: 'data',
      dataSource: this.props.dataSource,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString(),
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
      console.error('Failed to report data error:', err);
    });
  }

  handleRetry = () => {
    if (this.state.retryCount < this.state.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));

      // Call custom retry handler if provided
      if (this.props.onRetry) {
        this.props.onRetry();
      }
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

  isNetworkError = (error: Error) => {
    const message = error.message.toLowerCase();
    return message.includes('network') || 
           message.includes('fetch') || 
           message.includes('connection') ||
           message.includes('timeout');
  };

  isPermissionError = (error: Error) => {
    const message = error.message.toLowerCase();
    return message.includes('unauthorized') || 
           message.includes('forbidden') || 
           message.includes('permission');
  };

  getErrorIcon = () => {
    if (!this.state.error) return <Database className="h-6 w-6 text-red-600" />;
    
    if (this.isNetworkError(this.state.error)) {
      return <Wifi className="h-6 w-6 text-red-600" />;
    }
    if (this.isPermissionError(this.state.error)) {
      return <FileX className="h-6 w-6 text-red-600" />;
    }
    return <Database className="h-6 w-6 text-red-600" />;
  };

  getErrorTitle = () => {
    if (!this.state.error) return 'Data Loading Error';
    
    if (this.isNetworkError(this.state.error)) {
      return 'Connection Error';
    }
    if (this.isPermissionError(this.state.error)) {
      return 'Access Denied';
    }
    return 'Data Loading Error';
  };

  getErrorMessage = () => {
    if (!this.state.error) return 'Unable to load data.';
    
    if (this.isNetworkError(this.state.error)) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    if (this.isPermissionError(this.state.error)) {
      return 'You don\'t have permission to access this data.';
    }
    return `Unable to load data${this.props.dataSource ? ` from ${this.props.dataSource}` : ''}.`;
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.state.maxRetries && this.props.showRetry !== false;

      // Default data error UI
      return (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              {this.getErrorIcon()}
              <CardTitle className="text-red-900 text-lg">
                {this.getErrorTitle()}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-red-800 mb-4">
              {this.getErrorMessage()}
            </p>
            
            {this.state.retryCount > 0 && (
              <p className="text-sm text-red-700 mb-4">
                Retry attempt {this.state.retryCount} of {this.state.maxRetries}
              </p>
            )}

            <div className="flex space-x-3">
              {canRetry && (
                <Button
                  onClick={this.handleRetry}
                  variant="outline"
                  size="sm"
                  className="flex items-center border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry ({this.state.maxRetries - this.state.retryCount} left)
                </Button>
              )}
              
              <Button
                onClick={this.handleReset}
                variant="outline"
                size="sm"
                className="flex items-center border-red-300 text-red-700 hover:bg-red-100"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto max-h-32">
                  {this.state.error.message}
                  {this.state.error.stack && (
                    <>
                      {'\n\n'}
                      {this.state.error.stack}
                    </>
                  )}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}