"use client";

import { SalesmenManagementSimple } from '@/components/admin/salesmen/SalesmenManagementSimple';
import { DashboardLazyWrapper } from '@/components/admin/layout/LazyLoadWrapper';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

export default function AdminSalesmenPage() {
  const { trackInteraction } = usePerformanceMonitoring('AdminSalesmenPage');

  return (
    <DashboardLazyWrapper>
      <SalesmenManagementSimple />
    </DashboardLazyWrapper>
  );
}