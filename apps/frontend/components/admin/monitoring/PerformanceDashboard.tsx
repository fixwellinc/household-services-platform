/**
 * Performance monitoring dashboard component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  HardDrive, 
  Cpu, 
  Zap,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface PerformanceMetrics {
  timestamp: number;
  system?: {
    memoryUsage: number;
    cpuUsage: number;
    loadAverage: number;
    uptime: number;
  };
  application?: {
    cacheHitRate: number;
    queueHealth: number;
    errorRate: number;
  };
  alerts: {
    active: number;
    critical: number;
    warnings: number;
  };
  health: number;
}

interface SystemMetric {
  timestamp: number;
  memory: {
    usagePercent: number;
    heap: {
      usagePercent: number;
    };
  };
  cpu: {
    usage: number;
    loadAvg: {
      '1m': number;
      '5m': number;
      '15m': number;
    };
  };
}

export function PerformanceDashboard() {
  const { trackInteraction } = usePerformanceMonitoring('PerformanceDashboard');
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch performance summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['performance', 'summary'],
    queryFn: () => fetch('/api/admin/performance/summary').then(res => res.json()),
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds
  });

  // Fetch system metrics
  const { data: systemMetrics, isLoading: systemLoading } = useQuery({
    queryKey: ['performance', 'system', timeRange],
    queryFn: () => {
      const endTime = Date.now();
      const startTime = endTime - getTimeRangeMs(timeRange);
      return fetch(`/api/admin/performance/metrics/system?startTime=${startTime}&endTime=${endTime}`)
        .then(res => res.json());
    },
    refetchInterval: autoRefresh ? 60000 : false, // Refresh every minute
  });

  // Fetch application metrics
  const { data: appMetrics, isLoading: appLoading } = useQuery({
    queryKey: ['performance', 'application', timeRange],
    queryFn: () => {
      const endTime = Date.now();
      const startTime = endTime - getTimeRangeMs(timeRange);
      return fetch(`/api/admin/performance/metrics/application?startTime=${startTime}&endTime=${endTime}`)
        .then(res => res.json());
    },
    refetchInterval: autoRefresh ? 60000 : false,
  });

  // Fetch active alerts
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['performance', 'alerts'],
    queryFn: () => fetch('/api/admin/performance/alerts').then(res => res.json()),
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const handleRefresh = () => {
    trackInteraction('manual_refresh');
    queryClient.invalidateQueries({ queryKey: ['performance'] });
  };

  const handleExport = async () => {
    trackInteraction('export_data');
    try {
      const response = await fetch(`/api/admin/performance/export?type=all&format=json`);
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-green-600';
    if (health >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBadgeVariant = (health: number) => {
    if (health >= 80) return 'default';
    if (health >= 60) return 'secondary';
    return 'destructive';
  };

  if (summaryLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Monitoring</h1>
          <p className="text-gray-600">System and application performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'text-green-600' : 'text-gray-400'}`} />
            Auto Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getHealthColor(summary?.health || 0)}>
                {summary?.health?.toFixed(0) || 0}%
              </span>
            </div>
            <Badge variant={getHealthBadgeVariant(summary?.health || 0)} className="mt-2">
              {summary?.health >= 80 ? 'Healthy' : summary?.health >= 60 ? 'Degraded' : 'Unhealthy'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.system?.memoryUsage?.toFixed(1) || 0}%
            </div>
            <Progress 
              value={summary?.system?.memoryUsage || 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.system?.cpuUsage?.toFixed(1) || 0}%
            </div>
            <Progress 
              value={summary?.system?.cpuUsage || 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.alerts?.active || 0}
            </div>
            <div className="flex gap-2 mt-2">
              {summary?.alerts?.critical > 0 && (
                <Badge variant="destructive">{summary.alerts.critical} Critical</Badge>
              )}
              {summary?.alerts?.warnings > 0 && (
                <Badge variant="secondary">{summary.alerts.warnings} Warnings</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="system" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="system">System Metrics</TabsTrigger>
            <TabsTrigger value="application">Application Metrics</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>
        </div>

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Memory Usage Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={systemMetrics?.metrics || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Memory Usage']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="memory.usagePercent" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* CPU Usage Chart */}
            <Card>
              <CardHeader>
                <CardTitle>CPU Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={systemMetrics?.metrics || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'CPU Usage']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cpu.usage" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Load Average Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Load Average</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={systemMetrics?.metrics || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cpu.loadAvg.1m" 
                      stroke="#ff7300" 
                      strokeWidth={2}
                      name="1 minute"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cpu.loadAvg.5m" 
                      stroke="#00ff00" 
                      strokeWidth={2}
                      name="5 minutes"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cpu.loadAvg.15m" 
                      stroke="#0000ff" 
                      strokeWidth={2}
                      name="15 minutes"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Heap Usage Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Heap Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={systemMetrics?.metrics || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Heap Usage']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="memory.heap.usagePercent" 
                      stroke="#ff6b6b" 
                      fill="#ff6b6b" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="application" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cache Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Cache Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Hit Rate</span>
                    <span className="font-bold">
                      {summary?.application?.cacheHitRate?.toFixed(1) || 0}%
                    </span>
                  </div>
                  <Progress value={summary?.application?.cacheHitRate || 0} />
                </div>
              </CardContent>
            </Card>

            {/* Queue Health */}
            <Card>
              <CardHeader>
                <CardTitle>Queue Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Overall Health</span>
                    <span className="font-bold">
                      {summary?.application?.queueHealth?.toFixed(1) || 0}%
                    </span>
                  </div>
                  <Progress value={summary?.application?.queueHealth || 0} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : alerts && alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map((alert: any, index: number) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border ${
                        alert.severity === 'critical' 
                          ? 'border-red-200 bg-red-50' 
                          : alert.severity === 'error'
                          ? 'border-orange-200 bg-orange-50'
                          : 'border-yellow-200 bg-yellow-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`h-4 w-4 ${
                            alert.severity === 'critical' 
                              ? 'text-red-600' 
                              : alert.severity === 'error'
                              ? 'text-orange-600'
                              : 'text-yellow-600'
                          }`} />
                          <span className="font-medium">{alert.message}</span>
                        </div>
                        <Badge variant={
                          alert.severity === 'critical' 
                            ? 'destructive' 
                            : alert.severity === 'error'
                            ? 'destructive'
                            : 'secondary'
                        }>
                          {alert.severity}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <div>First seen: {new Date(alert.firstSeen).toLocaleString()}</div>
                        <div>Last seen: {new Date(alert.lastSeen).toLocaleString()}</div>
                        <div>Count: {alert.count}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No active alerts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getTimeRangeMs(range: string): number {
  switch (range) {
    case '1h': return 60 * 60 * 1000;
    case '6h': return 6 * 60 * 60 * 1000;
    case '24h': return 24 * 60 * 60 * 1000;
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    default: return 60 * 60 * 1000;
  }
}