'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { toast } from 'sonner';
import { 
  Calendar,
  Settings,
  Loader2,
  RefreshCw
} from 'lucide-react';
import PaymentFrequencySelector from './PaymentFrequencySelector';
import FrequencyComparisonTable from './FrequencyComparisonTable';
import FrequencyChangeModal from './FrequencyChangeModal';

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
  recommended?: boolean;
  isCurrent?: boolean;
}

interface PaymentFrequencyManagerProps {
  currentFrequency?: string;
  planTier?: string;
  onFrequencyChanged?: (newFrequency: string) => void;
  className?: string;
}

export default function PaymentFrequencyManager({
  currentFrequency = 'MONTHLY',
  planTier,
  onFrequencyChanged,
  className = ''
}: PaymentFrequencyManagerProps) {
  const [selectedFrequency, setSelectedFrequency] = useState<string>(currentFrequency);
  const [selectedOption, setSelectedOption] = useState<FrequencyOption | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    setSelectedFrequency(currentFrequency);
  }, [currentFrequency]);

  const handleFrequencySelect = (frequency: string, option: FrequencyOption) => {
    if (frequency === currentFrequency) {
      toast.info('This is already your current payment frequency');
      return;
    }

    setSelectedFrequency(frequency);
    setSelectedOption(option);
    setShowModal(true);
  };

  const handleConfirmChange = async () => {
    if (!selectedOption) return;

    try {
      setIsChanging(true);
      
      const response = await fetch('/api/subscriptions/change-frequency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          frequency: selectedFrequency
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Payment frequency updated successfully!');
        onFrequencyChanged?.(selectedFrequency);
        setShowModal(false);
      } else {
        throw new Error(data.error || 'Failed to update payment frequency');
      }
    } catch (error) {
      console.error('Error changing frequency:', error);
      throw error; // Re-throw to be handled by the modal
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Frequency Selector */}
      <PaymentFrequencySelector
        currentFrequency={currentFrequency}
        planTier={planTier}
        onFrequencySelect={handleFrequencySelect}
      />

      {/* Toggle Comparison Table */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => setShowComparison(!showComparison)}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          {showComparison ? 'Hide' : 'Show'} Detailed Comparison
        </Button>
      </div>

      {/* Comparison Table */}
      {showComparison && (
        <FrequencyComparisonTable
          planTier={planTier}
          currentFrequency={currentFrequency}
        />
      )}

      {/* Change Confirmation Modal */}
      {showModal && selectedOption && (
        <FrequencyChangeModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          currentFrequency={currentFrequency}
          newFrequency={selectedFrequency}
          newOption={selectedOption}
          onConfirm={handleConfirmChange}
        />
      )}

      {/* Help Text */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-sm">
              <h4 className="font-medium text-blue-900 mb-1">
                Payment Frequency Options
              </h4>
              <p className="text-blue-700 mb-2">
                Choose the billing frequency that works best for your budget. 
                Longer billing periods offer better discounts and savings.
              </p>
              <ul className="text-blue-600 space-y-1 text-xs">
                <li>• Monthly: Standard billing, no discount</li>
                <li>• Yearly: 10% discount, maximum savings</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}