'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/shared';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/shared';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  LogIn, 
  Settings,
  HelpCircle,
  Wifi,
  Server
} from 'lucide-react';

interface DashboardErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
  lastRetryAt?: Date;
}

interface DashboardErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ 
    error: Error; 
    resetError: () => void; 
    retryCount: number;
    navigateToFallback: () => void;
  }>;
  fallbackRoute?: string;
  maxRetries?: number;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onMaxRetriesReached?: (error: Error) => void;
}

/**
 * Specialized error boundary for dashboard routing failures
 * Provides intelligent error handling with user-friendly messages and recovery options
 * 
 * Requirements: 3.2, 4.3, 4.4
 */
class DashboardErrorBoundary extends React.Component<
  DashboardErrorBoundaryProps, 
  DashboardErrorBoundaryState
> {
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: DashboardErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<DashboardErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error Boundary caught error:', error, errorInfo);
    
    this.setState({ 
      errorInfo,
      lastRetryAt: new Date()
    });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount,
      context: 'dashboard-routing'
    };
    
    console.log('Dashboard error logged:', errorData);
    // In production, send to your error reporting service
  };

  resetError = () => {
    const maxRetries = this.props.maxRetries || 3;
    const newRetryCount = this.state.retryCount + 1;

    if (newRetryCount > maxRetries) {
      if (this.props.onMaxRetriesReached && this.state.error) {
        this.props.onMaxRetriesReached(this.state.error);
      }
      return;
    }

    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      retryCount: newRetryCount,
      lastRetryAt: new Date()
    });
  };

  navigateToFallback = () => {
    const fallbackRoute = this.props.fallbackRoute || '/dashboard';
    window.location.href = fallbackRoute;
  };

  private getErrorType = (error: Error): 'network' | 'auth' | 'subscription' | 'routing' | 'unknown' => {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('login')) {
      return 'auth';
    }
    if (message.includes('subscription') || message.includes('plan') || message.includes('billing')) {
      return 'subscription';
    }
    if (message.includes('route') || message.includes('navigation') || message.includes('redirect')) {
      return 'routing';
    }
    return 'unknown';
  };

  private renderErrorContent = () => {
    if (!this.state.error) return null;

    const errorType = this.getErrorType(this.state.error);
    const maxRetries = this.props.maxRetries || 3;
    const canRetry = this.state.retryCount < maxRetries;

    const errorConfigs = {
      network: {
        icon: Wifi,
        title: 'Connection Problem',
        message: 'Unable to connect to our servers. Please check your internet connection and try again.',
        color: 'blue',
        actions: [
          { label: 'Try Again', action: this.resetError, primary: true, show: canRetry },
          { label: 'Go to Dashboard', action: this.navigateToFallback, primary: false, show: true }
        ]
      },
      auth: {
        icon: LogIn,
        title: 'Authentication Required',
        message: 'Please sign in to access your dashboard.',
        color: 'yellow',
        actions: [
          { label: 'Sign In', action: () => window.location.href = '/login', primary: true, show: true },
          { label: 'Go Home', action: () => window.location.href = '/', primary: false, show: true }
        ]
      },
      subscription: {
        icon: Settings,
        title: 'Subscription Data Unavailable',
        message: 'We\'re having trouble loading your subscription information. You can still access your dashboard.',
        color: 'orange',
        actions: [
          { label: 'Try Again', action: this.resetError, primary: true, show: canRetry },
          { label: 'Continue to Dashboard', action: this.navigateToFallback, primary: false, show: true },
          { label: 'Billing Settings', action: () => window.location.href = '/billing', primary: false, show: true }
        ]
      },
      routing: {
        icon: Home,
        title: 'Navigation Error',
        message: 'We encountered a problem while navigating to your dashboard.',
        color: 'purple',
        actions: [
          { label: 'Try Again', action: this.resetError, primary: true, show: canRetry },
          { label: 'Go to Dashboard', action: this.navigateToFallback, primary: false, show: true }
        ]
      },
      unknown: {
        icon: Server,
        title: 'Something Went Wrong',
        message: 'We encountered an unexpected error. Please try again or contact support if the problem persists.',
        color: 'red',
        actions: [
          { label: 'Try Again', action: this.resetError, primary: true, show: canRetry },
          { label: 'Go to Dashboard', action: this.navigateToFallback, primary: false, show: true },
          { label: 'Contact Support', action: () => window.location.href = '/contact', primary: false, show: !canRetry }
        ]
      }
    };

    const config = errorConfigs[errorType];
    const Icon = config.icon;

    const colorClasses = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', icon: 'text-blue-600', iconBg: 'bg-blue-100' },
      yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900', icon: 'text-yellow-600', iconBg: 'bg-yellow-100' },
      orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', icon: 'text-orange-600', iconBg: 'bg-orange-100' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', icon: 'text-purple-600', iconBg: 'bg-purple-100' },
      red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', icon: 'text-red-600', iconBg: 'bg-red-100' }
    };

    const colors = colorClasses[config.color as keyof typeof colorClasses];

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className={`w-full max-w-md ${colors.border} ${colors.bg}`}>
          <CardContent className="p-6 text-center">
            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${colors.iconBg} mb-4`}>
              <Icon className={`h-6 w-6 ${colors.icon}`} />
            </div>
            
            <h2 className={`text-xl font-semibold ${colors.text} mb-2`}>
              {config.title}
            </h2>
            
            <p className={`${colors.text.replace('900', '700')} mb-6`}>
              {config.message}
            </p>

            {this.state.retryCount > 0 && (
              <div className={`text-sm ${colors.text.replace('900', '600')} mb-4 p-2 rounded bg-white/50`}>
                Retry attempt {this.state.retryCount} of {maxRetries}
                {this.state.lastRetryAt && (
                  <div className="text-xs mt-1">
                    Last attempt: {this.state.lastRetryAt.toLocaleTimeString()}
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-3">
              {config.actions.filter(action => action.show).map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    action.primary
                      ? 'text-white bg-primary hover:bg-primary-dark focus:ring-primary'
                      : `text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-gray-500`
                  }`}
                >
                  {action.label === 'Try Again' && <RefreshCw className="-ml-1 mr-2 h-4 w-4" />}
                  {action.label === 'Sign In' && <LogIn className="-ml-1 mr-2 h-4 w-4" />}
                  {action.label.includes('Dashboard') && <Home className="-ml-1 mr-2 h-4 w-4" />}
                  {action.label === 'Contact Support' && <HelpCircle className="-ml-1 mr-2 h-4 w-4" />}
                  {action.label === 'Billing Settings' && <Settings className="-ml-1 mr-2 h-4 w-4" />}
                  {action.label}
                </button>
              ))}
            </div>

            {!canRetry && (
              <p className={`text-xs ${colors.text.replace('900', '500')} mt-4`}>
                If the problem persists, please contact our support team for assistance.
              </p>
            )}

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className={`cursor-pointer text-sm ${colors.text.replace('900', '600')} hover:${colors.text.replace('900', '800')}`}>
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-white/50 rounded text-xs">
                  <div className={`font-semibold ${colors.text.replace('900', '800')} mb-2`}>Error Message:</div>
                  <div className={`${colors.text.replace('900', '700')} mb-3`}>{this.state.error.message}</div>
                  
                  {this.state.error.stack && (
                    <>
                      <div className={`font-semibold ${colors.text.replace('900', '800')} mb-2`}>Stack Trace:</div>
                      <pre className={`${colors.text.replace('900', '600')} overflow-auto whitespace-pre-wrap text-xs`}>
                        {this.state.error.stack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback && this.state.error) {
        return (
          <this.props.fallback 
            error={this.state.error} 
            resetError={this.resetError}
            retryCount={this.state.retryCount}
            navigateToFallback={this.navigateToFallback}
          />
        );
      }

      return this.renderErrorContent();
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;