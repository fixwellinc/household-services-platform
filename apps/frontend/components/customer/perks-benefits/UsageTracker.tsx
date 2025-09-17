'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  Activity,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Zap,
  ArrowRight,
  Download
} from 'lucide-react';

interface UsageMetric {
  id: string;
  name: string;
  description: string;
  currentUsage: number;
  limit: number;
  unit: string;
  category: 'SERVICES' | 'BOOKINGS' | 'SUPPORT' | 'DISCOUNTS';
  isUnlimited: boolean;
  resetPeriod: 'MONTHLY' | 'YEARLY' | 'NEVER';
  resetDate?: string;
  trend: {
    direction: 'UP' | 'DOWN' | 'STABLE';
    percentage: number;
    period: string;
  };
  history: Array<{
    period: string;
    usage: number;
    date: string;
  }>;
}

interface UsageTrackerProps {
  metrics: UsageMetric[];
  currentPeriodStart: string;
  currentPeriodEnd: string;
  onExportData?: () => void;
  onViewHistory?: (metricId: string) => void;
}

const CATEGORY_COLORS = {
  SERVICES: 'bg-blue-50 border-blue-200 text-blue-800',
  BOOKINGS: 'bg-green-50 border-green-200 text-green-800',
  SUPPORT: 'bg-purple-50 border-purple-200 text-purple-800',
  DISCOUNTS: 'bg-amber-50 border-amber-200 text-amber-800'
};

const CATEGORY_ICONS = {
  SERVICES: Zap,
  BOOKINGS: Calendar,
  SUPPORT: Activity,
  DISCOUNTS: Target
};

export default function UsageTracker({ 
  metrics, 
  currentPeriodStart, 
  currentPeriodEnd, 
  onExportData,
  onViewHistory 
}: UsageTrackerProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'last' | 'all'>('current');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getUsagePercentage = (metric: UsageMetric) => {
    if (metric.isUnlimited) return 0;
    return Math.min((metric.currentUsage / metric.limit) * 100, 100);
  };

  const getUsageStatus = (metric: UsageMetric) => {
    if (metric.isUnlimited) return 'unlimited';
    const percentage = getUsagePercentage(metric);
    if (percentage >= 100) return 'exceeded';
    if (percentage >= 90) return 'critical';
    if (percentage >= 70) return 'warning';
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded': return 'text-red-600 bg-red-50 border-red-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'unlimited': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'exceeded': return 'bg-red-500';
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

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

  const groupedMetrics = metrics.reduce((acc, metric) => {
    if (!acc[metric.category]) {
      acc[metric.category] = [];
    }
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<string, UsageMetric[]>);

  const renderMetricCard = (metric: UsageMetric) => {
    const percentage = getUsagePercentage(metric);
    const status = getUsageStatus(metric);
    const TrendIcon = getTrendIcon(metric.trend.direction);
    const CategoryIcon = CATEGORY_ICONS[metric.category];

    return (
      <Card key={metric.id} className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <CategoryIcon className="h-4 w-4 text-gray-600" />
              <h4 className="font-medium text-sm text-gray-900">{metric.name}</h4>
            </div>
            <Badge className={`${getStatusColor(status)} text-xs px-2 py-0.5`}>
              {status === 'unlimited' ? 'Unlimited' : `${Math.round(percentage)}%`}
            </Badge>
          </div>

          <p className="text-xs text-gray-600 mb-3">{metric.description}</p>

          {/* Usage Progress */}
          {!metric.isUnlimited && (
            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">
                  {metric.currentUsage} of {metric.limit} {metric.unit}
                </span>
                <span className={`font-medium ${
                  status === 'exceeded' ? 'text-red-600' :
                  status === 'critical' ? 'text-red-600' :
                  status === 'warning' ? 'text-yellow-600' : 'text-gray-600'
                }`}>
                  {metric.limit - metric.currentUsage} remaining
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(status)}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Unlimited indicator */}
          {metric.isUnlimited && (
            <div className="flex items-center gap-2 mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 font-medium">
                {metric.currentUsage} {metric.unit} used (Unlimited)
              </span>
            </div>
          )}

          {/* Trend Information */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <TrendIcon className={`h-3 w-3 ${getTrendColor(metric.trend.direction)}`} />
              <span className={getTrendColor(metric.trend.direction)}>
                {metric.trend.percentage}% {metric.trend.direction.toLowerCase()} vs {metric.trend.period}
              </span>
            </div>
            
            {metric.resetDate && (
              <div className="flex items-center gap-1 text-gray-500">
                <Clock className="h-3 w-3" />
                <span>Resets {formatDate(metric.resetDate)}</span>
              </div>
            )}
          </div>

          {/* Warning for high usage */}
          {status === 'critical' && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-red-700 font-medium">Usage Alert</p>
                  <p className="text-xs text-red-600 mt-1">
                    You're approaching your limit. Consider upgrading your plan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* View history button */}
          {onViewHistory && metric.history.length > 0 && (
            <button
              onClick={() => onViewHistory(metric.id)}
              className="mt-3 w-full flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-700 py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <BarChart3 className="h-3 w-3" />
              View Usage History
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </CardContent>
      </Card>
    );
  };

  const getTotalUsageStats = () => {
    const totalMetrics = metrics.length;
    const criticalMetrics = metrics.filter(m => getUsageStatus(m) === 'critical' || getUsageStatus(m) === 'exceeded').length;
    const warningMetrics = metrics.filter(m => getUsageStatus(m) === 'warning').length;
    const unlimitedMetrics = metrics.filter(m => m.isUnlimited).length;

    return { totalMetrics, criticalMetrics, warningMetrics, unlimitedMetrics };
  };

  const stats = getTotalUsageStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Usage Tracking</h3>
          <p className="text-sm text-gray-600 mt-1">
            Current period: {formatDate(currentPeriodStart)} - {formatDate(currentPeriodEnd)}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {onExportData && (
            <button
              onClick={onExportData}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="h-3 w-3" />
              Export Data
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{stats.totalMetrics}</div>
              <div className="text-xs text-blue-700">Total Metrics</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{stats.unlimitedMetrics}</div>
              <div className="text-xs text-green-700">Unlimited</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">{stats.warningMetrics}</div>
              <div className="text-xs text-yellow-700">Warning</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{stats.criticalMetrics}</div>
              <div className="text-xs text-red-700">Critical</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Metrics by Category */}
      {Object.entries(groupedMetrics).map(([category, categoryMetrics]) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-800 text-sm">
              {category.charAt(0) + category.slice(1).toLowerCase()} Usage
            </h4>
            <Badge className={`${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]} text-xs px-2 py-0.5`}>
              {categoryMetrics.length} metrics
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryMetrics.map(renderMetricCard)}
          </div>
        </div>
      ))}

      {/* Overall Usage Trends */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-900">Usage Overview</CardTitle>
          <CardDescription className="text-xs text-gray-600">
            Your usage patterns for the current billing period
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.reduce((sum, m) => sum + m.currentUsage, 0)}
              </div>
              <div className="text-xs text-gray-600">Total Usage</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(metrics.filter(m => !m.isUnlimited).reduce((sum, m) => sum + getUsagePercentage(m), 0) / metrics.filter(m => !m.isUnlimited).length) || 0}%
              </div>
              <div className="text-xs text-gray-600">Avg. Utilization</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {metrics.filter(m => m.trend.direction === 'UP').length}
              </div>
              <div className="text-xs text-gray-600">Trending Up</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}