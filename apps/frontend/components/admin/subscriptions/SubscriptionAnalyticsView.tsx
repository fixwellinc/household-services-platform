"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/shared';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  revenue: {
    total: number;
    monthly: number;
    growth: number;
    byTier: Array<{ tier: string; revenue: number; count: number }>;
    trend: Array<{ month: string; revenue: number; subscriptions: number }>;
  };
  subscriptions: {
    total: number;
    active: number;
    churnRate: number;
    newSubscriptions: number;
    cancellations: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  customers: {
    averageLifetimeValue: number;
    averageMonthlySpend: number;
    retentionRate: number;
    topCustomers: Array<{
      email: string;
      tier: string;
      lifetimeValue: number;
      monthsActive: number;
    }>;
  };
}

export function SubscriptionAnalyticsView() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [exportLoading, setExportLoading] = useState(false);

  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await request(`/api/admin/subscriptions/analytics?timeRange=${timeRange}`);
      
      if (response.success) {
        setAnalytics(response.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      showError("Failed to fetch analytics data");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const response = await request(`/api/admin/subscriptions/analytics/export?timeRange=${timeRange}&format=csv`);
      
      if (response.success) {
        // Create download link
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `subscription-analytics-${timeRange}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showSuccess('Analytics exported successfully');
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
      showError("Failed to export analytics");
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Subscription Analytics</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTimeRange(e.target.value)} className="w-32">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exportLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            {exportLoading ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.revenue.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className={analytics.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {analytics.revenue.growth >= 0 ? '+' : ''}{analytics.revenue.growth.toFixed(1)}%
              </span>
              {' '}from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.subscriptions.active}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.subscriptions.newSubscriptions} new this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analytics.subscriptions.churnRate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.subscriptions.cancellations} cancellations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. LTV</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.customers.averageLifetimeValue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              ${analytics.customers.averageMonthlySpend.toFixed(0)} avg monthly
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Tier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue by Plan Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.revenue.byTier.map((tier) => (
                <div key={tier.tier} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="font-medium">{tier.tier}</span>
                    <span className="text-sm text-gray-500">({tier.count} subs)</span>
                  </div>
                  <span className="font-bold">${tier.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subscription Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.subscriptions.byStatus.map((status) => (
                <div key={status.status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      status.status === 'ACTIVE' ? 'bg-green-500' :
                      status.status === 'PAUSED' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                    <span className="font-medium">{status.status}</span>
                  </div>
                  <span className="font-bold">{status.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Chart visualization would be implemented here</p>
              <p className="text-sm">Using a charting library like Recharts or Chart.js</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Customers by Lifetime Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.customers.topCustomers.map((customer, index) => (
              <div key={customer.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{customer.email}</p>
                    <p className="text-sm text-gray-600">{customer.tier} • {customer.monthsActive} months active</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">${customer.lifetimeValue.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">LTV</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}