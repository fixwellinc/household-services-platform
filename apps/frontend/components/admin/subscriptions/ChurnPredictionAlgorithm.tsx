"use client";

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingDown, 
  Calculator, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label } from '@/components/ui/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shared';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';

interface ChurnFactor {
  id: string;
  name: string;
  description: string;
  weight: number;
  enabled: boolean;
  category: 'behavioral' | 'financial' | 'engagement' | 'support';
}

interface AlgorithmConfig {
  factors: ChurnFactor[];
  thresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  predictionWindow: number; // days
  minimumDataPoints: number;
  enableAutoRetention: boolean;
}

interface AlgorithmPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  lastUpdated: string;
}

export function ChurnPredictionAlgorithm() {
  const [config, setConfig] = useState<AlgorithmConfig | null>(null);
  const [performance, setPerformance] = useState<AlgorithmPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('factors');

  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  const defaultFactors: ChurnFactor[] = [
    {
      id: 'payment_failures',
      name: 'Payment Failures',
      description: 'Number of failed payment attempts in the last 30 days',
      weight: 0.25,
      enabled: true,
      category: 'financial'
    },
    {
      id: 'service_usage',
      name: 'Service Usage Decline',
      description: 'Decrease in service bookings compared to historical average',
      weight: 0.20,
      enabled: true,
      category: 'behavioral'
    },
    {
      id: 'support_tickets',
      name: 'Support Ticket Frequency',
      description: 'Increase in support tickets indicating dissatisfaction',
      weight: 0.15,
      enabled: true,
      category: 'support'
    },
    {
      id: 'login_frequency',
      name: 'Login Frequency',
      description: 'Decrease in platform login frequency',
      weight: 0.10,
      enabled: true,
      category: 'engagement'
    },
    {
      id: 'subscription_age',
      name: 'Subscription Age',
      description: 'Time since subscription started (higher risk in early months)',
      weight: 0.08,
      enabled: true,
      category: 'behavioral'
    },
    {
      id: 'price_sensitivity',
      name: 'Price Sensitivity',
      description: 'Response to price changes and promotional offers',
      weight: 0.07,
      enabled: true,
      category: 'financial'
    },
    {
      id: 'feature_adoption',
      name: 'Feature Adoption',
      description: 'Usage of premium features and benefits',
      weight: 0.06,
      enabled: true,
      category: 'engagement'
    },
    {
      id: 'communication_response',
      name: 'Communication Response',
      description: 'Response rate to marketing emails and notifications',
      weight: 0.05,
      enabled: true,
      category: 'engagement'
    },
    {
      id: 'seasonal_patterns',
      name: 'Seasonal Patterns',
      description: 'Historical churn patterns based on time of year',
      weight: 0.04,
      enabled: false,
      category: 'behavioral'
    }
  ];

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await request('/admin/subscriptions/churn-algorithm/config');
      
      if (response.success) {
        setConfig(response.config);
      } else {
        // Set default config if none exists
        setConfig({
          factors: defaultFactors,
          thresholds: {
            low: 0.3,
            medium: 0.5,
            high: 0.7,
            critical: 0.85
          },
          predictionWindow: 30,
          minimumDataPoints: 10,
          enableAutoRetention: false
        });
      }
    } catch (error) {
      console.error('Error fetching algorithm config:', error);
      setConfig({
        factors: defaultFactors,
        thresholds: {
          low: 0.3,
          medium: 0.5,
          high: 0.7,
          critical: 0.85
        },
        predictionWindow: 30,
        minimumDataPoints: 10,
        enableAutoRetention: false
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async () => {
    try {
      const response = await request('/admin/subscriptions/churn-algorithm/performance');
      
      if (response.success) {
        setPerformance(response.performance);
      }
    } catch (error) {
      console.error('Error fetching algorithm performance:', error);
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    try {
      setSaving(true);
      const response = await request('/admin/subscriptions/churn-algorithm/config', {
        method: 'PUT',
        body: JSON.stringify(config)
      });

      if (response.success) {
        showSuccess('Algorithm configuration saved successfully');
      }
    } catch (error: any) {
      showError(error.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const runAlgorithmTest = async () => {
    try {
      setSaving(true);
      const response = await request('/admin/subscriptions/churn-algorithm/test', {
        method: 'POST'
      });

      if (response.success) {
        showSuccess('Algorithm test completed successfully');
        fetchPerformance();
      }
    } catch (error: any) {
      showError(error.message || 'Failed to run algorithm test');
    } finally {
      setSaving(false);
    }
  };

  const updateFactor = (factorId: string, updates: Partial<ChurnFactor>) => {
    if (!config) return;

    setConfig({
      ...config,
      factors: config.factors.map(factor =>
        factor.id === factorId ? { ...factor, ...updates } : factor
      )
    });
  };

  const updateThreshold = (threshold: keyof AlgorithmConfig['thresholds'], value: number) => {
    if (!config) return;

    setConfig({
      ...config,
      thresholds: {
        ...config.thresholds,
        [threshold]: value
      }
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'behavioral': return 'bg-blue-100 text-blue-800';
      case 'financial': return 'bg-green-100 text-green-800';
      case 'engagement': return 'bg-purple-100 text-purple-800';
      case 'support': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchPerformance();
  }, []);

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading algorithm configuration...</p>
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
          <h2 className="text-xl font-semibold">Churn Prediction Algorithm</h2>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={runAlgorithmTest} disabled={saving}>
            <Calculator className="w-4 h-4 mr-2" />
            Test Algorithm
          </Button>
          <Button onClick={saveConfig} disabled={saving}>
            <Settings className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Config'}
          </Button>
        </div>
      </div>

      {/* Performance Metrics */}
      {performance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(performance.accuracy * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Overall prediction accuracy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Precision</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(performance.precision * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">True positive rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recall</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(performance.recall * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Sensitivity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">F1 Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(performance.f1Score * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Harmonic mean</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="factors" currentValue={activeTab} onValueChange={setActiveTab}>Risk Factors</TabsTrigger>
          <TabsTrigger value="thresholds" currentValue={activeTab} onValueChange={setActiveTab}>Thresholds</TabsTrigger>
          <TabsTrigger value="settings" currentValue={activeTab} onValueChange={setActiveTab}>Settings</TabsTrigger>
          <TabsTrigger value="performance" currentValue={activeTab} onValueChange={setActiveTab}>Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="factors" currentValue={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Factor Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {config.factors.map((factor) => (
                  <div key={factor.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium">{factor.name}</h4>
                          <Badge className={getCategoryColor(factor.category)}>
                            {factor.category}
                          </Badge>
                          <Checkbox
                            checked={factor.enabled}
                            onCheckedChange={(enabled) => updateFactor(factor.id, { enabled: enabled as boolean })}
                          />
                        </div>
                        <p className="text-sm text-gray-600">{factor.description}</p>
                      </div>
                    </div>
                    
                    {factor.enabled && (
                      <div className="mt-4">
                        <Label className="text-sm">Weight: {(factor.weight * 100).toFixed(0)}%</Label>
                        <Input
                          type="range"
                          value={factor.weight}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFactor(factor.id, { weight: parseFloat(e.target.value) })}
                          max={1}
                          min={0}
                          step={0.01}
                          className="mt-2"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="thresholds" currentValue={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Level Thresholds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label className="text-sm">Low Risk Threshold: {(config.thresholds.low * 100).toFixed(0)}%</Label>
                  <Input
                    type="range"
                    value={config.thresholds.low}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateThreshold('low', parseFloat(e.target.value))}
                    max={1}
                    min={0}
                    step={0.01}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-1">Customers below this threshold are considered low risk</p>
                </div>

                <div>
                  <Label className="text-sm">Medium Risk Threshold: {(config.thresholds.medium * 100).toFixed(0)}%</Label>
                  <Input
                    type="range"
                    value={config.thresholds.medium}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateThreshold('medium', parseFloat(e.target.value))}
                    max={1}
                    min={0}
                    step={0.01}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-1">Customers above low but below this threshold are medium risk</p>
                </div>

                <div>
                  <Label className="text-sm">High Risk Threshold: {(config.thresholds.high * 100).toFixed(0)}%</Label>
                  <Input
                    type="range"
                    value={config.thresholds.high}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateThreshold('high', parseFloat(e.target.value))}
                    max={1}
                    min={0}
                    step={0.01}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-1">Customers above medium but below this threshold are high risk</p>
                </div>

                <div>
                  <Label className="text-sm">Critical Risk Threshold: {(config.thresholds.critical * 100).toFixed(0)}%</Label>
                  <Input
                    type="range"
                    value={config.thresholds.critical}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateThreshold('critical', parseFloat(e.target.value))}
                    max={1}
                    min={0}
                    step={0.01}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-1">Customers above this threshold are critical risk</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" currentValue={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Algorithm Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label className="text-sm">Prediction Window: {config.predictionWindow} days</Label>
                  <Input
                    type="range"
                    value={config.predictionWindow}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, predictionWindow: parseInt(e.target.value) })}
                    max={90}
                    min={7}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-1">How far ahead to predict churn risk</p>
                </div>

                <div>
                  <Label className="text-sm">Minimum Data Points: {config.minimumDataPoints}</Label>
                  <Input
                    type="range"
                    value={config.minimumDataPoints}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, minimumDataPoints: parseInt(e.target.value) })}
                    max={50}
                    min={5}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-1">Minimum data points required for prediction</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Enable Auto-Retention Campaigns</Label>
                    <p className="text-xs text-gray-600">Automatically trigger retention campaigns for high-risk customers</p>
                  </div>
                  <Checkbox
                    checked={config.enableAutoRetention}
                    onCheckedChange={(enabled) => setConfig({ ...config, enableAutoRetention: enabled as boolean })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" currentValue={activeTab} className="space-y-4">
          {performance ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Confusion Matrix</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 border border-green-200 rounded">
                      <div className="text-2xl font-bold text-green-600">{performance.truePositives}</div>
                      <div className="text-sm text-green-700">True Positives</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 border border-red-200 rounded">
                      <div className="text-2xl font-bold text-red-600">{performance.falsePositives}</div>
                      <div className="text-sm text-red-700">False Positives</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 border border-red-200 rounded">
                      <div className="text-2xl font-bold text-red-600">{performance.falseNegatives}</div>
                      <div className="text-sm text-red-700">False Negatives</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 border border-green-200 rounded">
                      <div className="text-2xl font-bold text-green-600">{performance.trueNegatives}</div>
                      <div className="text-sm text-green-700">True Negatives</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Last Updated:</span>
                      <span className="font-medium">{new Date(performance.lastUpdated).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Predictions:</span>
                      <span className="font-medium">
                        {performance.truePositives + performance.falsePositives + 
                         performance.trueNegatives + performance.falseNegatives}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Correct Predictions:</span>
                      <span className="font-medium text-green-600">
                        {performance.truePositives + performance.trueNegatives}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Incorrect Predictions:</span>
                      <span className="font-medium text-red-600">
                        {performance.falsePositives + performance.falseNegatives}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No performance data available</p>
                <p className="text-sm text-gray-500 mt-2">Run the algorithm test to generate performance metrics</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}