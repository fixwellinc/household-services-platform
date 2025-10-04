"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  AlertTriangle,
  Download,
  RefreshCw,
  Calendar,
  Target,
  Award,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/shared';

interface ChurnRiskCustomer {
  userId: string;
  riskScore: number;
  riskLevel: string;
  riskFactors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  protectiveFactors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  recommendation: string;
}

interface ChurnRiskData {
  summary: {
    totalActiveSubscriptions: number;
    highRiskCount: number;
    riskDistribution: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  highRiskCustomers: ChurnRiskCustomer[];
}

interface RevenueTrend {
  month: string;
  revenue: number;
  newSubscriptions: number;
  cancelledSubscriptions: number;
  netGrowth: number;
}

interface RevenueTrendsData {
  monthlyData: RevenueTrend[];
  revenueGrowthRates: Array<{
    month: string;
    growthRate: number;
  }>;
  totalRevenue: number;
  averageMonthlyRevenue: number;
}

interface PerkUtilizationData {
  totalSubscriptionsWithUsage: number;
  utilizationRates: Array<{
    perk: string;
    utilizationRate: number;
  }>;
  usageByTier: Array<{
    tier: string;
    priorityBookingUsage: number;
    discountUsage: number;
    freeServiceUsage: number;
    emergencyServiceUsage: number;
  }>;
}

interface EnhancedAnalyticsData {
  subscriptionMetrics: {
    churnRate: number;
    churnByTier: Array<{
      tier: string;
      count: number;
      rate: number;
    }>;
    churnByFrequency: Array<{
      frequency: string;
      count: number;
      rate: number;
    }>;
    averageCLV: number;
    clvByTier: Array<{
      tier: string;
      averageCLV: number;
      count: number;
    }>;
    perkUtilization: Array<{
      perk: string;
      utilizationRate: number;
    }>;
  };
}

export default function EnhancedAnalytics() {
  const [loading, setLoading] = useState(true);
  const [churnRiskData, setChurnRiskData] = useState<ChurnRiskData | null>(null);
  const [revenueTrends, setRevenueTrends] = useState<RevenueTrendsData | null>(null);
  const [perkUtilization, setPerkUtilization] = useState<PerkUtilizationData | null>(null);
  const [enhancedAnalytics, setEnhancedAnalytics] = useState<EnhancedAnalyticsData | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState(12);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedTimeframe]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch enhanced analytics from main endpoint
      const analyticsResponse = await fetch('/api/admin/analytics');
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setEnhancedAnalytics(analyticsData);
      }

      // Fetch churn risk data
      const churnResponse = await fetch('/api/analytics/churn-risk?limit=20&riskThreshold=60');
      if (churnResponse.ok) {
        const churnData = await churnResponse.json();
        setChurnRiskData(churnData);
      }

      // Fetch revenue trends
      const revenueResponse = await fetch(`/api/analytics/revenue-trends?months=${selectedTimeframe}`);
      if (revenueResponse.ok) {
        const revenueData = await revenueResponse.json();
        setRevenueTrends(revenueData);
      }

      // Fetch perk utilization
      const perkResponse = await fetch('/api/analytics/perk-utilization');
      if (perkResponse.ok) {
        const perkData = await perkResponse.json();
        setPerkUtilization(perkData);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const reportData = {
      churnRisk: churnRiskData,
      revenueTrends: revenueTrends,
      perkUtilization: perkUtilization,
      enhancedAnalytics: enhancedAnalytics,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enhanced Analytics</h2>
          <p className="text-gray-600">Advanced subscription and customer insights</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
            <option value={24}>Last 24 months</option>
          </select>
          <Button onClick={fetchAnalyticsData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      {enhancedAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Churn Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {enhancedAnalytics.subscriptionMetrics.churnRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-2 rounded-full bg-red-100">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average CLV</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${enhancedAnalytics.subscriptionMetrics.averageCLV.toFixed(0)}
                </p>
              </div>
              <div className="p-2 rounded-full bg-green-100">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Risk Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {churnRiskData?.summary.highRiskCount || 0}
                </p>
              </div>
              <div className="p-2 rounded-full bg-orange-100">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Perk Usage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {enhancedAnalytics.subscriptionMetrics.perkUtilization.length > 0 
                    ? (enhancedAnalytics.subscriptionMetrics.perkUtilization.reduce((sum, p) => sum + p.utilizationRate, 0) / enhancedAnalytics.subscriptionMetrics.perkUtilization.length).toFixed(1)
                    : 0}%
                </p>
              </div>
              <div className="p-2 rounded-full bg-blue-100">
                <Award className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Trends Chart */}
      {revenueTrends && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="h-64 flex items-end space-x-2">
                {revenueTrends.monthlyData.map((month, index) => (
                  <div key={month.month} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t"
                      style={{ 
                        height: `${(month.revenue / Math.max(...revenueTrends.monthlyData.map(m => m.revenue))) * 200}px`,
                        minHeight: '4px'
                      }}
                    />
                    <span className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-left">
                      {month.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-xl font-bold text-gray-900">
                  ${revenueTrends.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Avg Monthly Revenue</p>
                <p className="text-xl font-bold text-gray-900">
                  ${revenueTrends.averageMonthlyRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Churn Risk Analysis */}
      {churnRiskData && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Churn Risk Analysis</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Risk Distribution</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Critical</span>
                  <span className="text-sm font-medium text-red-600">
                    {churnRiskData.summary.riskDistribution.critical}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">High</span>
                  <span className="text-sm font-medium text-orange-600">
                    {churnRiskData.summary.riskDistribution.high}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Medium</span>
                  <span className="text-sm font-medium text-yellow-600">
                    {churnRiskData.summary.riskDistribution.medium}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Low</span>
                  <span className="text-sm font-medium text-green-600">
                    {churnRiskData.summary.riskDistribution.low}
                  </span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <h4 className="font-medium text-gray-900 mb-3">High Risk Customers</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {churnRiskData.highRiskCustomers.slice(0, 10).map((customer) => (
                  <div key={customer.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          Customer {customer.userId.slice(-8)}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getRiskLevelColor(customer.riskLevel)}`}>
                          {customer.riskLevel}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{customer.recommendation}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{customer.riskScore.toFixed(1)}%</p>
                      <p className="text-xs text-gray-600">{customer.riskFactors.length} factors</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Churn by Tier and Frequency */}
      {enhancedAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Churn Rate by Tier</h3>
            <div className="space-y-3">
              {enhancedAnalytics.subscriptionMetrics.churnByTier.map((tier) => (
                <div key={tier.tier} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{tier.tier}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${Math.min(tier.rate, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{tier.rate.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">CLV by Tier</h3>
            <div className="space-y-3">
              {enhancedAnalytics.subscriptionMetrics.clvByTier.map((tier) => (
                <div key={tier.tier} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{tier.tier}</span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">${tier.averageCLV.toFixed(0)}</p>
                    <p className="text-xs text-gray-600">{tier.count} customers</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Perk Utilization */}
      {enhancedAnalytics && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Perk Utilization Rates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {enhancedAnalytics.subscriptionMetrics.perkUtilization.map((perk) => (
              <div key={perk.perk} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {perk.perk.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {perk.utilizationRate.toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}