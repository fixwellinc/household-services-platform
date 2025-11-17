'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/shared';
import { Badge, Button } from '@/components/ui/shared';
import { 
  Shield, 
  Calendar, 
  DollarSign, 
  Star, 
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerSubscription } from '@/hooks/use-customer-subscription';
import { useCustomerUsage } from '@/hooks/use-customer-usage';
import Link from 'next/link';

interface DashboardOverviewProps {
  onPlanChange?: () => void;
  onCancelSubscription?: () => void;
}

export function DashboardOverview({ 
  onPlanChange, 
  onCancelSubscription 
}: DashboardOverviewProps) {
  const { user } = useAuth();
  const { data: subscription, isLoading: subscriptionLoading } = useCustomerSubscription();
  const { data: usage, isLoading: usageLoading } = useCustomerUsage();

  const isLoading = subscriptionLoading || usageLoading;

  // Get account status
  const getAccountStatus = () => {
    if (!subscription) return { label: 'No Subscription', variant: 'secondary' as const };
    
    switch (subscription.status) {
      case 'ACTIVE':
        return subscription.isPaused 
          ? { label: 'Paused', variant: 'warning' as const }
          : { label: 'Active', variant: 'success' as const };
      case 'PAST_DUE':
        return { label: 'Past Due', variant: 'destructive' as const };
      case 'CANCELLED':
        return { label: 'Cancelled', variant: 'secondary' as const };
      case 'INCOMPLETE':
        return { label: 'Incomplete', variant: 'warning' as const };
      default:
        return { label: subscription.status, variant: 'secondary' as const };
    }
  };

  const accountStatus = getAccountStatus();

  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!subscription?.currentPeriodEnd) return null;
    const endDate = new Date(subscription.currentPeriodEnd);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining();

  // Format next billing date
  const getNextBillingDate = () => {
    if (!subscription?.currentPeriodEnd) return null;
    return new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gray-200 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">
                Welcome back, {user?.name || 'Customer'}!
              </CardTitle>
              <CardDescription className="mt-1">
                Here's an overview of your account and recent activity.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={accountStatus.variant}
                className="text-sm px-3 py-1"
              >
                <Shield className="h-3 w-3 mr-1" />
                {accountStatus.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Services Used</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {usage?.data?.servicesUsed || 0}
                </p>
                {usage?.data?.limits?.maxServices && (
                  <p className="text-xs text-gray-500 mt-1">
                    of {usage.data.limits.maxServices} this period
                  </p>
                )}
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Savings</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  ${(usage?.data?.discountsSaved || 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">From discounts</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Priority Bookings</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {usage?.data?.priorityBookings || 0}
                </p>
                {usage?.data?.limits?.maxPriorityBookings && (
                  <p className="text-xs text-gray-500 mt-1">
                    of {usage.data.limits.maxPriorityBookings} available
                  </p>
                )}
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Emergency Services</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {usage?.data?.emergencyServices || 0}
                </p>
                {usage?.data?.limits?.maxEmergencyServices && (
                  <p className="text-xs text-gray-500 mt-1">
                    of {usage.data.limits.maxEmergencyServices} available
                  </p>
                )}
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <Zap className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Status Card */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Subscription Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Current Plan</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {subscription.tier}
                    </p>
                  </div>
                  <Badge variant={accountStatus.variant}>
                    {subscription.status}
                  </Badge>
                </div>

                {subscription.isPaused && (
                  <div className="flex items-center gap-2 text-amber-600 mb-4">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Subscription is paused</span>
                  </div>
                )}

                {daysRemaining !== null && (
                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      {daysRemaining} days remaining in current period
                    </span>
                  </div>
                )}

                {subscription.nextPaymentAmount && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">
                      Next payment: ${subscription.nextPaymentAmount.toFixed(2)} on {getNextBillingDate()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {onPlanChange && (
                  <Button 
                    onClick={onPlanChange}
                    variant="outline"
                    className="w-full"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Manage Plan
                  </Button>
                )}
                {onCancelSubscription && subscription.status === 'ACTIVE' && !subscription.isPaused && (
                  <Button 
                    onClick={onCancelSubscription}
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Cancel Subscription
                  </Button>
                )}
                <Button 
                  asChild
                  variant="outline"
                  className="w-full"
                >
                  <Link href="/billing">
                    View Billing Details
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Warnings */}
      {usage?.data?.warnings && usage.data.warnings.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="h-5 w-5" />
              Usage Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {usage.data.warnings.map((warning: any, index: number) => (
                <div key={index} className="flex items-start gap-2 text-amber-800">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{warning.message || warning}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

