'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Button } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { toast } from 'sonner';
import {
  ArrowRight,
  Calculator,
  Calendar,
  CreditCard,
  DollarSign,
  Info,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  X
} from 'lucide-react';
import apiClient from '@/lib/api';
import PlanComparison from './PlanComparison';
import CancellationFlow from './CancellationFlow';

interface PlanChangeWorkflowProps {
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
  onPlanChanged: () => void;
  onCancel: () => void;
  onCancellationComplete?: () => void;
  className?: string;
}

interface PlanChangePreview {
  currentPlan: {
    id: string;
    name: string;
    monthlyPrice: number;
    yearlyPrice?: number;
  };
  newPlan: {
    id: string;
    name: string;
    monthlyPrice: number;
    yearlyPrice?: number;
  };
  isUpgrade: boolean;
  canChange: boolean;
  restrictions: string[];
  billingPreview: {
    currentPrice: number;
    newPrice: number;
    proratedDifference: number;
    immediateCharge: number;
    creditAmount: number;
    nextAmount: number;
    remainingDays: number;
    totalDays: number;
    billingCycle: string;
  };
  visitCarryover: {
    currentVisitsPerMonth: number;
    newVisitsPerMonth: number;
    unusedVisits: number;
    carryoverVisits: number;
    totalVisitsNextPeriod: number;
  };
  effectiveDate: string;
}

type WorkflowStep = 'selection' | 'preview' | 'confirmation' | 'processing' | 'complete' | 'cancellation';

export default function PlanChangeWorkflow({
  currentSubscription,
  onPlanChanged,
  onCancel,
  onCancellationComplete,
  className = ''
}: PlanChangeWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('selection');
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [preview, setPreview] = useState<PlanChangePreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handlePlanSelect = async (tier: string, billingCycle: 'monthly' | 'yearly') => {
    if (tier === currentSubscription.tier) {
      toast.error('You are already on this plan');
      return;
    }

    setSelectedTier(tier);
    setSelectedBillingCycle(billingCycle);
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.getPlanChangePreview(tier, billingCycle);
      
      if (response.success) {
        setPreview(response.preview);
        setCurrentStep('preview');
      } else {
        throw new Error('Failed to get plan change preview');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to preview plan change';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmChange = async () => {
    if (!selectedTier || !preview) return;

    setCurrentStep('processing');
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.changePlan(selectedTier, selectedBillingCycle);
      
      if (response.success) {
        setCurrentStep('complete');
        toast.success('Plan changed successfully!');
        
        // Notify parent component after a short delay
        setTimeout(() => {
          onPlanChanged();
        }, 2000);
      } else {
        throw new Error('Failed to change plan');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change plan';
      setError(errorMessage);
      setCurrentStep('preview');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSelection = () => {
    setCurrentStep('selection');
    setPreview(null);
    setSelectedTier('');
    setError(null);
  };

  const handleCancelSubscription = () => {
    setCurrentStep('cancellation');
  };

  const handleCancellationComplete = () => {
    if (onCancellationComplete) {
      onCancellationComplete();
    } else {
      onCancel();
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'selection', label: 'Select Plan', icon: Calculator },
      { key: 'preview', label: 'Review Changes', icon: Info },
      { key: 'confirmation', label: 'Confirm', icon: CheckCircle },
      { key: 'processing', label: 'Processing', icon: Loader2 },
      { key: 'complete', label: 'Complete', icon: CheckCircle }
    ];

    const currentStepIndex = steps.findIndex(step => step.key === currentStep);

    return (
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {steps.slice(0, 4).map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            const isDisabled = index > currentStepIndex;

            return (
              <div key={step.key} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isActive
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : isCompleted
                      ? 'border-green-600 bg-green-600 text-white'
                      : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  <StepIcon className="h-5 w-5" />
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    isActive
                      ? 'text-blue-600'
                      : isCompleted
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
                {index < steps.length - 2 && (
                  <ArrowRight className="h-4 w-4 text-gray-400 mx-4" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSelectionStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your New Plan</h2>
        <p className="text-gray-600">
          Select a plan that better fits your needs. You can upgrade or downgrade at any time.
        </p>
      </div>

      <PlanComparison
        currentSubscription={currentSubscription}
        onPlanSelect={handlePlanSelect}
      />

      <div className="flex justify-center space-x-4">
        <Button
          onClick={onCancel}
          variant="outline"
          className="px-8"
        >
          Cancel
        </Button>
        <Button
          onClick={handleCancelSubscription}
          variant="outline"
          className="px-8 text-red-600 border-red-300 hover:bg-red-50"
        >
          Cancel Subscription
        </Button>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    if (!preview) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Plan Change</h2>
          <p className="text-gray-600">
            Please review the details of your plan change before confirming.
          </p>
        </div>

        {/* Plan Change Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Plan Change Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Current Plan</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-semibold">{preview.currentPlan.name}</div>
                    <div className="text-sm text-gray-600">
                      {formatCurrency(preview.currentPlan.monthlyPrice)}/month
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">New Plan</h4>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="font-semibold text-blue-900">{preview.newPlan.name}</div>
                    <div className="text-sm text-blue-700">
                      {formatCurrency(preview.newPlan.monthlyPrice)}/month
                    </div>
                    <Badge className={`mt-2 ${
                      preview.isUpgrade 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {preview.isUpgrade ? 'Upgrade' : 'Downgrade'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current monthly cost:</span>
                    <span className="font-medium">{formatCurrency(preview.billingPreview.currentPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">New monthly cost:</span>
                    <span className="font-medium">{formatCurrency(preview.billingPreview.newPrice)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
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
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining days in cycle:</span>
                    <span className="font-medium">{preview.billingPreview.remainingDays} days</span>
                  </div>
                  {preview.billingPreview.immediateCharge > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Immediate charge:</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(preview.billingPreview.immediateCharge)}
                      </span>
                    </div>
                  )}
                  {preview.billingPreview.creditAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account credit:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(preview.billingPreview.creditAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Next payment amount:</span>
                    <span className="font-medium">{formatCurrency(preview.billingPreview.nextAmount)}</span>
                  </div>
                </div>
              </div>

              {(preview.billingPreview.immediateCharge > 0 || preview.billingPreview.creditAmount > 0) && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800 mb-1">Prorated Billing</p>
                      <p className="text-yellow-700">
                        {preview.billingPreview.immediateCharge > 0
                          ? `You'll be charged ${formatCurrency(preview.billingPreview.immediateCharge)} today for the upgrade to your new plan for the remaining ${preview.billingPreview.remainingDays} days of your current billing cycle.`
                          : `You'll receive a credit of ${formatCurrency(preview.billingPreview.creditAmount)} that will be applied to your next payment.`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Visit Carryover */}
        {preview.visitCarryover && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Service Visit Changes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current visits per month:</span>
                    <span className="font-medium">{preview.visitCarryover.currentVisitsPerMonth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">New visits per month:</span>
                    <span className="font-medium">{preview.visitCarryover.newVisitsPerMonth}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unused visits:</span>
                    <span className="font-medium">{preview.visitCarryover.unusedVisits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Carryover visits:</span>
                    <span className="font-medium text-green-600">{preview.visitCarryover.carryoverVisits}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Total visits next period:</span>
                    <span className="font-medium">{preview.visitCarryover.totalVisitsNextPeriod}</span>
                  </div>
                </div>
              </div>

              {preview.visitCarryover.carryoverVisits > 0 && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg mt-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-green-800 mb-1">Visit Carryover</p>
                      <p className="text-green-700">
                        Your {preview.visitCarryover.carryoverVisits} unused visits will be carried over to your new plan, 
                        giving you {preview.visitCarryover.totalVisitsNextPeriod} total visits next month.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Restrictions */}
        {preview.restrictions && preview.restrictions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                Important Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {preview.restrictions.map((restriction, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{restriction}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Effective Date */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Effective Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              Your plan change will take effect on <strong>{formatDate(preview.effectiveDate)}</strong>.
              {preview.billingPreview.immediateCharge > 0 
                ? ' You will be charged immediately for the prorated amount.'
                : ' Your next billing cycle will reflect the new plan pricing.'
              }
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button
            onClick={handleBackToSelection}
            variant="outline"
            disabled={isLoading}
          >
            Back to Selection
          </Button>
          
          <div className="flex gap-3">
            <Button
              onClick={onCancel}
              variant="outline"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmChange}
              disabled={isLoading || !preview.canChange}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Plan Change'
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderProcessingStep = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="bg-blue-100 p-6 rounded-full">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Your Plan Change</h2>
        <p className="text-gray-600">
          Please wait while we update your subscription. This may take a few moments.
        </p>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="bg-green-100 p-6 rounded-full">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Plan Change Complete!</h2>
        <p className="text-gray-600">
          Your subscription has been successfully updated. You'll receive a confirmation email shortly.
        </p>
      </div>
      
      {preview && (
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">New Plan:</span>
                <span className="font-medium">{preview.newPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Cost:</span>
                <span className="font-medium">{formatCurrency(preview.newPlan.monthlyPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Effective Date:</span>
                <span className="font-medium">{formatDate(preview.effectiveDate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={onPlanChanged}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Return to Dashboard
      </Button>
    </div>
  );

  const renderCancellationStep = () => (
    <CancellationFlow
      currentSubscription={currentSubscription}
      onCancel={() => setCurrentStep('selection')}
      onCancellationComplete={handleCancellationComplete}
    />
  );

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {currentStep !== 'cancellation' && renderStepIndicator()}

      {error && currentStep !== 'cancellation' && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800 mb-1">Error</h4>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'selection' && renderSelectionStep()}
      {currentStep === 'preview' && renderPreviewStep()}
      {currentStep === 'processing' && renderProcessingStep()}
      {currentStep === 'complete' && renderCompleteStep()}
      {currentStep === 'cancellation' && renderCancellationStep()}
    </div>
  );
}