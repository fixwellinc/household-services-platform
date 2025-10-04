"use client";

import React from 'react';
import { MultiTenantAdmin } from '@/components/admin/tenants/MultiTenantAdmin';
import { AdminErrorBoundary } from '@/components/admin/ErrorBoundary';

export default function AdminTenantsPage() {
  return (
    <AdminErrorBoundary context="AdminTenantsPage">
      <MultiTenantAdmin />
    </AdminErrorBoundary>
  );
}
