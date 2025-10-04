"use client";

import React from 'react';
import { SystemMonitoringDashboard } from '@/components/admin/monitoring/SystemMonitoringDashboard';
import { AdminErrorBoundary } from '@/components/admin/ErrorBoundary';

export default function MonitoringPage() {
  return (
    <AdminErrorBoundary context="AdminMonitoringPage">
      <SystemMonitoringDashboard />
    </AdminErrorBoundary>
  );
}