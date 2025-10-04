"use client";

/**
 * Enhanced Error Tracking React Hook
 * 
 * Provides error tracking functionality for React components
 */

import { useEffect, useCallback } from 'react';
import { enhancedErrorTracker } from '@/lib/enhanced-error-tracker';
import { useAuth } from '@/contexts/AuthContext';

interface UseErrorTrackingOptions {
  componentName?: string;
  trackUserActions?: boolean;
  trackPerformance?: boolean;
}

interface UseErrorTrackingReturn {
  trackError: (error: Error, severity?: 'low' | 'medium' | 'high' | 'critical') => void;
  trackCustomError: (message: string, severity?: 'low' | 'medium' | 'high' | 'critical', data?: any) => void;
  addBreadcrumb: (action: string, data?: any) => void;
  setUserContext: (context: any) => void;
}

export function useErrorTracking(options: UseErrorTrackingOptions = {}): UseErrorTrackingReturn {
  const { user } = useAuth();
  const { componentName, trackUserActions = true, trackPerformance = true } = options;

  // Set up user context
  useEffect(() => {
    if (user) {
      errorTracker.setUserContext({
        userId: user.id,
        userRole: user.role,
        userTier: user.tier,
      });
    }
  }, [user]);

  // Set up component-specific context
  useEffect(() => {
    if (componentName) {
      errorTracker.addBreadcrumb('component_mounted', { componentName });
    }

    return () => {
      if (componentName) {
        errorTracker.addBreadcrumb('component_unmounted', { componentName });
      }
    };
  }, [componentName]);

  // Track user actions
  const addBreadcrumb = useCallback((action: string, data?: any) => {
    if (trackUserActions) {
      errorTracker.addBreadcrumb(action, { componentName, ...data });
    }
  }, [componentName, trackUserActions]);

  // Track errors
  const trackError = useCallback((error: Error, severity: 'low' | 'medium' | 'high' | 'critical' = 'high') => {
    errorTracker.trackError({
      message: error.message,
      stack: error.stack,
      type: 'react',
      severity,
      componentName,
    });
  }, [componentName]);

  // Track custom errors
  const trackCustomError = useCallback((
    message: string, 
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium', 
    data?: any
  ) => {
    errorTracker.trackCustomError(message, severity, { componentName, ...data });
  }, [componentName]);

  // Set user context
  const setUserContext = useCallback((context: any) => {
    errorTracker.setUserContext(context);
  }, []);

  return {
    trackError,
    trackCustomError,
    addBreadcrumb,
    setUserContext,
  };
}

/**
 * Hook for tracking API errors
 */
export function useApiErrorTracking() {
  const { trackError, addBreadcrumb } = useErrorTracking({ componentName: 'API' });

  const trackApiError = useCallback((
    error: Error,
    endpoint: string,
    method: string,
    statusCode?: number
  ) => {
    addBreadcrumb('api_error', { endpoint, method, statusCode });
    trackError(error, statusCode && statusCode >= 500 ? 'high' : 'medium');
  }, [trackError, addBreadcrumb]);

  return { trackApiError };
}

/**
 * Hook for tracking user interactions
 */
export function useInteractionTracking() {
  const { addBreadcrumb } = useErrorTracking({ componentName: 'UserInteraction' });

  const trackClick = useCallback((element: string, data?: any) => {
    addBreadcrumb('click', { element, ...data });
  }, [addBreadcrumb]);

  const trackNavigation = useCallback((from: string, to: string) => {
    addBreadcrumb('navigation', { from, to });
  }, [addBreadcrumb]);

  const trackFormSubmission = useCallback((formName: string, success: boolean, data?: any) => {
    addBreadcrumb('form_submission', { formName, success, ...data });
  }, [addBreadcrumb]);

  const trackPageView = useCallback((page: string, data?: any) => {
    addBreadcrumb('page_view', { page, ...data });
  }, [addBreadcrumb]);

  return {
    trackClick,
    trackNavigation,
    trackFormSubmission,
    trackPageView,
  };
}

/**
 * Hook for tracking performance issues
 */
export function usePerformanceTracking() {
  const { trackCustomError, addBreadcrumb } = useErrorTracking({ componentName: 'Performance' });

  const trackSlowOperation = useCallback((operation: string, duration: number, threshold: number = 1000) => {
    if (duration > threshold) {
      trackCustomError(
        `Slow operation: ${operation}`,
        duration > threshold * 2 ? 'high' : 'medium',
        { operation, duration, threshold }
      );
    }
    addBreadcrumb('slow_operation', { operation, duration });
  }, [trackCustomError, addBreadcrumb]);

  const trackMemoryUsage = useCallback((usage: number, threshold: number = 0.8) => {
    if (usage > threshold) {
      trackCustomError(
        'High memory usage detected',
        usage > 0.9 ? 'high' : 'medium',
        { usage, threshold }
      );
    }
    addBreadcrumb('memory_usage', { usage });
  }, [trackCustomError, addBreadcrumb]);

  const trackRenderTime = useCallback((component: string, renderTime: number, threshold: number = 16) => {
    if (renderTime > threshold) {
      trackCustomError(
        `Slow render: ${component}`,
        renderTime > threshold * 2 ? 'high' : 'medium',
        { component, renderTime, threshold }
      );
    }
    addBreadcrumb('render_time', { component, renderTime });
  }, [trackCustomError, addBreadcrumb]);

  return {
    trackSlowOperation,
    trackMemoryUsage,
    trackRenderTime,
  };
}
