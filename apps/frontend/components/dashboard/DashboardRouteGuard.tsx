'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorHandler } from '../customer/error-handling/useErrorHandler';
import { FullPageLoader, LoadingOverlay } from '../customer/loading/LoadingStates';
import { AlertCircle, RefreshCw, Home, LogIn } from 'lucide-react';
import { Card, CardContent } from '../ui/shared';
import DashboardErrorBoundary from './DashboardErrorBoundary';
import { 
  DashboardTransitionWrapper, 
  RouteTransitionIndicator,
  NavigationTransition,
  useDashboardTransitions 
} from './DashboardTransitions';

interface DashboardRouteGuardProps {
  children: React.ReactNode;
  requiredRole?: 'CUSTOMER' | 'ADMIN';
  fallbackRoute?: string;
  showLoadingOverlay?: boolean;
}

interface ErrorDisplayProps {
  error: Error;
  onRetry: () => void;
  canRetry: boolean;
  isRetrying: boolean;
}

function ErrorDisplay({ error, onRetry, canRetry, isRetrying }: ErrorDisplayProps) {
  const router = useRouter();

  const getErrorMessage = (error: Error): { title: string; message: string; actions: Array<{ label: string; action: () => void; primary?: boolean }> } => {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
      return {
        title: 'Authentication Required',
        message: 'Please sign in to access your dashboard.',
        actions: [
          { label: 'Sign In', action: () => router.push('/login'), primary: true },
          { label: 'Go Home', action: () => router.push('/') }
        ]
      };
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return {
        title: 'Connection Problem',
        message: 'Unable to connect to our servers. Please check your internet connection.',
        actions: [
          { label: 'Try Again', action: onRetry, primary: true },
          { label: 'Go Home', action: () => router.push('/') }
        ]
      };
    }
    
    if (errorMessage.includes('subscription') || errorMessage.includes('plan')) {
      return {
        title: 'Subscription Data Unavailable',
        message: 'We\'re having trouble loading your subscription information.',
        actions: [
          { label: 'Retry', action: onRetry, primary: true },
          { label: 'Continue Anyway', action: () => router.push('/customer-dashboard') }
        ]
      };
    }
    
    return {
      title: 'Something Went Wrong',
      message: 'We encountered an unexpected error. Please try again or contact support if the problem persists.',
      actions: [
        { label: 'Try Again', action: onRetry, primary: true },
        { label: 'Go Home', action: () => router.push('/') }
      ]
    };
  };

  const { title, message, actions } = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="space-y-3">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                disabled={isRetrying && action.action === onRetry}
                className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  action.primary
                    ? 'text-white bg-primary hover:bg-primary-dark focus:ring-primary'
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-gray-500'
                }`}
              >
                {isRetrying && action.action === onRetry ? (
                  <>
                    <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Retrying...
                  </>
                ) : action.label === 'Try Again' || action.label === 'Retry' ? (
                  <>
                    <RefreshCw className="-ml-1 mr-2 h-4 w-4" />
                    {action.label}
                  </>
                ) : action.label === 'Sign In' ? (
                  <>
                    <LogIn className="-ml-1 mr-2 h-4 w-4" />
                    {action.label}
                  </>
                ) : action.label === 'Go Home' || action.label === 'Continue Anyway' ? (
                  <>
                    <Home className="-ml-1 mr-2 h-4 w-4" />
                    {action.label}
                  </>
                ) : (
                  action.label
                )}
              </button>
            ))}
          </div>
          
          {canRetry && !isRetrying && (
            <p className="text-xs text-gray-500 mt-4">
              Having trouble? Try refreshing the page or contact support.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Dashboard Route Guard Component
 * 
 * Provides route protection for dashboard pages with:
 * - Authentication checks before dashboard access
 * - Loading states during data fetching
 * - Error handling with user-friendly messages
 * - Automatic routing based on user role and subscription status
 * 
 * Requirements: 2.4, 4.1, 4.3
 */
export function DashboardRouteGuard({
  children,
  requiredRole,
  fallbackRoute = '/login',
  showLoadingOverlay = false
}: DashboardRouteGuardProps) {
  const { user, isLoading: authLoading, isAuthenticated, isHydrated } = useAuth();
  const router = useRouter();
  const { isTransitioning, transitionState, dashboardState } = useDashboardTransitions();
  
  // Determine critical loading state (blocks rendering completely)
  const isCriticalLoading = !isHydrated || authLoading;

  // Handle authentication redirect
  useEffect(() => {
    if (isHydrated && !authLoading && !isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      const returnUrl = encodeURIComponent(currentPath);
      router.push(`${fallbackRoute}?returnUrl=${returnUrl}`);
    }
  }, [isHydrated, authLoading, isAuthenticated, router, fallbackRoute]);

  // Handle role-based access control
  useEffect(() => {
    if (isAuthenticated && user && requiredRole && user.role !== requiredRole) {
      // Redirect to appropriate dashboard based on user role
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.role === 'CUSTOMER') {
        router.push('/customer-dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, user, requiredRole, router]);

  // Note: Automatic dashboard routing is now handled by CustomerDashboardLogic
  // to prevent duplicate hook calls and race conditions

  // Retry function for error recovery - simplified since routing is handled by parent
  const handleRetry = async () => {
    try {
      // Simple retry by refreshing the page - let CustomerDashboardLogic handle data refetch
      window.location.reload();
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  // Show loading state while authenticating or hydrating (critical loading)
  if (isCriticalLoading) {
    const loadingMessage = !isHydrated 
      ? 'Initializing...'
      : 'Checking authentication...';

    return (
      <FullPageLoader 
        message={loadingMessage}
      />
    );
  }

  // Show error state if there are unrecoverable errors
  // Note: Most errors are now handled by CustomerDashboardLogic

  // Don't render children if not authenticated (redirect is in progress)
  if (!isAuthenticated) {
    return (
      <FullPageLoader 
        message="Redirecting to sign in..."
        submessage="Please wait while we redirect you to the login page."
      />
    );
  }

  // Don't render children if role check fails (redirect is in progress)
  if (requiredRole && user && user.role !== requiredRole) {
    return (
      <FullPageLoader 
        message="Redirecting to your dashboard..."
        submessage="Taking you to the right place based on your account type."
      />
    );
  }

  // Render children with optional loading overlay
  // Note: Loading states are now handled by CustomerDashboardLogic

  // Wrap children with error boundary and transition components for comprehensive error handling
  return (
    <>
      {/* Route transition indicator */}
      <RouteTransitionIndicator
        isTransitioning={isTransitioning}
        message={transitionState === 'navigating' ? 'Navigating to dashboard...' : 'Updating dashboard...'}
      />
      
      <DashboardErrorBoundary
        fallbackRoute={fallbackRoute}
        onError={(error, errorInfo) => {
          console.error('Dashboard Route Guard Error Boundary:', error, errorInfo);
        }}
        onMaxRetriesReached={(error) => {
          console.error('Dashboard Route Guard max retries reached:', error);
        }}
      >
        <NavigationTransition
          isNavigating={transitionState === 'navigating'}
          destination="/customer-dashboard"
        >
          <DashboardTransitionWrapper
            transitionKey={`${user?.id || 'anonymous'}-${dashboardState}`}
            variant="fade"
          >
            {children}
          </DashboardTransitionWrapper>
        </NavigationTransition>
      </DashboardErrorBoundary>
    </>
  );
}

// Higher-order component version for easier usage
export function withDashboardRouteGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardOptions?: Omit<DashboardRouteGuardProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <DashboardRouteGuard {...guardOptions}>
      <Component {...props} />
    </DashboardRouteGuard>
  );
  
  WrappedComponent.displayName = `withDashboardRouteGuard(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Utility hook for components that need to check route guard status
export function useDashboardRouteGuardStatus() {
  const { user, isLoading: authLoading, isAuthenticated, isHydrated } = useAuth();
  
  const isLoading = !isHydrated || authLoading;
  const isReady = isAuthenticated && !isLoading;
  
  return {
    isLoading,
    isReady,
    isAuthenticated,
    user
  };
}

export default DashboardRouteGuard;