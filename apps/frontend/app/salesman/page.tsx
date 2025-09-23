'use client';

import { SalesmanDashboard } from '@/components/salesman/SalesmanDashboard';
import { DashboardLazyWrapper } from '@/components/admin/layout/LazyLoadWrapper';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

export default function SalesmanPage() {
  const { trackInteraction } = usePerformanceMonitoring('SalesmanPage');

  return (
    <DashboardLazyWrapper>
      <SalesmanDashboard />
    </DashboardLazyWrapper>
  );
}