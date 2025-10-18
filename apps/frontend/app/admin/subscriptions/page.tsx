"use client";

import React, { Suspense } from 'react';
import { SubscriptionManagement } from '@/lib/performance/lazy-components';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';

export default function AdminSubscriptionsPage() {
  return (
    <AdminErrorBoundary>
      <Suspense fallback={<AdminLoadingState message="Loading subscription management..." />}>
        <SubscriptionManagement />
      </Suspense>
    </AdminErrorBoundary>
  );
}