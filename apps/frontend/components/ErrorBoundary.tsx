'use client';

import React from 'react';
import { Button } from '@/components/ui/shared';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Special handling for React error #310 (hooks order violation)
    if (error.message.includes('310') || error.message.includes('Rendered more hooks than during the previous render')) {
      console.error('🚨 React Error #310 detected: Hooks order violation');
      console.error('This usually means hooks are being called conditionally or in different orders between renders.');
      console.error('Common causes:');
      console.error('1. Calling hooks inside conditions, loops, or nested functions');
      console.error('2. Early returns before all hooks are called');
      console.error('3. Dynamic hook calls based on props/state');
      console.error('4. Conditional rendering that affects hook call order');
      console.error('');
      console.error('🔧 To fix this issue:');
      console.error('1. Move all hook calls to the top level of the component');
      console.error('2. Use conditional rendering instead of early returns after hooks');
      console.error('3. Ensure hooks are always called in the same order');
      console.error('4. Use useMemo or useCallback for conditional logic');
    }
    
    // Handle subscription-related errors
    if (error.message.includes('subscription') || error.message.includes('customer')) {
      console.error('🚨 Customer dashboard subscription error detected');
      console.error('This might be related to subscription data loading or real-time updates');
      console.error('Check if the user has an active subscription and if the API endpoints are working');
    }
    
    // Here you could send error to your error reporting service
    // e.g., Sentry, LogRocket, etc.
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.error!} resetError={this.resetError} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">
              We&apos;re sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <div className="space-y-3">
              <Button onClick={this.resetError} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Go to Home
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 