"use client";
import React from 'react';
import { CustomerDashboardLogic } from '@/components/dashboard/CustomerDashboardLogic';
import { DashboardRouteGuard } from '@/components/dashboard/DashboardRouteGuard';
import { CustomerDashboardContent } from '@/components/dashboard/CustomerDashboardContent';
import { coreWebVitalsMonitor } from '@/lib/core-web-vitals-monitor';

export const dynamic = 'force-dynamic';

export default function CustomerDashboardPage() {
  // Initialize Core Web Vitals monitoring once on mount
  React.useEffect(() => {
    coreWebVitalsMonitor.init();
  }, []);

  return (
    <CustomerDashboardLogic>
      <DashboardRouteGuard requiredRole="CUSTOMER">
        <CustomerDashboardContent />
      </DashboardRouteGuard>
    </CustomerDashboardLogic>
  );
}