'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  AlertTriangle,
  Check,
  X,
  Loader2,
  Calendar,
  Shield,
  ExternalLink,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  brand: string;
  isExpiringSoon: boolean;
}

interface PaymentMethodUpdateProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentMethodUpdated?: () => void;
}

export default function PaymentMethodUpdate({ 
  isOpen, 
  onClose, 
  onPaymentMethodUpdated 
}: PaymentMethodUpdateProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPaymentMethods();
    }
  }, [isOpen]);

  const loadPaymentMethods = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payments/methods');
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      } else {
        throw new Error('Failed to load payment methods');
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  const removePaymentMethod = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/payments/methods/${paymentMethodId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Payment method removed successfully');
        await loadPaymentMethods();
        onPaymentMethodUpdated?.();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove payment method');
      }
    } catch (error) {
      console.error('Error removing payment method:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove payment method');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddPaymentMethod = () => {
    // In a real implementation, this would integrate with Stripe Elements
    // For now, we'll show a placeholder
    toast.info('Payment method integration would be implemented here with Stripe Elements');
    setShowAddForm(true);
  };

  const getBrandIcon = (brand: string) => {
    const brandLower = brand.toLowerCase();
    switch (brandLower) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      case 'discover':
        return '💳';
      default:
        return '💳';
    }
  };

  const getExpiryStatus = (month: number, year: number) => {
    const now = new Date();
    const expiry = new Date(year, month - 1);
    const monthsUntilExpiry = (expiry.getFullYear() - now.getFullYear()) * 12 + (expiry.getMonth() - now.getMonth());
    
    if (monthsUntilExpiry <= 0) {
      return { status: 'expired', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' };
    } else if (monthsUntilExpiry <= 2) {
      return { status: 'expiring', color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200' };
    } else {
      return { status: 'valid', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Payment Methods</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your payment methods and update expiring cards
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading payment methods...</span>
            </div>
          ) : (
            <>
              {/* Payment Methods List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Your Payment Methods</h3>
                  <Button onClick={handleAddPaymentMethod} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Card
                  </Button>
                </div>

                {paymentMethods.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Payment Methods</h3>
                      <p className="text-muted-foreground mb-4">
                        Add a payment method to manage your subscription
                      </p>
                      <Button onClick={handleAddPaymentMethod}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Payment Method
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {paymentMethods.map((method) => {
                      const expiryStatus = getExpiryStatus(method.expiryMonth, method.expiryYear);
                      
                      return (
                        <Card key={method.id} className={expiryStatus.bgColor}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="text-2xl">
                                  {getBrandIcon(method.brand)}
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {method.brand.toUpperCase()} •••• {method.last4}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                {/* Expiry Status */}
                                {expiryStatus.status === 'expired' && (
                                  <Badge variant="destructive" className="flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Expired
                                  </Badge>
                                )}
                                {expiryStatus.status === 'expiring' && (
                                  <Badge variant="secondary" className="flex items-center gap-1 bg-orange-100 text-orange-800">
                                    <AlertCircle className="h-3 w-3" />
                                    Expiring Soon
                                  </Badge>
                                )}
                                {expiryStatus.status === 'valid' && (
                                  <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3" />
                                    Valid
                                  </Badge>
                                )}

                                {/* Actions */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removePaymentMethod(method.id)}
                                  disabled={isUpdating || paymentMethods.length <= 1}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Expiry Warning */}
                            {method.isExpiringSoon && (
                              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                                  <div className="text-sm">
                                    <div className="font-medium text-orange-800">
                                      Card Expiring Soon
                                    </div>
                                    <div className="text-orange-700 mt-1">
                                      Please update your payment method to avoid service interruption.
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-blue-900 mb-1">Secure Payment Processing</div>
                    <div className="text-blue-700">
                      Your payment information is encrypted and securely processed by Stripe. 
                      We never store your full card details on our servers.
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Payment Method Form Placeholder */}
              {showAddForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>Add New Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Stripe Elements Integration</h3>
                      <p className="text-muted-foreground mb-4">
                        This would integrate with Stripe Elements for secure card input
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button variant="outline" onClick={() => setShowAddForm(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => {
                          toast.success('Payment method would be added here');
                          setShowAddForm(false);
                        }}>
                          Add Card
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}