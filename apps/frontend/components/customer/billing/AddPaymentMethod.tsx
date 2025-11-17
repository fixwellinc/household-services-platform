'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/shared';
import { Button } from '@/components/ui/shared';
import { CreditCard, Loader2 } from 'lucide-react';
import { useAddPaymentMethod } from '@/hooks/use-customer-billing';

interface AddPaymentMethodProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddPaymentMethod({ onSuccess, onCancel }: AddPaymentMethodProps) {
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const addMutation = useAddPaymentMethod();

  // In a real implementation, this would integrate with Stripe Elements
  // For now, this is a placeholder that shows the structure
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentMethodId) {
      alert('Please enter a payment method ID');
      return;
    }

    try {
      await addMutation.mutateAsync(paymentMethodId);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Failed to add payment method:', error);
      alert(error.message || 'Failed to add payment method. Please try again.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Add Payment Method
        </CardTitle>
        <CardDescription>
          Add a new credit or debit card to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* In a real implementation, this would use Stripe Elements */}
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Stripe payment form would be integrated here
            </p>
            <p className="text-xs text-gray-500">
              For now, enter a payment method ID for testing
            </p>
            <input
              type="text"
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
              placeholder="Payment Method ID (for testing)"
              className="mt-4 w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={addMutation.isPending || !paymentMethodId}
              className="flex-1"
            >
              {addMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Payment Method'
              )}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={addMutation.isPending}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

