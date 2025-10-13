"use client";
import React from 'react';
import { CustomerDashboardWrapper } from '@/components/dashboard/CustomerDashboardWrapper';
import { CustomerDashboardLogic, useCustomerDashboard } from '@/components/dashboard/CustomerDashboardLogic';
import { DashboardRouteGuard } from '@/components/dashboard/DashboardRouteGuard';
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
  SkipLink, 
  HighContrastToggle 
} from '@/components/customer/accessibility/AccessibilityComponents';
import { ScreenReaderOnly } from '@/components/customer/accessibility/AccessibilityComponents';
import AccessibilityInit from '@/components/customer/accessibility/AccessibilityInit';
import PerformanceMonitor from '@/components/customer/performance/PerformanceMonitor';
import OfflineStatus from '@/components/customer/offline/OfflineStatus';
import AdvancedServiceFilter from '@/components/customer/services/AdvancedServiceFilter';
import DataExport from '@/components/customer/export/DataExport';
import PWAInstallPrompt from '@/components/customer/pwa/PWAInstallPrompt';
import AIRecommendations from '@/components/customer/ai/AIRecommendations';
import Personalization from '@/components/customer/personalization/Personalization';
import { useOfflineManager } from '@/hooks/use-offline-manager';
import { useErrorTracking } from '@/hooks/use-error-tracking';
import { coreWebVitalsMonitor } from '@/lib/core-web-vitals-monitor';

export const dynamic = 'force-dynamic';

export default function CustomerDashboardPage() {
  return (
    <CustomerDashboardWrapper>
      <CustomerDashboardLogic>
        <DashboardRouteGuard requiredRole="CUSTOMER">
          <CustomerDashboardContent />
        </DashboardRouteGuard>
      </CustomerDashboardLogic>
    </CustomerDashboardWrapper>
  );
}

// Separate component for the actual dashboard content
function CustomerDashboardContent() {
  const {
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
  } = useCustomerDashboard();
  // Initialize new features
  const { retryPendingActions, clearPendingActions } = useOfflineManager();
  const { addBreadcrumb } = useErrorTracking({ componentName: 'CustomerDashboard' });

  // Initialize Core Web Vitals monitoring
  React.useEffect(() => {
    coreWebVitalsMonitor.init();
    addBreadcrumb('dashboard_loaded', { 
      subscriptionTier: transformedSubscription?.tier,
      socketConnected 
    });
  }, [addBreadcrumb, transformedSubscription?.tier, socketConnected]);
  return (
    <ResponsiveLayout>
      {/* Initialize accessibility features */}
      <AccessibilityInit />
      
      {/* Skip Navigation Links */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#subscription-overview">Skip to subscription overview</SkipLink>
      <SkipLink href="#perks-benefits">Skip to perks and benefits</SkipLink>
      <SkipLink href="#available-services">Skip to available services</SkipLink>

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

      {/* PWA Install Prompt */}
      <PWAInstallPrompt 
        onInstall={() => addBreadcrumb('pwa_installed')}
        onDismiss={() => addBreadcrumb('pwa_dismissed')}
      />

      {/* Offline Status */}
      <OfflineStatus 
        onRetry={retryPendingActions}
        onClear={clearPendingActions}
        showDetails={true}
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
                  <>
                    <AdvancedServiceFilter
                      services={[
                        {
                          serviceId: '1',
                          service: {
                            id: '1',
                            name: 'Home Cleaning',
                            description: 'Professional home cleaning service',
                            category: 'CLEANING',
                            complexity: 'SIMPLE',
                            basePrice: 120,
                            isActive: true,
                            rating: 4.8,
                            estimatedDuration: 120,
                            location: 'Toronto',
                            maxParticipants: 2,
                            features: ['eco-friendly', 'insured', 'guaranteed']
                          },
                          isIncluded: true,
                          discountPercentage: 10,
                          requiresUpgrade: false,
                          currentUsage: 2
                        },
                        {
                          serviceId: '2',
                          service: {
                            id: '2',
                            name: 'Plumbing Repair',
                            description: 'Basic plumbing repairs and maintenance',
                            category: 'REPAIR',
                            complexity: 'MODERATE',
                            basePrice: 150,
                            isActive: true,
                            rating: 4.6,
                            estimatedDuration: 90,
                            location: 'Toronto',
                            maxParticipants: 1,
                            features: ['same-day', 'insured', 'guaranteed']
                          },
                          isIncluded: false,
                          discountPercentage: 0,
                          requiresUpgrade: false,
                          currentUsage: 0
                        },
                        {
                          serviceId: '3',
                          service: {
                            id: '3',
                            name: 'Emergency Service',
                            description: '24/7 emergency home services',
                            category: 'REPAIR',
                            complexity: 'COMPLEX',
                            basePrice: 200,
                            isActive: true,
                            rating: 4.9,
                            estimatedDuration: 60,
                            location: 'Toronto',
                            maxParticipants: 1,
                            features: ['same-day', 'insured', 'guaranteed']
                          },
                          isIncluded: transformedSubscription.tier === 'PRIORITY',
                          discountPercentage: transformedSubscription.tier === 'PRIORITY' ? 20 : 0,
                          requiresUpgrade: transformedSubscription.tier !== 'PRIORITY',
                          upgradeToTier: 'PRIORITY',
                          currentUsage: 0
                        }
                      ]}
                      onFilteredServices={(services) => {
                        addBreadcrumb('services_filtered', { count: services.length });
                      }}
                    />
                    <AvailableServices
                      userTier={transformedSubscription.tier}
                      services={[
                        {
                          serviceId: '1',
                          service: {
                            id: '1',
                            name: 'Home Cleaning',
                            description: 'Professional home cleaning service',
                            category: 'CLEANING',
                            complexity: 'SIMPLE',
                            basePrice: 120,
                            isActive: true,
                            rating: 4.8,
                            estimatedDuration: 120,
                            location: 'Toronto',
                            maxParticipants: 2,
                            features: ['eco-friendly', 'insured', 'guaranteed']
                          },
                          isIncluded: true,
                          discountPercentage: 10,
                          requiresUpgrade: false,
                          currentUsage: 2
                        },
                        {
                          serviceId: '2',
                          service: {
                            id: '2',
                            name: 'Plumbing Repair',
                            description: 'Basic plumbing repairs and maintenance',
                            category: 'REPAIR',
                            complexity: 'MODERATE',
                            basePrice: 150,
                            isActive: true,
                            rating: 4.6,
                            estimatedDuration: 90,
                            location: 'Toronto',
                            maxParticipants: 1,
                            features: ['same-day', 'insured', 'guaranteed']
                          },
                          isIncluded: false,
                          discountPercentage: 0,
                          requiresUpgrade: false,
                          currentUsage: 0
                        },
                        {
                          serviceId: '3',
                          service: {
                            id: '3',
                            name: 'Emergency Service',
                            description: '24/7 emergency home services',
                            category: 'REPAIR',
                            complexity: 'COMPLEX',
                            basePrice: 200,
                            isActive: true,
                            rating: 4.9,
                            estimatedDuration: 60,
                            location: 'Toronto',
                            maxParticipants: 1,
                            features: ['same-day', 'insured', 'guaranteed']
                          },
                          isIncluded: transformedSubscription.tier === 'PRIORITY',
                          discountPercentage: transformedSubscription.tier === 'PRIORITY' ? 20 : 0,
                          requiresUpgrade: transformedSubscription.tier !== 'PRIORITY',
                          upgradeToTier: 'PRIORITY',
                          currentUsage: 0
                        }
                      ]}
                      onServiceRequest={(serviceId) => {
                        addBreadcrumb('service_requested', { serviceId });
                        console.log('Service requested:', serviceId);
                      }}
                      onUpgradePrompt={(requiredTier) => {
                        addBreadcrumb('upgrade_prompted', { requiredTier });
                        console.log('Upgrade required to:', requiredTier);
                        setShowPlanChangeWorkflow(true);
                      }}
                    />
                  </>
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

            {/* Performance Monitor */}
            <section>
              <PerformanceMonitor 
                showDetails={false}
                onExport={() => addBreadcrumb('performance_exported')}
              />
            </section>

            {/* AI Recommendations */}
            <section>
              <AIRecommendations
                userData={{
                  subscription: transformedSubscription,
                  usageAnalytics: realtimeUsage ? [realtimeUsage] : [],
                  serviceRequests: [],
                  preferences: user?.preferences
                }}
                onRecommendationClick={(recommendation) => {
                  addBreadcrumb('recommendation_clicked', { 
                    recommendationId: recommendation.id,
                    type: recommendation.type 
                  });
                }}
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
                addBreadcrumb('upgrade_suggested', { suggestedTier });
                console.log('Upgrade suggested to:', suggestedTier);
                setShowPlanChangeWorkflow(true);
              }}
            />
          </section>

          {/* Data Export Section */}
          <section>
            <DataExport
              data={{
                subscription: transformedSubscription,
                usageAnalytics: realtimeUsage ? [realtimeUsage] : [],
                serviceRequests: [],
                notifications: notifications
              }}
              onExport={(format, data) => {
                addBreadcrumb('data_exported', { format, dataCount: Object.keys(data).length });
              }}
            />
          </section>

          {/* Personalization Section */}
          <section>
            <Personalization
              userData={{
                id: user?.id || '',
                preferences: user?.preferences,
                behavior: {
                  mostUsedFeatures: ['services', 'analytics', 'notifications'],
                  preferredTimes: ['Morning', 'Afternoon'],
                  favoriteServices: ['Home Cleaning', 'Plumbing Repair']
                }
              }}
              onSave={(settings) => {
                addBreadcrumb('personalization_saved', { settings });
                console.log('Personalization settings saved:', settings);
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