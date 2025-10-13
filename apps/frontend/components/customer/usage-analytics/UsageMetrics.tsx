'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { 
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Users,
  Clock,
  Filter,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface UsageMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  category: 'SERVICES' | 'BOOKINGS' | 'DISCOUNTS' | 'SUPPORT';
  trend: {
    direction: 'UP' | 'DOWN' | 'STABLE';
    percentage: number;
    period: string;
  };
  description: string;
}

interface ServiceUsageBreakdown {
  serviceId: string;
  serviceName: string;
  category: string;
  usageCount: number;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
}

interface UsageMetricsProps {
  currentPeriodStart: string;
  currentPeriodEnd: string;
  onExportData?: () => void;
}

const CATEGORY_COLORS = {
  SERVICES: 'bg-blue-50 border-blue-200 text-blue-800',
  BOOKINGS: 'bg-green-50 border-green-200 text-green-800',
  DISCOUNTS: 'bg-amber-50 border-amber-200 text-amber-800',
  SUPPORT: 'bg-purple-50 border-purple-200 text-purple-800'
};

const CATEGORY_ICONS = {
  SERVICES: Activity,
  BOOKINGS: Calendar,
  DISCOUNTS: DollarSign,
  SUPPORT: Users
};

export default function UsageMetrics({ 
  currentPeriodStart, 
  currentPeriodEnd, 
  onExportData 
}: UsageMetricsProps) {
  const [metrics, setMetrics] = useState<UsageMetric[]>([]);
  const [serviceBreakdown, setServiceBreakdown] = useState<ServiceUsageBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const fetchUsageMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current billing period usage statistics
      const response = await apiClient.request<{
        success: boolean;
        metrics: UsageMetric[];
        serviceBreakdown: ServiceUsageBreakdown[];
        totalSavings: number;
        totalSpent: number;
        message: string;
      }>('/customer/usage/metrics', {
        method: 'POST',
        body: JSON.stringify({
          startDate: currentPeriodStart,
          endDate: currentPeriodEnd
        })
      });

      if (response.success) {
        setMetrics(response.metrics);
        setServiceBreakdown(response.serviceBreakdown);
      } else {
        // Fallback to mock data for development
        setMetrics(getMockMetrics());
        setServiceBreakdown(getMockServiceBreakdown());
      }
    } catch (err) {
      console.error('Failed to fetch usage metrics:', err);
      // Use mock data as fallback
      setMetrics(getMockMetrics());
      setServiceBreakdown(getMockServiceBreakdown());
      setError('Unable to load real-time data. Showing sample data.');
    } finally {
      setLoading(false);
    }
  };

  const getMockMetrics = (): UsageMetric[] => [
    {
      id: '1',
      name: 'Services Booked',
      value: 8,
      unit: 'bookings',
      category: 'SERVICES',
      trend: { direction: 'UP', percentage: 25, period: 'last month' },
      description: 'Total services booked this billing period'
    },
    {
      id: '2',
      name: 'Total Bookings',
      value: 12,
      unit: 'appointments',
      category: 'BOOKINGS',
      trend: { direction: 'UP', percentage: 15, period: 'last month' },
      description: 'All appointments scheduled this period'
    },
    {
      id: '3',
      name: 'Discount Savings',
      value: 245,
      unit: 'USD',
      category: 'DISCOUNTS',
      trend: { direction: 'UP', percentage: 30, period: 'last month' },
      description: 'Total amount saved through subscription discounts'
    },
    {
      id: '4',
      name: 'Support Requests',
      value: 3,
      unit: 'tickets',
      category: 'SUPPORT',
      trend: { direction: 'DOWN', percentage: 40, period: 'last month' },
      description: 'Support tickets created this period'
    }
  ];

  const getMockServiceBreakdown = (): ServiceUsageBreakdown[] => [
    {
      serviceId: '1',
      serviceName: 'Plumbing Repair',
      category: 'Plumbing',
      usageCount: 3,
      totalAmount: 450,
      discountAmount: 90,
      finalAmount: 360
    },
    {
      serviceId: '2',
      serviceName: 'Electrical Installation',
      category: 'Electrical',
      usageCount: 2,
      totalAmount: 320,
      discountAmount: 64,
      finalAmount: 256
    },
    {
      serviceId: '3',
      serviceName: 'HVAC Maintenance',
      category: 'HVAC',
      usageCount: 3,
      totalAmount: 280,
      discountAmount: 56,
      finalAmount: 224
    }
  ];

  const handleExportData = async () => {
    try {
      const exportData = {
        period: {
          start: currentPeriodStart,
          end: currentPeriodEnd
        },
        metrics,
        serviceBreakdown,
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usage-metrics-${formatDate(currentPeriodStart)}-${formatDate(currentPeriodEnd)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (onExportData) {
        onExportData();
      }
    } catch (err) {
      console.error('Failed to export data:', err);
      setError('Failed to export usage data');
    }
  };

  useEffect(() => {
    fetchUsageMetrics();
  }, [currentPeriodStart, currentPeriodEnd]);

  const filteredMetrics = selectedCategory === 'ALL' 
    ? metrics 
    : metrics.filter(metric => metric.category === selectedCategory);

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'UP': return TrendingUp;
      case 'DOWN': return TrendingDown;
      default: return Activity;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'UP': return 'text-green-600';
      case 'DOWN': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const renderMetricCard = (metric: UsageMetric) => {
    const TrendIcon = getTrendIcon(metric.trend.direction);
    const CategoryIcon = CATEGORY_ICONS[metric.category];

    return (
      <Card key={metric.id} className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <CategoryIcon className="h-5 w-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">{metric.name}</h4>
            </div>
            <Badge className={`${CATEGORY_COLORS[metric.category]} text-xs px-2 py-1`}>
              {metric.category?.toLowerCase() || 'unknown'}
            </Badge>
          </div>

          <div className="mb-3">
            <div className="text-2xl font-bold text-gray-900">
              {metric.category === 'DISCOUNTS' ? formatCurrency(metric.value) : metric.value}
              <span className="text-sm font-normal text-gray-600 ml-1">
                {metric.category === 'DISCOUNTS' ? '' : metric.unit}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{metric.description}</p>
          </div>

          <div className="flex items-center gap-1 text-sm">
            <TrendIcon className={`h-4 w-4 ${getTrendColor(metric.trend.direction)}`} />
            <span className={getTrendColor(metric.trend.direction)}>
              {metric.trend.percentage}% {metric.trend.direction?.toLowerCase() || 'stable'}
            </span>
            <span className="text-gray-500">vs {metric.trend.period}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading usage metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Usage Metrics</h3>
          <p className="text-sm text-gray-600 mt-1">
            Billing period: {formatDate(currentPeriodStart)} - {formatDate(currentPeriodEnd)}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsageMetrics}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          
          <button
            onClick={handleExportData}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Filter by category:</span>
        <div className="flex gap-1">
          {['ALL', 'SERVICES', 'BOOKINGS', 'DISCOUNTS', 'SUPPORT'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredMetrics.map(renderMetricCard)}
      </div>

      {/* Service Usage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Service Usage Breakdown
          </CardTitle>
          <CardDescription>
            Detailed breakdown of services used during this billing period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {serviceBreakdown.length > 0 ? (
            <div className="space-y-4">
              {serviceBreakdown.map((service) => (
                <div key={service.serviceId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{service.serviceName}</h4>
                    <p className="text-sm text-gray-600">{service.category}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Used {service.usageCount} time{service.usageCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(service.finalAmount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Original: {formatCurrency(service.totalAmount)}
                    </div>
                    <div className="text-xs text-green-600">
                      Saved: {formatCurrency(service.discountAmount)}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Summary */}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Total Savings:</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency((serviceBreakdown || []).reduce((sum, s) => sum + s.discountAmount, 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-600">Total Spent:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency((serviceBreakdown || []).reduce((sum, s) => sum + s.finalAmount, 0))}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No service usage data available for this period</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {metrics.reduce((sum, m) => m.category === 'SERVICES' ? sum + m.value : sum, 0)}
            </div>
            <div className="text-sm text-blue-700">Total Services Used</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency((serviceBreakdown || []).reduce((sum, s) => sum + s.discountAmount, 0))}
            </div>
            <div className="text-sm text-green-700">Total Savings</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(((serviceBreakdown || []).reduce((sum, s) => sum + s.discountAmount, 0) / 
                Math.max((serviceBreakdown || []).reduce((sum, s) => sum + s.totalAmount, 0), 1)) * 100)}%
            </div>
            <div className="text-sm text-purple-700">Average Discount</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}