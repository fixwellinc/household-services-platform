"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  RefreshCw
} from 'lucide-react';

interface SystemMetric {
  name: string;
  value: string;
  status: 'healthy' | 'warning' | 'critical';
  icon: React.ComponentType<any>;
  description: string;
  lastUpdated: Date;
}

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
}

export default function MonitoringPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const systemMetrics: SystemMetric[] = [
    {
      name: 'API Response Time',
      value: '245ms',
      status: 'healthy',
      icon: Clock,
      description: 'Average API response time over the last 5 minutes',
      lastUpdated: new Date()
    },
    {
      name: 'Database Performance',
      value: '89%',
      status: 'warning',
      icon: Database,
      description: 'Database query performance and connection pool status',
      lastUpdated: new Date()
    },
    {
      name: 'Server CPU Usage',
      value: '34%',
      status: 'healthy',
      icon: Cpu,
      description: 'Current CPU utilization across all server instances',
      lastUpdated: new Date()
    },
    {
      name: 'Memory Usage',
      value: '68%',
      status: 'healthy',
      icon: MemoryStick,
      description: 'System memory utilization',
      lastUpdated: new Date()
    },
    {
      name: 'Disk Space',
      value: '82%',
      status: 'warning',
      icon: HardDrive,
      description: 'Storage utilization across all drives',
      lastUpdated: new Date()
    },
    {
      name: 'Network Status',
      value: '99.9%',
      status: 'healthy',
      icon: Wifi,
      description: 'Network connectivity and bandwidth utilization',
      lastUpdated: new Date()
    }
  ];

  const alerts: Alert[] = [
    {
      id: '1',
      title: 'High Database Load Detected',
      description: 'Database connection pool is experiencing high usage. Consider scaling up.',
      severity: 'medium',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      status: 'active'
    },
    {
      id: '2',
      title: 'Disk Space Warning',
      description: 'Storage utilization is above 80% threshold on primary server.',
      severity: 'high',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      status: 'acknowledged'
    },
    {
      id: '3',
      title: 'SSL Certificate Renewal',
      description: 'SSL certificate expires in 30 days. Schedule renewal.',
      severity: 'low',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'active'
    }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
      setLastRefresh(new Date());
    }, 1000);
  };

  const getStatusIcon = (status: SystemMetric['status']) => {
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

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 p-6">
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
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">System Status</p>
                <p className="text-lg font-semibold text-green-600">Operational</p>
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
                <p className="text-lg font-semibold">12/12</p>
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
                <p className="text-lg font-semibold">3</p>
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
                  {getStatusIcon(metric.status)}
                </div>

                <div className="mb-3">
                  <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                  <Badge className={getStatusColor(metric.status)}>
                    {metric.status}
                  </Badge>
                </div>

                <p className="text-xs text-gray-600">{metric.description}</p>

                <div className="mt-3 text-xs text-gray-500">
                  Last updated: {metric.lastUpdated.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
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
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
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
                      {alert.timestamp.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {alert.status === 'active' && (
                      <Button variant="outline" size="sm">
                        Acknowledge
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      Resolve
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>CPU & Memory Usage</CardTitle>
            <CardDescription>System resource utilization over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Performance Chart Placeholder</p>
                <p className="text-sm text-gray-500">Chart component would be integrated here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Time Trends</CardTitle>
            <CardDescription>API and database response time metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Response Time Chart Placeholder</p>
                <p className="text-sm text-gray-500">Chart component would be integrated here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'API Gateway', status: 'healthy', uptime: '99.9%' },
              { name: 'Authentication Service', status: 'healthy', uptime: '99.8%' },
              { name: 'Payment Processing', status: 'healthy', uptime: '99.7%' },
              { name: 'Email Service', status: 'warning', uptime: '98.5%' },
              { name: 'SMS Gateway', status: 'healthy', uptime: '99.9%' },
              { name: 'File Storage', status: 'healthy', uptime: '99.6%' },
              { name: 'Analytics Engine', status: 'healthy', uptime: '99.4%' },
              { name: 'Background Jobs', status: 'critical', uptime: '95.2%' }
            ].map((service) => (
              <div key={service.name} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-sm">{service.name}</h5>
                  {getStatusIcon(service.status as any)}
                </div>
                <div className="text-xs text-gray-600">
                  Uptime: {service.uptime}
                </div>
                <Badge className={`${getStatusColor(service.status)} text-xs mt-1`}>
                  {service.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}