'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { toast } from 'sonner';
import { 
  Pause, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Loader2, 
  X,
  Info,
  CheckCircle
} from 'lucide-react';

interface SubscriptionPauseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPauseSuccess: () => void;
  subscriptionTier: string;
}

const DURATION_OPTIONS = [
  { value: 1, label: '1 Month', description: 'Short break' },
  { value: 2, label: '2 Months', description: 'Extended break' },
  { value: 3, label: '3 Months', description: 'Seasonal break' },
  { value: 4, label: '4 Months', description: 'Long break' },
  { value: 5, label: '5 Months', description: 'Extended leave' },
  { value: 6, label: '6 Months', description: 'Maximum duration' }
];

const COMMON_REASONS = [
  'Vacation/Travel',
  'Temporary relocation',
  'Financial reasons',
  'Seasonal needs',
  'Home renovation',
  'Other'
];

export default function SubscriptionPauseModal({ 
  isOpen, 
  onClose, 
  onPauseSuccess, 
  subscriptionTier 
}: SubscriptionPauseModalProps) {
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'duration' | 'reason' | 'confirm'>('duration');

  if (!isOpen) return null;

  const handlePause = async () => {
    setLoading(true);
    try {
      const finalReason = reason === 'Other' ? customReason : reason;
      
      const response = await fetch('/api/subscriptions/pause', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          durationMonths: selectedDuration,
          reason: finalReason || null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Subscription paused successfully');
        onPauseSuccess();
        onClose();
        resetForm();
      } else {
        throw new Error(data.error || 'Failed to pause subscription');
      }
    } catch (error) {
      console.error('Error pausing subscription:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to pause subscription');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDuration(1);
    setReason('');
    setCustomReason('');
    setStep('duration');
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const getEndDate = () => {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + selectedDuration);
    return endDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const canProceed = () => {
    switch (step) {
      case 'duration':
        return selectedDuration >= 1 && selectedDuration <= 6;
      case 'reason':
        return reason !== '' && (reason !== 'Other' || customReason.trim() !== '');
      case 'confirm':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step === 'duration') {
      setStep('reason');
    } else if (step === 'reason') {
      setStep('confirm');
    }
  };

  const handleBack = () => {
    if (step === 'reason') {
      setStep('duration');
    } else if (step === 'confirm') {
      setStep('reason');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Pause className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold">Pause Subscription</h3>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                step === 'duration' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
              }`}>
                1
              </div>
              <div className={`w-8 h-1 ${step !== 'duration' ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                step === 'reason' ? 'bg-blue-600 text-white' : 
                step === 'confirm' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'
              }`}>
                2
              </div>
              <div className={`w-8 h-1 ${step === 'confirm' ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                step === 'confirm' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Step Content */}
          {step === 'duration' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">How long would you like to pause?</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Choose a duration between 1-6 months. Your subscription will automatically resume after this period.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedDuration(option.value)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedDuration === option.value
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </button>
                ))}
              </div>

              {selectedDuration > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm text-blue-900">Resume Date</span>
                  </div>
                  <div className="text-sm text-blue-800">
                    Your subscription will automatically resume on <strong>{getEndDate()}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'reason' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Why are you pausing? (Optional)</h4>
                <p className="text-sm text-gray-600 mb-4">
                  This helps us improve our service and may allow us to offer better options.
                </p>
              </div>

              <div className="space-y-2">
                {COMMON_REASONS.map((reasonOption) => (
                  <button
                    key={reasonOption}
                    onClick={() => setReason(reasonOption)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      reason === reasonOption
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {reasonOption}
                  </button>
                ))}
              </div>

              {reason === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Please specify:
                  </label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Tell us more about your reason..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {customReason.length}/500 characters
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Confirm Pause Details</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Please review your pause settings before confirming.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Plan:</span>
                  <span className="text-sm">{subscriptionTier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Duration:</span>
                  <span className="text-sm">{selectedDuration} month{selectedDuration > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Resume Date:</span>
                  <span className="text-sm">{getEndDate()}</span>
                </div>
                {(reason && reason !== 'Other') && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Reason:</span>
                    <span className="text-sm">{reason}</span>
                  </div>
                )}
                {(reason === 'Other' && customReason) && (
                  <div>
                    <span className="text-sm font-medium">Reason:</span>
                    <p className="text-sm mt-1 text-gray-600">{customReason}</p>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 mb-1">What happens during the pause:</p>
                    <ul className="text-yellow-700 space-y-1">
                      <li>• No billing will occur during the pause period</li>
                      <li>• Service scheduling will be suspended</li>
                      <li>• Your plan tier and pricing will be preserved</li>
                      <li>• Subscription will automatically resume on {getEndDate()}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            {step !== 'duration' && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={loading}
                className="flex-1"
              >
                Back
              </Button>
            )}
            
            {step === 'duration' && (
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
            )}

            {step !== 'confirm' ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || loading}
                className="flex-1"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handlePause}
                disabled={loading}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Pausing...
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Subscription
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}