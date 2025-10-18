"use client";

import React, { Suspense } from 'react';
import { UserManagement } from '@/lib/performance/lazy-components';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';

export default function AdminUsersPage() {
  return (
    <AdminErrorBoundary>
      <Suspense fallback={<AdminLoadingState message="Loading user management..." />}>
        <UserManagement />
      </Suspense>
    </AdminErrorBoundary>
  );
}