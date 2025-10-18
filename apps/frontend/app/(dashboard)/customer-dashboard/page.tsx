"use client";
import React, { Suspense } from 'react';
import { CustomerDashboard } from '@/lib/performance/lazy-components';
import { DashboardRouteGuard } from '@/components/dashboard/DashboardRouteGuard';
import { coreWebVitalsMonitor } from '@/lib/core-web-vitals-monitor';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';

export const dynamic = 'force-dynamic';

export default function CustomerDashboardPage() {
  // Initialize Core Web Vitals monitoring once on mount
  React.useEffect(() => {
    coreWebVitalsMonitor.init();
  }, []);

  return (
    <DashboardRouteGuard requiredRole="CUSTOMER">
      <Suspense fallback={<AdminLoadingState message="Loading customer dashboard..." />}>
        <CustomerDashboard />
      </Suspense>
    </DashboardRouteGuard>
  );
}