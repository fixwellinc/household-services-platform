'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
  DollarSign
} from 'lucide-react';

interface AppointmentStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  conversionRate: number;
  averageDuration: number;
  peakHours: Array<{
    hour: number;
    count: number;
  }>;
  serviceDistribution: Array<{
    serviceType: string;
    count: number;
    percentage: number;
  }>;
  weeklyTrends: Array<{
    date: string;
    bookings: number;
    completed: number;
  }>;
  customerMetrics: {
    repeatCustomers: number;
    newCustomers: number;
    averageLeadTime: number;
  };
}

export default function AppointmentAnalytics() {
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [selectedServiceType, setSelectedServiceType] = useState('all');

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      // Set date range based on selected period
      const now = new Date();
      let startDate: Date;

      switch (selectedPeriod) {
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      params.append('startDate', startDate.toISOString().split('T')[0]);
      params.append('endDate', now.toISOString().split('T')[0]);

      if (selectedServiceType !== 'all') {
        params.append('serviceType', selectedServiceType);
      }

      const response = await fetch(`/api/admin/availability/appointments/stats?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }

      const data = await response.json();

      if (data.success) {
        // Transform the data to match our interface
        const transformedStats: AppointmentStats = {
          total: data.stats.total || 0,
          pending: data.stats.pending || 0,
          confirmed: data.stats.confirmed || 0,
          completed: data.stats.completed || 0,
          cancelled: data.stats.cancelled || 0,
          conversionRate: data.stats.completed > 0
            ? Math.round((data.stats.completed / data.stats.total) * 100)
            : 0,
          averageDuration: data.stats.averageDuration || 60,
          peakHours: data.stats.peakHours || [],
          serviceDistribution: data.stats.serviceDistribution || [],
          weeklyTrends: data.stats.weeklyTrends || [],
          customerMetrics: {
            repeatCustomers: data.stats.repeatCustomers || 0,
            newCustomers: data.stats.newCustomers || 0,
            averageLeadTime: data.stats.averageLeadTime || 0
          }
        };
        setStats(transformedStats);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');

      // Set mock data for demonstration
      setStats({
        total: 145,
        pending: 12,
        confirmed: 23,
        completed: 98,
        cancelled: 12,
        conversionRate: 68,
        averageDuration: 75,
        peakHours: [
          { hour: 9, count: 15 },
          { hour: 10, count: 22 },
          { hour: 11, count: 18 },
          { hour: 14, count: 25 },
          { hour: 15, count: 20 },
          { hour: 16, count: 16 }
        ],
        serviceDistribution: [
          { serviceType: 'General Consultation', count: 45, percentage: 31 },
          { serviceType: 'Plumbing Assessment', count: 38, percentage: 26 },
          { serviceType: 'HVAC Assessment', count: 32, percentage: 22 },
          { serviceType: 'Electrical Assessment', count: 20, percentage: 14 },
          { serviceType: 'Home Inspection', count: 10, percentage: 7 }
        ],
        weeklyTrends: [
          { date: '2024-01-01', bookings: 12, completed: 8 },
          { date: '2024-01-08', bookings: 15, completed: 12 },
          { date: '2024-01-15', bookings: 18, completed: 14 },
          { date: '2024-01-22', bookings: 22, completed: 18 },
          { date: '2024-01-29', bookings: 16, completed: 13 }
        ],
        customerMetrics: {
          repeatCustomers: 34,
          newCustomers: 67,
          averageLeadTime: 4.2
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod, selectedServiceType]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Calendar className="h-5 w-5 text-blue-500" />;
    }
  };

  const formatLeadTime = (days: number) => {
    if (days < 1) return 'Same day';
    if (days === 1) return '1 day';
    return `${Math.round(days)} days`;
  };

  if (loading && !stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Activity className="h-8 w-8 animate-pulse" />
          <span className="ml-2">Loading analytics...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Appointment Analytics</h2>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="General Consultation">General Consultation</SelectItem>
              <SelectItem value="Plumbing Assessment">Plumbing Assessment</SelectItem>
              <SelectItem value="HVAC Assessment">HVAC Assessment</SelectItem>
              <SelectItem value="Electrical Assessment">Electrical Assessment</SelectItem>
              <SelectItem value="Home Inspection">Home Inspection</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={loadAnalytics} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                {error} - Showing demo data below
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {stats && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completion Rate</p>
                    <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Duration</p>
                    <p className="text-2xl font-bold">{stats.averageDuration}m</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Lead Time</p>
                    <p className="text-2xl font-bold">{formatLeadTime(stats.customerMetrics.averageLeadTime)}</p>
                  </div>
                  <Activity className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon('completed')}
                      <span>Completed</span>
                    </div>
                    <Badge variant="outline">{stats.completed}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon('confirmed')}
                      <span>Confirmed</span>
                    </div>
                    <Badge variant="outline">{stats.confirmed}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon('pending')}
                      <span>Pending</span>
                    </div>
                    <Badge variant="outline">{stats.pending}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon('cancelled')}
                      <span>Cancelled</span>
                    </div>
                    <Badge variant="outline">{stats.cancelled}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customer Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">New Customers</span>
                      <span className="font-medium">{stats.customerMetrics.newCustomers}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(stats.customerMetrics.newCustomers / (stats.customerMetrics.newCustomers + stats.customerMetrics.repeatCustomers)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Repeat Customers</span>
                      <span className="font-medium">{stats.customerMetrics.repeatCustomers}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(stats.customerMetrics.repeatCustomers / (stats.customerMetrics.newCustomers + stats.customerMetrics.repeatCustomers)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Service Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Service Type Popularity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.serviceDistribution.map((service, index) => (
                  <div key={service.serviceType} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{service.serviceType}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{service.count} bookings</span>
                        <Badge variant="outline">{service.percentage}%</Badge>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-green-500' :
                          index === 2 ? 'bg-purple-500' :
                          index === 3 ? 'bg-orange-500' :
                          'bg-gray-500'
                        }`}
                        style={{ width: `${service.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Peak Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Peak Booking Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {stats.peakHours.map((hour) => (
                  <div key={hour.hour} className="text-center">
                    <div className="text-lg font-bold">{hour.hour}:00</div>
                    <div className="text-sm text-gray-600">{hour.count} bookings</div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(hour.count / Math.max(...stats.peakHours.map(h => h.count))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}