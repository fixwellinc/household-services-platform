'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import SubscribePlanForm from '@/components/customer/SubscribePlanForm';
import { Button } from '@/components/ui/shared';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BookServicePage() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCanceled, setShowCanceled] = useState(false);

  useEffect(() => {
    if (success === 'true') {
      setShowSuccess(true);
      toast.success('Subscription successful! You can now book services.');
    } else if (canceled === 'true') {
      setShowCanceled(true);
      toast.error('Subscription was canceled.');
    }
  }, [success, canceled]);

  if (showSuccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg border shadow-lg p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscription Successful!</h1>
            <p className="text-gray-600 mb-6">
              Welcome to the {plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Premium'} Plan! You can now book services and enjoy all the benefits.
            </p>
            <div className="space-y-3">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                Start Booking Services
              </Button>
              <Button variant="outline" className="w-full">
                View Your Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showCanceled) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg border shadow-lg p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscription Canceled</h1>
            <p className="text-gray-600 mb-6">
              Your subscription was not completed. You can try again or choose a different plan.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = '/pricing'} 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
              >
                Choose a Plan
              </Button>
              <Button 
                onClick={() => window.location.href = '/dashboard'} 
                variant="outline" 
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Subscribe to a Plan</h1>
          <p className="mt-2 text-gray-600">
            {plan ? `Subscribe to the ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan to unlock bookings.` : 'Please select a plan from the pricing page to continue.'}
          </p>
        </div>
        {plan ? <SubscribePlanForm planId={plan} /> : <div className="text-center text-gray-500">No plan selected.</div>}
      </div>
    </div>
  );
} 