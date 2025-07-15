'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Button } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { usePlans, usePlanStats, formatPrice } from '@/hooks/use-plans';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  BarChart3,
  Eye,
  Edit,
  Settings,
  RefreshCw
} from 'lucide-react';

export default function PlanManagement() {
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'analytics'>('overview');
  const { data: plansData, isLoading: plansLoading, refetch: refetchPlans } = usePlans();
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = usePlanStats();

  const plans = (plansData as any)?.plans || [];
  const stats = (statsData as any)?.stats || [];
  const totalRevenue = (statsData as any)?.totalRevenue || { monthly: 0, yearly: 0 };

  const getPlanStats = (tier: string) => {
    const planStats = stats.filter((stat: any) => stat.tier === tier);
    const active = planStats.find((stat: any) => stat.status === 'ACTIVE');
    const cancelled = planStats.find((stat: any) => stat.status === 'CANCELLED');
    const pending = planStats.find((stat: any) => stat.status === 'PENDING');
    
    return {
      active: active?._count?.id || 0,
      cancelled: cancelled?._count?.id || 0,
      pending: pending?._count?.id || 0,
      total: planStats.reduce((sum: number, stat: any) => sum + stat._count.id, 0)
    };
  };

  const totalSubscriptions = stats.reduce((sum: number, stat: any) => sum + stat._count.id, 0);
  const activeSubscriptions = stats.filter((stat: any) => stat.status === 'ACTIVE')
    .reduce((sum: number, stat: any) => sum + stat._count.id, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plan Management</h1>
          <p className="text-gray-600">Manage subscription plans and view analytics</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              refetchPlans();
              refetchStats();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'plans', label: 'Plans', icon: Settings },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Subscriptions</p>
                    <p className="text-2xl font-bold text-gray-900">{totalSubscriptions}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                    <p className="text-2xl font-bold text-gray-900">{activeSubscriptions}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPrice(totalRevenue.monthly)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Yearly Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPrice(totalRevenue.yearly)}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plan Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Distribution</CardTitle>
              <CardDescription>Current subscription breakdown by plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan: any) => {
                  const planStats = getPlanStats(plan.id.toUpperCase());
                  return (
                    <div key={plan.id} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                        <Badge variant="outline">{planStats.total}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Active</span>
                          <span className="font-medium text-green-600">{planStats.active}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Pending</span>
                          <span className="font-medium text-yellow-600">{planStats.pending}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Cancelled</span>
                          <span className="font-medium text-red-600">{planStats.cancelled}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Monthly Price</span>
                          <span className="font-medium">{formatPrice(plan.monthlyPrice)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Yearly Price</span>
                          <span className="font-medium">{formatPrice(plan.yearlyPrice)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'plans' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plan Configuration</CardTitle>
              <CardDescription>Manage plan details and pricing</CardDescription>
            </CardHeader>
            <CardContent>
              {plansLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {plans.map((plan: any) => (
                    <div key={plan.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                          <p className="text-gray-600">{plan.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Monthly Price</p>
                          <p className="text-lg font-semibold">{formatPrice(plan.monthlyPrice)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Yearly Price</p>
                          <p className="text-lg font-semibold">{formatPrice(plan.yearlyPrice)}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Features ({plan.features.length})</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {plan.features.slice(0, 6).map((feature: string, index: number) => (
                            <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                              {feature}
                            </div>
                          ))}
                          {plan.features.length > 6 && (
                            <div className="text-sm text-gray-500">
                              +{plan.features.length - 6} more features
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Analytics</CardTitle>
              <CardDescription>Detailed subscription metrics and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Analytics dashboard coming soon...</p>
                <p className="text-sm">This will include conversion rates, churn analysis, and revenue trends.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 