/**
 * Dashboard Performance Monitor Component
 * 
 * Displays Core Web Vitals and performance metrics for the dashboard
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { Button } from '@/components/ui/shared';
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Download,
  Settings,
  Zap,
  Clock,
  Target
} from 'lucide-react';
import { useCoreWebVitals, usePerformanceScore } from '@/hooks/use-core-web-vitals';

interface PerformanceMonitorProps {
  className?: string;
  showDetails?: boolean;
  onExport?: () => void;
}

export function PerformanceMonitor({ 
  className = '', 
  showDetails = false,
  onExport 
}: PerformanceMonitorProps) {
  const { performanceScore, isLoading, error, refreshMetrics } = useCoreWebVitals();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshMetrics();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'D': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'F': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'needs-improvement': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'poor': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'needs-improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Monitor
          </CardTitle>
          <CardDescription>Loading performance metrics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Performance Monitor
          </CardTitle>
          <CardDescription>Error loading performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-red-600 mb-4">{error.message}</p>
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!performanceScore) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Monitor
          </CardTitle>
          <CardDescription>No performance data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">Performance metrics will appear here once collected</p>
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Monitor
            </CardTitle>
            <CardDescription>Core Web Vitals and performance metrics</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Performance Score */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="text-4xl font-bold text-gray-900">
              {performanceScore.score}
            </div>
            <Badge className={`text-lg px-3 py-1 ${getGradeColor(performanceScore.grade)}`}>
              Grade {performanceScore.grade}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">
            Overall Performance Score
          </p>
        </div>

        {/* Core Web Vitals */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Core Web Vitals
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* LCP */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">LCP</span>
                {getStatusIcon(performanceScore.details.lcp.status)}
              </div>
              <div className="text-lg font-bold text-gray-900">
                {Math.round(performanceScore.details.lcp.value)}ms
              </div>
              <div className={`text-xs ${getStatusColor(performanceScore.details.lcp.status)}`}>
                Largest Contentful Paint
              </div>
            </div>

            {/* FID */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">FID</span>
                {getStatusIcon(performanceScore.details.fid.status)}
              </div>
              <div className="text-lg font-bold text-gray-900">
                {Math.round(performanceScore.details.fid.value)}ms
              </div>
              <div className={`text-xs ${getStatusColor(performanceScore.details.fid.status)}`}>
                First Input Delay
              </div>
            </div>

            {/* CLS */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">CLS</span>
                {getStatusIcon(performanceScore.details.cls.status)}
              </div>
              <div className="text-lg font-bold text-gray-900">
                {performanceScore.details.cls.value.toFixed(3)}
              </div>
              <div className={`text-xs ${getStatusColor(performanceScore.details.cls.status)}`}>
                Cumulative Layout Shift
              </div>
            </div>
          </div>
        </div>

        {/* Performance Recommendations */}
        {showDetails && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Recommendations
            </h4>
            
            <div className="space-y-2">
              {performanceScore.details.lcp.status !== 'good' && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Optimize LCP</p>
                    <p className="text-xs text-yellow-700">
                      Consider optimizing images, reducing server response time, or eliminating render-blocking resources.
                    </p>
                  </div>
                </div>
              )}
              
              {performanceScore.details.fid.status !== 'good' && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Improve FID</p>
                    <p className="text-xs text-yellow-700">
                      Reduce JavaScript execution time, break up long tasks, or optimize third-party scripts.
                    </p>
                  </div>
                </div>
              )}
              
              {performanceScore.details.cls.status !== 'good' && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Reduce CLS</p>
                    <p className="text-xs text-yellow-700">
                      Set size attributes on images and videos, avoid inserting content above existing content.
                    </p>
                  </div>
                </div>
              )}
              
              {performanceScore.grade === 'A' && (
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Excellent Performance</p>
                    <p className="text-xs text-green-700">
                      Your dashboard is performing well across all Core Web Vitals metrics.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PerformanceMonitor;
