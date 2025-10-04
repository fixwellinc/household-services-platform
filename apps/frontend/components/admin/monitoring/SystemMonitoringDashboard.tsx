"use client";

import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Server, 
  Database, 
  Cpu, 
  HardDrive, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings,
  Bell,
  Zap,
  Shield,
  Globe,
  Users,
  Mail,
  CreditCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { AdminLoadingState, AdminErrorState, AdminChartLoadingState } from '../AdminLoadingState';
import { AdminErrorBoundary } from '../ErrorBoundary';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  uptime: number;
  lastCheck: string;
  responseTime: number;
  description: string;
}

interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  service: string;
}

interface PerformanceData {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

export function SystemMonitoringDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  // Fetch monitoring data
  useEffect(() => {
    fetchMonitoringData();
  }, []);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMonitoringData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const fetchMonitoringData = async () => {
    try {
      setError(null);
      
      const [metricsResponse, servicesResponse, alertsResponse, performanceResponse] = await Promise.all([
        request('/admin/monitoring/metrics'),
        request('/admin/monitoring/services'),
        request('/admin/monitoring/alerts'),
        request('/admin/monitoring/performance')
      ]);
      
      if (metricsResponse.success) {
        setMetrics(metricsResponse.metrics);
      }
      
      if (servicesResponse.success) {
        setServices(servicesResponse.services);
      }
      
      if (alertsResponse.success) {
        setAlerts(alertsResponse.alerts);
      }
      
      if (performanceResponse.success) {
        setPerformanceData(performanceResponse.data);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching monitoring data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch monitoring data');
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading && !metrics) {
    return <AdminLoadingState message="Loading system metrics..." />;
  }

  if (error) {
    return (
      <AdminErrorState
        title="Failed to load monitoring data"
        message={error}
        onRetry={fetchMonitoringData}
      />
    );
  }

  return (
    <AdminErrorBoundary context="SystemMonitoringDashboard">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Monitor className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
              <p className="text-gray-600">Real-time system health and performance metrics</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm text-gray-600">
                {autoRefresh ? `Auto-refresh: ${refreshInterval}s` : 'Manual refresh'}
              </span>
            </div>
            
            <Button
              variant="outline"
              onClick={fetchMonitoringData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Activity className="h-4 w-4 mr-2" />
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </Button>
          </div>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Cpu className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">CPU Usage</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics?.cpu.usage.toFixed(1)}%
                  </p>
                  <Progress value={metrics?.cpu.usage || 0} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <HardDrive className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics?.memory.usage.toFixed(1)}%
                  </p>
                  <Progress value={metrics?.memory.usage || 0} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Database className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Disk Usage</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics?.disk.usage.toFixed(1)}%
                  </p>
                  <Progress value={metrics?.disk.usage || 0} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Wifi className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Network</p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatBytes(metrics?.network.bytesIn || 0)}/s
                  </p>
                  <p className="text-xs text-gray-500">In/Out</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.filter(alert => !alert.resolved).slice(0, 5).map((alert) => (
                  <Alert key={alert.id}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <span className="ml-2 font-medium">{alert.title}</span>
                          <span className="ml-2 text-gray-600">{alert.message}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="services" className="space-y-6">
          <TabsList>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="alerts">All Alerts</TabsTrigger>
            <TabsTrigger value="logs">System Logs</TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {services.map((service) => (
                    <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {service.status === 'healthy' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : service.status === 'warning' ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          )}
                          <span className="font-medium">{service.name}</span>
                        </div>
                        <Badge className={getStatusColor(service.status)}>
                          {service.status}
                        </Badge>
                      </div>
                      
                      <div className="text-right text-sm text-gray-600">
                        <div>Uptime: {formatUptime(service.uptime)}</div>
                        <div>Response: {service.responseTime}ms</div>
                        <div>Last check: {new Date(service.lastCheck).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>CPU Usage Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <AdminChartLoadingState />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Memory Usage Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <AdminChartLoadingState />
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Detailed Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">CPU Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Usage:</span>
                        <span>{metrics?.cpu.usage.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cores:</span>
                        <span>{metrics?.cpu.cores}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Load Average:</span>
                        <span>{metrics?.cpu.loadAverage.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Memory Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span>{formatBytes(metrics?.memory.total || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Used:</span>
                        <span>{formatBytes(metrics?.memory.used || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Free:</span>
                        <span>{formatBytes(metrics?.memory.free || 0)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Disk Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span>{formatBytes(metrics?.disk.total || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Used:</span>
                        <span>{formatBytes(metrics?.disk.used || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Free:</span>
                        <span>{formatBytes(metrics?.disk.free || 0)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Network Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Bytes In:</span>
                        <span>{formatBytes(metrics?.network.bytesIn || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bytes Out:</span>
                        <span>{formatBytes(metrics?.network.bytesOut || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Packets In:</span>
                        <span>{metrics?.network.packetsIn.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Packets Out:</span>
                        <span>{metrics?.network.packetsOut.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <div>
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-sm text-gray-600">{alert.message}</div>
                          <div className="text-xs text-gray-500">Service: {alert.service}</div>
                        </div>
                      </div>
                      
                      <div className="text-right text-sm text-gray-600">
                        <div>{new Date(alert.timestamp).toLocaleString()}</div>
                        <Badge variant={alert.resolved ? 'default' : 'destructive'}>
                          {alert.resolved ? 'Resolved' : 'Active'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
                  <div>2024-01-15 10:30:15 [INFO] System monitoring started</div>
                  <div>2024-01-15 10:30:16 [INFO] CPU usage: 45.2%</div>
                  <div>2024-01-15 10:30:17 [INFO] Memory usage: 67.8%</div>
                  <div>2024-01-15 10:30:18 [INFO] Disk usage: 23.4%</div>
                  <div>2024-01-15 10:30:19 [INFO] Network: 1.2MB/s in, 0.8MB/s out</div>
                  <div>2024-01-15 10:30:20 [INFO] All services healthy</div>
                  <div>2024-01-15 10:30:21 [INFO] Database connection: OK</div>
                  <div>2024-01-15 10:30:22 [INFO] Email service: OK</div>
                  <div>2024-01-15 10:30:23 [INFO] Payment service: OK</div>
                  <div>2024-01-15 10:30:24 [INFO] Monitoring cycle completed</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminErrorBoundary>
  );
}
