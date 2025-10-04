"use client";

import React from 'react';
import { AdvancedAnalyticsML } from '@/components/admin/analytics/AdvancedAnalyticsML';
import { AdminErrorBoundary } from '@/components/admin/ErrorBoundary';

export default function AdminMLAnalyticsPage() {
  return (
    <AdminErrorBoundary context="AdminMLAnalyticsPage">
      <AdvancedAnalyticsML />
    </AdminErrorBoundary>
  );
}
