"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge, Button } from '@/components/ui/shared';
import { 
  AlertTriangle, 
  TrendingUp, 
  Zap, 
  Clock,
  CheckCircle,
  XCircle,
  ArrowUp
} from 'lucide-react';

interface UsageWarning {
  type: 'APPROACHING_LIMIT' | 'LIMIT_REACHED' | 'UPGRADE_SUGGESTED';
  message: string;
  actionRequired?: boolean;
  suggestedTier?: string;
}

interface UsageWarningsProps {
  warnings: UsageWarning[];
  currentUsage: {
    servicesUsed: number;
    priorityBookings: number;
    emergencyServices: number;
    discountsSaved: number;
  };
  limits: {
    maxPriorityBookings: number;
    maxDiscountAmount: number;
    maxEmergencyServices: number;
  };
  onUpgradeClick?: (suggestedTier: string) => void;
  lastUpdated?: Date;
}

export default function UsageWarnings({
  warnings,
  currentUsage,
  limits,
  onUpgradeClick,
  lastUpdated
}: UsageWarningsProps) {
  const getWarningIcon = (type: UsageWarning['type']) => {
    switch (type) {
      case 'LIMIT_REACHED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'APPROACHING_LIMIT':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'UPGRADE_SUGGESTED':
        return <ArrowUp className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getWarningColor = (type: UsageWarning['type']) => {
    switch (type) {
      case 'LIMIT_REACHED':
        return 'border-red-200 bg-red-50';
      case 'APPROACHING_LIMIT':
        return 'border-yellow-200 bg-yellow-50';
      case 'UPGRADE_SUGGESTED':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getUsagePercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    if (percentage >= 60) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-4">
      {/* Usage Progress Bars */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Usage Tracking
            {lastUpdated && (
              <Badge variant="outline" className="ml-auto text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {lastUpdated.toLocaleTimeString()}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Priority Bookings */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Priority Bookings</span>
                <span className="text-sm text-gray-600">
                  {currentUsage.priorityBookings} / {limits.maxPriorityBookings}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(
                    getUsagePercentage(currentUsage.priorityBookings, limits.maxPriorityBookings)
                  )}`}
                  style={{
                    width: `${getUsagePercentage(currentUsage.priorityBookings, limits.maxPriorityBookings)}%`
                  }}
                />
              </div>
            </div>

            {/* Emergency Services */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Emergency Services</span>
                <span className="text-sm text-gray-600">
                  {currentUsage.emergencyServices} / {limits.maxEmergencyServices}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(
                    getUsagePercentage(currentUsage.emergencyServices, limits.maxEmergencyServices)
                  )}`}
                  style={{
                    width: `${getUsagePercentage(currentUsage.emergencyServices, limits.maxEmergencyServices)}%`
                  }}
                />
              </div>
            </div>

            {/* Discount Savings */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Discount Savings</span>
                <span className="text-sm text-gray-600">
                  ${currentUsage.discountsSaved} / ${limits.maxDiscountAmount}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(
                    getUsagePercentage(currentUsage.discountsSaved, limits.maxDiscountAmount)
                  )}`}
                  style={{
                    width: `${getUsagePercentage(currentUsage.discountsSaved, limits.maxDiscountAmount)}%`
                  }}
                />
              </div>
            </div>

            {/* Total Services */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Total Services Used</span>
                <span className="text-sm text-gray-600">
                  {currentUsage.servicesUsed} this period
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">No limits on total services</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">Active Alerts</h4>
          {warnings.map((warning, index) => (
            <Card key={index} className={`border ${getWarningColor(warning.type)}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {getWarningIcon(warning.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {warning.type === 'LIMIT_REACHED' && 'Usage Limit Reached'}
                      {warning.type === 'APPROACHING_LIMIT' && 'Approaching Usage Limit'}
                      {warning.type === 'UPGRADE_SUGGESTED' && 'Upgrade Recommended'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {warning.message}
                    </p>
                    {warning.actionRequired && warning.suggestedTier && (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          onClick={() => onUpgradeClick?.(warning.suggestedTier!)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Upgrade to {warning.suggestedTier}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Warnings State */}
      {warnings.length === 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">All Good!</h4>
            <p className="text-sm text-gray-600">
              Your usage is within normal limits. No action required.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}