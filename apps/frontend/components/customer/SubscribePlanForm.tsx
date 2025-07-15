'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/shared';
import { toast } from 'sonner';
import { Loader2, CreditCard, Shield, CheckCircle } from 'lucide-react';

interface SubscribePlanFormProps {
  planId: string;
}

// TODO: Replace with your actual Stripe price IDs
const PLAN_PRICE_IDS: Record<string, string> = {
  basic: 'price_basic_placeholder',    // Replace with your real Stripe price ID
  plus: 'price_plus_placeholder',      // Replace with your real Stripe price ID  
  premier: 'price_premier_placeholder', // Replace with your real Stripe price ID
};

const PLAN_DETAILS: Record<string, { name: string; price: string; features: string[] }> = {
  basic: {
    name: 'Basic',
    price: '$9.99/month',
    features: ['Access to basic services', 'Standard booking system', 'Email support']
  },
  plus: {
    name: 'Plus', 
    price: '$19.99/month',
    features: ['Everything in Basic', 'Priority booking', 'Phone & email support', 'Faster response time']
  },
  premier: {
    name: 'Premier',
    price: '$39.99/month', 
    features: ['Everything in Plus', 'Concierge service', 'Dedicated account manager', '24/7 priority support']
  }
};

export default function SubscribePlanForm({ planId }: SubscribePlanFormProps) {
  const [subscribing, setSubscribing] = useState(false);
  const planDetails = PLAN_DETAILS[planId] || { name: planId, price: 'N/A', features: [] };
  const priceId = PLAN_PRICE_IDS[planId];

  const handleSubscribe = async () => {
    if (!priceId) {
      toast.error('Plan configuration not found. Please contact support.');
      return;
    }

    setSubscribing(true);
    try {
      const response = await fetch('/api/payments/create-subscription-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

  return (
    <div className="bg-white rounded-lg border shadow-lg overflow-hidden">
      {/* Plan Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{planDetails.name} Plan</h2>
            <p className="text-blue-100 mt-1">Subscribe to unlock all features</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{planDetails.price}</div>
            <div className="text-blue-100 text-sm">per month</div>
          </div>
        </div>
      </div>

      {/* Plan Features */}
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-500" />
          What's Included
        </h3>
        <ul className="space-y-3 mb-6">
          {planDetails.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Security Notice */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-gray-900">Secure Payment</h4>
              <p className="text-sm text-gray-600 mt-1">
                Your payment is processed securely by Stripe. You can cancel your subscription anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Subscribe Button */}
        <Button 
          onClick={handleSubscribe} 
          disabled={subscribing} 
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 text-lg"
        >
          {subscribing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5 mr-2" />
              Subscribe to {planDetails.name} Plan
            </>
          )}
        </Button>

        {/* Price ID Notice */}
        {!priceId && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Stripe price ID not configured for {planDetails.name} plan. Please update PLAN_PRICE_IDS in SubscribePlanForm.tsx
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 