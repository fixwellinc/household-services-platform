'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionStatus } from '@/hooks/use-subscription-status';
import { useDashboardRouting } from '@/hooks/use-dashboard-routing';
import { useCustomerRealtime } from '@/hooks/use-customer-realtime';
import { DashboardRouteGuard } from '@/components/dashboard/DashboardRouteGuard';
import { FullPageLoader } from '@/components/customer/loading/LoadingStates';
import { Notification } from '@fixwell/types';
import { useQueryClient } from '@tanstack/react-query';

// Create context for dashboard data
interface CustomerDashboardContextType {
    user: any;
    subscriptionStatus: any;
    transformedSubscription: any;
    realtimeUsage: any;
    socketConnected: boolean;
    lastUpdated: any;
    refreshData: () => void;
    notifications: Notification[];
    handleMarkAsRead: (notificationId: string) => void;
    handleMarkAllAsRead: () => void;
    handleDeleteNotification: (notificationId: string) => void;
    handlePlanChange: () => void;
    handleCancelSubscription: () => void;
    showPlanChangeWorkflow: boolean;
    showCancellationModal: boolean;
    setShowPlanChangeWorkflow: (show: boolean) => void;
    setShowCancellationModal: (show: boolean) => void;
    handlePlanChanged: () => void;
    handleCancellationComplete: () => void;
    perkUpdates: any[];
}

const CustomerDashboardContext = React.createContext<CustomerDashboardContextType | null>(null);

export const useCustomerDashboard = () => {
    const context = React.useContext(CustomerDashboardContext);
    if (!context) {
        throw new Error('useCustomerDashboard must be used within CustomerDashboardLogic');
    }
    return context;
};

interface CustomerDashboardLogicProps {
    children: React.ReactNode;
}

export function CustomerDashboardLogic({ children }: CustomerDashboardLogicProps) {
    const { user, isLoading: authLoading } = useAuth();
    const subscriptionStatus = useSubscriptionStatus();
    const dashboardRouting = useDashboardRouting();
    const router = useRouter();
    const queryClient = useQueryClient();

    // Always call hooks unconditionally - use empty string as fallback for user?.id
    const userId = user?.id || '';
    
    // Real-time updates - always called with consistent parameter
    const {
        subscription: realtimeSubscription,
        usage: realtimeUsage,
        billingEvents,
        perkUpdates,
        notifications: realtimeNotifications,
        isConnected: socketConnected,
        lastUpdated,
        refreshData,
        updateSubscriptionOptimistically,
        updateUsageOptimistically
    } = useCustomerRealtime(userId);

    // State for modals and workflows
    const [showPlanChangeWorkflow, setShowPlanChangeWorkflow] = useState(false);
    const [showCancellationModal, setShowCancellationModal] = useState(false);

    // Notifications state - merge real-time notifications with existing ones
    const [localNotifications, setLocalNotifications] = useState<Notification[]>([
        {
            id: '1',
            userId: user?.id || '',
            type: 'BILLING',
            priority: 'HIGH',
            title: 'Payment Method Update Required',
            message: 'Your payment method will expire soon. Please update your billing information to avoid service interruption.',
            actionRequired: true,
            actionUrl: '/billing',
            actionText: 'Update Payment Method',
            isRead: false,
            createdAt: new Date().toISOString()
        },
        {
            id: '2',
            userId: user?.id || '',
            type: 'SERVICE',
            priority: 'MEDIUM',
            title: 'Service Completed',
            message: 'Your home cleaning service has been completed successfully. Rate your experience!',
            actionRequired: false,
            isRead: false,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
            id: '3',
            userId: user?.id || '',
            type: 'ACCOUNT',
            priority: 'LOW',
            title: 'Welcome to Premium Plan',
            message: 'Your subscription upgrade is now active. Enjoy your new benefits!',
            actionRequired: false,
            isRead: true,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
    ]);

    // Merge real-time notifications with local ones - ensure arrays exist
    const notifications = [...(realtimeNotifications || []), ...(localNotifications || [])];

    // Access control: Redirect non-customer users or users without subscription history
    useEffect(() => {
        if (!authLoading && user && !subscriptionStatus.isLoading) {
            // Admin users should be redirected to admin dashboard
            if (user.role === 'ADMIN') {
                router.replace('/admin');
                return;
            }

            // Customer users without subscription history should be redirected to general dashboard
            if (user.role === 'CUSTOMER' && !subscriptionStatus.shouldShowCustomerDashboard) {
                dashboardRouting.navigateToRoute('/dashboard', true);
                return;
            }
        }
    }, [authLoading, user, subscriptionStatus, dashboardRouting, router]);

    // Determine what to render based on loading and error states
    const renderContent = () => {
        // Show loading while determining access
        if (authLoading || subscriptionStatus.isLoading) {
            return (
                <FullPageLoader
                    message="Loading customer dashboard..."
                    submessage="Verifying your subscription access..."
                />
            );
        }

        // Show loading while redirecting
        if (
            (user?.role === 'ADMIN') ||
            (user?.role === 'CUSTOMER' && !subscriptionStatus.shouldShowCustomerDashboard)
        ) {
            return (
                <FullPageLoader
                    message="Redirecting..."
                    submessage="Taking you to the appropriate dashboard..."
                />
            );
        }

        // Error handling for subscription status
        if (subscriptionStatus.error) {
            return (
                <DashboardRouteGuard requiredRole="CUSTOMER">
                    <div className="container mx-auto px-4 py-8">
                        <div className="max-w-md mx-auto text-center">
                            <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Error</h1>
                            <p className="text-gray-600 mb-8">
                                We encountered an issue loading your subscription information. Please try again.
                            </p>
                            <button
                                onClick={() => subscriptionStatus.refetch()}
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </DashboardRouteGuard>
            );
        }

        // This should not happen due to access control above, but handle edge case
        if (!subscriptionStatus.shouldShowCustomerDashboard) {
            return (
                <FullPageLoader
                    message="Redirecting..."
                    submessage="Taking you to the appropriate dashboard..."
                />
            );
        }

        // Render the actual dashboard content
        return children;
    };

    // Handlers for subscription management
    const handlePlanChange = () => {
        setShowPlanChangeWorkflow(true);
    };

    const handleCancelSubscription = () => {
        setShowCancellationModal(true);
    };

    const handlePlanChanged = () => {
        setShowPlanChangeWorkflow(false);
        // Invalidate and refetch subscription data instead of page reload
        queryClient.invalidateQueries({ queryKey: ['user-plan'] });
        queryClient.invalidateQueries({ queryKey: ['user'] });
        refreshData(); // Refresh real-time data
    };

    const handleCancellationComplete = () => {
        setShowCancellationModal(false);
        // Invalidate and refetch subscription data instead of page reload
        queryClient.invalidateQueries({ queryKey: ['user-plan'] });
        queryClient.invalidateQueries({ queryKey: ['user'] });
        refreshData(); // Refresh real-time data
    };

    // Notification handlers
    const handleMarkAsRead = (notificationId: string) => {
        setLocalNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        // TODO: Also mark real-time notifications as read via API
    };

    const handleMarkAllAsRead = () => {
        setLocalNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        // TODO: Also mark all real-time notifications as read via API
    };

    const handleDeleteNotification = (notificationId: string) => {
        setLocalNotifications(prev => prev.filter(n => n.id !== notificationId));
        // TODO: Also delete real-time notifications via API
    };

    // Handle real-time subscription updates
    useEffect(() => {
        if (realtimeSubscription && realtimeSubscription.id !== 'initial') {
            console.log('Real-time subscription update received:', realtimeSubscription);

            // Add notification for subscription changes
            const subscriptionNotification: Notification = {
                id: `subscription-${Date.now()}`,
                userId: user?.id || '',
                type: 'ACCOUNT',
                priority: 'MEDIUM',
                title: 'Subscription Updated',
                message: `Your subscription status has been updated to ${realtimeSubscription.status}`,
                actionRequired: false,
                isRead: false,
                createdAt: new Date().toISOString()
            };

            setLocalNotifications(prev => [subscriptionNotification, ...prev.slice(0, 19)]);
        }
    }, [realtimeSubscription, user?.id]);

    // Handle real-time usage updates
    useEffect(() => {
        if (realtimeUsage && realtimeUsage.warnings && realtimeUsage.warnings.length > 0) {
            console.log('Real-time usage warnings received:', realtimeUsage.warnings);

            // Add notifications for usage warnings
            realtimeUsage.warnings.forEach(warning => {
                const warningNotification: Notification = {
                    id: `usage-warning-${Date.now()}-${Math.random()}`,
                    userId: user?.id || '',
                    type: 'ACCOUNT',
                    priority: warning.type === 'LIMIT_REACHED' ? 'HIGH' : 'MEDIUM',
                    title: warning.type === 'LIMIT_REACHED' ? 'Usage Limit Reached' :
                        warning.type === 'APPROACHING_LIMIT' ? 'Approaching Usage Limit' :
                            'Upgrade Suggested',
                    message: warning.message,
                    actionRequired: warning.actionRequired || false,
                    actionUrl: warning.suggestedTier ? '/pricing' : undefined,
                    actionText: warning.suggestedTier ? `Upgrade to ${warning.suggestedTier}` : undefined,
                    isRead: false,
                    createdAt: new Date().toISOString()
                };

                setLocalNotifications(prev => [warningNotification, ...prev.slice(0, 19)]);
            });
        }
    }, [realtimeUsage, user?.id]);

    // Handle billing events
    useEffect(() => {
        if (billingEvents && billingEvents.length > 0) {
            const latestEvent = billingEvents[0];
            console.log('Real-time billing event received:', latestEvent);

            const billingNotification: Notification = {
                id: `billing-${Date.now()}`,
                userId: user?.id || '',
                type: 'BILLING',
                priority: latestEvent.type === 'PAYMENT_FAILED' ? 'HIGH' : 'MEDIUM',
                title: latestEvent.type === 'PAYMENT_SUCCESS' ? 'Payment Successful' :
                    latestEvent.type === 'PAYMENT_FAILED' ? 'Payment Failed' :
                        latestEvent.type === 'PAYMENT_METHOD_UPDATED' ? 'Payment Method Updated' :
                            'Billing Update',
                message: latestEvent.message,
                actionRequired: latestEvent.type === 'PAYMENT_FAILED',
                actionUrl: latestEvent.type === 'PAYMENT_FAILED' ? '/billing' : undefined,
                actionText: latestEvent.type === 'PAYMENT_FAILED' ? 'Update Payment Method' : undefined,
                isRead: false,
                createdAt: latestEvent.timestamp
            };

            setLocalNotifications(prev => [billingNotification, ...prev.slice(0, 19)]);
        }
    }, [billingEvents, user?.id]);

    // Transform subscription data for components - prefer real-time data when available
    const transformedSubscription = useMemo(() => {
        // Use real-time subscription data if available and not just the initial connection message
        if (realtimeSubscription && realtimeSubscription.id !== 'initial') {
            return realtimeSubscription;
        }

        // Fall back to enhanced subscription status data
        if (subscriptionStatus.subscription && subscriptionStatus.plan) {
            const { subscription, plan } = subscriptionStatus;
            return {
                id: subscription.id || '',
                tier: subscription.tier as 'STARTER' | 'HOMECARE' | 'PRIORITY',
                status: subscription.status as 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'INCOMPLETE',
                paymentFrequency: 'MONTHLY' as 'MONTHLY' | 'YEARLY', // Default to monthly
                currentPeriodStart: subscription.currentPeriodStart || new Date().toISOString(),
                currentPeriodEnd: subscription.currentPeriodEnd || new Date().toISOString(),
                nextPaymentAmount: plan.monthlyPrice || 0,
                plan: {
                    name: plan.name || '',
                    monthlyPrice: plan.monthlyPrice || 0,
                    yearlyPrice: plan.yearlyPrice || 0,
                    features: plan.features || []
                }
            };
        }

        return null;
    }, [realtimeSubscription, subscriptionStatus.subscription, subscriptionStatus.plan]);

    const contextValue: CustomerDashboardContextType = useMemo(() => ({
        user,
        subscriptionStatus,
        transformedSubscription,
        realtimeUsage,
        socketConnected,
        lastUpdated,
        refreshData,
        notifications: notifications || [],
        handleMarkAsRead,
        handleMarkAllAsRead,
        handleDeleteNotification,
        handlePlanChange,
        handleCancelSubscription,
        showPlanChangeWorkflow,
        showCancellationModal,
        setShowPlanChangeWorkflow,
        setShowCancellationModal,
        handlePlanChanged,
        handleCancellationComplete,
        perkUpdates
    }), [
        user,
        subscriptionStatus,
        transformedSubscription,
        realtimeUsage,
        socketConnected,
        lastUpdated,
        refreshData,
        notifications,
        handleMarkAsRead,
        handleMarkAllAsRead,
        handleDeleteNotification,
        handlePlanChange,
        handleCancelSubscription,
        showPlanChangeWorkflow,
        showCancellationModal,
        setShowPlanChangeWorkflow,
        setShowCancellationModal,
        handlePlanChanged,
        handleCancellationComplete,
        perkUpdates
    ]);

    return (
        <CustomerDashboardContext.Provider value={contextValue}>
            {renderContent()}
        </CustomerDashboardContext.Provider>
    );
}