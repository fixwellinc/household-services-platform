"use client";

import React from 'react';
import { AdminSettings } from '@/components/admin/settings/AdminSettings';
import { AdminErrorBoundary } from '@/components/admin/ErrorBoundary';

export default function AdminSettingsPage() {
  return (
    <AdminErrorBoundary context="AdminSettingsPage">
      <AdminSettings />
    </AdminErrorBoundary>
  );
}