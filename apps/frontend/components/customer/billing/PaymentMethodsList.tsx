'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Button, Badge } from '@/components/ui/shared';
import { CreditCard, Trash2, CheckCircle } from 'lucide-react';
import { usePaymentMethods, useRemovePaymentMethod } from '@/hooks/use-customer-billing';
import Link from 'next/link';

export function PaymentMethodsList() {
  const { data: paymentMethods, isLoading, error } = usePaymentMethods();
  const removeMutation = useRemovePaymentMethod();

  const handleRemove = async (id: string) => {
    if (confirm('Are you sure you want to remove this payment method?')) {
      try {
        await removeMutation.mutateAsync(id);
      } catch (error) {
        console.error('Failed to remove payment method:', error);
        alert('Failed to remove payment method. Please try again.');
      }
    }
  };

  const getCardIcon = (brand?: string) => {
    const brandLower = brand?.toLowerCase() || '';
    if (brandLower.includes('visa')) return '💳';
    if (brandLower.includes('mastercard')) return '💳';
    if (brandLower.includes('amex')) return '💳';
    return '💳';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Failed to load payment methods. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  if (!paymentMethods || paymentMethods.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No payment methods on file</p>
          <Button asChild>
            <Link href="/billing/payment-methods/add">Add Payment Method</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {paymentMethods.map((method: any) => (
        <Card key={method.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                  {getCardIcon(method.brand)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">
                      {method.brand ? `${method.brand.toUpperCase()} •••• ${method.last4}` : `Card •••• ${method.last4}`}
                    </p>
                    {method.isDefault && (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </div>
                  {method.expiryMonth && method.expiryYear && (
                    <p className="text-sm text-gray-600 mt-1">
                      Expires {method.expiryMonth}/{method.expiryYear}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!method.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemove(method.id)}
                    disabled={removeMutation.isPending}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

