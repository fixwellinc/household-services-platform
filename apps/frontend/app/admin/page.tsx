"use client";

import { AdminDashboard } from '@/lib/performance/lazy-components';
import { DashboardLazyWrapper } from '@/components/admin/layout/LazyLoadWrapper';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

export default function AdminPage() {
  const { trackInteraction } = usePerformanceMonitoring('AdminPage');

  return (
    <DashboardLazyWrapper>
      <AdminDashboard />
    </DashboardLazyWrapper>
  );
}