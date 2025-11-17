'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Button, Badge } from '@/components/ui/shared';
import { AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { useCustomerUsage } from '@/hooks/use-customer-usage';
import Link from 'next/link';

export function UsageLimitsCard() {
  const { data: usage, isLoading } = useCustomerUsage();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-48 bg-gray-200 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!usage?.data) {
    return null;
  }

  const limits = usage.data.limits || {};
  const usageData = usage.data;

  const getUsagePercentage = (used: number, max: number) => {
    if (!max || max === 0) return 0;
    return Math.min((used / max) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const usageItems = [
    {
      label: 'Services Used',
      used: usageData.servicesUsed || 0,
      max: limits.maxServices || 100,
      unit: 'services',
    },
    {
      label: 'Discount Savings',
      used: usageData.discountsSaved || 0,
      max: limits.maxDiscountAmount || 200,
      unit: 'dollars',
      isCurrency: true,
    },
    {
      label: 'Priority Bookings',
      used: usageData.priorityBookings || 0,
      max: limits.maxPriorityBookings || 5,
      unit: 'bookings',
    },
    {
      label: 'Emergency Services',
      used: usageData.emergencyServices || 0,
      max: limits.maxEmergencyServices || 1,
      unit: 'services',
    },
  ];

  const needsUpgrade = usageItems.some(
    item => getUsagePercentage(item.used, item.max) >= 75
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Usage Limits</CardTitle>
          {needsUpgrade && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Near Limit
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {usageItems.map((item, index) => {
          const percentage = getUsagePercentage(item.used, item.max);
          const isNearLimit = percentage >= 75;
          const isAtLimit = percentage >= 90;

          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">{item.label}</p>
                  <p className="text-xs text-gray-500">
                    {item.isCurrency 
                      ? `$${item.used.toFixed(2)}` 
                      : item.used} of {item.isCurrency 
                      ? `$${item.max.toFixed(2)}` 
                      : item.max} {item.unit}
                  </p>
                </div>
                <div className="text-right">
                  {isAtLimit ? (
                    <Badge variant="destructive">At Limit</Badge>
                  ) : isNearLimit ? (
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      Near Limit
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      OK
                    </Badge>
                  )}
                </div>
              </div>
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getProgressColor(percentage)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 mt-1 block">
                  {percentage.toFixed(0)}% used
                </span>
              </div>
            </div>
          );
        })}

        {needsUpgrade && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-blue-900 mb-1">
                  Approaching Usage Limits
                </p>
                <p className="text-sm text-blue-700 mb-3">
                  Consider upgrading your plan to get higher limits and more benefits.
                </p>
                <Button asChild size="sm">
                  <Link href="/pricing">
                    View Plans
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

