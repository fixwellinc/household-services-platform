'use client';

import React, { Suspense } from 'react';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';

interface CustomerDashboardSafeWrapperProps {
  children: React.ReactNode;
}

/**
 * Safe wrapper for customer dashboard that ensures proper Suspense boundaries
 * for any components that might use useSearchParams or other client-side hooks
 */
export function CustomerDashboardSafeWrapper({ children }: CustomerDashboardSafeWrapperProps) {
  return (
    <Suspense fallback={<AdminLoadingState message="Loading dashboard components..." />}>
      {children}
    </Suspense>
  );
}