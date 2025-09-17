'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { 
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Filter,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface UsageTrendData {
  period: string;
  date: string;
  servicesUsed: number;
  totalBookings: number;
  discountsSaved: number;
  supportTickets: number;
  totalSpent: number;
}

interface PeriodComparison {
  metric: string;
  currentPeriod: number;
  previousPeriod: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'stable';
}

interface ServiceCategoryUsage {
  category: string;
  usage: number;
  percentage: number;
  color: string;
}

interface UsageTrendsVisualizationProps {
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const DATE_RANGES = [
  { label: 'Last 3 months', value: '3months', months: 3 },
  { label: 'Last 6 months', value: '6months', months: 6 },
  { label: 'Last 12 months', value: '12months', months: 12 },
  { label: 'Custom range', value: 'custom', months: 0 }
];

export default function UsageTrendsVisualization({ 
  currentPeriodStart, 
  currentPeriodEnd 
}: UsageTrendsVisualizationProps) {
  const [trendData, setTrendData] = useState<UsageTrendData[]>([]);
  const [comparisons, setComparisons] = useState<PeriodComparison[]>([]);
  const [categoryUsage, setCategoryUsage] = useState<ServiceCategoryUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState('6months');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getDateRange = () => {
    if (selectedRange === 'custom' && customStartDate && customEndDate) {
      return { start: customStartDate, end: customEndDate };
    }
    
    const range = DATE_RANGES.find(r => r.value === selectedRange);
    if (!range) return { start: currentPeriodStart, end: currentPeriodEnd };
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - range.months);
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  const fetchUsageTrends = async () => {
    try {
      setLoading(true);
      setError(null);

      const { start, end } = getDateRange();

      // Fetch historical usage trends
      const response = await apiClient.request<{
        success: boolean;
        trends: UsageTrendData[];
        comparisons: PeriodComparison[];
        categoryUsage: ServiceCategoryUsage[];
        message: string;
      }>('/customer/usage/trends', {
        method: 'POST',
        body: JSON.stringify({
          startDate: start,
          endDate: end,
          granularity: 'monthly'
        })
      });

      if (response.success) {
        setTrendData(response.trends);
        setComparisons(response.comparisons);
        setCategoryUsage(response.categoryUsage);
      } else {
        // Fallback to mock data for development
        setTrendData(getMockTrendData());
        setComparisons(getMockComparisons());
        setCategoryUsage(getMockCategoryUsage());
      }
    } catch (err) {
      console.error('Failed to fetch usage trends:', err);
      // Use mock data as fallback
      setTrendData(getMockTrendData());
      setComparisons(getMockComparisons());
      setCategoryUsage(getMockCategoryUsage());
      setError('Unable to load real-time data. Showing sample data.');
    } finally {
      setLoading(false);
    }
  };

  const getMockTrendData = (): UsageTrendData[] => {
    const data = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    for (let i = 0; i < months.length; i++) {
      data.push({
        period: months[i],
        date: `2024-${String(i + 1).padStart(2, '0')}-01`,
        servicesUsed: Math.floor(Math.random() * 15) + 5,
        totalBookings: Math.floor(Math.random() * 20) + 8,
        discountsSaved: Math.floor(Math.random() * 300) + 100,
        supportTickets: Math.floor(Math.random() * 5) + 1,
        totalSpent: Math.floor(Math.random() * 800) + 400
      });
    }
    
    return data;
  };

  const getMockComparisons = (): PeriodComparison[] => [
    {
      metric: 'Services Used',
      currentPeriod: 12,
      previousPeriod: 8,
      change: 50,
      changeType: 'increase'
    },
    {
      metric: 'Total Bookings',
      currentPeriod: 15,
      previousPeriod: 18,
      change: -16.7,
      changeType: 'decrease'
    },
    {
      metric: 'Discounts Saved',
      currentPeriod: 245,
      previousPeriod: 180,
      change: 36.1,
      changeType: 'increase'
    },
    {
      metric: 'Support Tickets',
      currentPeriod: 3,
      previousPeriod: 5,
      change: -40,
      changeType: 'decrease'
    }
  ];

  const getMockCategoryUsage = (): ServiceCategoryUsage[] => [
    { category: 'Plumbing', usage: 5, percentage: 35, color: CHART_COLORS[0] },
    { category: 'Electrical', usage: 3, percentage: 21, color: CHART_COLORS[1] },
    { category: 'HVAC', usage: 3, percentage: 21, color: CHART_COLORS[2] },
    { category: 'Appliance Repair', usage: 2, percentage: 14, color: CHART_COLORS[3] },
    { category: 'General Maintenance', usage: 1, percentage: 7, color: CHART_COLORS[4] }
  ];

  useEffect(() => {
    fetchUsageTrends();
  }, [selectedRange, customStartDate, customEndDate]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Saved') || entry.name.includes('Spent') 
                ? formatCurrency(entry.value) 
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderComparisonCard = (comparison: PeriodComparison) => {
    const isPositive = comparison.changeType === 'increase';
    const isNegative = comparison.changeType === 'decrease';
    const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Activity;
    
    return (
      <Card key={comparison.metric} className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 text-sm">{comparison.metric}</h4>
            <TrendIcon className={`h-4 w-4 ${
              isPositive ? 'text-green-600' : 
              isNegative ? 'text-red-600' : 'text-gray-600'
            }`} />
          </div>
          
          <div className="space-y-1">
            <div className="text-lg font-bold text-gray-900">
              {comparison.metric.includes('Saved') || comparison.metric.includes('Spent')
                ? formatCurrency(comparison.currentPeriod)
                : comparison.currentPeriod}
            </div>
            
            <div className="text-xs text-gray-600">
              Previous: {comparison.metric.includes('Saved') || comparison.metric.includes('Spent')
                ? formatCurrency(comparison.previousPeriod)
                : comparison.previousPeriod}
            </div>
            
            <div className={`text-xs font-medium ${
              isPositive ? 'text-green-600' : 
              isNegative ? 'text-red-600' : 'text-gray-600'
            }`}>
              {comparison.change > 0 ? '+' : ''}{comparison.change.toFixed(1)}% change
            </div>
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
          <span className="ml-2 text-gray-600">Loading usage trends...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Usage Trends</h3>
          <p className="text-sm text-gray-600 mt-1">
            Historical usage patterns and period-over-period comparisons
          </p>
        </div>
        
        <button
          onClick={fetchUsageTrends}
          className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {/* Date Range Selection */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Date range:</span>
        </div>
        
        <div className="flex gap-2">
          {DATE_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => setSelectedRange(range.value)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedRange === range.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {selectedRange === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-200 rounded"
            />
            <span className="text-xs text-gray-500">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-200 rounded"
            />
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-gray-600">Chart type:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setChartType('line')}
              className={`p-1 rounded ${
                chartType === 'line' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Activity className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-1 rounded ${
                chartType === 'bar' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Period-over-Period Comparisons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {comparisons.map(renderComparisonCard)}
      </div>

      {/* Usage Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {chartType === 'line' ? <Activity className="h-5 w-5" /> : <BarChart3 className="h-5 w-5" />}
            Usage Trends Over Time
          </CardTitle>
          <CardDescription>
            Track your service usage patterns and spending trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="period" 
                    stroke="#666"
                    fontSize={12}
                  />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="servicesUsed" 
                    stroke={CHART_COLORS[0]} 
                    strokeWidth={2}
                    name="Services Used"
                    dot={{ fill: CHART_COLORS[0], strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalBookings" 
                    stroke={CHART_COLORS[1]} 
                    strokeWidth={2}
                    name="Total Bookings"
                    dot={{ fill: CHART_COLORS[1], strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="discountsSaved" 
                    stroke={CHART_COLORS[2]} 
                    strokeWidth={2}
                    name="Discounts Saved"
                    dot={{ fill: CHART_COLORS[2], strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="period" 
                    stroke="#666"
                    fontSize={12}
                  />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="servicesUsed" fill={CHART_COLORS[0]} name="Services Used" />
                  <Bar dataKey="totalBookings" fill={CHART_COLORS[1]} name="Total Bookings" />
                  <Bar dataKey="supportTickets" fill={CHART_COLORS[3]} name="Support Tickets" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Service Category Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Service Category Usage
            </CardTitle>
            <CardDescription>
              Breakdown of services by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryUsage}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => `${category} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="usage"
                  >
                    {categoryUsage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Details</CardTitle>
            <CardDescription>
              Service usage by category with percentages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryUsage.map((category) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {category.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {category.usage} services
                    </div>
                    <div className="text-xs text-gray-600">
                      {category.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spending Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Spending Trends</CardTitle>
          <CardDescription>
            Track your spending and savings over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="period" 
                  stroke="#666"
                  fontSize={12}
                />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="totalSpent" fill={CHART_COLORS[3]} name="Total Spent" />
                <Bar dataKey="discountsSaved" fill={CHART_COLORS[2]} name="Discounts Saved" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}