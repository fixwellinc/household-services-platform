'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useSubscriptionStatus } from './use-subscription-status';
import { useErrorHandler } from '../components/customer/error-handling/useErrorHandler';
import { useDashboardPerformanceMonitor } from '../lib/dashboard-performance-monitor';

export interface DashboardRoute {
    path: string;
    label: string;
    description: string;
}

export interface DashboardRoutingState {
    // Current routing state
    currentRoute: string;
    targetRoute: string;
    isLoading: boolean;
    error: Error | null;

    // Available routes for the user
    availableRoutes: DashboardRoute[];

    // Route determination
    shouldRedirectToCustomerDashboard: boolean;
    shouldShowGeneralDashboard: boolean;
    shouldRedirectToAdmin: boolean;

    // Navigation functions
    navigateToDashboard: (preserveParams?: boolean) => void;
    navigateToRoute: (route: string, preserveParams?: boolean) => void;
    getDashboardUrl: (preserveParams?: boolean) => string;

    // Utility functions
    isCurrentRoute: (route: string) => boolean;
    canAccessRoute: (route: string) => boolean;

    // Enhanced error handling and fallback routing
    hasRoutingError: boolean;
    fallbackRoute: string;
    retryRouting: () => Promise<void>;
    navigateToFallback: () => void;
    isRetrying: boolean;
    canRetry: boolean;
}

/**
 * Enhanced dashboard routing hook that provides centralized routing logic
 * based on user role and subscription status with proper loading states
 * and URL parameter preservation.
 */
export function useDashboardRouting(): DashboardRoutingState {
    const { user, isLoading: authLoading } = useAuth();
    const subscriptionStatus = useSubscriptionStatus();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const performanceMonitor = useDashboardPerformanceMonitor();

    // Local state for routing errors
    const [routingError, setRoutingError] = useState<Error | null>(null);

    // Error handler for routing operations
    const routingErrorHandler = useErrorHandler({
        maxRetries: 2,
        retryDelay: 500,
        onError: (error) => {
            console.error('Dashboard routing error:', error);
            setRoutingError(error);
        },
        onMaxRetriesReached: (error) => {
            console.error('Max retries reached for dashboard routing:', error);
        }
    });

    // Determine if we're currently loading critical data
    const isLoading = authLoading || (subscriptionStatus?.isLoading ?? false) || routingErrorHandler.isRetrying;

    // Combine errors from auth, subscription, and routing
    const error = routingError || (subscriptionStatus?.error ?? null);
    const hasRoutingError = !!error;

    // Determine fallback route based on user role
    const fallbackRoute = useMemo(() => {
        if (!user) return '/login';
        if (user.role === 'ADMIN') return '/admin';
        if (user.role === 'CUSTOMER') return '/customer-dashboard';
        return '/dashboard';
    }, [user]);

    // Route determination logic based on user role and subscription status
    const routeDecisions = useMemo(() => {
        try {
            // Default state when auth is loading or no user
            if (authLoading || !user) {
                return {
                    shouldRedirectToAdmin: false,
                    shouldRedirectToCustomerDashboard: false,
                    shouldShowGeneralDashboard: false,
                    targetRoute: '/login',
                };
            }

            // Admin users always go to admin dashboard
            if (user.role === 'ADMIN') {
                return {
                    shouldRedirectToAdmin: true,
                    shouldRedirectToCustomerDashboard: false,
                    shouldShowGeneralDashboard: false,
                    targetRoute: '/admin',
                };
            }

            // Customer users routing based on subscription status
            if (user.role === 'CUSTOMER') {
                // If subscription data is still loading, don't make routing decisions yet
                if (subscriptionStatus?.isLoading) {
                    return {
                        shouldRedirectToAdmin: false,
                        shouldRedirectToCustomerDashboard: false,
                        shouldShowGeneralDashboard: false,
                        targetRoute: pathname, // Stay on current route while loading
                    };
                }

                // If subscription data failed to load, implement fallback routing
                if (subscriptionStatus?.isError || !subscriptionStatus) {
                    // For customer users, default to customer dashboard when subscription data is unavailable
                    // This ensures they can still access their dashboard even if subscription service is down
                    return {
                        shouldRedirectToAdmin: false,
                        shouldRedirectToCustomerDashboard: true,
                        shouldShowGeneralDashboard: false,
                        targetRoute: '/customer-dashboard',
                    };
                }

                // Route based on subscription status
                if (subscriptionStatus?.shouldShowCustomerDashboard) {
                    return {
                        shouldRedirectToAdmin: false,
                        shouldRedirectToCustomerDashboard: true,
                        shouldShowGeneralDashboard: false,
                        targetRoute: '/customer-dashboard',
                    };
                } else {
                    return {
                        shouldRedirectToAdmin: false,
                        shouldRedirectToCustomerDashboard: false,
                        shouldShowGeneralDashboard: true,
                        targetRoute: '/dashboard',
                    };
                }
            }

            // Fallback for unknown user roles
            return {
                shouldRedirectToAdmin: false,
                shouldRedirectToCustomerDashboard: false,
                shouldShowGeneralDashboard: true,
                targetRoute: '/dashboard',
            };
        } catch (error) {
            // If route determination fails, set routing error and return safe fallback
            console.error('Route determination error:', error);
            setRoutingError(error as Error);

            return {
                shouldRedirectToAdmin: false,
                shouldRedirectToCustomerDashboard: false,
                shouldShowGeneralDashboard: false,
                targetRoute: fallbackRoute,
            };
        }
    }, [user, subscriptionStatus, isLoading, pathname, fallbackRoute]);

    // Available routes based on user permissions
    const availableRoutes = useMemo((): DashboardRoute[] => {
        if (!user) return [];

        const routes: DashboardRoute[] = [];

        if (user.role === 'ADMIN') {
            routes.push({
                path: '/admin',
                label: 'Admin Dashboard',
                description: 'Administrative controls and system management',
            });
        }

        if (user.role === 'CUSTOMER') {
            if (subscriptionStatus?.shouldShowCustomerDashboard) {
                routes.push({
                    path: '/customer-dashboard',
                    label: 'Customer Dashboard',
                    description: 'Manage your subscription and services',
                });
            }

            routes.push({
                path: '/dashboard',
                label: 'Dashboard',
                description: 'General dashboard with subscription options',
            });
        }

        return routes;
    }, [user, subscriptionStatus]);

    // Helper function to preserve URL parameters and hash fragments
    const preserveUrlParams = useCallback((baseUrl: string): string => {
        let url = baseUrl;

        // Preserve query parameters
        if (searchParams && searchParams.toString() !== '') {
            const separator = url.includes('?') ? '&' : '?';
            url = `${url}${separator}${searchParams.toString()}`;
        }

        // Preserve hash fragment (client-side only)
        if (typeof window !== 'undefined' && window.location.hash) {
            url = `${url}${window.location.hash}`;
        }

        return url;
    }, [searchParams]);

    // Get the appropriate dashboard URL
    const getDashboardUrl = useCallback((preserveParams: boolean = true): string => {
        const baseUrl = routeDecisions.targetRoute;
        return preserveParams ? preserveUrlParams(baseUrl) : baseUrl;
    }, [routeDecisions.targetRoute, preserveUrlParams]);

    // Navigate to the appropriate dashboard with error handling
    const navigateToDashboard = useCallback(async (preserveParams: boolean = true) => {
        performanceMonitor.startTiming('dashboard-routing');
        
        try {
            await routingErrorHandler.executeWithRetry(async () => {
                const url = getDashboardUrl(preserveParams);
                router.push(url);
            });
            
            performanceMonitor.endTiming('dashboard-routing');
        } catch (error) {
            performanceMonitor.endTiming('dashboard-routing');
            performanceMonitor.recordError();
            console.error('Navigation to dashboard failed:', error);
            // Fallback to safe route
            router.push(fallbackRoute);
        }
    }, [router, getDashboardUrl, routingErrorHandler, fallbackRoute, performanceMonitor]);

    // Navigate to a specific route with error handling
    const navigateToRoute = useCallback(async (route: string, preserveParams: boolean = true) => {
        performanceMonitor.startTiming('dashboard-routing');
        
        try {
            await routingErrorHandler.executeWithRetry(async () => {
                const url = preserveParams ? preserveUrlParams(route) : route;
                router.push(url);
            });
            
            performanceMonitor.endTiming('dashboard-routing');
        } catch (error) {
            performanceMonitor.endTiming('dashboard-routing');
            performanceMonitor.recordError();
            console.error('Navigation to route failed:', error);
            // Fallback to safe route
            router.push(fallbackRoute);
        }
    }, [router, preserveUrlParams, routingErrorHandler, fallbackRoute, performanceMonitor]);

    // Navigate to fallback route
    const navigateToFallback = useCallback(() => {
        try {
            router.push(fallbackRoute);
            setRoutingError(null); // Clear routing error on successful fallback
        } catch (error) {
            console.error('Fallback navigation failed:', error);
            // Last resort: hard navigation
            window.location.href = fallbackRoute;
        }
    }, [router, fallbackRoute]);

    // Retry routing operation
    const retryRouting = useCallback(async () => {
        try {
            await routingErrorHandler.retry();
            setRoutingError(null);

            // Retry subscription data if that was the source of the error
            if (subscriptionStatus?.error && subscriptionStatus.canRetry) {
                await subscriptionStatus.retrySubscriptionData();
            }
        } catch (error) {
            console.error('Routing retry failed:', error);
        }
    }, [routingErrorHandler, subscriptionStatus]);

    // Check if a route is the current route
    const isCurrentRoute = useCallback((route: string): boolean => {
        return pathname === route;
    }, [pathname]);

    // Check if user can access a specific route
    const canAccessRoute = useCallback((route: string): boolean => {
        if (!user) return false;

        // Admin routes
        if (route.startsWith('/admin')) {
            return user.role === 'ADMIN';
        }

        // Customer dashboard route
        if (route === '/customer-dashboard') {
            return user.role === 'CUSTOMER' && (subscriptionStatus?.shouldShowCustomerDashboard ?? false);
        }

        // General dashboard route
        if (route === '/dashboard') {
            return user.role === 'CUSTOMER';
        }

        // Default: allow access to other routes
        return true;
    }, [user, subscriptionStatus]);

    return {
        // Current state
        currentRoute: pathname,
        targetRoute: routeDecisions.targetRoute,
        isLoading,
        error,

        // Available routes
        availableRoutes,

        // Route decisions
        shouldRedirectToCustomerDashboard: routeDecisions.shouldRedirectToCustomerDashboard,
        shouldShowGeneralDashboard: routeDecisions.shouldShowGeneralDashboard,
        shouldRedirectToAdmin: routeDecisions.shouldRedirectToAdmin,

        // Navigation functions
        navigateToDashboard,
        navigateToRoute,
        getDashboardUrl,

        // Utility functions
        isCurrentRoute,
        canAccessRoute,

        // Enhanced error handling and fallback routing
        hasRoutingError,
        fallbackRoute,
        retryRouting,
        navigateToFallback,
        isRetrying: routingErrorHandler.isRetrying,
        canRetry: routingErrorHandler.canRetry,
    };
}

// Utility functions for backward compatibility and convenience

/**
 * Utility function to check if user should be redirected to customer dashboard
 * @deprecated Use useDashboardRouting hook instead
 */
export function shouldRedirectToCustomerDashboard(
    userRole: string | undefined,
    subscriptionStatus: any
): boolean {
    return userRole === 'CUSTOMER' && subscriptionStatus?.shouldShowCustomerDashboard;
}

/**
 * Utility function to check if user should see general dashboard with promotion
 * @deprecated Use useDashboardRouting hook instead
 */
export function shouldShowGeneralDashboard(
    userRole: string | undefined,
    subscriptionStatus: any
): boolean {
    return userRole === 'CUSTOMER' && subscriptionStatus?.shouldShowPromotion;
}

/**
 * Utility function to get appropriate dashboard URL
 * @deprecated Use useDashboardRouting hook instead
 */
export function getDashboardUrl(
    userRole: string | undefined,
    subscriptionStatus: any
): string {
    if (userRole === 'ADMIN') {
        return '/admin';
    }

    if (shouldRedirectToCustomerDashboard(userRole, subscriptionStatus)) {
        return '/customer-dashboard';
    }

    return '/dashboard';
}