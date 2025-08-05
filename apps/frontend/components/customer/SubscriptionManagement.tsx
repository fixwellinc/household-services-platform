'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { toast } from 'sonner';
import { 
  Check, 
  Star, 
  Crown, 
  Sparkles,
  CreditCard,
  Shield,
  Clock,
  User,
  Calendar,
  DollarSign,
  AlertTriangle,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-api';

interface Subscription {
  id: string;
  tier: string;
  status: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  canCancel: boolean;
  cancellationBlockedReason?: string;
  cancellationBlockedAt?: string;
  plan?: any;
  stripeSubscription?: any;
  usage?: any;
}

interface SubscriptionManagementProps {
  className?: string;
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
  ACTIVE: 'bg-green-100 text-green-800',
  PAST_DUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  INCOMPLETE: 'bg-yellow-100 text-yellow-800'
};

export default function SubscriptionManagement({ className = '' }: SubscriptionManagementProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const { userData, userLoading } = useCurrentUser();

  useEffect(() => {
    if (!userLoading) {
      fetchSubscription();
    }
  }, [userLoading]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/current', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      } else {
        console.error('Failed to fetch subscription');
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    setCancelling(true);
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Subscription cancelled successfully');
        setShowCancelConfirm(false);
        // Refresh subscription data
        await fetchSubscription();
      } else {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPlanIcon = (tier: string) => {
    const IconComponent = PLAN_ICONS[tier as keyof typeof PLAN_ICONS] || Star;
    return <IconComponent className="h-5 w-5" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'PAST_DUE':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'CANCELLED':
        return <X className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading subscription details...</span>
      </div>
    );
  }

  if (!subscription) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Subscription</h3>
            <p className="text-gray-600 mb-6">
              You don't have an active subscription. Subscribe to one of our plans to get started.
            </p>
            <Button asChild>
              <a href="/pricing">View Plans</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Plan Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${PLAN_COLORS[subscription.tier as keyof typeof PLAN_COLORS] || 'from-gray-500 to-gray-600'}`}>
                  {getPlanIcon(subscription.tier)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {subscription.plan?.name || `${subscription.tier} Plan`}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {subscription.plan?.description || 'Subscription plan'}
                  </p>
                </div>
              </div>
              <Badge className={STATUS_COLORS[subscription.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(subscription.status)}
                  {subscription.status}
                </div>
              </Badge>
            </div>

            {/* Billing Period */}
            {subscription.currentPeriodStart && subscription.currentPeriodEnd && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-sm">Billing Period</span>
                </div>
                <div className="text-sm text-gray-600">
                  {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                </div>
              </div>
            )}

            {/* Price Info */}
            {subscription.plan && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-sm">Pricing</span>
                </div>
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">${subscription.plan.monthlyPrice}</span>
                    <span>/month</span>
                  </div>
                  {subscription.plan.yearlyPrice && (
                    <div className="text-xs text-gray-500 mt-1">
                      ${subscription.plan.yearlyPrice}/year (10% discount)
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cancellation Status */}
            {!subscription.canCancel && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Cancellation Blocked</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      {subscription.cancellationBlockedReason || 'Your subscription cannot be cancelled at this time.'}
                    </p>
                    {subscription.cancellationBlockedAt && (
                      <p className="text-xs text-yellow-600 mt-2">
                        Blocked on: {formatDate(subscription.cancellationBlockedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {subscription.canCancel && (
                <Button
                  variant="outline"
                  onClick={() => setShowCancelConfirm(true)}
                  className="flex-1"
                >
                  Cancel Subscription
                </Button>
              )}
              <Button asChild className="flex-1">
                <a href="/pricing">Change Plan</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Summary */}
      {subscription.usage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Usage Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority Bookings */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">Priority Bookings</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold">{subscription.usage.priorityBookingCount || 0}</span>
                  <span className="text-gray-600"> / {subscription.usage.maxPriorityBookings || 0} used</span>
                </div>
              </div>

              {/* Discount Usage */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm">Discount Used</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold">${subscription.usage.discountAmount || 0}</span>
                  <span className="text-gray-600"> / ${subscription.usage.maxDiscountAmount || 0}</span>
                </div>
              </div>

              {/* Free Services */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-sm">Free Services</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold">
                    {subscription.usage.freeServiceUsed ? 'Used' : 'Available'}
                  </span>
                </div>
              </div>

              {/* Emergency Services */}
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-sm">Emergency Services</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold">
                    {subscription.usage.emergencyServiceUsed ? 'Used' : 'Available'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-semibold">Cancel Subscription</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your subscription? You'll lose access to your plan benefits at the end of your current billing period.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
                className="flex-1"
              >
                Keep Subscription
              </Button>
              <Button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Subscription'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 