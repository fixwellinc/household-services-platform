'use client';

import React from 'react';
import { 
  SubscriptionErrorBoundary,
  PerksErrorBoundary,
  ServicesErrorBoundary,
  UsageAnalyticsErrorBoundary,
  NotificationsErrorBoundary
} from './SectionErrorBoundaries';
import {
  SubscriptionOverviewSkeleton,
  PerksListSkeleton,
  AvailableServicesSkeleton,
  UsageAnalyticsSkeleton,
  NotificationsSkeleton,
  ProgressiveLoader
} from '../loading';
import { useLoadingState, useApiErrorHandler } from '../loading';

// Example of how to integrate error boundaries and loading states
export function EnhancedCustomerDashboard() {
  const subscriptionLoading = useLoadingState({ minLoadingTime: 500 });
  const perksLoading = useLoadingState({ minLoadingTime: 300 });
  const servicesLoading = useLoadingState({ minLoadingTime: 400 });
  
  const apiErrorHandler = useApiErrorHandler({
    maxRetries: 3,
    retryDelay: 1000,
    onError: (error) => console.error('API Error:', error),
    onMaxRetriesReached: (error) => console.error('Max retries reached:', error)
  });

  // Example API calls with error handling and loading states
  const loadSubscriptionData = async () => {
    try {
      await subscriptionLoading.executeWithLoading(async () => {
        const response = await fetch('/api/customer/subscription');
        if (!response.ok) throw new Error('Failed to load subscription');
        return response.json();
      }, 'Loading subscription details...');
    } catch (error) {
      apiErrorHandler.handleApiError(error);
    }
  };

  const loadPerksData = async () => {
    try {
      await perksLoading.executeWithLoading(async () => {
        const response = await fetch('/api/customer/perks');
        if (!response.ok) throw new Error('Failed to load perks');
        return response.json();
      }, 'Loading perks and benefits...');
    } catch (error) {
      apiErrorHandler.handleApiError(error);
    }
  };

  const loadServicesData = async () => {
    try {
      await servicesLoading.executeWithLoading(async () => {
        const response = await fetch('/api/customer/services');
        if (!response.ok) throw new Error('Failed to load services');
        return response.json();
      }, 'Loading available services...');
    } catch (error) {
      apiErrorHandler.handleApiError(error);
    }
  };

  React.useEffect(() => {
    loadSubscriptionData();
    loadPerksData();
    loadServicesData();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column - Main Content */}
        <main className="lg:col-span-8 space-y-6 lg:space-y-8">
          
          {/* Subscription Overview with Error Boundary and Loading */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Overview</h2>
            <SubscriptionErrorBoundary>
              <ProgressiveLoader
                isLoading={subscriptionLoading.isLoading}
                skeleton={<SubscriptionOverviewSkeleton />}
                delay={200}
              >
                {/* Your actual SubscriptionOverview component would go here */}
                <div className="p-4 border rounded-lg">
                  Subscription Overview Content
                  {subscriptionLoading.error && (
                    <div className="text-red-600 text-sm mt-2">
                      Error: {subscriptionLoading.error.message}
                    </div>
                  )}
                </div>
              </ProgressiveLoader>
            </SubscriptionErrorBoundary>
          </section>

          {/* Perks and Benefits with Error Boundary and Loading */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Perks & Benefits</h2>
            <PerksErrorBoundary>
              <ProgressiveLoader
                isLoading={perksLoading.isLoading}
                skeleton={<PerksListSkeleton />}
                delay={150}
              >
                {/* Your actual PerksList component would go here */}
                <div className="p-4 border rounded-lg">
                  Perks and Benefits Content
                  {perksLoading.error && (
                    <div className="text-red-600 text-sm mt-2">
                      Error: {perksLoading.error.message}
                    </div>
                  )}
                </div>
              </ProgressiveLoader>
            </PerksErrorBoundary>
          </section>

          {/* Available Services with Error Boundary and Loading */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Services</h2>
            <ServicesErrorBoundary>
              <ProgressiveLoader
                isLoading={servicesLoading.isLoading}
                skeleton={<AvailableServicesSkeleton />}
                delay={100}
              >
                {/* Your actual AvailableServices component would go here */}
                <div className="p-4 border rounded-lg">
                  Available Services Content
                  {servicesLoading.error && (
                    <div className="text-red-600 text-sm mt-2">
                      Error: {servicesLoading.error.message}
                    </div>
                  )}
                </div>
              </ProgressiveLoader>
            </ServicesErrorBoundary>
          </section>

        </main>

        {/* Right Column - Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* Usage Analytics with Error Boundary */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Analytics</h3>
            <UsageAnalyticsErrorBoundary>
              <ProgressiveLoader
                isLoading={false} // Would be connected to actual loading state
                skeleton={<UsageAnalyticsSkeleton />}
              >
                <div className="p-4 border rounded-lg">
                  Usage Analytics Content
                </div>
              </ProgressiveLoader>
            </UsageAnalyticsErrorBoundary>
          </section>

          {/* Notifications with Error Boundary */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
            <NotificationsErrorBoundary>
              <ProgressiveLoader
                isLoading={false} // Would be connected to actual loading state
                skeleton={<NotificationsSkeleton />}
              >
                <div className="p-4 border rounded-lg">
                  Notifications Content
                </div>
              </ProgressiveLoader>
            </NotificationsErrorBoundary>
          </section>

        </aside>
      </div>
    </div>
  );
}

// Example of how to wrap the entire dashboard with a top-level error boundary
export function DashboardWithErrorBoundary() {
  return (
    <CustomerErrorBoundary
      section="Customer Dashboard"
      onError={(error, errorInfo) => {
        // Log to error reporting service
        console.error('Dashboard Error:', error, errorInfo);
      }}
    >
      <EnhancedCustomerDashboard />
    </CustomerErrorBoundary>
  );
}

export default DashboardWithErrorBoundary;