'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { 
  Star, 
  Crown, 
  Sparkles,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Clock,
  X
} from 'lucide-react';

interface Subscription {
  id: string;
  tier: 'STARTER' | 'HOMECARE' | 'PRIORITY';
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'INCOMPLETE';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  paymentFrequency: 'MONTHLY' | 'YEARLY';
  nextPaymentAmount: number;
  plan: {
    name: string;
    description: string;
    monthlyPrice: number;
    yearlyPrice: number;
    features: string[];
  };
}

interface CurrentPlanCardProps {
  subscription: Subscription;
  onPlanChange?: () => void;
  onCancelSubscription?: () => void;
}

const PLAN_ICONS = {
  STARTER: Star,
  HOMECARE: Crown,
  PRIORITY: Sparkles
};

const PLAN_COLORS = {
  STARTER: 'from-blue-500 to-blue-600',
  HOMECARE: 'from-purple-500 to-purple-600', 
  PRIORITY: 'from-amber-500 to-amber-600'
};

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  PAST_DUE: 'bg-red-100 text-red-800 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
  INCOMPLETE: 'bg-yellow-100 text-yellow-800 border-yellow-200'
};

const STATUS_ICONS = {
  ACTIVE: CheckCircle,
  PAST_DUE: AlertTriangle,
  CANCELLED: X,
  INCOMPLETE: Clock
};

export default function CurrentPlanCard({ 
  subscription, 
  onPlanChange, 
  onCancelSubscription 
}: CurrentPlanCardProps) {
  const PlanIcon = PLAN_ICONS[subscription.tier];
  const StatusIcon = STATUS_ICONS[subscription.status];
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(price);
  };

  const getNextBillingDate = () => {
    return formatDate(subscription.currentPeriodEnd);
  };

  const getBillingCycleText = () => {
    return subscription.paymentFrequency === 'YEARLY' ? 'Annual' : 'Monthly';
  };

  const getCurrentPrice = () => {
    return subscription.paymentFrequency === 'YEARLY' 
      ? subscription.plan.yearlyPrice 
      : subscription.plan.monthlyPrice;
  };

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-gradient-to-r ${PLAN_COLORS[subscription.tier]} shadow-lg`}>
              <PlanIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                {subscription.plan.name}
              </CardTitle>
              <CardDescription className="text-gray-600 mt-1">
                {subscription.plan.description}
              </CardDescription>
            </div>
          </div>
          <Badge className={`${STATUS_COLORS[subscription.status]} font-medium px-3 py-1`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {subscription.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Billing Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm text-blue-900">Current Plan</span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-900">
                {formatPrice(getCurrentPrice())}
              </div>
              <div className="text-sm text-blue-700">
                {getBillingCycleText()} billing
              </div>
              {subscription.paymentFrequency === 'YEARLY' && (
                <div className="text-xs text-blue-600">
                  Save {formatPrice((subscription.plan.monthlyPrice * 12) - subscription.plan.yearlyPrice)} per year
                </div>
              )}
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="font-medium text-sm text-green-900">Next Billing</span>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-green-900">
                {getNextBillingDate()}
              </div>
              <div className="text-sm text-green-700">
                {formatPrice(subscription.nextPaymentAmount)}
              </div>
            </div>
          </div>
        </div>

        {/* Billing Period */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-sm text-gray-900">Current Billing Period</span>
          </div>
          <div className="text-sm text-gray-700">
            {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
          </div>
        </div>

        {/* Status-specific Information */}
        {subscription.status === 'PAST_DUE' && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Payment Past Due</h4>
                <p className="text-sm text-red-700 mt-1">
                  Your payment is overdue. Please update your payment method to continue your subscription.
                </p>
              </div>
            </div>
          </div>
        )}

        {subscription.status === 'CANCELLED' && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <X className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Subscription Cancelled</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Your subscription has been cancelled. You'll retain access until {getNextBillingDate()}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Plan Features Preview */}
        <div className="pt-2">
          <h4 className="font-medium text-gray-900 mb-3">Plan Features</h4>
          <div className="grid grid-cols-1 gap-2">
            {subscription.plan.features.slice(0, 3).map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
            {subscription.plan.features.length > 3 && (
              <div className="text-sm text-gray-500 mt-1">
                +{subscription.plan.features.length - 3} more features
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {subscription.status === 'ACTIVE' && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              {onPlanChange && (
                <button
                  onClick={onPlanChange}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-3 sm:py-2 rounded-lg font-medium transition-all duration-200 touch-manipulation active:scale-95"
                >
                  Change Plan
                </button>
              )}
              {onCancelSubscription && (
                <button
                  onClick={onCancelSubscription}
                  className="flex-1 bg-white hover:bg-gray-50 active:bg-gray-100 text-red-600 border border-red-300 px-4 py-3 sm:py-2 rounded-lg font-medium transition-all duration-200 touch-manipulation active:scale-95"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}