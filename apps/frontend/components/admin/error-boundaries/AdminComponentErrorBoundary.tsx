"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug, Wifi, Database, FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
  showRetry?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorType: 'network' | 'data' | 'permission' | 'component' | 'unknown';
}

export class AdminComponentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown'
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorType = AdminComponentErrorBoundary.categorizeError(error);
    
    return {
      hasError: true,
      error,
      errorType
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
    console.error(`Admin Component Error (${this.props.componentName || 'Unknown'}):`, error, errorInfo);

    // Send error to monitoring service
    this.reportError(error, errorInfo);
  }

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      errorId: `component_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      errorType: this.state.errorType,
      componentName: this.props.componentName,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
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
      console.error('Failed to report component error:', err);
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown'
    });
  };

  getErrorIcon = () => {
    switch (this.state.errorType) {
      case 'network':
        return <Wifi className="h-4 w-4" />;
      case 'data':
        return <Database className="h-4 w-4" />;
      case 'permission':
        return <FileX className="h-4 w-4" />;
      case 'component':
        return <Bug className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  getErrorTitle = () => {
    const componentName = this.props.componentName || 'Component';
    switch (this.state.errorType) {
      case 'network':
        return `${componentName} Connection Error`;
      case 'data':
        return `${componentName} Data Error`;
      case 'permission':
        return `${componentName} Access Error`;
      case 'component':
        return `${componentName} Render Error`;
      default:
        return `${componentName} Error`;
    }
  };

  getErrorMessage = () => {
    switch (this.state.errorType) {
      case 'network':
        return 'Unable to load data due to connection issues.';
      case 'data':
        return 'There was a problem processing the data.';
      case 'permission':
        return 'You don\'t have permission to view this content.';
      case 'component':
        return 'The component failed to render properly.';
      default:
        return 'An unexpected error occurred in this component.';
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default component error UI
      return (
        <Alert variant="destructive" className="my-4">
          <div className="flex items-start space-x-2">
            {this.getErrorIcon()}
            <div className="flex-1">
              <div className="font-medium text-sm mb-1">{this.getErrorTitle()}</div>
              <AlertDescription className="mt-1">
                {this.getErrorMessage()}
              </AlertDescription>
              {this.props.showRetry !== false && (
                <div className="mt-3">
                  <Button
                    onClick={this.handleReset}
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <RefreshCw className="h-3 w-3 mr-2" />
                    Retry
                  </Button>
                </div>
              )}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto max-h-32">
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
            </div>
          </div>
        </Alert>
      );
    }

    return this.props.children;
  }
}