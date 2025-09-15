"use client";

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  TrendingDown, 
  Users, 
  Mail, 
  Phone,
  Gift,
  Target,
  Brain,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shared';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { PermissionGuard } from '@/hooks/use-permissions';

interface ChurnPrediction {
  id: string;
  userId: string;
  email: string;
  name?: string;
  tier: string;
  churnRiskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  lifetimeValue: number;
  monthsActive: number;
  lastActivity: string;
  predictedChurnDate: string;
  riskFactors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  recommendedActions: Array<{
    action: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
    estimatedImpact: number;
  }>;
}

interface ChurnMetrics {
  totalAtRisk: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  potentialRevenueLoss: number;
  averageRiskScore: number;
  trendsLastMonth: {
    newHighRisk: number;
    improved: number;
    churned: number;
  };
}

interface RetentionCampaign {
  id: string;
  name: string;
  type: 'EMAIL' | 'DISCOUNT' | 'CALL' | 'CREDIT';
  targetRiskLevel: string;
  description: string;
  isActive: boolean;
  successRate: number;
  totalSent: number;
  responses: number;
}

export function ChurnPredictionPanel() {
  const [predictions, setPredictions] = useState<ChurnPrediction[]>([]);
  const [metrics, setMetrics] = useState<ChurnMetrics | null>(null);
  const [campaigns, setCampaigns] = useState<RetentionCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('predictions');

  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  const fetchChurnData = async () => {
    try {
      setLoading(true);
      
      // Fetch churn predictions
      const predictionsResponse = await request(`/admin/subscriptions/churn-predictions?riskLevel=${riskFilter}`);
      if (predictionsResponse.success) {
        setPredictions(predictionsResponse.predictions);
      }

      // Fetch churn metrics
      const metricsResponse = await request('/admin/subscriptions/churn-metrics');
      if (metricsResponse.success) {
        setMetrics(metricsResponse.metrics);
      }

      // Fetch retention campaigns
      const campaignsResponse = await request('/admin/subscriptions/retention-campaigns');
      if (campaignsResponse.success) {
        setCampaigns(campaignsResponse.campaigns);
      }
    } catch (error) {
      console.error('Error fetching churn data:', error);
      showError("Failed to fetch churn prediction data");
    } finally {
      setLoading(false);
    }
  };

  const handleRunRetentionCampaign = async (campaignType: string) => {
    if (selectedCustomers.length === 0) {
      showError('Please select customers to target');
      return;
    }

    try {
      const response = await request('/admin/subscriptions/retention-campaign', {
        method: 'POST',
        body: JSON.stringify({
          type: campaignType,
          customerIds: selectedCustomers
        })
      });

      if (response.success) {
        showSuccess(`Retention campaign launched for ${selectedCustomers.length} customers`);
        setSelectedCustomers([]);
        fetchChurnData();
      }
    } catch (error: any) {
      showError(error.message || 'Failed to launch retention campaign');
    }
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'default';
      default: return 'outline';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL': return 'text-red-600';
      case 'HIGH': return 'text-red-500';
      case 'MEDIUM': return 'text-yellow-600';
      case 'LOW': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  useEffect(() => {
    fetchChurnData();
  }, [riskFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading churn predictions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold">Churn Prediction & Retention</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={riskFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRiskFilter(e.target.value)} className="w-40">
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </Select>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total At Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalAtRisk}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.highRisk} high risk
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potential Revenue Loss</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.potentialRevenueLoss.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                If all high-risk churn
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
              <Target className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(metrics.averageRiskScore * 100).toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">
                Across all customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">+{metrics.trendsLastMonth.newHighRisk}</div>
              <p className="text-xs text-muted-foreground">
                New high-risk customers
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="predictions" currentValue={activeTab} onValueChange={setActiveTab}>Risk Predictions</TabsTrigger>
          <TabsTrigger value="campaigns" currentValue={activeTab} onValueChange={setActiveTab}>Retention Campaigns</TabsTrigger>
          <TabsTrigger value="analytics" currentValue={activeTab} onValueChange={setActiveTab}>Churn Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" currentValue={activeTab} className="space-y-4">
          {/* Bulk Actions */}
          {selectedCustomers.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedCustomers.length} customers selected
                  </span>
                  <div className="flex space-x-2">
                    <PermissionGuard permission="subscriptions.retention">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRunRetentionCampaign('EMAIL')}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRunRetentionCampaign('DISCOUNT')}
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        Offer Discount
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRunRetentionCampaign('CALL')}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Schedule Call
                      </Button>
                    </PermissionGuard>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Predictions List */}
          <div className="space-y-4">
            {predictions.map((prediction) => (
              <Card key={prediction.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(prediction.userId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCustomers(prev => [...prev, prediction.userId]);
                          } else {
                            setSelectedCustomers(prev => prev.filter(id => id !== prediction.userId));
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium">{prediction.email}</h3>
                          <Badge variant={getRiskBadgeVariant(prediction.riskLevel)}>
                            {prediction.riskLevel} ({(prediction.churnRiskScore * 100).toFixed(0)}%)
                          </Badge>
                          <Badge variant="outline">{prediction.tier}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">LTV:</span> ${prediction.lifetimeValue.toFixed(2)}
                          </div>
                          <div>
                            <span className="font-medium">Active:</span> {prediction.monthsActive} months
                          </div>
                          <div>
                            <span className="font-medium">Last Activity:</span> {new Date(prediction.lastActivity).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Predicted Churn:</span> {new Date(prediction.predictedChurnDate).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Risk Factors */}
                        <div className="mb-3">
                          <h4 className="text-sm font-medium mb-2">Risk Factors:</h4>
                          <div className="flex flex-wrap gap-2">
                            {prediction.riskFactors.slice(0, 3).map((factor, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {factor.factor} ({(factor.impact * 100).toFixed(0)}%)
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Recommended Actions */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Recommended Actions:</h4>
                          <div className="space-y-1">
                            {prediction.recommendedActions.slice(0, 2).map((action, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span>{action.action}</span>
                                <Badge variant={
                                  action.priority === 'HIGH' ? 'destructive' :
                                  action.priority === 'MEDIUM' ? 'secondary' :
                                  'default'
                                }>
                                  {action.priority}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {predictions.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No churn predictions available for the selected filter</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="campaigns" currentValue={activeTab}>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <Badge variant={campaign.isActive ? 'default' : 'secondary'}>
                      {campaign.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Type:</span>
                      <p className="font-medium">{campaign.type}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Success Rate:</span>
                      <p className="font-medium">{(campaign.successRate * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Total Sent:</span>
                      <p className="font-medium">{campaign.totalSent}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Responses:</span>
                      <p className="font-medium">{campaign.responses}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">{campaign.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" currentValue={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>Churn Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <TrendingDown className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Advanced churn analytics would be implemented here</p>
                  <p className="text-sm">Including trend analysis, cohort analysis, and predictive modeling</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}