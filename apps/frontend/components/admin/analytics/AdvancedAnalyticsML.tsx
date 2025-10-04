"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Target, 
  Users, 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Download, 
  Filter, 
  Search,
  Lightbulb,
  Zap,
  Activity,
  PieChart,
  LineChart,
  BarChart,
  Scatter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { AdminLoadingState, AdminErrorState, AdminChartLoadingState } from '../AdminLoadingState';
import { AdminErrorBoundary } from '../ErrorBoundary';

interface MLInsight {
  id: string;
  type: 'prediction' | 'anomaly' | 'recommendation' | 'pattern';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: 'revenue' | 'users' | 'operations' | 'marketing';
  data: any;
  createdAt: string;
  actionable: boolean;
  action?: string;
}

interface AnalyticsData {
  revenue: {
    total: number;
    growth: number;
    trend: 'up' | 'down' | 'stable';
    predictions: Array<{
      date: string;
      predicted: number;
      confidence: number;
    }>;
  };
  users: {
    total: number;
    active: number;
    churn: number;
    predictions: Array<{
      date: string;
      predicted: number;
      confidence: number;
    }>;
  };
  bookings: {
    total: number;
    completed: number;
    cancelled: number;
    predictions: Array<{
      date: string;
      predicted: number;
      confidence: number;
    }>;
  };
  performance: {
    avgResponseTime: number;
    uptime: number;
    errorRate: number;
    predictions: Array<{
      date: string;
      predicted: number;
      confidence: number;
    }>;
  };
}

interface ChurnPrediction {
  userId: string;
  userName: string;
  email: string;
  churnProbability: number;
  riskFactors: string[];
  lastActivity: string;
  recommendations: string[];
}

interface RevenueForecast {
  period: string;
  predicted: number;
  confidence: number;
  factors: string[];
  scenarios: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
}

export function AdvancedAnalyticsML() {
  const [insights, setInsights] = useState<MLInsight[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [churnPredictions, setChurnPredictions] = useState<ChurnPrediction[]>([]);
  const [revenueForecast, setRevenueForecast] = useState<RevenueForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('insights');
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshInterval, setRefreshInterval] = useState(300); // 5 minutes

  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  // Fetch analytics data
  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  // Auto-refresh setup
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalyticsData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const fetchAnalyticsData = async () => {
    try {
      setError(null);
      
      const [insightsResponse, analyticsResponse, churnResponse, forecastResponse] = await Promise.all([
        request('/admin/analytics/ml/insights'),
        request('/admin/analytics/ml/data'),
        request('/admin/analytics/ml/churn-predictions'),
        request('/admin/analytics/ml/revenue-forecast')
      ]);
      
      if (insightsResponse.success) {
        setInsights(insightsResponse.insights || []);
      }
      
      if (analyticsResponse.success) {
        setAnalyticsData(analyticsResponse.data);
      }
      
      if (churnResponse.success) {
        setChurnPredictions(churnResponse.predictions || []);
      }
      
      if (forecastResponse.success) {
        setRevenueForecast(forecastResponse.forecast || []);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction': return <Target className="h-5 w-5" />;
      case 'anomaly': return <AlertTriangle className="h-5 w-5" />;
      case 'recommendation': return <Lightbulb className="h-5 w-5" />;
      case 'pattern': return <Activity className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'revenue': return 'text-green-600 bg-green-100';
      case 'users': return 'text-blue-600 bg-blue-100';
      case 'operations': return 'text-purple-600 bg-purple-100';
      case 'marketing': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getChurnRiskColor = (probability: number) => {
    if (probability >= 0.8) return 'text-red-600 bg-red-100';
    if (probability >= 0.6) return 'text-orange-600 bg-orange-100';
    if (probability >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  if (loading && !analyticsData) {
    return <AdminLoadingState message="Loading ML analytics..." />;
  }

  if (error) {
    return (
      <AdminErrorState
        title="Failed to load ML analytics"
        message={error}
        onRetry={fetchAnalyticsData}
      />
    );
  }

  return (
    <AdminErrorBoundary context="AdvancedAnalyticsML">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ML-Powered Analytics</h1>
              <p className="text-gray-600">AI insights, predictions, and recommendations</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={fetchAnalyticsData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        {analyticsData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${analyticsData.revenue.total.toLocaleString()}
                    </p>
                    <div className="flex items-center mt-1">
                      {analyticsData.revenue.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm ${
                        analyticsData.revenue.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {analyticsData.revenue.growth}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData.users.active.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {analyticsData.users.churn}% churn rate
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData.bookings.total.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {analyticsData.bookings.completed} completed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Performance</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData.performance.uptime}%
                    </p>
                    <p className="text-sm text-gray-500">
                      {analyticsData.performance.avgResponseTime}ms avg
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="insights">ML Insights</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="churn">Churn Analysis</TabsTrigger>
            <TabsTrigger value="forecast">Revenue Forecast</TabsTrigger>
          </TabsList>

          {/* ML Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {insights.map((insight) => (
                <Card key={insight.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getInsightIcon(insight.type)}
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                      </div>
                      <div className="flex space-x-1">
                        <Badge className={getImpactColor(insight.impact)}>
                          {insight.impact}
                        </Badge>
                        <Badge className={getCategoryColor(insight.category)}>
                          {insight.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-gray-600">{insight.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Confidence:</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${insight.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {Math.round(insight.confidence * 100)}%
                        </span>
                      </div>
                      
                      {insight.actionable && (
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Actionable
                        </Badge>
                      )}
                    </div>
                    
                    {insight.actionable && insight.action && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h4 className="font-semibold text-blue-800 mb-1">Recommended Action</h4>
                        <p className="text-sm text-blue-700">{insight.action}</p>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      Generated {new Date(insight.createdAt).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Revenue Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AdminChartLoadingState />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5" />
                    User Growth Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AdminChartLoadingState />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Booking Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AdminChartLoadingState />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scatter className="h-5 w-5" />
                    Performance Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AdminChartLoadingState />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Churn Analysis Tab */}
          <TabsContent value="churn" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  High-Risk Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {churnPredictions
                    .filter(user => user.churnProbability >= 0.6)
                    .sort((a, b) => b.churnProbability - a.churnProbability)
                    .slice(0, 10)
                    .map((user) => (
                      <div key={user.userId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{user.userName}</h3>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <p className="text-xs text-gray-500">
                              Last activity: {new Date(user.lastActivity).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <Badge className={getChurnRiskColor(user.churnProbability)}>
                            {Math.round(user.churnProbability * 100)}% risk
                          </Badge>
                          <div className="mt-2">
                            <p className="text-xs text-gray-600">Risk factors:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {user.riskFactors.slice(0, 2).map((factor, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {factor}
                                </Badge>
                              ))}
                              {user.riskFactors.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{user.riskFactors.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Forecast Tab */}
          <TabsContent value="forecast" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueForecast.map((forecast, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{forecast.period}</h3>
                        <Badge variant="outline">
                          {Math.round(forecast.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-gray-600">Optimistic</p>
                          <p className="text-lg font-semibold text-green-600">
                            ${forecast.scenarios.optimistic.toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600">Realistic</p>
                          <p className="text-lg font-semibold text-blue-600">
                            ${forecast.scenarios.realistic.toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <p className="text-sm text-gray-600">Pessimistic</p>
                          <p className="text-lg font-semibold text-red-600">
                            ${forecast.scenarios.pessimistic.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Key factors:</p>
                        <div className="flex flex-wrap gap-2">
                          {forecast.factors.map((factor, factorIndex) => (
                            <Badge key={factorIndex} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminErrorBoundary>
  );
}
