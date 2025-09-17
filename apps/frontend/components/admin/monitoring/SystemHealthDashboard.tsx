"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/shared';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  Shield,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';

interface SystemMetric {
  name: string;
  value: string | number;
  status: 'healthy' | 'warning' | 'critical';
  icon: React.ComponentType<any>;
  description: string;
  lastUpdated: Date;
  trend?: 'increasing' | 'decreasing' | 'stable';
  percentage?: number;
}

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
}

interface SystemHealthData {
  timestamp: string;
  responseTime: number;
  status: 'healthy' | 'warning' | 'critical';
  metrics: {
    performance: any;
    memory: any;
    cache: any;
    database: any;
    system: any;
    services: any[];
  };
  alerts: Alert[];
}

export default function SystemHealthDashboard() {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { socket } = useSocket();

  // Fetch system health data
  const fetchHealthData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/admin/monitoring/health', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setHealthData(result.data);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Error fetching health data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    fetchHealthData();
  };

  // Auto-refresh setup
  useEffect(() => {
    fetchHealthData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchHealthData, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Socket.IO real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('system:health-update', (data) => {
        setHealthData(data);
        setLastRefresh(new Date());
      });

      socket.on('system:alert', (alert) => {
        if (healthData) {
          setHealthData(prev => ({
            ...prev!,
            alerts: [alert, ...prev!.alerts]
          }));
        }
      });

      return () => {
        socket.off('system:health-update');
        socket.off('system:alert');
      };
    }
  }, [socket, healthData]);

  // Alert management
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/monitoring/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setHealthData(prev => ({
          ...prev!,
          alerts: prev!.alerts.map(alert => 
            alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert
          )
        }));
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/monitoring/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setHealthData(prev => ({
          ...prev!,
          alerts: prev!.alerts.map(alert => 
            alert.id === alertId ? { ...alert, status: 'resolved' } : alert
          )
        }));
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  // Utility functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'active':
        return 'bg-red-100 text-red-800';
      case 'acknowledged':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="h-3 w-3 text-green-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  if (!healthData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading system health data...</p>
        </div>
      </div>
    );
  }

  const systemMetrics: SystemMetric[] = [
    {
      name: 'API Response Time',
      value: `${healthData.metrics.performance?.averageResponseTime?.toFixed(0) || 0}ms`,
      status: healthData.metrics.performance?.status || 'healthy',
      icon: Clock,
      description: 'Average API response time',
      lastUpdated: new Date(healthData.timestamp),
      trend: healthData.metrics.performance?.trend
    },
    {
      name: 'Memory Usage',
      value: `${healthData.metrics.memory?.percentage || 0}%`,
      status: healthData.metrics.memory?.status || 'healthy',
      icon: MemoryStick,
      description: 'System memory utilization',
      lastUpdated: new Date(healthData.timestamp),
      trend: healthData.metrics.memory?.trend,
      percentage: healthData.metrics.memory?.percentage
    },
    {
      name: 'CPU Usage',
      value: `${healthData.metrics.system?.cpu?.usage || 0}%`,
      status: healthData.metrics.system?.cpu?.status || 'healthy',
      icon: Cpu,
      description: 'CPU utilization across all cores',
      lastUpdated: new Date(healthData.timestamp),
      trend: healthData.metrics.system?.cpu?.trend,
      percentage: healthData.metrics.system?.cpu?.usage
    },
    {
      name: 'Cache Hit Rate',
      value: `${healthData.metrics.cache?.hitRate || 0}%`,
      status: healthData.metrics.cache?.status || 'healthy',
      icon: Database,
      description: 'Cache performance and hit rate',
      lastUpdated: new Date(healthData.timestamp),
      percentage: healthData.metrics.cache?.hitRate
    },
    {
      name: 'Database Health',
      value: healthData.metrics.database?.connected ? 'Connected' : 'Disconnected',
      status: healthData.metrics.database?.status || 'critical',
      icon: Database,
      description: `Connection time: ${healthData.metrics.database?.connectionTime || 0}ms`,
      lastUpdated: new Date(healthData.timestamp)
    },
    {
      name: 'System Uptime',
      value: `${Math.floor((healthData.metrics.system?.uptime || 0) / 3600)}h`,
      status: 'healthy',
      icon: Server,
      description: 'System uptime',
      lastUpdated: new Date(healthData.timestamp)
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Health Monitoring</h1>
          <p className="text-gray-600 mt-1">
            Real-time system performance and health monitoring
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {getStatusIcon(healthData.status)}
              <div>
                <p className="text-xs text-gray-600">System Status</p>
                <p className="text-lg font-semibold capitalize">{healthData.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Active Services</p>
                <p className="text-lg font-semibold">
                  {healthData.metrics.services?.filter(s => s.status === 'healthy').length || 0}/
                  {healthData.metrics.services?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-xs text-gray-600">Active Alerts</p>
                <p className="text-lg font-semibold">
                  {healthData.alerts?.filter(a => a.status === 'active').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Response Time</p>
                <p className="text-lg font-semibold">{healthData.responseTime}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>System Metrics</span>
          </CardTitle>
          <CardDescription>
            Real-time performance metrics and health indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systemMetrics.map((metric) => (
              <div key={metric.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <metric.icon className="h-5 w-5 text-gray-600" />
                    <h4 className="font-medium text-gray-900">{metric.name}</h4>
                  </div>
                  <div className="flex items-center space-x-1">
                    {metric.trend && getTrendIcon(metric.trend)}
                    {getStatusIcon(metric.status)}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
                  {metric.percentage !== undefined && (
                    <Progress value={metric.percentage} className="h-2 mb-2" />
                  )}
                  <Badge className={getStatusColor(metric.status)}>
                    {metric.status}
                  </Badge>
                </div>

                <p className="text-xs text-gray-600 mb-2">{metric.description}</p>

                <div className="text-xs text-gray-500">
                  Last updated: {metric.lastUpdated.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {healthData.alerts && healthData.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Active Alerts</span>
            </CardTitle>
            <CardDescription>
              System alerts and notifications requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {healthData.alerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 ${
                    alert.severity === 'critical' ? 'border-red-200 bg-red-50' :
                    alert.severity === 'high' ? 'border-orange-200 bg-orange-50' :
                    alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium">{alert.title}</h4>
                        <Badge className={getStatusColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(alert.status)}>
                          {alert.status}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{alert.description}</p>
                      <div className="text-xs text-gray-600">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {alert.status === 'active' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Service Status</span>
          </CardTitle>
          <CardDescription>
            Status of all microservices and external dependencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthData.metrics.services?.map((service, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-sm">{service.name}</h5>
                  {getStatusIcon(service.status)}
                </div>
                {service.uptime && (
                  <div className="text-xs text-gray-600 mb-1">
                    Uptime: {service.uptime}
                  </div>
                )}
                {service.responseTime && (
                  <div className="text-xs text-gray-600 mb-1">
                    Response: {service.responseTime}ms
                  </div>
                )}
                <Badge className={`${getStatusColor(service.status)} text-xs`}>
                  {service.status}
                </Badge>
                {service.error && (
                  <div className="text-xs text-red-600 mt-1">{service.error}</div>
                )}
                {service.warning && (
                  <div className="text-xs text-yellow-600 mt-1">{service.warning}</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}