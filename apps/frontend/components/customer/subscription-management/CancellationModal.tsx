'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/shared';
import CancellationFlow from './CancellationFlow';
import apiClient from '@/lib/api';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancellationComplete: () => void;
  currentSubscription: {
    id: string;
    tier: string;
    status: string;
    paymentFrequency: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    nextPaymentAmount: number;
    plan: {
      name: string;
      monthlyPrice: number;
      yearlyPrice: number;
      features: string[];
    };
  };
}

export default function CancellationModal({
  isOpen,
  onClose,
  onCancellationComplete,
  currentSubscription
}: CancellationModalProps) {
  const [canCancel, setCanCancel] = useState<boolean>(true);
  const [cancellationBlockedReason, setCancellationBlockedReason] = useState<string>('');
  const [isCheckingEligibility, setIsCheckingEligibility] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      checkCancellationEligibility();
    }
  }, [isOpen]);

  const checkCancellationEligibility = async () => {
    try {
      setIsCheckingEligibility(true);
      const response = await apiClient.canCancelSubscription();
      setCanCancel(response.canCancel);
      setCancellationBlockedReason(response.reason || '');
    } catch (error) {
      console.error('Error checking cancellation eligibility:', error);
      // Default to allowing cancellation if check fails
      setCanCancel(true);
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Cancel Subscription
            </h2>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6">
            {isCheckingEligibility ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Checking cancellation eligibility...</p>
              </div>
            ) : !canCancel ? (
              <div className="text-center py-8">
                <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <X className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Cancellation Not Available
                </h3>
                <p className="text-gray-600 mb-6">
                  {cancellationBlockedReason || 'Your subscription cannot be cancelled at this time.'}
                </p>
                <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
                  Close
                </Button>
              </div>
            ) : (
              <CancellationFlow
                currentSubscription={currentSubscription}
                onCancel={onClose}
                onCancellationComplete={onCancellationComplete}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}