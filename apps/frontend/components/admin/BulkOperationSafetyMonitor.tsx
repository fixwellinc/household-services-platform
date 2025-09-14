'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database,
  Activity,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface SafetyMetrics {
  rateLimitStatus: {
    currentWindow: number;
    windowDuration: number;
    limits: Record<string, number>;
  };
  safetyFeatures: {
    rateLimitingEnabled: boolean;
    batchProcessingEnabled: boolean;
    rollbackSupported: boolean;
    auditLoggingEnabled: boolean;
    additionalAuthRequired: boolean;
    adminProtectionEnabled: boolean;
  };
  recentActivity: {
    totalOperationsToday: number;
    failedOperationsToday: number;
    averageSuccessRate: number;
    mostCommonErrors: Array<{ error: string; count: number }>;
  };
}

export function BulkOperationSafetyMonitor() {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['bulk-operations', 'safety-metrics'],
    queryFn: async (): Promise<SafetyMetrics> => {
      const response = await fetch('/api/bulk-operations/safety-metrics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch safety metrics');
      }

      const data = await response.json();
      return data.metrics;
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Safety Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading safety metrics...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Safety Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-600">
            Failed to load safety metrics
          </div>
        </CardContent>
      </Card>
    );
  }

  const successRate = metrics.recentActivity.averageSuccessRate;
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSuccessRateIcon = (rate: number) => {
    if (rate >= 95) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (rate >= 85) return <Activity className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-4">
      {/* Safety Features Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Safety Features Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              {metrics.safetyFeatures.rateLimitingEnabled ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">Rate Limiting</span>
            </div>
            
            <div className="flex items-center gap-2">
              {metrics.safetyFeatures.batchProcessingEnabled ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">Batch Processing</span>
            </div>
            
            <div className="flex items-center gap-2">
              {metrics.safetyFeatures.rollbackSupported ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">Rollback Support</span>
            </div>
            
            <div className="flex items-center gap-2">
              {metrics.safetyFeatures.auditLoggingEnabled ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">Audit Logging</span>
            </div>
            
            <div className="flex items-center gap-2">
              {metrics.safetyFeatures.additionalAuthRequired ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">Additional Auth</span>
            </div>
            
            <div className="flex items-center gap-2">
              {metrics.safetyFeatures.adminProtectionEnabled ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">Admin Protection</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Rate Limits (per minute)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(metrics.rateLimitStatus.limits).map(([operation, limit]) => (
              <div key={operation} className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{operation}</span>
                <Badge variant="outline">
                  {limit} items/min
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Operations Today</div>
              <div className="text-2xl font-bold">
                {metrics.recentActivity.totalOperationsToday}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Failed Today</div>
              <div className="text-2xl font-bold text-red-600">
                {metrics.recentActivity.failedOperationsToday}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Success Rate</span>
              <div className="flex items-center gap-1">
                {getSuccessRateIcon(successRate)}
                <span className={`text-sm font-medium ${getSuccessRateColor(successRate)}`}>
                  {successRate.toFixed(1)}%
                </span>
              </div>
            </div>
            <Progress value={successRate} className="h-2" />
          </div>

          {metrics.recentActivity.mostCommonErrors.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">Most Common Errors</div>
              <div className="space-y-2">
                {metrics.recentActivity.mostCommonErrors.map((error, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{error.error}</span>
                    <Badge variant="outline" className="text-red-600">
                      {error.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}