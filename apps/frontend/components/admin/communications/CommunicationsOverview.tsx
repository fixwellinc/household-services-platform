"use client";

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  MessageSquare, 
  Bell, 
  TrendingUp, 
  Users, 
  Send, 
  Eye, 
  MousePointer, 
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Filter,
  RefreshCw,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { AdminLoadingState, AdminErrorState } from '../AdminLoadingState';
import { AdminComponentErrorBoundary } from '../error-boundaries/AdminComponentErrorBoundary';
import { AdminStatsSkeleton, AdminChartSkeleton } from '../loading-states';
import { useAdminLoading } from '@/hooks/use-admin-loading';
import { AdminPageLayout } from '../layout/AdminPageLayout';

interface CommunicationStats {
  email: {
    totalSent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
  };
  sms: {
    totalSent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
  };
  push: {
    totalSent: number;
    delivered: number;
    opened: number;
    failed: number;
    deliveryRate: number;
    openRate: number;
  };
  overview: {
    totalCommunications: number;
    activeTemplates: number;
    activeCampaigns: number;
    totalRecipients: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'email' | 'sms' | 'push';
  action: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
  subject: string;
  recipient: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

export function CommunicationsOverview() {
  const [stats, setStats] = useState<CommunicationStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  const { request } = useApi();
  const { showError } = useToast();

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsResponse, activityResponse] = await Promise.all([
        request(`/admin/communications/stats?timeRange=${timeRange}`),
        request(`/admin/communications/activity?limit=20&timeRange=${timeRange}`)
      ]);
      
      if (statsResponse.success) {
        setStats(statsResponse.stats);
      } else {
        throw new Error(statsResponse.error || 'Failed to fetch communication statistics');
      }
      
      if (activityResponse.success) {
        setRecentActivity(activityResponse.activities || []);
      } else {
        throw new Error(activityResponse.error || 'Failed to fetch recent activity');
      }
      
    } catch (error) {
      console.error('Error fetching communications data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
      // Set default empty data
      setStats({
        email: {
          totalSent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0,
          deliveryRate: 0, openRate: 0, clickRate: 0
        },
        sms: { totalSent: 0, delivered: 0, failed: 0, deliveryRate: 0 },
        push: { totalSent: 0, delivered: 0, opened: 0, failed: 0, deliveryRate: 0, openRate: 0 },
        overview: { totalCommunications: 0, activeTemplates: 0, activeCampaigns: 0, totalRecipients: 0 }
      });
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'sent': return <Send className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'opened': return <Eye className="h-4 w-4" />;
      case 'clicked': return <MousePointer className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <AdminLoadingState message="Loading communications overview..." />;
  }

  if (error && !stats) {
    return (
      <AdminErrorState 
        title="Failed to load communications data"
        message={error}
        onRetry={fetchData}
      />
    );
  }

  return (
    <AdminComponentErrorBoundary componentName="CommunicationsOverview">
      <AdminPageLayout
        title="Communications Overview"
        description="Monitor and manage all communication channels"
        actions={
          <div className="flex items-center gap-2">
            <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="w-[120px]">
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </Select>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Overview Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Communications</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.overview.totalCommunications.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Templates</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.overview.activeTemplates || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.overview.activeCampaigns || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Send className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Recipients</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.overview.totalRecipients.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Communication Channels Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4" role="tablist" aria-label="Communication channels">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2"
                role="tab"
                aria-controls="overview-panel"
                aria-selected={activeTab === 'overview'}
              >
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="email" 
                className="flex items-center gap-2"
                role="tab"
                aria-controls="email-panel"
                aria-selected={activeTab === 'email'}
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Email
              </TabsTrigger>
              <TabsTrigger 
                value="sms" 
                className="flex items-center gap-2"
                role="tab"
                aria-controls="sms-panel"
                aria-selected={activeTab === 'sms'}
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                SMS
              </TabsTrigger>
              <TabsTrigger 
                value="push" 
                className="flex items-center gap-2"
                role="tab"
                aria-controls="push-panel"
                aria-selected={activeTab === 'push'}
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                Push Notifications
              </TabsTrigger>
            </TabsList>

            <TabsContent 
              value="overview" 
              className="space-y-4"
              role="tabpanel"
              id="overview-panel"
              aria-labelledby="overview-tab"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Channel Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Channel Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">Email</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{stats?.email.totalSent.toLocaleString() || 0}</p>
                          <p className="text-xs text-gray-500">{stats?.email.deliveryRate.toFixed(1) || 0}% delivered</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">SMS</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{stats?.sms.totalSent.toLocaleString() || 0}</p>
                          <p className="text-xs text-gray-500">{stats?.sms.deliveryRate.toFixed(1) || 0}% delivered</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium">Push</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{stats?.push.totalSent.toLocaleString() || 0}</p>
                          <p className="text-xs text-gray-500">{stats?.push.deliveryRate.toFixed(1) || 0}% delivered</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {recentActivity.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                      ) : (
                        recentActivity.slice(0, 10).map((activity) => (
                          <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(activity.type)}
                              {getActionIcon(activity.action)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{activity.subject}</p>
                              <p className="text-xs text-gray-500 truncate">{activity.recipient}</p>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(activity.status)} variant="secondary">
                                {activity.action}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(activity.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent 
              value="email" 
              className="space-y-4"
              role="tabpanel"
              id="email-panel"
              aria-labelledby="email-tab"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Sent</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats?.email.totalSent.toLocaleString() || 0}
                        </p>
                      </div>
                      <Send className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
                        <p className="text-2xl font-bold text-green-600">
                          {stats?.email.deliveryRate.toFixed(1) || 0}%
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Open Rate</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {stats?.email.openRate.toFixed(1) || 0}%
                        </p>
                      </div>
                      <Eye className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Click Rate</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {stats?.email.clickRate.toFixed(1) || 0}%
                        </p>
                      </div>
                      <MousePointer className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Performance Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Delivered</span>
                        <span className="text-sm font-semibold">{stats?.email.delivered.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Opened</span>
                        <span className="text-sm font-semibold">{stats?.email.opened.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Clicked</span>
                        <span className="text-sm font-semibold">{stats?.email.clicked.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Bounced</span>
                        <span className="text-sm font-semibold text-red-600">{stats?.email.bounced.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Unsubscribed</span>
                        <span className="text-sm font-semibold text-orange-600">{stats?.email.unsubscribed.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start" variant="outline">
                      <Mail className="h-4 w-4 mr-2" />
                      Manage Email Campaigns
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Manage Email Templates
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Email Analytics
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent 
              value="sms" 
              className="space-y-4"
              role="tabpanel"
              id="sms-panel"
              aria-labelledby="sms-tab"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Sent</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats?.sms.totalSent.toLocaleString() || 0}
                        </p>
                      </div>
                      <MessageSquare className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Delivered</p>
                        <p className="text-2xl font-bold text-green-600">
                          {stats?.sms.delivered.toLocaleString() || 0}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
                        <p className="text-2xl font-bold text-green-600">
                          {stats?.sms.deliveryRate.toFixed(1) || 0}%
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>SMS Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Delivered</span>
                        <span className="text-sm font-semibold">{stats?.sms.delivered.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Failed</span>
                        <span className="text-sm font-semibold text-red-600">{stats?.sms.failed.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Manage SMS Templates
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Send className="h-4 w-4 mr-2" />
                      Send Test SMS
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View SMS Analytics
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent 
              value="push" 
              className="space-y-4"
              role="tabpanel"
              id="push-panel"
              aria-labelledby="push-tab"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Sent</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats?.push.totalSent.toLocaleString() || 0}
                        </p>
                      </div>
                      <Bell className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Delivered</p>
                        <p className="text-2xl font-bold text-green-600">
                          {stats?.push.delivered.toLocaleString() || 0}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Opened</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {stats?.push.opened.toLocaleString() || 0}
                        </p>
                      </div>
                      <Eye className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Open Rate</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {stats?.push.openRate.toFixed(1) || 0}%
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Push Notification Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Delivered</span>
                        <span className="text-sm font-semibold">{stats?.push.delivered.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Opened</span>
                        <span className="text-sm font-semibold">{stats?.push.opened.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Failed</span>
                        <span className="text-sm font-semibold text-red-600">{stats?.push.failed.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start" variant="outline">
                      <Bell className="h-4 w-4 mr-2" />
                      Manage Push Templates
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Send className="h-4 w-4 mr-2" />
                      Test Push Notification
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Push Analytics
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </AdminPageLayout>
    </AdminComponentErrorBoundary>
  );
}