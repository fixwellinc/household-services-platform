"use client";

import React, { Suspense, lazy } from 'react';
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
// These are now lazy loaded below
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
import PWAInstallPrompt from '@/components/customer/pwa/PWAInstallPrompt';

// Lazy load heavy components for better performance
const UsageAnalytics = lazy(() => import('@/components/customer/usage-analytics').then(m => ({ default: m.UsageAnalytics })));
const NotificationCenter = lazy(() => import('@/components/customer/notifications').then(m => ({ default: m.NotificationCenter })));
const AIRecommendations = lazy(() => import('@/components/customer/ai/AIRecommendations'));
const DataExport = lazy(() => import('@/components/customer/export/DataExport'));
const Personalization = lazy(() => import('@/components/customer/personalization/Personalization'));
import { useOfflineManager } from '@/hooks/use-offline-manager';
import { useErrorTracking } from '@/hooks/use-error-tracking';
import { useCustomerDashboard } from './CustomerDashboardLogic';

export function CustomerDashboardContent() {
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
    handleCancellationComplete,
    perkUpdates
  } = useCustomerDashboard();
  
  // Initialize new features
  const { retryPendingActions, clearPendingActions } = useOfflineManager();
  const { addBreadcrumb } = useErrorTracking({ componentName: 'CustomerDashboard' });

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
              {socketConnected && (
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                  Live Updates
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main id="main-content" className="space-y-8">
          
          {/* Subscription Overview Section */}
          <section id="subscription-overview" aria-labelledby="subscription-heading">
            <h2 id="subscription-heading" className="text-xl font-semibold text-gray-900 mb-6">
              Subscription Overview
            </h2>
            <SubscriptionOverview
              subscription={transformedSubscription}
              onPlanChange={handlePlanChange}
              onCancelSubscription={handleCancelSubscription}
              isLoading={subscriptionStatus.isLoading}
            />
          </section>

          {/* Quick Actions */}
          <section aria-labelledby="quick-actions-heading">
            <h2 id="quick-actions-heading" className="text-xl font-semibold text-gray-900 mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Book Service</h3>
                      <p className="text-sm text-gray-600">Schedule a new service</p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                  <Button className="w-full mt-4" asChild>
                    <Link href="/book-appointment">Book Now</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Manage Plan</h3>
                      <p className="text-sm text-gray-600">Upgrade or modify</p>
                    </div>
                    <Settings className="h-8 w-8 text-purple-600" />
                  </div>
                  <Button className="w-full mt-4" onClick={handlePlanChange}>
                    Manage
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Billing</h3>
                      <p className="text-sm text-gray-600">Payment & invoices</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-green-600" />
                  </div>
                  <Button className="w-full mt-4" asChild>
                    <Link href="/billing">View Billing</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Notifications</h3>
                      <p className="text-sm text-gray-600">
                        {notifications.filter(n => !n.isRead).length} unread
                      </p>
                    </div>
                    <Bell className="h-8 w-8 text-orange-600" />
                  </div>
                  <Button className="w-full mt-4" asChild>
                    <Link href="#notifications">View All</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Critical Notifications */}
          {notifications.filter(n => !n.isRead && n.priority === 'HIGH').length > 0 && (
            <section aria-labelledby="critical-notifications-heading">
              <h2 id="critical-notifications-heading" className="text-xl font-semibold text-gray-900 mb-6">
                Important Notifications
              </h2>
              <div className="space-y-4">
                {notifications
                  .filter(n => !n.isRead && n.priority === 'HIGH')
                  .slice(0, 3)
                  .map((notification) => (
                    <Card key={notification.id} className="border-red-200 bg-red-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-red-900">{notification.title}</h3>
                            <p className="text-sm text-red-700 mt-1">{notification.message}</p>
                            {notification.actionRequired && notification.actionUrl && (
                              <Button 
                                size="sm" 
                                className="mt-2 bg-red-600 hover:bg-red-700"
                                asChild
                              >
                                <Link href={notification.actionUrl}>
                                  {notification.actionText || 'Take Action'}
                                </Link>
                              </Button>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Mark Read
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </section>
          )}

          {/* Usage Summary */}
          {realtimeUsage && (
            <section aria-labelledby="usage-summary-heading">
              <h2 id="usage-summary-heading" className="text-xl font-semibold text-gray-900 mb-6">
                Usage Summary
              </h2>
              <MobileStatsGrid>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Services Used</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {realtimeUsage.servicesUsed}
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Savings</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${realtimeUsage.discountsSaved}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Priority Bookings</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {realtimeUsage.priorityBookings}
                        </p>
                      </div>
                      <Star className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Emergency Services</p>
                        <p className="text-2xl font-bold text-red-600">
                          {realtimeUsage.emergencyServices}
                        </p>
                      </div>
                      <Zap className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </MobileStatsGrid>
            </section>
          )}

          {/* Usage Warnings */}
          {realtimeUsage?.warnings && realtimeUsage.warnings.length > 0 && (
            <section aria-labelledby="usage-warnings-heading">
              <h2 id="usage-warnings-heading" className="text-xl font-semibold text-gray-900 mb-6">
                Usage Alerts
              </h2>
              <UsageWarnings warnings={realtimeUsage.warnings} />
            </section>
          )}

          {/* Perks & Benefits */}
          <section id="perks-benefits" aria-labelledby="perks-heading">
            <h2 id="perks-heading" className="text-xl font-semibold text-gray-900 mb-6">
              Perks & Benefits
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PerksList subscription={transformedSubscription} />
              <RealtimePerkStatus perkUpdates={perkUpdates} />
            </div>
          </section>

          {/* Available Services */}
          <section id="available-services" aria-labelledby="services-heading">
            <h2 id="services-heading" className="text-xl font-semibold text-gray-900 mb-6">
              Available Services
            </h2>
            <AvailableServices 
              userTier={transformedSubscription?.tier}
              onServiceSelect={(service) => {
                addBreadcrumb('service_selected', { serviceId: service.id });
              }}
            />
          </section>

          {/* Modals */}
          {showPlanChangeWorkflow && (
            <PlanChangeWorkflow
              currentSubscription={transformedSubscription}
              onClose={() => setShowPlanChangeWorkflow(false)}
              onPlanChanged={handlePlanChanged}
            />
          )}

          {showCancellationModal && (
            <CancellationModal
              subscription={transformedSubscription}
              onClose={() => setShowCancellationModal(false)}
              onCancellationComplete={handleCancellationComplete}
            />
          )}

          {/* Performance Monitor (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <section>
              <PerformanceMonitor />
            </section>
          )}

        </main>
      </ResponsiveContainer>
    </ResponsiveLayout>
  );
}
