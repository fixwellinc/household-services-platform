'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { toast } from 'sonner';
import { 
  X,
  Calendar,
  DollarSign,
  TrendingDown,
  AlertTriangle,
  Check,
  Loader2,
  Info,
  CreditCard
} from 'lucide-react';

interface FrequencyOption {
  frequency: string;
  planTier: string;
  frequencyConfig: {
    multiplier: number;
    periodsPerYear: number;
    discount: number;
    label: string;
    description: string;
  };
  pricing: {
    monthlyBasePrice: number;
    paymentAmount: number;
    baseAmount: number;
    discountAmount: number;
    discountPercentage: number;
  };
  annual: {
    totalPayments: number;
    totalDiscount: number;
    savingsVsMonthly: number;
    savingsPercentage: number;
  };
  schedule: {
    periodsPerYear: number;
    label: string;
    description: string;
  };
}

interface FrequencyChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFrequency: string;
  newFrequency: string;
  newOption: FrequencyOption;
  onConfirm: () => Promise<void>;
}

export default function FrequencyChangeModal({
  isOpen,
  onClose,
  currentFrequency,
  newFrequency,
  newOption,
  onConfirm
}: FrequencyChangeModalProps) {
  const [isChanging, setIsChanging] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsChanging(true);
      await onConfirm();
      toast.success('Payment frequency updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error changing frequency:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update payment frequency');
    } finally {
      setIsChanging(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatFrequencyLabel = (frequency: string) => {
    const labels = {
      WEEKLY: 'Weekly',
      BIWEEKLY: 'Bi-weekly',
      MONTHLY: 'Monthly',
      QUARTERLY: 'Quarterly',
      YEARLY: 'Yearly'
    };
    return labels[frequency as keyof typeof labels] || frequency;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Confirm Frequency Change
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isChanging}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Change Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Payment Frequency Change</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-blue-700">From:</span>
                <span className="font-medium text-blue-900">
                  {formatFrequencyLabel(currentFrequency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-700">To:</span>
                <span className="font-medium text-blue-900">
                  {newOption.schedule.label}
                </span>
              </div>
            </div>
          </div>

          {/* New Payment Details */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">New Payment Details</h4>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              {/* Payment Amount */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-700">Payment Amount:</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(newOption.pricing.paymentAmount)}
                </span>
              </div>

              {/* Billing Frequency */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-700">Billing Frequency:</span>
                </div>
                <span className="font-medium text-gray-900">
                  Every {newOption.schedule.label.toLowerCase()}
                </span>
              </div>

              {/* Annual Total */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-700">Annual Total:</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(newOption.annual.totalPayments)}
                </span>
              </div>
            </div>
          </div>

          {/* Discount Information */}
          {newOption.pricing.discountPercentage > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900">Discount Applied</span>
              </div>
              <div className="text-sm text-green-700">
                <div className="flex items-center justify-between">
                  <span>Discount Rate:</span>
                  <span className="font-medium">{newOption.pricing.discountPercentage}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Discount Amount:</span>
                  <span className="font-medium">
                    {formatCurrency(newOption.pricing.discountAmount)} per payment
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Savings Information */}
          {newOption.annual.savingsVsMonthly > 0 && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-purple-900">Annual Savings</span>
              </div>
              <div className="text-sm text-purple-700">
                <div className="flex items-center justify-between">
                  <span>Savings vs Monthly:</span>
                  <span className="font-medium">
                    {formatCurrency(newOption.annual.savingsVsMonthly)} per year
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Savings Percentage:</span>
                  <span className="font-medium">
                    {newOption.annual.savingsPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900 mb-1">Important Notice</p>
                <p className="text-yellow-700">
                  Your next billing date will be adjusted based on the new frequency. 
                  You'll receive a confirmation email with the updated billing schedule.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isChanging}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isChanging}
            className="flex-1"
          >
            {isChanging ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Updating...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirm Change
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}