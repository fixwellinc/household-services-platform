"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Pause,
  Play,
  XCircle,
  Edit,
  History,
  BarChart3,
  Gift
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shared';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label, Textarea, Select } from '@/components/ui/shared';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { PermissionGuard } from '@/hooks/use-permissions';

interface Subscription {
  id: string;
  userId: string;
  tier: string;
  status: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  createdAt: string;
  updatedAt: string;
  paymentFrequency: string;
  nextPaymentAmount?: number;
  isPaused: boolean;
  pauseStartDate?: string;
  pauseEndDate?: string;
  availableCredits: number;
  loyaltyPoints: number;
  churnRiskScore: number;
  lifetimeValue: number;
  user: {
    id: string;
    email: string;
    name?: string;
    phone?: string;
    createdAt: string;
  };
}

interface SubscriptionHistory {
  id: string;
  action: string;
  details: string;
  performedBy: string;
  performedAt: string;
  metadata?: any;
}

interface SubscriptionAnalytics {
  totalPayments: number;
  totalRevenue: number;
  averageMonthlySpend: number;
  paymentHistory: Array<{
    date: string;
    amount: number;
    status: string;
  }>;
  usageMetrics: {
    servicesBooked: number;
    perksUsed: number;
    supportTickets: number;
  };
}

interface SubscriptionDetailsPanelProps {
  subscription: Subscription;
  onClose: () => void;
  onRefresh: () => void;
  onPause: (subscriptionId: string, reason: string, endDate: Date) => Promise<void>;
  onResume: (subscriptionId: string) => Promise<void>;
  onCancel: (subscriptionId: string, reason: string) => Promise<void>;
}

export function SubscriptionDetailsPanel({
  subscription,
  onClose,
  onRefresh,
  onPause,
  onResume,
  onCancel
}: SubscriptionDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [history, setHistory] = useState<SubscriptionHistory[]>([]);
  const [analytics, setAnalytics] = useState<SubscriptionAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [pauseEndDate, setPauseEndDate] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [modifyData, setModifyData] = useState({
    tier: subscription.tier,
    paymentFrequency: subscription.paymentFrequency,
    credits: subscription.availableCredits.toString()
  });

  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  // Fetch subscription history and analytics
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch history
        const historyResponse = await request(`/api/admin/subscriptions/${subscription.id}/history`);
        if (historyResponse.success) {
          setHistory(historyResponse.history);
        }

        // Fetch analytics
        const analyticsResponse = await request(`/api/admin/subscriptions/${subscription.id}/analytics`);
        if (analyticsResponse.success) {
          setAnalytics(analyticsResponse.analytics);
        }
      } catch (error) {
        console.error('Error fetching subscription details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [subscription.id]);

  const handlePause = async () => {
    if (!pauseReason.trim()) {
      showError('Please provide a reason for pausing the subscription');
      return;
    }

    try {
      const endDate = pauseEndDate ? new Date(pauseEndDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
      await onPause(subscription.id, pauseReason, endDate);
      setShowPauseDialog(false);
      setPauseReason('');
      setPauseEndDate('');
      onRefresh();
    } catch (error) {
      // Error handled in parent component
    }
  };

  const handleResume = async () => {
    try {
      await onResume(subscription.id);
      onRefresh();
    } catch (error) {
      // Error handled in parent component
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      showError('Please provide a reason for cancelling the subscription');
      return;
    }

    try {
      await onCancel(subscription.id, cancelReason);
      setShowCancelDialog(false);
      setCancelReason('');
      onRefresh();
    } catch (error) {
      // Error handled in parent component
    }
  };

  const handleModify = async () => {
    try {
      const response = await request(`/api/admin/subscriptions/${subscription.id}/modify`, {
        method: 'PUT',
        body: JSON.stringify({
          tier: modifyData.tier,
          paymentFrequency: modifyData.paymentFrequency,
          availableCredits: parseFloat(modifyData.credits)
        })
      });

      if (response.success) {
        showSuccess('Subscription modified successfully');
        setShowModifyDialog(false);
        onRefresh();
      }
    } catch (error: any) {
      showError(error.message || 'Failed to modify subscription');
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 0.7) return { level: 'High', color: 'text-red-600', bg: 'bg-red-100' };
    if (score >= 0.4) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'Low', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const risk = getRiskLevel(subscription.churnRiskScore);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Subscription Details</span>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-medium">{subscription.user.email}</p>
                  {subscription.user.name && (
                    <p className="text-sm text-gray-600">{subscription.user.name}</p>
                  )}
                  {subscription.user.phone && (
                    <p className="text-sm text-gray-600">{subscription.user.phone}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Plan Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Plan:</span>
                    <Badge variant="outline">{subscription.tier}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status:</span>
                    <Badge variant={
                      subscription.status === 'ACTIVE' ? 'default' :
                      subscription.status === 'PAUSED' ? 'secondary' :
                      'destructive'
                    }>
                      {subscription.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Billing:</span>
                    <span className="text-sm font-medium">{subscription.paymentFrequency}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Churn Risk:</span>
                    <Badge className={`${risk.bg} ${risk.color}`}>
                      {risk.level} ({(subscription.churnRiskScore * 100).toFixed(0)}%)
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">LTV:</span>
                    <span className="text-sm font-medium">${subscription.lifetimeValue.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Credits:</span>
                    <span className="text-sm font-medium text-green-600">${subscription.availableCredits.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <PermissionGuard permission="subscriptions.update">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModifyDialog(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Modify
              </Button>
            </PermissionGuard>

            <PermissionGuard permission="subscriptions.pause">
              {subscription.isPaused ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResume}
                  className="text-green-600 hover:text-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPauseDialog(true)}
                  className="text-yellow-600 hover:text-yellow-700"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              )}
            </PermissionGuard>

            <PermissionGuard permission="subscriptions.cancel">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelDialog(true)}
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </PermissionGuard>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview" currentValue={activeTab} onValueChange={setActiveTab}>Overview</TabsTrigger>
              <TabsTrigger value="history" currentValue={activeTab} onValueChange={setActiveTab}>History</TabsTrigger>
              <TabsTrigger value="analytics" currentValue={activeTab} onValueChange={setActiveTab}>Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" currentValue={activeTab} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Subscription Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm">{new Date(subscription.createdAt).toLocaleDateString()}</span>
                    </div>
                    {subscription.currentPeriodStart && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Period Start:</span>
                        <span className="text-sm">{new Date(subscription.currentPeriodStart).toLocaleDateString()}</span>
                      </div>
                    )}
                    {subscription.currentPeriodEnd && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Period End:</span>
                        <span className="text-sm">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
                      </div>
                    )}
                    {subscription.isPaused && subscription.pauseEndDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Pause Until:</span>
                        <span className="text-sm text-orange-600">{new Date(subscription.pauseEndDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Payment Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Frequency:</span>
                      <span className="text-sm">{subscription.paymentFrequency}</span>
                    </div>
                    {subscription.nextPaymentAmount && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Next Amount:</span>
                        <span className="text-sm font-medium">${subscription.nextPaymentAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Loyalty Points:</span>
                      <span className="text-sm">{subscription.loyaltyPoints}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" currentValue={activeTab}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <History className="w-4 h-4 mr-2" />
                    Subscription History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-center text-gray-500 py-4">Loading history...</p>
                  ) : history.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No history available</p>
                  ) : (
                    <div className="space-y-3">
                      {history.map((item) => (
                        <div key={item.id} className="border-l-2 border-blue-200 pl-4 pb-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{item.action}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(item.performedAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{item.details}</p>
                          <p className="text-xs text-gray-500">By: {item.performedBy}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" currentValue={activeTab}>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-center text-gray-500 py-4">Loading analytics...</p>
                ) : analytics ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Revenue Metrics</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Total Revenue:</span>
                              <span className="font-medium">${analytics.totalRevenue.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Avg Monthly:</span>
                              <span className="font-medium">${analytics.averageMonthlySpend.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Total Payments:</span>
                              <span className="font-medium">{analytics.totalPayments}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Usage Metrics</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Services Booked:</span>
                              <span className="font-medium">{analytics.usageMetrics.servicesBooked}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Perks Used:</span>
                              <span className="font-medium">{analytics.usageMetrics.perksUsed}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Support Tickets:</span>
                              <span className="font-medium">{analytics.usageMetrics.supportTickets}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Recent Payments</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {analytics.paymentHistory.slice(0, 3).map((payment, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-600">{new Date(payment.date).toLocaleDateString()}</span>
                                <span className={`font-medium ${
                                  payment.status === 'succeeded' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  ${payment.amount.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-gray-500 py-4">No analytics available</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Pause Dialog */}
        <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pause Subscription</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="pauseReason">Reason for pausing</Label>
                <Textarea
                  id="pauseReason"
                  value={pauseReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPauseReason(e.target.value)}
                  placeholder="Enter reason for pausing the subscription..."
                />
              </div>
              <div>
                <Label htmlFor="pauseEndDate">Resume date (optional)</Label>
                <Input
                  id="pauseEndDate"
                  type="date"
                  value={pauseEndDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPauseEndDate(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowPauseDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handlePause}>
                  Pause Subscription
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Subscription</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cancelReason">Reason for cancellation</Label>
                <Textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCancelReason(e.target.value)}
                  placeholder="Enter reason for cancelling the subscription..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleCancel}>
                  Cancel Subscription
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modify Dialog */}
        <Dialog open={showModifyDialog} onOpenChange={setShowModifyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modify Subscription</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tier">Plan Tier</Label>
                <Select value={modifyData.tier} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setModifyData(prev => ({ ...prev, tier: e.target.value }))}>
                  <option value="STARTER">Starter</option>
                  <option value="HOMECARE">Homecare</option>
                  <option value="PRIORITY">Priority</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentFrequency">Payment Frequency</Label>
                <Select value={modifyData.paymentFrequency} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setModifyData(prev => ({ ...prev, paymentFrequency: e.target.value }))}>
                  <option value="WEEKLY">Weekly</option>
                  <option value="BIWEEKLY">Bi-weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="credits">Available Credits</Label>
                <Input
                  id="credits"
                  type="number"
                  step="0.01"
                  value={modifyData.credits}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModifyData(prev => ({ ...prev, credits: e.target.value }))}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowModifyDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleModify}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}