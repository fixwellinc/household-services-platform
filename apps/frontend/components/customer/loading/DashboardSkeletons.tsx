'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/shared';
import { 
  Skeleton, 
  TextSkeleton, 
  ButtonSkeleton, 
  BadgeSkeleton, 
  IconSkeleton,
  StatsCardSkeleton,
  ChartSkeleton,
  ListSkeleton
} from './SkeletonComponents';

// Subscription Overview Skeleton
export function SubscriptionOverviewSkeleton() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IconSkeleton size="lg" />
            <div>
              <TextSkeleton size="xl" className="w-48 mb-2" />
              <TextSkeleton size="sm" className="w-32" />
            </div>
          </div>
          <BadgeSkeleton />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Plan Details */}
          <div className="space-y-3">
            <TextSkeleton size="sm" className="w-20" />
            <TextSkeleton size="lg" className="w-32" />
            <TextSkeleton size="sm" className="w-24" />
          </div>
          
          {/* Billing Info */}
          <div className="space-y-3">
            <TextSkeleton size="sm" className="w-24" />
            <TextSkeleton size="lg" className="w-28" />
            <TextSkeleton size="sm" className="w-36" />
          </div>
          
          {/* Status */}
          <div className="space-y-3">
            <TextSkeleton size="sm" className="w-16" />
            <BadgeSkeleton />
            <TextSkeleton size="sm" className="w-40" />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <ButtonSkeleton className="flex-1" />
          <ButtonSkeleton variant="outline" className="flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

// Perks List Skeleton
export function PerksListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <IconSkeleton />
                </div>
                <div>
                  <TextSkeleton size="lg" className="w-32 mb-1" />
                  <TextSkeleton size="sm" className="w-48" />
                </div>
              </div>
              <BadgeSkeleton />
            </div>
            
            {/* Usage Progress */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <TextSkeleton size="sm" className="w-20" />
                <TextSkeleton size="sm" className="w-16" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Available Services Skeleton
export function AvailableServicesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <IconSkeleton size="lg" />
              </div>
              <BadgeSkeleton />
            </div>
            
            <div className="space-y-3 mb-4">
              <TextSkeleton size="lg" className="w-32" />
              <TextSkeleton lines={2} size="sm" />
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <TextSkeleton size="sm" className="w-20" />
              <TextSkeleton size="lg" className="w-16" />
            </div>
            
            <ButtonSkeleton className="w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Usage Analytics Skeleton
export function UsageAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatsCardSkeleton key={index} />
        ))}
      </div>
      
      {/* Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <TextSkeleton size="lg" className="w-40" />
            <div className="flex space-x-2">
              <ButtonSkeleton size="sm" />
              <ButtonSkeleton size="sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartSkeleton height={300} />
        </CardContent>
      </Card>
      
      {/* Usage Breakdown */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <TextSkeleton size="lg" className="w-36" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <IconSkeleton />
                  <div>
                    <TextSkeleton className="w-24 mb-1" />
                    <TextSkeleton size="sm" className="w-32" />
                  </div>
                </div>
                <div className="text-right">
                  <TextSkeleton className="w-12 mb-1" />
                  <TextSkeleton size="sm" className="w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Notifications Skeleton
export function NotificationsSkeleton() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <IconSkeleton />
            <TextSkeleton size="lg" className="w-32" />
          </div>
          <BadgeSkeleton />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
              <div className="w-2 h-2 bg-gray-300 rounded-full mt-2 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <TextSkeleton className="w-40" />
                  <TextSkeleton size="sm" className="w-16" />
                </div>
                <TextSkeleton lines={2} size="sm" />
                <div className="flex space-x-2">
                  <ButtonSkeleton size="sm" />
                  <ButtonSkeleton size="sm" variant="outline" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Stats Sidebar Skeleton
export function QuickStatsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <TextSkeleton size="lg" className="w-24" />
        <ButtonSkeleton size="sm" />
      </div>
      
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <TextSkeleton size="sm" className="w-20 mb-1" />
                  <TextSkeleton size="xl" className="w-12" />
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <IconSkeleton size="sm" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Mobile Stats Grid Skeleton
export function MobileStatsGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-gray-100 rounded-full mx-auto mb-2 flex items-center justify-center">
              <IconSkeleton size="sm" />
            </div>
            <TextSkeleton size="sm" className="w-16 mx-auto mb-1" />
            <TextSkeleton size="lg" className="w-12 mx-auto" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Full Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Skeleton */}
      <div className="hidden lg:block mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <TextSkeleton size="2xl" className="w-64 mb-2" />
            <TextSkeleton className="w-96" />
          </div>
          <div className="flex items-center gap-3">
            <BadgeSkeleton />
            <BadgeSkeleton />
            <ButtonSkeleton />
            <ButtonSkeleton />
          </div>
        </div>
      </div>

      {/* Mobile Quick Stats */}
      <div className="lg:hidden mb-6">
        <MobileStatsGridSkeleton />
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column - Main Content */}
        <main className="lg:col-span-8 space-y-6 lg:space-y-8">
          {/* Subscription Overview */}
          <div>
            <TextSkeleton size="xl" className="w-48 mb-4" />
            <SubscriptionOverviewSkeleton />
          </div>

          {/* Perks and Benefits */}
          <div>
            <TextSkeleton size="xl" className="w-40 mb-4" />
            <PerksListSkeleton />
          </div>

          {/* Available Services */}
          <div>
            <TextSkeleton size="xl" className="w-44 mb-4" />
            <AvailableServicesSkeleton />
          </div>
        </main>

        {/* Right Column - Sidebar */}
        <aside className="hidden lg:block lg:col-span-4 space-y-6">
          <QuickStatsSkeleton />
          <NotificationsSkeleton />
        </aside>
      </div>
    </div>
  );
}

// Progressive Loading Component
export function ProgressiveLoader({ 
  isLoading, 
  children, 
  skeleton,
  delay = 200 
}: {
  isLoading: boolean;
  children: React.ReactNode;
  skeleton: React.ReactNode;
  delay?: number;
}) {
  const [showSkeleton, setShowSkeleton] = React.useState(false);

  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isLoading) {
      timeout = setTimeout(() => {
        setShowSkeleton(true);
      }, delay);
    } else {
      setShowSkeleton(false);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isLoading, delay]);

  if (isLoading && showSkeleton) {
    return <>{skeleton}</>;
  }

  if (isLoading) {
    return null; // Show nothing during the delay
  }

  return <>{children}</>;
}