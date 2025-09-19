'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionStatus } from '@/hooks/use-subscription-status';
import { useDashboardRouting } from '@/hooks/use-dashboard-routing';
import { useCustomerRealtime } from '@/hooks/use-customer-realtime';
import { DashboardRouteGuard } from '@/components/dashboard/DashboardRouteGuard';
import { FullPageLoader } from '@/components/customer/loading/LoadingStates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge, Button } from '@/components/ui/shared';
import { 
  Loader2, 
  Shield, 
  Settings, 
  CreditCard,
  BarChart3,
  Bell,
  Star,
  Gift,
  Zap,
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import SubscriptionOverview from '@/components/customer/subscription-overview/SubscriptionOverview';
import PerksList from '@/components/customer/perks-benefits/PerksList';
import AvailableServices from '@/components/customer/services/AvailableServices';
import PlanChangeWorkflow from '@/components/customer/subscription-management/PlanChangeWorkflow';
import CancellationModal from '@/components/customer/subscription-management/CancellationModal';
import { UsageAnalytics } from '@/components/customer/usage-analytics';
import { NotificationCenter } from '@/components/customer/notifications';
import UsageWarnings from '@/components/customer/usage-tracking/UsageWarnings';
import RealtimePerkStatus from '@/components/customer/perks-benefits/RealtimePerkStatus';
import { 
  ResponsiveLayout, 
  ResponsiveContainer, 
  ResponsiveSection,
  MobileStatsGrid 
} from '@/components/customer/layout/ResponsiveLayout';
import MobileNavigation from '@/components/customer/layout/MobileNavigation';
import { 
  SkipNavigation, 
  HighContrastToggle 
} from '@/components/customer/accessibility/AccessibilityComponents';
import { ScreenReaderOnly } from '@/components/customer/accessibility/AccessibilityComponents';
import AccessibilityInit from '@/components/customer/accessibility/AccessibilityInit';

export default function CustomerDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const subscriptionStatus = useSubscriptionStatus();
  const dashboardRouting = useDashboardRouting();
  const router = useRouter();
  
  // Access control: Redirect non-customer users or users without subscription history
  useEffect(() => {
    if (!authLoading && user && !subscriptionStatus.isLoading) {
      // Admin users should be redirected to admin dashboard
      if (user.role === 'ADMIN') {
        router.push('/admin');
        return;
      }

      // Customer users without subscription history should be redirected to general dashboard
      if (user.role === 'CUSTOMER' && !subscriptionStatus.shouldShowCustomerDashboard) {
        dashboardRouting.navigateToRoute('/dashboard', true);
        return;
      }
    }
  }, [authLoading, user, subscriptionStatus, dashboardRouting, router]);

  // Real-time updates
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
  } = useCustomerRealtime(user?.id);
  
  // State for modals and workflows
  const [showPlanChangeWorkflow, setShowPlanChangeWorkflow] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  
  // Notifications state - merge real-time notifications with existing ones
  const [localNotifications, setLocalNotifications] = useState([
    {
      id: '1',
      userId: user?.id || '',
      type: 'BILLING' as const,
      priority: 'HIGH' as const,
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
      type: 'SERVICE' as const,
      priority: 'MEDIUM' as const,
      title: 'Service Completed',
      message: 'Your home cleaning service has been completed successfully. Rate your experience!',
      actionRequired: false,
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      userId: user?.id || '',
      type: 'ACCOUNT' as const,
      priority: 'LOW' as const,
      title: 'Welcome to Priority Plan',
      message: 'Your subscription upgrade is now active. Enjoy your new benefits!',
      actionRequired: false,
      isRead: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  ]);

  // Merge real-time notifications with local ones
  const notifications = [...realtimeNotifications, ...localNotifications];

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

  // Handlers for subscription management
  const handlePlanChange = () => {
    setShowPlanChangeWorkflow(true);
  };

  const handleCancelSubscription = () => {
    setShowCancellationModal(true);
  };

  const handlePlanChanged = () => {
    setShowPlanChangeWorkflow(false);
    // Refresh the page data
    window.location.reload();
  };

  const handleCancellationComplete = () => {
    setShowCancellationModal(false);
    // Refresh the page data
    window.location.reload();
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
      const subscriptionNotification = {
        id: `subscription-${Date.now()}`,
        userId: user?.id || '',
        type: 'ACCOUNT' as const,
        priority: 'MEDIUM' as const,
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
        const warningNotification = {
          id: `usage-warning-${Date.now()}-${Math.random()}`,
          userId: user?.id || '',
          type: 'ACCOUNT' as const,
          priority: warning.type === 'LIMIT_REACHED' ? 'HIGH' as const : 'MEDIUM' as const,
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
      
      const billingNotification = {
        id: `billing-${Date.now()}`,
        userId: user?.id || '',
        type: 'BILLING' as const,
        priority: latestEvent.type === 'PAYMENT_FAILED' ? 'HIGH' as const : 'MEDIUM' as const,
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
  const transformedSubscription = (() => {
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
  })();

  // This should not happen due to access control above, but handle edge case
  if (!subscriptionStatus.shouldShowCustomerDashboard) {
    return (
      <FullPageLoader 
        message="Redirecting..."
        submessage="Taking you to the appropriate dashboard..."
      />
    );
  }

  return (
    <DashboardRouteGuard requiredRole="CUSTOMER">
      <CustomerDashboardContent 
        user={user}
        subscriptionStatus={subscriptionStatus}
        transformedSubscription={transformedSubscription}
        realtimeUsage={realtimeUsage}
        socketConnected={socketConnected}
        lastUpdated={lastUpdated}
        refreshData={refreshData}
        notifications={notifications}
        handleMarkAsRead={handleMarkAsRead}
        handleMarkAllAsRead={handleMarkAllAsRead}
        handleDeleteNotification={handleDeleteNotification}
        handlePlanChange={handlePlanChange}
        handleCancelSubscription={handleCancelSubscription}
        showPlanChangeWorkflow={showPlanChangeWorkflow}
        showCancellationModal={showCancellationModal}
        setShowPlanChangeWorkflow={setShowPlanChangeWorkflow}
        setShowCancellationModal={setShowCancellationModal}
        handlePlanChanged={handlePlanChanged}
        handleCancellationComplete={handleCancellationComplete}
      />
    </DashboardRouteGuard>
  );
}

// Separate component for the actual dashboard content
function CustomerDashboardContent({
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
  handleCancellationComplete
}: any) {
  return (
    <ResponsiveLayout>
      {/* Initialize accessibility features */}
      <AccessibilityInit />
      
      {/* Skip Navigation Links */}
      <SkipNavigation
        links={[
          { href: '#main-content', label: 'Skip to main content' },
          { href: '#subscription-overview', label: 'Skip to subscription overview' },
          { href: '#perks-benefits', label: 'Skip to perks and benefits' },
          { href: '#available-services', label: 'Skip to available services' },
        ]}
      />

      {/* Mobile Navigation */}
      <MobileNavigation
        isConnected={socketConnected}
        notificationCount={notifications.filter(n => !n.isRead).length}
        userTier={transformedSubscription?.tier}
        onLogout={() => {
          // Handle logout
          window.location.href = '/logout';
        }}
      />

      <ResponsiveContainer padding="md">
        {/* Desktop Header - Hidden on mobile */}
        <div className="hidden lg:block mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 id="main-heading" className="text-3xl font-bold text-gray-900">
                Customer Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your subscription, view services, and track your account activity.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                <Shield className="h-3 w-3 mr-1" />
                <ScreenReaderOnly>Account type: </ScreenReaderOnly>
                Customer Account
              </Badge>
              
              {/* Real-time connection status */}
              <Badge 
                variant="outline" 
                className={`${
                  socketConnected 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
                role="status"
                aria-live="polite"
              >
                <div 
                  className={`w-2 h-2 rounded-full mr-1 ${
                    socketConnected ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                  aria-hidden="true"
                />
                {socketConnected ? 'Live Updates' : 'Offline'}
              </Badge>
              
              {/* High Contrast Toggle */}
              <HighContrastToggle />
              
              <NotificationCenter
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                onDeleteNotification={handleDeleteNotification}
              />
              <Link href="/settings">
                <button 
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 h-9 rounded-md px-3"
                  aria-label="Go to settings page"
                >
                  <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
                  Settings
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Quick Stats - Shown first on mobile */}
        <div className="lg:hidden mb-6">
          <MobileStatsGrid
            stats={[
              {
                label: 'Services Used',
                value: realtimeUsage?.servicesUsed ?? '--',
                icon: <BarChart3 className="h-5 w-5 text-blue-600" />,
                color: 'bg-blue-100',
                updated: lastUpdated.usage ? `Updated ${lastUpdated.usage.toLocaleTimeString()}` : undefined
              },
              {
                label: 'Total Savings',
                value: `$${realtimeUsage?.discountsSaved ?? '--'}`,
                icon: <TrendingUp className="h-5 w-5 text-green-600" />,
                color: 'bg-green-100',
                updated: lastUpdated.usage ? `Updated ${lastUpdated.usage.toLocaleTimeString()}` : undefined
              },
              {
                label: 'Next Billing',
                value: transformedSubscription?.currentPeriodEnd 
                  ? new Date(transformedSubscription.currentPeriodEnd).toLocaleDateString()
                  : '--/--/--',
                icon: <Calendar className="h-5 w-5 text-purple-600" />,
                color: 'bg-purple-100',
                updated: lastUpdated.subscription ? `Updated ${lastUpdated.subscription.toLocaleTimeString()}` : undefined
              }
            ]}
          />
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column - Main Content */}
          <main id="main-content" className="lg:col-span-8 space-y-6 lg:space-y-8" role="main">
            {/* Subscription Overview Section */}
            <ResponsiveSection 
              title="Subscription Overview"
              className="lg:mb-8"
            >
              <div id="subscription-overview">
                {transformedSubscription ? (
                  <SubscriptionOverview
                    subscription={transformedSubscription}
                    onPlanChange={handlePlanChange}
                    onCancelSubscription={handleCancelSubscription}
                  />
                ) : (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6 lg:p-8 text-center">
                      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                        <Star className="h-6 w-6 lg:h-8 lg:w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 text-sm lg:text-base" role="alert">
                        Unable to load subscription details
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ResponsiveSection>

            {/* Perks and Benefits Section */}
            <ResponsiveSection 
              title="Perks & Benefits"
              className="lg:mb-8"
            >
              <div id="perks-benefits">
                {transformedSubscription ? (
                  <PerksList
                    subscription={transformedSubscription}
                    usage={{
                      priorityBookingCount: realtimeUsage?.priorityBookings || 0,
                      maxPriorityBookings: realtimeUsage?.limits?.maxPriorityBookings || 5,
                      discountAmount: realtimeUsage?.discountsSaved || 0,
                      maxDiscountAmount: realtimeUsage?.limits?.maxDiscountAmount || 500,
                      freeServiceUsed: (realtimeUsage?.servicesUsed || 0) > 0,
                      emergencyServiceUsed: (realtimeUsage?.emergencyServices || 0) > 0
                    }}
                  />
                ) : (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6 lg:p-8 text-center">
                      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                        <Gift className="h-6 w-6 lg:h-8 lg:w-8 text-purple-600" />
                      </div>
                      <p className="text-gray-600 text-sm lg:text-base" role="alert">
                        Unable to load perks and benefits
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ResponsiveSection>

            {/* Available Services Section */}
            <ResponsiveSection 
              title="Available Services"
              className="lg:mb-8"
            >
              <div id="available-services">
                {transformedSubscription ? (
                  <AvailableServices
                    userTier={transformedSubscription.tier}
                    services={[
                      {
                        id: '1',
                        name: 'Home Cleaning',
                        description: 'Professional home cleaning service',
                        category: 'Cleaning',
                        basePrice: 120,
                        isIncluded: true,
                        requiresUpgrade: false
                      },
                      {
                        id: '2',
                        name: 'Plumbing Repair',
                        description: 'Basic plumbing repairs and maintenance',
                        category: 'Maintenance',
                        basePrice: 150,
                        isIncluded: false,
                        requiresUpgrade: false
                      },
                      {
                        id: '3',
                        name: 'Emergency Service',
                        description: '24/7 emergency home services',
                        category: 'Emergency',
                        basePrice: 200,
                        isIncluded: transformedSubscription.tier === 'PRIORITY',
                        requiresUpgrade: transformedSubscription.tier !== 'PRIORITY',
                        upgradeToTier: 'PRIORITY'
                      }
                    ]}
                    onServiceRequest={(serviceId) => {
                      console.log('Service requested:', serviceId);
                    }}
                    onUpgradePrompt={(requiredTier) => {
                      console.log('Upgrade required to:', requiredTier);
                      setShowPlanChangeWorkflow(true);
                    }}
                  />
                ) : (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6 lg:p-8 text-center">
                      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                        <Zap className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
                      </div>
                      <p className="text-gray-600 text-sm lg:text-base" role="alert">
                        Unable to load available services
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ResponsiveSection>
          </main>

          {/* Right Column - Sidebar (Hidden on mobile, stats moved to top) */}
          <aside className="hidden lg:block lg:col-span-4 space-y-6" role="complementary" aria-label="Dashboard sidebar">
            {/* Quick Stats */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
                <button
                  onClick={refreshData}
                  disabled={!socketConnected}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 h-8 px-2"
                  title={socketConnected ? "Refresh data" : "Real-time updates not connected"}
                >
                  <TrendingUp className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-4">
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Services Used</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {realtimeUsage?.servicesUsed ?? '--'}
                        </p>
                        {lastUpdated.usage && (
                          <p className="text-xs text-gray-500">
                            Updated {lastUpdated.usage.toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Savings</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${realtimeUsage?.discountsSaved ?? '--'}
                        </p>
                        {lastUpdated.usage && (
                          <p className="text-xs text-gray-500">
                            Updated {lastUpdated.usage.toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Next Billing</p>
                        <p className="text-lg font-bold text-gray-900">
                          {transformedSubscription?.currentPeriodEnd 
                            ? new Date(transformedSubscription.currentPeriodEnd).toLocaleDateString()
                            : '--/--/--'
                          }
                        </p>
                        {lastUpdated.subscription && (
                          <p className="text-xs text-gray-500">
                            Updated {lastUpdated.subscription.toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Subscription Management */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Management</h3>
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="h-5 w-5 text-blue-600" />
                    Manage Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Settings className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                      Plan management options will be available here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Real-time Usage Warnings */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Tracking</h3>
              <UsageWarnings
                warnings={realtimeUsage?.warnings || []}
                currentUsage={{
                  servicesUsed: realtimeUsage?.servicesUsed || 0,
                  priorityBookings: realtimeUsage?.priorityBookings || 0,
                  emergencyServices: realtimeUsage?.emergencyServices || 0,
                  discountsSaved: realtimeUsage?.discountsSaved || 0
                }}
                limits={{
                  maxPriorityBookings: realtimeUsage?.limits?.maxPriorityBookings || 5,
                  maxDiscountAmount: realtimeUsage?.limits?.maxDiscountAmount || 500,
                  maxEmergencyServices: realtimeUsage?.limits?.maxEmergencyServices || 2
                }}
                onUpgradeClick={(suggestedTier) => {
                  console.log('Upgrade suggested to:', suggestedTier);
                  setShowPlanChangeWorkflow(true);
                }}
                lastUpdated={lastUpdated.usage}
              />
            </section>

            {/* Real-time Perk Status */}
            <section>
              <RealtimePerkStatus
                perkUpdates={perkUpdates}
                lastUpdated={lastUpdated.perks}
              />
            </section>

            {/* Recent Notifications */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Updates</h3>
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bell className="h-5 w-5 text-blue-600" />
                    Latest Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {notifications.slice(0, 3).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border ${
                          !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </h4>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <span className="text-xs text-gray-500 mt-1 block">
                              {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="text-center py-6">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Bell className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-gray-600 text-sm">
                          No recent notifications
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>
          </aside>
        </div>

        {/* Bottom Section - Full Width */}
        <div className="mt-12 space-y-12">
          {/* Usage Analytics Section */}
          <section data-section="usage-analytics">
            <UsageAnalytics
              subscription={transformedSubscription ? {
                id: transformedSubscription.id,
                currentPeriodStart: transformedSubscription.currentPeriodStart,
                currentPeriodEnd: transformedSubscription.currentPeriodEnd,
                tier: transformedSubscription.tier
              } : undefined}
              onUpgradeClick={(suggestedTier) => {
                console.log('Upgrade suggested to:', suggestedTier);
                setShowPlanChangeWorkflow(true);
              }}
            />
          </section>

          {/* Account Activity Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Activity</h2>
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your recent subscription and service activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600">
                    Recent activity will be displayed here
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Modals and Workflows */}
        {showPlanChangeWorkflow && transformedSubscription && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowPlanChangeWorkflow(false)} />
              <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <PlanChangeWorkflow
                    currentSubscription={transformedSubscription}
                    onPlanChanged={handlePlanChanged}
                    onCancel={() => setShowPlanChangeWorkflow(false)}
                    onCancellationComplete={handleCancellationComplete}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {showCancellationModal && transformedSubscription && (
          <CancellationModal
            isOpen={showCancellationModal}
            onClose={() => setShowCancellationModal(false)}
            onCancellationComplete={handleCancellationComplete}
            currentSubscription={transformedSubscription}
          />
        )}
      </ResponsiveContainer>
    </ResponsiveLayout>
  );
}