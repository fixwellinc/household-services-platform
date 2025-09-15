"use client";

import React, { useState } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  RefreshCw, 
  Gift, 
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button, Input, Label, Textarea, Select } from '@/components/ui/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';

interface Subscription {
  id: string;
  userId: string;
  tier: string;
  status: string;
  availableCredits: number;
  lifetimeValue: number;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

interface BillingAdjustment {
  type: 'credit' | 'debit' | 'refund' | 'discount';
  amount: number;
  reason: string;
  description: string;
  effectiveDate: string;
  requiresApproval: boolean;
  metadata?: {
    originalTransactionId?: string;
    discountCode?: string;
    expirationDate?: string;
  };
}

interface BillingAdjustmentModalProps {
  subscription: Subscription;
  onClose: () => void;
  onSuccess: () => void;
}

export function BillingAdjustmentModal({
  subscription,
  onClose,
  onSuccess
}: BillingAdjustmentModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<'credit' | 'debit' | 'refund' | 'discount'>('credit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [originalTransactionId, setOriginalTransactionId] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { request } = useApi();
  const { showSuccess, showError } = useToast();

  const adjustmentTypes = [
    {
      value: 'credit',
      label: 'Credit',
      description: 'Add credit to customer account',
      icon: Gift,
      color: 'text-green-600'
    },
    {
      value: 'debit',
      label: 'Debit',
      description: 'Charge additional amount',
      icon: CreditCard,
      color: 'text-blue-600'
    },
    {
      value: 'refund',
      label: 'Refund',
      description: 'Process refund for payment',
      icon: RefreshCw,
      color: 'text-purple-600'
    },
    {
      value: 'discount',
      label: 'Discount',
      description: 'Apply discount to future billing',
      icon: DollarSign,
      color: 'text-orange-600'
    }
  ];

  const reasonOptions = {
    credit: [
      'Service issue compensation',
      'Goodwill gesture',
      'Billing error correction',
      'Promotional credit',
      'Referral bonus',
      'Other'
    ],
    debit: [
      'Additional service charge',
      'Late payment fee',
      'Upgrade fee',
      'Usage overage',
      'Other'
    ],
    refund: [
      'Service cancellation',
      'Billing error',
      'Duplicate charge',
      'Service not delivered',
      'Customer request',
      'Other'
    ],
    discount: [
      'Loyalty discount',
      'Promotional offer',
      'Service issue compensation',
      'Retention offer',
      'Volume discount',
      'Other'
    ]
  };

  const handleSubmit = async () => {
    if (!amount || !reason || !description) {
      showError('Please fill in all required fields');
      return;
    }

    const adjustmentAmount = parseFloat(amount);
    if (isNaN(adjustmentAmount) || adjustmentAmount <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    // Check if approval is required for large amounts
    const needsApproval = adjustmentAmount > 100 || requiresApproval;

    if (needsApproval && !showConfirmation) {
      setRequiresApproval(true);
      setShowConfirmation(true);
      return;
    }

    try {
      setLoading(true);

      const adjustmentData: BillingAdjustment = {
        type: adjustmentType,
        amount: adjustmentAmount,
        reason,
        description,
        effectiveDate,
        requiresApproval: needsApproval,
        metadata: {}
      };

      // Add type-specific metadata
      if (adjustmentType === 'refund' && originalTransactionId) {
        adjustmentData.metadata!.originalTransactionId = originalTransactionId;
      }
      if (adjustmentType === 'discount') {
        if (discountCode) adjustmentData.metadata!.discountCode = discountCode;
        if (expirationDate) adjustmentData.metadata!.expirationDate = expirationDate;
      }

      const response = await request(`/admin/subscriptions/${subscription.id}/billing-adjustment`, {
        method: 'POST',
        body: JSON.stringify(adjustmentData)
      });

      if (response.success) {
        showSuccess(
          needsApproval 
            ? 'Billing adjustment submitted for approval'
            : 'Billing adjustment applied successfully'
        );
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error processing billing adjustment:', error);
      showError(error.message || 'Failed to process billing adjustment');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = adjustmentTypes.find(type => type.value === adjustmentType);
  const IconComponent = selectedType?.icon || DollarSign;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Billing Adjustment</span>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {!showConfirmation ? (
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium">{subscription.user.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Plan:</span>
                    <Badge variant="outline">{subscription.tier}</Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Credits:</span>
                    <p className="font-medium text-green-600">${subscription.availableCredits.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Lifetime Value:</span>
                    <p className="font-medium">${subscription.lifetimeValue.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Adjustment Type Selection */}
            <div>
              <Label className="text-base font-medium">Adjustment Type</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {adjustmentTypes.map((type) => {
                  const TypeIcon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setAdjustmentType(type.value as any)}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        adjustmentType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <TypeIcon className={`w-4 h-4 ${type.color}`} />
                        <span className="font-medium">{type.label}</span>
                      </div>
                      <p className="text-xs text-gray-600">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount and Reason */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Select value={reason} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReason(e.target.value)}>
                  <option value="">Select reason</option>
                  {reasonOptions[adjustmentType].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="Provide detailed description of the adjustment..."
                rows={3}
              />
            </div>

            {/* Type-specific fields */}
            {adjustmentType === 'refund' && (
              <div>
                <Label htmlFor="transactionId">Original Transaction ID (optional)</Label>
                <Input
                  id="transactionId"
                  value={originalTransactionId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOriginalTransactionId(e.target.value)}
                  placeholder="pi_1234567890"
                />
              </div>
            )}

            {adjustmentType === 'discount' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discountCode">Discount Code (optional)</Label>
                  <Input
                    id="discountCode"
                    value={discountCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDiscountCode(e.target.value)}
                    placeholder="DISCOUNT10"
                  />
                </div>
                <div>
                  <Label htmlFor="expirationDate">Expiration Date (optional)</Label>
                  <Input
                    id="expirationDate"
                    type="date"
                    value={expirationDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpirationDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Effective Date */}
            <div>
              <Label htmlFor="effectiveDate">Effective Date</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={effectiveDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEffectiveDate(e.target.value)}
              />
            </div>

            {/* Approval Required */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresApproval"
                checked={requiresApproval}
                onCheckedChange={(checked) => setRequiresApproval(checked as boolean)}
              />
              <Label htmlFor="requiresApproval" className="text-sm">
                Requires additional approval
              </Label>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Processing...' : 'Apply Adjustment'}
              </Button>
            </div>
          </div>
        ) : (
          /* Confirmation Screen */
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-medium">Confirm Billing Adjustment</h3>
              <p className="text-gray-600 mt-2">
                This adjustment requires approval due to the amount or type of adjustment.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <IconComponent className={`w-4 h-4 mr-2 ${selectedType?.color}`} />
                  Adjustment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <Badge variant="outline">{selectedType?.label}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">${parseFloat(amount || '0').toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">{subscription.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reason:</span>
                  <span className="font-medium">{reason}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Effective Date:</span>
                  <span className="font-medium">{new Date(effectiveDate).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Approval Required</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    {parseFloat(amount || '0') > 100 
                      ? 'Adjustments over $100 require additional approval.'
                      : 'This adjustment has been marked as requiring approval.'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit for Approval'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}