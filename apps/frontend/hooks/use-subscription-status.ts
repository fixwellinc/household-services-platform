'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { useApiErrorHandler, classifyError } from '../components/customer/error-handling/useErrorHandler';
import { useDashboardPerformanceMonitor } from '../lib/dashboard-performance-monitor';

// Subscription status types based on Stripe and our business logic
export type SubscriptionStatusType = 
  | 'ACTIVE'           // Active subscription with full access
  | 'PAST_DUE'         // Payment failed but still has access (grace period)
  | 'CANCELLED'        // Cancelled but may still have access until period end
  | 'INCOMPLETE'       // Subscription created but payment not completed
  | 'NONE';            // No subscription history

export interface SubscriptionStatus {
  // Core status information
  hasSubscriptionHistory: boolean;
  currentStatus: SubscriptionStatusType;
  
  // Dashboard routing decisions
  shouldShowCustomerDashboard: boolean;
  shouldShowPromotion: boolean;
  
  // Feature access control
  canAccessPremiumFeatures: boolean;
  
  // Subscription details (when available)
  subscription?: {
    id?: string;
    tier: string;
    status: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    createdAt?: string;
  };
  
  // Plan details (when available)
  plan?: {
    id: string;
    name: string;
    description: string;
    monthlyPrice: number;
    yearlyPrice: number;
    features: string[];
  };
}

export interface UseSubscriptionStatusResult extends SubscriptionStatus {
  // Loading and error states
  isLoading: boolean;
  error: Error | null;
  
  // Utility functions
  refetch: () => void;
  isError: boolean;
  
  // Enhanced error handling
  retryCount: number;
  canRetry: boolean;
  isRetrying: boolean;
  retrySubscriptionData: () => Promise<void>;
  errorType: 'network' | 'server' | 'client' | 'unknown' | null;
  userFriendlyErrorMessage: string | null;
}

/**
 * Enhanced subscription status hook that provides comprehensive subscription detection
 * and handles all subscription states properly with loading and error states.
 */
export function useSubscriptionStatus(): UseSubscriptionStatusResult {
  const { user, isLoading: authLoading } = useAuth();
  const performanceMonitor = useDashboardPerformanceMonitor();
  
  // Enhanced error handler for subscription data
  const errorHandler = useApiErrorHandler({
    maxRetries: 3,
    retryDelay: 1000,
    onError: (error) => {
      console.error('Subscription data error:', error);
      performanceMonitor.recordError();
    },
    onMaxRetriesReached: (error) => {
      console.error('Max retries reached for subscription data:', error);
      performanceMonitor.recordError();
    }
  });
  
  // Query user's current plan data with performance monitoring
  const {
    data: userPlanData,
    isLoading: planLoading,
    error,
    refetch,
    isError
  } = useQuery({
    queryKey: ['user-plan', user?.id],
    queryFn: async () => {
      performanceMonitor.startTiming('subscription-load');
      
      try {
        const result = await errorHandler.executeApiCall(async () => {
          return api.getUserPlan();
        });
        
        performanceMonitor.endTiming('subscription-load');
        performanceMonitor.recordCacheHit(); // Successful load
        
        return result;
      } catch (error) {
        performanceMonitor.endTiming('subscription-load');
        performanceMonitor.recordCacheMiss();
        throw error;
      }
    },
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes - increased for better caching
    gcTime: 10 * 60 * 1000, // 10 minutes - increased for better caching
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: false, // Use cached data when available
    retry: (failureCount, error) => {
      performanceMonitor.recordRetry();
      
      // Don't retry on authentication errors
      if (error instanceof Error && error.message.includes('Authentication required')) {
        return false;
      }
      
      // Use error classification to determine if retry is appropriate
      const errorClassification = classifyError(error as Error);
      if (!errorClassification.isRetryable) {
        return false;
      }
      
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Determine subscription status based on API response
  const determineSubscriptionStatus = (apiResponse: any): SubscriptionStatus => {
    // Default status for users with no subscription data
    const defaultStatus: SubscriptionStatus = {
      hasSubscriptionHistory: false,
      currentStatus: 'NONE',
      shouldShowCustomerDashboard: false,
      shouldShowPromotion: true,
      canAccessPremiumFeatures: false,
    };

    // If no API response or no subscription data, return default
    if (!apiResponse || !apiResponse.success || !apiResponse.hasPlan || !apiResponse.subscription) {
      return defaultStatus;
    }

    const subscription = apiResponse.subscription;
    const plan = apiResponse.plan;
    const subscriptionStatus = subscription.status?.toUpperCase() as SubscriptionStatusType;

    // Determine if user has subscription history (any subscription record exists)
    const hasSubscriptionHistory = true; // If we have subscription data, they have history

    // Determine dashboard and feature access based on status
    let shouldShowCustomerDashboard = false;
    let shouldShowPromotion = false;
    let canAccessPremiumFeatures = false;

    switch (subscriptionStatus) {
      case 'ACTIVE':
        shouldShowCustomerDashboard = true;
        shouldShowPromotion = false;
        canAccessPremiumFeatures = true;
        break;
        
      case 'PAST_DUE':
        // Still show customer dashboard with payment reminder
        shouldShowCustomerDashboard = true;
        shouldShowPromotion = false;
        canAccessPremiumFeatures = true; // Grace period access
        break;
        
      case 'CANCELLED':
        // Show customer dashboard with reactivation options
        shouldShowCustomerDashboard = true;
        shouldShowPromotion = false;
        canAccessPremiumFeatures = false;
        break;
        
      case 'INCOMPLETE':
        // Show customer dashboard with payment completion prompt
        shouldShowCustomerDashboard = true;
        shouldShowPromotion = false;
        canAccessPremiumFeatures = false;
        break;
        
      default:
        // Unknown status, treat as no subscription
        shouldShowCustomerDashboard = false;
        shouldShowPromotion = true;
        canAccessPremiumFeatures = false;
        break;
    }

    return {
      hasSubscriptionHistory,
      currentStatus: subscriptionStatus || 'NONE',
      shouldShowCustomerDashboard,
      shouldShowPromotion,
      canAccessPremiumFeatures,
      subscription: {
        id: subscription.id || '',
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        createdAt: subscription.createdAt,
      },
      plan: plan ? {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        features: plan.features,
      } : undefined,
    };
  };

  // Calculate final status with fallback for error states
  const subscriptionStatus = determineSubscriptionStatus(userPlanData);
  
  // Determine overall loading state
  const isLoading = authLoading || planLoading || errorHandler.isRetrying;
  
  // Enhanced error information
  const primaryError = error || errorHandler.error;
  const errorClassification = primaryError ? classifyError(primaryError) : null;
  
  // Retry function for subscription data
  const retrySubscriptionData = async () => {
    try {
      await errorHandler.retry();
      await refetch();
    } catch (retryError) {
      console.error('Subscription data retry failed:', retryError);
      throw retryError;
    }
  };

  return {
    ...subscriptionStatus,
    isLoading,
    error: primaryError,
    refetch,
    isError: isError || !!errorHandler.error,
    
    // Enhanced error handling
    retryCount: errorHandler.retryCount,
    canRetry: errorHandler.canRetry,
    isRetrying: errorHandler.isRetrying,
    retrySubscriptionData,
    errorType: errorClassification?.type || null,
    userFriendlyErrorMessage: errorClassification?.userMessage || null,
  };
}

// Utility function to check if user should be redirected to customer dashboard
export function shouldRedirectToCustomerDashboard(
  userRole: string | undefined,
  subscriptionStatus: SubscriptionStatus
): boolean {
  return userRole === 'CUSTOMER' && subscriptionStatus.shouldShowCustomerDashboard;
}

// Utility function to check if user should see general dashboard with promotion
export function shouldShowGeneralDashboard(
  userRole: string | undefined,
  subscriptionStatus: SubscriptionStatus
): boolean {
  return userRole === 'CUSTOMER' && subscriptionStatus.shouldShowPromotion;
}

// Utility function to get appropriate dashboard URL
export function getDashboardUrl(
  userRole: string | undefined,
  subscriptionStatus: SubscriptionStatus
): string {
  if (userRole === 'ADMIN') {
    return '/admin';
  }
  
  if (shouldRedirectToCustomerDashboard(userRole, subscriptionStatus)) {
    return '/customer-dashboard';
  }
  
  return '/dashboard';
}