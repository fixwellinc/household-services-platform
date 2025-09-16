"use client";

import React from 'react';
import { SubscriptionManagement } from '@/components/admin/subscriptions/SubscriptionManagement';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';

export default function AdminSubscriptionsPage() {
  return (
    <AdminErrorBoundary>
      <SubscriptionManagement />
    </AdminErrorBoundary>
  );
}