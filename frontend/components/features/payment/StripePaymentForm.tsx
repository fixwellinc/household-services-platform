'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Card } from '@/components/ui/shared';
import { toast } from 'sonner';
import { Stripe, StripeElements } from '@stripe/stripe-js';

// Stripe Elements will be loaded dynamically

const paymentSchema = z.object({
  amount: z.number().min(1, 'Amount must be at least $1'),
  currency: z.string().default('usd'),
  description: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface StripePaymentFormProps {
  bookingId?: string;
  amount: number;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function StripePaymentForm({
  bookingId,
  amount,
  onSuccess,
  onError,
  className,
}: StripePaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [elements, setElements] = useState<StripeElements | null>(null);

  const {
    register,
    handleSubmit,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount,
      currency: 'usd',
    },
  });

  // Initialize Stripe
  useState(() => {
    const initStripe = async () => {
      try {
        // Load Stripe dynamically
        const { loadStripe } = await import('@stripe/stripe-js');
        const stripeInstance = await loadStripe(
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
        );

        if (!stripeInstance) {
          throw new Error('Failed to load Stripe');
        }

        setStripe(stripeInstance);
      } catch (error) {
        console.error('Error loading Stripe:', error);
        toast.error('Failed to load payment system');
      }
    };

    initStripe();
  });

  const createPaymentIntent = async (data: PaymentFormData) => {
    try {
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          amount: data.amount,
          bookingId,
          currency: data.currency,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const { clientSecret } = await response.json();
      return clientSecret;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  };

  const handlePayment = async () => {
    if (!stripe || !elements) {
      toast.error('Payment system not ready');
      return;
    }

    setIsLoading(true);

    try {
      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          toast.error(error.message);
        } else {
          toast.error('An unexpected error occurred');
        }
        if (error.message) {
          onError?.(error.message);
        }
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success('Payment successful!');
        onSuccess?.(paymentIntent.id);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      onError?.(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  const setupElements = async (clientSecret: string) => {
    if (!stripe) return;

    const elementsInstance = stripe.elements({
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#3b82f6',
          colorBackground: '#ffffff',
          colorText: '#1f2937',
          colorDanger: '#ef4444',
          fontFamily: 'Inter, system-ui, sans-serif',
          spacingUnit: '4px',
          borderRadius: '8px',
        },
      },
    });

    setElements(elementsInstance);

    const paymentElementInstance = elementsInstance.create('payment');

    // Mount the payment element
    const container = document.getElementById('payment-element');
    if (container) {
      paymentElementInstance.mount(container);
    }
  };

  const onSubmit = async (data: PaymentFormData) => {
    try {
      const clientSecret = await createPaymentIntent(data);
      await setupElements(clientSecret);
      await handlePayment();
    } catch (error) {
      console.error('Payment setup error:', error);
      toast.error('Failed to set up payment');
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Payment Details</h3>
        <p className="text-gray-600">
          Complete your payment to confirm your booking
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Amount Display */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Amount:</span>
            <span className="text-2xl font-bold text-green-600">
              ${amount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Element Container */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Payment Method
          </label>
          <div
            id="payment-element"
            className="border border-gray-300 rounded-lg p-4 min-h-[200px]"
          >
            {!stripe && (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading payment form...</span>
              </div>
            )}
          </div>
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Additional Notes (Optional)
          </label>
          <textarea
            {...register('description')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Any special instructions or notes..."
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading || !stripe}
          className="w-full"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing Payment...
            </div>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </Button>

        {/* Security Notice */}
        <div className="text-xs text-gray-500 text-center">
          🔒 Your payment information is secure and encrypted. We never store your
          card details.
        </div>
      </form>
    </Card>
  );
}

export default StripePaymentForm; 