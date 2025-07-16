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
  LogIn,
  UserPlus,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-api';
import { usePlans } from '@/hooks/use-plans';
import Link from 'next/link';

interface SubscribePlanFormProps {
  planId: string;
}

const PLAN_ICONS = {
  basic: Star,
  plus: Crown,
  premier: Sparkles
};

const PLAN_COLORS = {
  basic: 'from-blue-500 to-blue-600',
  plus: 'from-purple-500 to-purple-600', 
  premier: 'from-amber-500 to-amber-600'
};

export default function SubscribePlanForm({ planId }: SubscribePlanFormProps) {
  const [subscribing, setSubscribing] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const { data: plansData, isLoading: plansLoading } = usePlans();

  // Find the selected plan from API data
  const selectedPlan = plansData?.plans?.find((plan: any) => plan.id === planId);
  const PlanIcon = PLAN_ICONS[planId as keyof typeof PLAN_ICONS] || Star;
  const planColor = PLAN_COLORS[planId as keyof typeof PLAN_COLORS] || 'from-blue-500 to-blue-600';

  // Get price based on billing period
  const getPrice = () => {
    if (!selectedPlan) return 'N/A';
    return billingPeriod === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice;
  };

  const getOriginalPrice = () => {
    if (!selectedPlan) return null;
    return billingPeriod === 'yearly' ? (selectedPlan.originalPrice * 12) : selectedPlan.originalPrice;
  };

  const getSavings = () => {
    if (!selectedPlan || !selectedPlan.originalPrice) return null;
    const original = getOriginalPrice();
    const current = getPrice();
    if (original === null || typeof current !== 'number') return null;
    return original - current;
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      toast.error('Plan details not found. Please try again.');
      return;
    }

    setSubscribing(true);
    try {
      const priceId = billingPeriod === 'yearly' 
        ? selectedPlan.stripePriceIds.yearly 
        : selectedPlan.stripePriceIds.monthly;

      const response = await fetch('/api/payments/create-subscription-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          priceId,
          tier: planId.toUpperCase(),
          successUrl: `${window.location.origin}/dashboard/customer/book-service?success=true&plan=${planId}`,
          cancelUrl: `${window.location.origin}/dashboard/customer/book-service?canceled=true&plan=${planId}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start subscription process');
      setSubscribing(false);
    }
  };

  // Loading state
  if (userLoading || plansLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading plan details...</span>
      </div>
    );
  }

  // Plan not found
  if (!selectedPlan) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Plan Not Found</h3>
          <p className="text-gray-600 mb-4">The selected plan could not be found.</p>
          <Link href="/pricing">
            <Button>View All Plans</Button>
          </Link>
        </div>
      </Card>
    );
  }

  // User not authenticated - show login/register options
  if (!userData?.user) {
    return (
      <div className="space-y-6">
        {/* Plan Preview Card */}
        <Card className="overflow-hidden">
          <div className={`bg-gradient-to-r ${planColor} p-6 text-white`}>
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white/20 p-3 rounded-full">
                <PlanIcon className="h-8 w-8" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">{selectedPlan.name} Plan</h2>
              <p className="text-white/90 mb-4">{selectedPlan.description}</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-3xl font-bold">${getPrice()}</span>
                <span className="text-white/80">/{billingPeriod === 'yearly' ? 'year' : 'month'}</span>
              </div>
              {getSavings() && (
                <div className="mt-2">
                  <Badge className="bg-white/20 text-white border-white/30">
                    Save ${getSavings()?.toFixed(2)}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          
          <CardContent className="p-6">
            <div className="space-y-3">
              {selectedPlan.features.slice(0, 5).map((feature: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
              {selectedPlan.features.length > 5 && (
                <div className="text-center pt-2">
                  <span className="text-sm text-gray-500">
                    +{selectedPlan.features.length - 5} more features
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Authentication Required Card */}
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="bg-blue-50 p-3 rounded-full w-fit mx-auto">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Account Required
              </h3>
              <p className="text-gray-600 mb-6">
                Please sign in or create an account to subscribe to the {selectedPlan.name} plan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href={`/login?redirect=${encodeURIComponent(`/dashboard/customer/book-service?plan=${planId}`)}`}>
                <Button variant="outline" className="w-full">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </Link>
              <Link href={`/register?redirect=${encodeURIComponent(`/dashboard/customer/book-service?plan=${planId}`)}`}>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Account
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-500 mt-4">
              <Shield className="h-4 w-4" />
              <span>Secure registration • No setup fees • Cancel anytime</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // User authenticated - show subscription form
  return (
    <div className="space-y-6">
      {/* Plan Details Card */}
      <Card className="overflow-hidden">
        <div className={`bg-gradient-to-r ${planColor} p-6 text-white`}>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/20 p-3 rounded-full">
              <PlanIcon className="h-8 w-8" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{selectedPlan.name} Plan</h2>
            <p className="text-white/90 mb-6">{selectedPlan.description}</p>
            
            {/* Billing Period Toggle */}
            <div className="bg-white/10 p-1 rounded-lg inline-flex mb-6">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'monthly'
                    ? 'bg-white text-gray-900'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'yearly'
                    ? 'bg-white text-gray-900'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Yearly
              </button>
            </div>

            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-4xl font-bold">${getPrice()}</span>
              <span className="text-white/80">/{billingPeriod === 'yearly' ? 'year' : 'month'}</span>
            </div>
            
            {getOriginalPrice() && (
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-lg text-white/60 line-through">
                  ${getOriginalPrice()?.toFixed(2)}
                </span>
                <Badge className="bg-red-500 text-white border-0">
                  Save ${getSavings()?.toFixed(2)}
                </Badge>
              </div>
            )}
            
            {billingPeriod === 'yearly' && (
              <p className="text-sm text-white/80">
                Billed annually (${selectedPlan.monthlyPrice}/month)
              </p>
            )}
          </div>
        </div>
        
        <CardContent className="p-6">
          <div className="space-y-3 mb-6">
            {selectedPlan.features.map((feature: string, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Start immediately • Full access to all features • Cancel anytime</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Action */}
      <Card className="p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Subscribe to {selectedPlan.name}
          </h3>
          <p className="text-gray-600">
            Welcome, {userData.user.name}! Ready to unlock all the benefits?
          </p>
          
          <Button
            onClick={handleSubscribe}
            disabled={subscribing}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 text-lg shadow-lg"
          >
            {subscribing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                Subscribe Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
          
          <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
            <Shield className="h-4 w-4" />
            <span>Secure payment with Stripe • 30-day money-back guarantee</span>
          </div>
        </div>
      </Card>
    </div>
  );
} 