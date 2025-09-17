'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Button, Badge } from '@/components/ui/shared';
import { 
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  X,
  RefreshCw,
  CreditCard,
  Calendar,
  AlertCircle,
  Info,
  ExternalLink
} from 'lucide-react';

interface SubscriptionStatusProps {
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'INCOMPLETE' | 'PAUSED';
  accessEndDate?: string;
  cancellationDate?: string;
  pausedUntil?: string;
  paymentFailureReason?: string;
  lastPaymentAttempt?: string;
  nextRetryDate?: string;
  onRetryPayment?: () => void;
  onUpdatePaymentMethod?: () => void;
  onReactivateSubscription?: () => void;
  onContactSupport?: () => void;
  isProcessing?: boolean;
}

const STATUS_CONFIG = {
  ACTIVE: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    title: 'Subscription Active',
    description: 'Your subscription is active and all services are available.'
  },
  PAST_DUE: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangle,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    title: 'Payment Past Due',
    description: 'Your payment is overdue. Please update your payment method to continue service.'
  },
  CANCELLED: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: X,
    iconColor: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    title: 'Subscription Cancelled',
    description: 'Your subscription has been cancelled. You can reactivate anytime.'
  },
  INCOMPLETE: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    iconColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    title: 'Payment Incomplete',
    description: 'Your payment requires additional action to complete.'
  },
  PAUSED: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Clock,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    title: 'Subscription Paused',
    description: 'Your subscription is temporarily paused.'
  }
};

export default function SubscriptionStatus({
  status,
  accessEndDate,
  cancellationDate,
  pausedUntil,
  paymentFailureReason,
  lastPaymentAttempt,
  nextRetryDate,
  onRetryPayment,
  onUpdatePaymentMethod,
  onReactivateSubscription,
  onContactSupport,
  isProcessing = false
}: SubscriptionStatusProps) {
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStatusContent = () => {
    switch (status) {
      case 'ACTIVE':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">All systems operational</span>
            </div>
            <div className="text-sm text-green-600">
              Your subscription is active and all features are available. Billing will continue as scheduled.
            </div>
          </div>
        );

      case 'PAST_DUE':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Payment Required</span>
              </div>
              {paymentFailureReason && (
                <div className="text-sm text-red-600">
                  <strong>Reason:</strong> {paymentFailureReason}
                </div>
              )}
              {lastPaymentAttempt && (
                <div className="text-sm text-red-600">
                  <strong>Last attempt:</strong> {formatDateTime(lastPaymentAttempt)}
                </div>
              )}
              {nextRetryDate && (
                <div className="text-sm text-red-600">
                  <strong>Next retry:</strong> {formatDateTime(nextRetryDate)}
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {onRetryPayment && (
                <Button
                  size="sm"
                  onClick={onRetryPayment}
                  disabled={isProcessing}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Payment
                    </>
                  )}
                </Button>
              )}
              {onUpdatePaymentMethod && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onUpdatePaymentMethod}
                  disabled={isProcessing}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Update Payment Method
                </Button>
              )}
            </div>
          </div>
        );

      case 'CANCELLED':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-700">
                <X className="h-4 w-4" />
                <span className="font-medium">Subscription Ended</span>
              </div>
              {cancellationDate && (
                <div className="text-sm text-gray-600">
                  <strong>Cancelled on:</strong> {formatDate(cancellationDate)}
                </div>
              )}
              {accessEndDate && (
                <div className="text-sm text-gray-600">
                  <strong>Access until:</strong> {formatDate(accessEndDate)}
                </div>
              )}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Want to come back?</p>
                  <p>You can reactivate your subscription at any time and pick up where you left off.</p>
                </div>
              </div>
            </div>
            
            {onReactivateSubscription && (
              <Button
                onClick={onReactivateSubscription}
                disabled={isProcessing}
                className="w-full sm:w-auto"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Reactivating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Reactivate Subscription
                  </>
                )}
              </Button>
            )}
          </div>
        );

      case 'INCOMPLETE':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-yellow-700">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Action Required</span>
              </div>
              <div className="text-sm text-yellow-600">
                Your payment requires additional verification or action to complete. This may include:
              </div>
              <ul className="text-sm text-yellow-600 list-disc list-inside ml-4 space-y-1">
                <li>3D Secure authentication</li>
                <li>Bank verification</li>
                <li>Additional payment information</li>
              </ul>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {onUpdatePaymentMethod && (
                <Button
                  size="sm"
                  onClick={onUpdatePaymentMethod}
                  disabled={isProcessing}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Complete Payment
                </Button>
              )}
              {onContactSupport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onContactSupport}
                  disabled={isProcessing}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              )}
            </div>
          </div>
        );

      case 'PAUSED':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-700">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Temporarily Paused</span>
              </div>
              {pausedUntil && (
                <div className="text-sm text-blue-600">
                  <strong>Resumes on:</strong> {formatDate(pausedUntil)}
                </div>
              )}
              <div className="text-sm text-blue-600">
                Your subscription is paused and billing is suspended. You can resume anytime.
              </div>
            </div>
            
            {onReactivateSubscription && (
              <Button
                size="sm"
                onClick={onReactivateSubscription}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Resuming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resume Subscription
                  </>
                )}
              </Button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <Shield className="h-5 w-5 text-blue-600" />
              Subscription Status
            </CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              Current status and any required actions
            </CardDescription>
          </div>
          <Badge className={`${config.color} font-medium px-3 py-1`}>
            <StatusIcon className={`h-3 w-3 mr-1 ${config.iconColor}`} />
            {status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className={`${config.bgColor} ${config.borderColor} border p-4 rounded-lg`}>
          <div className="flex items-start gap-3">
            <StatusIcon className={`h-5 w-5 ${config.iconColor} mt-0.5 flex-shrink-0`} />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-2">{config.title}</h4>
              {renderStatusContent()}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        {(status === 'PAST_DUE' || status === 'INCOMPLETE') && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5" />
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Need Help?</p>
                <p>
                  If you're experiencing payment issues, our support team is here to help. 
                  {onContactSupport && (
                    <button
                      onClick={onContactSupport}
                      className="text-blue-600 hover:text-blue-800 underline ml-1"
                    >
                      Contact support
                    </button>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}