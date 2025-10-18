/**
 * Lazy-loaded chart components with optimized loading
 * These components are heavy due to the recharts library
 */

import React from 'react';
import { LazyChart, ChartLoadingFallback } from '@/lib/performance/lazy-loading-system';

// =============================================================================
// LAZY CHART COMPONENTS
// =============================================================================

// Revenue Chart Component - Using existing performance charts
export const LazyRevenueChart = React.lazy(() => 
  import('@/components/admin/monitoring/PerformanceCharts').catch(() => ({
    default: () => (
      <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-600">Revenue chart not available</p>
      </div>
    )
  }))
);

// User Growth Chart Component - Using existing performance charts
export const LazyUserGrowthChart = React.lazy(() => 
  import('@/components/admin/monitoring/PerformanceCharts').catch(() => ({
    default: () => (
      <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-600">User growth chart not available</p>
      </div>
    )
  }))
);

// Performance Metrics Chart
export const LazyPerformanceChart = React.lazy(() => 
  import('@/components/admin/monitoring/PerformanceCharts').catch(() => ({
    default: () => (
      <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-600">Performance chart not available</p>
      </div>
    )
  }))
);

// Usage Analytics Chart for customers
export const LazyUsageChart = React.lazy(() => 
  import('@/components/customer/usage-analytics/UsageTrendsVisualization').catch(() => ({
    default: ({ currentPeriodStart, currentPeriodEnd }: any) => (
      <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-600">Usage chart not available</p>
      </div>
    )
  }))
);

// =============================================================================
// CHART WRAPPER COMPONENTS
// =============================================================================

interface ChartWrapperProps {
  title: string;
  children: React.ReactNode;
  height?: string;
}

export const RevenueChartWrapper: React.FC<Omit<ChartWrapperProps, 'children'>> = ({ title, height = 'h-64' }) => (
  <LazyChart title={`Loading ${title}...`}>
    <div className={height}>
      <LazyRevenueChart />
    </div>
  </LazyChart>
);

export const UserGrowthChartWrapper: React.FC<Omit<ChartWrapperProps, 'children'>> = ({ title, height = 'h-64' }) => (
  <LazyChart title={`Loading ${title}...`}>
    <div className={height}>
      <LazyUserGrowthChart />
    </div>
  </LazyChart>
);

export const PerformanceChartWrapper: React.FC<Omit<ChartWrapperProps, 'children'>> = ({ title, height = 'h-64' }) => (
  <LazyChart title={`Loading ${title}...`}>
    <div className={height}>
      <LazyPerformanceChart />
    </div>
  </LazyChart>
);

export const UsageChartWrapper: React.FC<Omit<ChartWrapperProps, 'children'>> = ({ title, height = 'h-64' }) => (
  <LazyChart title={`Loading ${title}...`}>
    <div className={height}>
      <LazyUsageChart 
        currentPeriodStart={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()} 
        currentPeriodEnd={new Date().toISOString()} 
      />
    </div>
  </LazyChart>
);

// =============================================================================
// RECHARTS COMPONENT WRAPPERS
// =============================================================================

// Generic recharts components with lazy loading
export const LazyLineChart = React.lazy(() => 
  import('recharts').then(module => ({ default: module.LineChart }))
);

export const LazyBarChart = React.lazy(() => 
  import('recharts').then(module => ({ default: module.BarChart }))
);

export const LazyAreaChart = React.lazy(() => 
  import('recharts').then(module => ({ default: module.AreaChart }))
);

export const LazyPieChart = React.lazy(() => 
  import('recharts').then(module => ({ default: module.PieChart }))
);

// Recharts wrapper with error handling
interface RechartsWrapperProps {
  children: React.ReactNode;
  fallbackMessage?: string;
}

export const RechartsWrapper: React.FC<RechartsWrapperProps> = ({ 
  children, 
  fallbackMessage = "Loading chart..." 
}) => (
  <React.Suspense fallback={<ChartLoadingFallback title={fallbackMessage} />}>
    {children}
  </React.Suspense>
);

// =============================================================================
// CHART FACTORY FUNCTION
// =============================================================================

interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'pie';
  data: any[];
  title: string;
  height?: number;
}

export const createLazyChart = (config: ChartConfig) => {
  const ChartComponent = React.lazy(async () => {
    const recharts = await import('recharts');
    
    const ChartTypeMap = {
      line: recharts.LineChart,
      bar: recharts.BarChart,
      area: recharts.AreaChart,
      pie: recharts.PieChart,
    };

    const Chart = ChartTypeMap[config.type];
    
    return {
      default: () => (
        <Chart 
          width={800} 
          height={config.height || 300} 
          data={config.data}
        >
          {/* Chart configuration would go here */}
        </Chart>
      )
    };
  });

  return () => (
    <LazyChart title={`Loading ${config.title}...`}>
      <ChartComponent />
    </LazyChart>
  );
};