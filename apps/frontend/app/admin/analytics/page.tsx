"use client";

import React, { Suspense } from 'react';
import { EnhancedAnalytics } from '@/lib/performance/lazy-components';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';

export default function AnalyticsPage() {
  return (
    <AdminErrorBoundary>
      <Suspense fallback={<AdminLoadingState message="Loading analytics dashboard..." />}>
        <EnhancedAnalytics />
      </Suspense>
    </AdminErrorBoundary>
  );
}