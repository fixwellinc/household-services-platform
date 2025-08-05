'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import SubscribePlanForm from '@/components/customer/SubscribePlanForm';
import { Button } from '@/components/ui/shared';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

function SubscribeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const plan = searchParams.get('plan');
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCanceled, setShowCanceled] = useState(false);

  useEffect(() => {
    if (success === 'true') {
      setShowSuccess(true);
      toast.success('Subscription successful! Welcome to your new plan!');
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
              Welcome to the {plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Premium'} Plan! You can now access all member benefits and book services.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/dashboard/customer')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
              >
                Go to Dashboard
              </Button>
              <Button 
                onClick={() => router.push('/services')}
                variant="outline" 
                className="w-full"
              >
                Browse Services
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
                onClick={() => router.push('/pricing')} 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
              >
                Choose a Plan
              </Button>
              <Button 
                onClick={() => router.push('/dashboard')} 
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
        {/* Back button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/pricing')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Plans
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Subscription</h1>
          <p className="mt-2 text-gray-600">
            {plan ? `Subscribe to the ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan and start enjoying member benefits.` : 'Please select a plan from our pricing page to continue.'}
          </p>
        </div>
        
        {plan ? (
          <SubscribePlanForm planId={plan} />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No plan selected.</p>
            <Button 
              onClick={() => router.push('/pricing')}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Choose a Plan
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-8"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    }>
      <SubscribeContent />
    </Suspense>
  );
} 