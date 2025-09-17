'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Button } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import {
  AlertTriangle,
  CheckCircle,
  CreditCard,
  DollarSign,
  Info,
  Loader2,
  X
} from 'lucide-react';

interface PlanChangeConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  preview: {
    currentPlan: {
      id: string;
      name: string;
      monthlyPrice: number;
    };
    newPlan: {
      id: string;
      name: string;
      monthlyPrice: number;
    };
    isUpgrade: boolean;
    billingPreview: {
      currentPrice: number;
      newPrice: number;
      proratedDifference: number;
      immediateCharge: number;
      creditAmount: number;
      nextAmount: number;
      remainingDays: number;
      billingCycle: string;
    };
    effectiveDate: string;
    restrictions: string[];
  };
}

export default function PlanChangeConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  preview
}: PlanChangeConfirmationDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Confirm Plan Change
          </CardTitle>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            disabled={isProcessing}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Plan Change Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Plan Change Summary</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Current Plan</div>
                <div className="font-medium">{preview.currentPlan.name}</div>
                <div className="text-sm text-gray-600">
                  {formatCurrency(preview.currentPlan.monthlyPrice)}/month
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">New Plan</div>
                <div className="font-medium text-blue-900">{preview.newPlan.name}</div>
                <div className="text-sm text-blue-700">
                  {formatCurrency(preview.newPlan.monthlyPrice)}/month
                </div>
                <Badge className={`mt-1 ${
                  preview.isUpgrade 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {preview.isUpgrade ? 'Upgrade' : 'Downgrade'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Billing Impact */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Billing Impact
            </h4>
            
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Monthly difference:</span>
                  <span className={`font-medium ${
                    preview.billingPreview.proratedDifference > 0 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    {preview.billingPreview.proratedDifference > 0 ? '+' : ''}
                    {formatCurrency(preview.billingPreview.proratedDifference)}
                  </span>
                </div>

                {preview.billingPreview.immediateCharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Immediate charge:</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(preview.billingPreview.immediateCharge)}
                    </span>
                  </div>
                )}

                {preview.billingPreview.creditAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Account credit:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(preview.billingPreview.creditAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-gray-600">Next payment amount:</span>
                  <span className="font-medium">
                    {formatCurrency(preview.billingPreview.nextAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Effective Date */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Info className="h-4 w-4" />
            <span>
              This change will take effect on {formatDate(preview.effectiveDate)}
            </span>
          </div>

          {/* Restrictions/Warnings */}
          {preview.restrictions && preview.restrictions.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Important Notes
              </h4>
              <ul className="space-y-1">
                {preview.restrictions.map((restriction, index) => (
                  <li key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                    <span className="w-1 h-1 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></span>
                    <span>{restriction}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Confirmation */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-gray-900 mb-1">
                  I understand and confirm this plan change
                </p>
                <p className="text-gray-600">
                  By confirming, you agree to the new plan pricing and terms. 
                  {preview.billingPreview.immediateCharge > 0 && 
                    ` You will be charged ${formatCurrency(preview.billingPreview.immediateCharge)} immediately.`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Plan Change'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}