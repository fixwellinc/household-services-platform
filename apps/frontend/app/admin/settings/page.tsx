"use client";

import React from 'react';
import { EnhancedAdminSettings } from '@/components/admin/settings/EnhancedAdminSettings';
import { AdminPageErrorBoundary } from '@/components/admin/error-boundaries/AdminPageErrorBoundary';
import { createErrorBoundaryProps } from '@/lib/admin-error-reporting';

export default function AdminSettingsPage() {
  return (
    <AdminPageErrorBoundary 
      {...createErrorBoundaryProps('AdminSettingsPage')}
      pageTitle="Settings"
    >
      <EnhancedAdminSettings />
    </AdminPageErrorBoundary>
  );
}