'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3,
  TrendingUp,
  Bell,
  Activity,
  Calendar,
  Settings
} from 'lucide-react';
import { UsageMetrics, UsageTrendsVisualization, UsageAlertsSystem } from './index';
import { apiClient } from '@/lib/api';

interface UsageAnalyticsProps {
  subscription?: {
    id: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    tier: string;
  };
  onUpgradeClick?: (suggestedTier: string) => void;
}

const UsageAnalytics = React.memo(function UsageAnalytics({ 
  subscription, 
  onUpgradeClick 
}: UsageAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('metrics');
  const [currentPeriod, setCurrentPeriod] = useState({
    start: subscription?.currentPeriodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    end: subscription?.currentPeriodEnd || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString()
  });

  useEffect(() => {
    if (subscription) {
      setCurrentPeriod({
        start: subscription.currentPeriodStart,
        end: subscription.currentPeriodEnd
      });
    }
  }, [subscription]);

  const handleExportData = () => {
    // This will be handled by the individual components
    console.log('Export data requested');
  };

  const handleSettingsClick = () => {
    // Navigate to alert settings or open settings modal
    console.log('Settings clicked');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Usage Analytics</h2>
          <p className="text-gray-600 mt-1">
            Track your service usage, trends, and get personalized recommendations
          </p>
          {subscription && (
            <p className="text-sm text-gray-500 mt-1">
              Current billing period: {formatDate(currentPeriod.start)} - {formatDate(currentPeriod.end)}
            </p>
          )}
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Current Metrics
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Usage Trends
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alerts & Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          <UsageMetrics
            currentPeriodStart={currentPeriod.start}
            currentPeriodEnd={currentPeriod.end}
            onExportData={handleExportData}
          />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <UsageTrendsVisualization
            currentPeriodStart={currentPeriod.start}
            currentPeriodEnd={currentPeriod.end}
          />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <UsageAlertsSystem
            onUpgradeClick={onUpgradeClick}
            onSettingsClick={handleSettingsClick}
          />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>
            Common actions based on your usage patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveTab('metrics')}
              className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-left"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">View Current Usage</h4>
                <p className="text-sm text-gray-600">Check your current billing period metrics</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('trends')}
              className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-left"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Analyze Trends</h4>
                <p className="text-sm text-gray-600">Explore historical usage patterns</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-left"
            >
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bell className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Check Alerts</h4>
                <p className="text-sm text-gray-600">Review recommendations and warnings</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default UsageAnalytics;