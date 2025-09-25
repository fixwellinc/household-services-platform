"use client";

import { SalesmenManagement } from '@/components/admin/salesmen/SalesmenManagement';
import { DashboardLazyWrapper } from '@/components/admin/layout/LazyLoadWrapper';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

export default function AdminSalesmenPage() {
  const { trackInteraction } = usePerformanceMonitoring('AdminSalesmenPage');

  return (
    <DashboardLazyWrapper>
      <SalesmenManagement />
    </DashboardLazyWrapper>
  );
}