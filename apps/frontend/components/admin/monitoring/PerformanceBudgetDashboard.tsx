/**
 * Performance Budget Dashboard
 * Real-time monitoring and visualization of performance budgets
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  HardDrive,
  Globe,
  Clock
} from 'lucide-react';

interface BudgetMetric {
  name: string;
  current: number;
  budget: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  category: 'bundle' | 'metric' | 'asset' | 'network';
}

interface PerformanceBudgetDashboardProps {
  refreshInterval?: number;
}

export const PerformanceBudgetDashboard: React.FC<PerformanceBudgetDashboardProps> = ({
  refreshInterval = 30000
}) => {
  const [metrics, setMetrics] = useState<BudgetMetric[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - in real implementation, this would fetch from performance monitoring service
  const mockMetrics: BudgetMetric[] = [
    // Bundle metrics
    {
      name: 'Main Bundle',
      current: 145,
      budget: 150,
      unit: 'KB',
      status: 'good',
      trend: 'stable',
      category: 'bundle'
    },
    {
      name: 'Vendor Bundle',
      current: 185,
      budget: 200,
      unit: 'KB',
      status: 'good',
      trend: 'down',
      category: 'bundle'
    },
    {
      name: 'Admin Bundle',
      current: 320,
      budget: 300,
      unit: 'KB',
      status: 'warning',
      trend: 'up',
      category: 'bundle'
    },
    {
      name: 'Customer Bundle',
      current: 240,
      budget: 250,
      unit: 'KB',
      status: 'good',
      trend: 'stable',
      category: 'bundle'
    },
    
    // Performance metrics
    {
      name: 'LCP',
      current: 2200,
      budget: 2500,
      unit: 'ms',
      status: 'good',
      trend: 'down',
      category: 'metric'
    },
    {
      name: 'FID',
      current: 85,
      budget: 100,
      unit: 'ms',
      status: 'good',
      trend: 'stable',
      category: 'metric'
    },
    {
      name: 'CLS',
      current: 0.08,
      budget: 0.1,
      unit: '',
      status: 'good',
      trend: 'down',
      category: 'metric'
    },
    {
      name: 'TTFB',
      current: 650,
      budget: 800,
      unit: 'ms',
      status: 'good',
      trend: 'stable',
      category: 'metric'
    },
    
    // Asset metrics
    {
      name: 'Images',
      current: 850,
      budget: 1024,
      unit: 'KB',
      status: 'good',
      trend: 'down',
      category: 'asset'
    },
    {
      name: 'Fonts',
      current: 75,
      budget: 100,
      unit: 'KB',
      status: 'good',
      trend: 'stable',
      category: 'asset'
    },
    
    // Network metrics
    {
      name: 'Total Requests',
      current: 42,
      budget: 50,
      unit: '',
      status: 'good',
      trend: 'stable',
      category: 'network'
    },
    {
      name: 'Transfer Size',
      current: 1.2,
      budget: 2.0,
      unit: 'MB',
      status: 'good',
      trend: 'down',
      category: 'network'
    }
  ];

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMetrics(mockMetrics);
      setLastUpdated(new Date());
      setIsLoading(false);
    };

    fetchMetrics();
    
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-green-500" />;
      default:
        return <div className="h-3 w-3 bg-gray-400 rounded-full" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bundle':
        return <HardDrive className="h-5 w-5 text-blue-600" />;
      case 'metric':
        return <Zap className="h-5 w-5 text-purple-600" />;
      case 'asset':
        return <Activity className="h-5 w-5 text-orange-600" />;
      case 'network':
        return <Globe className="h-5 w-5 text-green-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateUsagePercentage = (current: number, budget: number) => {
    return Math.min((current / budget) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const groupedMetrics = metrics.reduce((acc, metric) => {
    if (!acc[metric.category]) {
      acc[metric.category] = [];
    }
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<string, BudgetMetric[]>);

  const overallStatus = metrics.some(m => m.status === 'critical') ? 'critical' :
                       metrics.some(m => m.status === 'warning') ? 'warning' : 'good';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Budget Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring of performance budgets and metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge className={getStatusBadgeColor(overallStatus)}>
            {getStatusIcon(overallStatus)}
            <span className="ml-1 capitalize">{overallStatus}</span>
          </Badge>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total Metrics</p>
                <p className="text-2xl font-bold">{metrics.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Within Budget</p>
                <p className="text-2xl font-bold text-green-600">
                  {metrics.filter(m => m.status === 'good').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {metrics.filter(m => m.status === 'warning').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">
                  {metrics.filter(m => m.status === 'critical').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics by Category */}
      {Object.entries(groupedMetrics).map(([category, categoryMetrics]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center">
              {getCategoryIcon(category)}
              <span className="ml-2 capitalize">{category} Metrics</span>
            </CardTitle>
            <CardDescription>
              Performance budget monitoring for {category} resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryMetrics.map((metric) => {
                const percentage = calculateUsagePercentage(metric.current, metric.budget);
                
                return (
                  <div key={metric.name} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {getStatusIcon(metric.status)}
                        <span className="ml-2 font-medium">{metric.name}</span>
                      </div>
                      {getTrendIcon(metric.trend)}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current: {metric.current}{metric.unit}</span>
                        <span>Budget: {metric.budget}{metric.unit}</span>
                      </div>
                      
                      <Progress 
                        value={percentage} 
                        className="h-2"
                      />
                      
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{percentage.toFixed(1)}% used</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusBadgeColor(metric.status)}`}
                        >
                          {metric.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Recommendations</CardTitle>
          <CardDescription>
            Suggestions to improve performance and stay within budget
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.filter(m => m.status !== 'good').length === 0 ? (
              <p className="text-green-600">🎉 All metrics are within budget! Great job!</p>
            ) : (
              <>
                {metrics.filter(m => m.status === 'warning' || m.status === 'critical').map((metric) => (
                  <div key={metric.name} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">
                        {metric.name} exceeds budget
                      </p>
                      <p className="text-sm text-yellow-700">
                        Consider implementing lazy loading or code splitting for this {metric.category}.
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};