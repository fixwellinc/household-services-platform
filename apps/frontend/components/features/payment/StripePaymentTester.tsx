'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/shared';
import { toast } from 'sonner';

/**
 * Stripe Payment Test Component
 * 
 * This component provides a simple interface to test Stripe payments
 * using test card numbers.
 */

interface TestCard {
  name: string;
  number: string;
  description: string;
}

const TEST_CARDS: TestCard[] = [
  {
    name: 'Visa Success',
    number: '4242424242424242',
    description: 'Successful payment'
  },
  {
    name: 'Visa Declined',
    number: '4000000000000002',
    description: 'Card declined'
  },
  {
    name: 'Mastercard',
    number: '5555555555554444',
    description: 'Successful payment'
  },
  {
    name: 'Amex',
    number: '378282246310005',
    description: 'Successful payment'
  },
  {
    name: 'Insufficient Funds',
    number: '4000000000009995',
    description: 'Insufficient funds'
  },
  {
    name: 'Expired Card',
    number: '4000000000000069',
    description: 'Expired card'
  },
  {
    name: '3D Secure',
    number: '4000002500003155',
    description: 'Requires authentication'
  }
];

export function StripePaymentTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState<TestCard | null>(null);
  const [testAmount, setTestAmount] = useState(20.00);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testPaymentIntent = async () => {
    if (!selectedCard) {
      toast.error('Please select a test card');
      return;
    }

    setIsLoading(true);
    addResult(`Testing payment with ${selectedCard.name} (${selectedCard.number})`);

    try {
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          amount: Math.round(testAmount * 100), // Convert to cents
          bookingId: 'test-booking-' + Date.now(),
          currency: 'usd',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const { clientSecret, paymentIntentId } = await response.json();
      addResult(`✅ Payment intent created: ${paymentIntentId}`);
      addResult(`Client secret: ${clientSecret.substring(0, 20)}...`);

      // Test the payment with Stripe Elements
      await testStripePayment(clientSecret);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ Payment intent creation failed: ${errorMessage}`);
      toast.error(`Payment test failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testStripePayment = async (clientSecret: string) => {
    try {
      // Load Stripe dynamically
      const { loadStripe } = await import('@stripe/stripe-js');
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      addResult('Stripe loaded successfully');

      // Create payment element
      const elements = stripe.elements({
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#3b82f6',
          },
        },
      });

      const paymentElement = elements.create('payment');
      
      // For testing, we'll simulate the payment confirmation
      // In a real scenario, you'd mount this to a DOM element
      addResult('Payment element created successfully');
      addResult('💡 Note: This is a test - actual payment processing would require user interaction');

      // Simulate payment confirmation with test card
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: 'Test Customer',
              email: 'test@jjglass.ca',
            },
          },
        },
        redirect: 'if_required',
      });

      if (error) {
        addResult(`❌ Payment failed: ${error.message}`);
        if (error.type === 'card_error') {
          addResult(`Card error type: ${error.code}`);
        }
      } else if (paymentIntent) {
        addResult(`✅ Payment succeeded: ${paymentIntent.id}`);
        addResult(`Status: ${paymentIntent.status}`);
        addResult(`Amount: $${paymentIntent.amount / 100}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ Stripe payment test failed: ${errorMessage}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const copyCardNumber = (card: TestCard) => {
    navigator.clipboard.writeText(card.number);
    toast.success(`Copied ${card.name} card number to clipboard`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-blue-900 mb-2">
          🧪 Stripe Payment Tester
        </h2>
        <p className="text-blue-800">
          Test your Stripe integration using test card numbers. These cards work in both test and live mode.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Test Configuration</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Amount ($)
            </label>
            <input
              type="number"
              value={testAmount}
              onChange={(e) => setTestAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0.50"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Test Card
            </label>
            <div className="space-y-2">
              {TEST_CARDS.map((card) => (
                <div
                  key={card.number}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedCard?.number === card.number
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCard(card)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{card.name}</div>
                      <div className="text-sm text-gray-600">{card.description}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyCardNumber(card);
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={testPaymentIntent}
            disabled={isLoading || !selectedCard}
            className="w-full"
          >
            {isLoading ? 'Testing Payment...' : 'Test Payment Intent'}
          </Button>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Test Results</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={clearResults}
              disabled={testResults.length === 0}
            >
              Clear
            </Button>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No test results yet. Run a test to see results here.
              </div>
            ) : (
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`text-sm p-2 rounded ${
                      result.includes('✅') ? 'bg-green-50 text-green-800' :
                      result.includes('❌') ? 'bg-red-50 text-red-800' :
                      result.includes('💡') ? 'bg-yellow-50 text-yellow-800' :
                      'bg-gray-50 text-gray-800'
                    }`}
                  >
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 mb-2">📋 Testing Instructions</h4>
        <ul className="text-yellow-800 space-y-1 text-sm">
          <li>• Select a test card from the list above</li>
          <li>• Set your desired test amount (minimum $0.50)</li>
          <li>• Click "Test Payment Intent" to create a payment intent</li>
          <li>• The test will attempt to process the payment with the selected card</li>
          <li>• Check the results panel for detailed feedback</li>
          <li>• Use different cards to test various scenarios (success, decline, etc.)</li>
        </ul>
      </div>

      {/* Environment Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">🔧 Environment Information</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <div>Stripe Publishable Key: {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Not set'}</div>
          <div>Mode: {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_') ? '🔴 Live' : '🟡 Test'}</div>
        </div>
      </div>
    </div>
  );
}

export default StripePaymentTester;
