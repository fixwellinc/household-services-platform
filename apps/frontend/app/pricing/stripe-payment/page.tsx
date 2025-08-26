'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  ArrowLeft,
  Loader2,
  Lock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-api';
import { usePlans } from '@/hooks/use-plans';
import { useSubscriptionPrerequisites } from '@/hooks/use-subscription-prerequisites';
import LocationPromptModal from '@/components/location/LocationPromptModal';

interface StripePaymentPageProps {
  planId: string;
}

const PLAN_ICONS = {
  starter: Star,
  homecare: Crown,
  priority: Sparkles
};

const PLAN_COLORS = {
  starter: 'from-blue-500 to-blue-600',
  homecare: 'from-purple-500 to-purple-600', 
  priority: 'from-amber-500 to-amber-600'
};

function StripePaymentPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get('plan') || 'starter';
  const billingPeriod = searchParams.get('billing') || 'monthly';
  
  const [subscribing, setSubscribing] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedPlanForLocation, setSelectedPlanForLocation] = useState<any>(null);
  
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const { data: plansData, isLoading: plansLoading } = usePlans();
  const prerequisites = useSubscriptionPrerequisites();

  // Get plan details
  const selectedPlan = plansData?.plans?.find((p: any) => p.id === planId) ||
    plansData?.plans?.[0] ||
    {
      id: planId,
      name: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
      description: 'Professional household services',
      monthlyPrice: 29.99,
      yearlyPrice: 299.99,
      originalPrice: 39.99,
      savings: 'Save on household services',
      color: 'blue',
      icon: 'star',
      features: [
        'Professional service providers',
        'Priority booking & scheduling',
        'Quality assurance guarantee',
        'Member-exclusive discounts',
        '24/7 customer support'
      ],
      popular: false,
      stripePriceIds: {
        monthly: `price_monthly_${planId}`,
        yearly: `price_yearly_${planId}`
      }
    };

  // Debug logging
  console.log('🔍 Plans data:', plansData);
  console.log('🔍 Selected plan ID:', planId);
  console.log('🔍 Available plans:', plansData?.plans);
  console.log('🔍 Final selected plan:', selectedPlan);
  console.log('🔍 Stripe price IDs:', selectedPlan.stripePriceIds);

  const PlanIcon = PLAN_ICONS[planId as keyof typeof PLAN_ICONS] || Star;
  const planColor = PLAN_COLORS[planId as keyof typeof PLAN_COLORS] || 'from-blue-500 to-blue-600';

  const getPrice = () => {
    if (billingPeriod === 'yearly') {
      return selectedPlan.yearlyPrice || (selectedPlan.monthlyPrice * 12 * 0.9);
    }
    return selectedPlan.monthlyPrice;
  };

  const getOriginalPrice = () => {
    if (billingPeriod === 'yearly') {
      return selectedPlan.originalPrice ? selectedPlan.originalPrice * 12 : null;
    }
    return selectedPlan.originalPrice;
  };

  const getSavings = () => {
    if (!selectedPlan || !selectedPlan.originalPrice) return null;
    const original = getOriginalPrice();
    const current = getPrice();
    if (original === null || typeof current !== 'number') return null;
    return original - current;
  };

  const handleStripeCheckout = async () => {
    if (!selectedPlan) {
      toast.error('Plan details not found. Please try again.');
      return;
    }

    // Check location before proceeding with subscription
    if (!prerequisites.hasValidLocation) {
      setShowLocationModal(true);
      toast.info('Please verify your location', {
        description: 'We need to confirm you\'re in our BC service area.',
      });
      return;
    }

    setSubscribing(true);
    try {
      // Use proper Stripe price IDs based on environment
      const priceId = billingPeriod === 'yearly' 
        ? selectedPlan.stripePriceIds?.yearly || `price_yearly_${planId}`
        : selectedPlan.stripePriceIds?.monthly || `price_monthly_${planId}`;

      console.log('💳 Creating Stripe checkout session with:', { 
        priceId, 
        tier: planId.toUpperCase(),
        billingPeriod 
      });

      const response = await fetch('/api/payments/create-subscription-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          priceId,
          tier: planId.toUpperCase(),
          successUrl: `${window.location.origin}/pricing/subscribe?success=true&plan=${planId}`,
          cancelUrl: `${window.location.origin}/stripe-payment?plan=${planId}&billing=${billingPeriod}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        console.log('🔄 Redirecting to Stripe Checkout:', data.url);
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Stripe checkout error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start payment process');
      setSubscribing(false);
    }
  };

  // Loading state
  if (userLoading || plansLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/pricing')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Plans
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-lg font-semibold text-gray-900">
              Complete Your Subscription
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Plan Summary Card */}
          <Card className="overflow-hidden mb-8">
            <div className={`bg-gradient-to-r ${planColor} p-8 text-white`}>
              <div className="flex items-center justify-center mb-6">
                <div className="bg-white/20 p-4 rounded-full">
                  <PlanIcon className="h-10 w-10" />
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-3">{selectedPlan.name} Plan</h2>
                <p className="text-white/90 text-lg mb-6">{selectedPlan.description}</p>
                
                {/* Billing Period Display */}
                <div className="bg-white/10 p-2 rounded-lg inline-flex mb-6">
                  <span className="px-4 py-2 text-sm font-medium bg-white text-gray-900 rounded-md">
                    {billingPeriod === 'yearly' ? 'Yearly Billing' : 'Monthly Billing'}
                  </span>
                </div>

                <div className="flex items-baseline justify-center gap-3 mb-3">
                  <span className="text-5xl font-bold">${getPrice()}</span>
                  <span className="text-white/80 text-xl">/{billingPeriod === 'yearly' ? 'year' : 'month'}</span>
                </div>
                
                {getSavings() && (
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <span className="text-xl text-white/60 line-through">
                      ${getOriginalPrice()?.toFixed(2)}
                    </span>
                    <Badge className="bg-red-500 text-white border-0 text-sm px-4 py-2 font-bold">
                      Save ${getSavings()?.toFixed(2)}
                    </Badge>
                  </div>
                )}
                
                {billingPeriod === 'yearly' && (
                  <p className="text-sm text-white/80">
                    Billed annually (${(selectedPlan.monthlyPrice * 0.9).toFixed(2)}/month)
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Payment Form */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Stripe Checkout Section */}
            <Card className="p-6">
              <CardHeader className="text-center pb-4">
                <div className="bg-blue-50 p-3 rounded-full w-fit mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl text-gray-900">
                  Secure Payment
                </CardTitle>
                <p className="text-gray-600">
                  Complete your subscription with secure payment processing
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Security Features */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>256-bit SSL encryption</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Lock className="h-4 w-4 text-green-500" />
                    <span>PCI DSS compliant</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Stripe secure checkout</span>
                  </div>
                </div>

                {/* Payment Button */}
                <Button
                  onClick={handleStripeCheckout}
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
                      Continue to Payment
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    You'll be redirected to Stripe's secure payment page
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Plan Benefits & Features */}
            <Card className="p-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-gray-900">
                  What You'll Get
                </CardTitle>
                <p className="text-gray-600">
                  All the benefits included with your {selectedPlan.name} plan
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Key Benefits */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Professional service providers</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Priority booking & scheduling</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Quality assurance guarantee</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Member-exclusive discounts</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">24/7 customer support</span>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="bg-gray-50 p-4 rounded-lg mt-6">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Start immediately • Full access to all features • Cancel anytime</span>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="border-t pt-4 mt-6">
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <Shield className="h-4 w-4" />
                      <span>Trusted by 1000+ households in BC</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <CheckCircle className="h-4 w-4" />
                      <span>Verified service providers</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Important Notes */}
          <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Important Information:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Your subscription will start immediately after successful payment</li>
                  <li>• You can cancel your subscription at any time</li>
                  <li>• All charges are processed securely through Stripe</li>
                  <li>• You'll receive a confirmation email with your subscription details</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Location Prompt Modal */}
      <LocationPromptModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSet={() => {
          setShowLocationModal(false);
          // After location is set, automatically proceed with payment
          setTimeout(() => {
            handleStripeCheckout();
          }, 500);
        }}
        planName={selectedPlan?.name}
      />
    </div>
  );
}

export default function StripePaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading payment details...</p>
        </div>
      </div>
    }>
      <StripePaymentPageContent />
    </Suspense>
  );
}
