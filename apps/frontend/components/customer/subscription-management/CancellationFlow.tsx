'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Button } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Heart,
  Loader2,
  MessageSquare,
  Shield,
  Star,
  X,
  Zap
} from 'lucide-react';
import apiClient from '@/lib/api';

interface CancellationFlowProps {
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
  onCancel: () => void;
  onCancellationComplete: () => void;
  className?: string;
}

interface RetentionOffer {
  id: string;
  type: 'DISCOUNT' | 'PAUSE' | 'DOWNGRADE';
  title: string;
  description: string;
  value: string;
  duration?: string;
  originalPrice: number;
  discountedPrice?: number;
  icon: React.ComponentType<{ className?: string }>;
}

type CancellationStep = 'confirmation' | 'retention' | 'feedback' | 'processing' | 'complete';

export default function CancellationFlow({
  currentSubscription,
  onCancel,
  onCancellationComplete,
  className = ''
}: CancellationFlowProps) {
  const [currentStep, setCurrentStep] = useState<CancellationStep>('confirmation');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRetentionOffer, setSelectedRetentionOffer] = useState<string | null>(null);
  const [feedbackReason, setFeedbackReason] = useState<string>('');
  const [feedbackComments, setFeedbackComments] = useState<string>('');
  const [cancellationDetails, setCancellationDetails] = useState<{
    accessEndDate: string;
    dataRetentionPeriod: string;
    refundAmount?: number;
  } | null>(null);
  const [retentionOffers, setRetentionOffers] = useState<RetentionOffer[]>([]);

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

  const getIconForOfferType = (type: string) => {
    switch (type) {
      case 'DISCOUNT':
        return Star;
      case 'PAUSE':
        return Clock;
      case 'DOWNGRADE':
        return Zap;
      default:
        return Star;
    }
  };

  const cancellationReasons = [
    'Too expensive',
    'Not using the service enough',
    'Found a better alternative',
    'Service quality issues',
    'Moving/relocating',
    'Financial difficulties',
    'No longer need the service',
    'Other'
  ];

  const handleInitialCancel = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch retention offers from the API
      const response = await apiClient.getRetentionOffers();
      
      if (response.success) {
        const transformedOffers = response.offers.map(offer => ({
          ...offer,
          icon: getIconForOfferType(offer.type)
        }));
        setRetentionOffers(transformedOffers);
        setCurrentStep('retention');
      } else {
        // If no offers available, skip to feedback
        setCurrentStep('feedback');
      }
    } catch (err) {
      console.error('Failed to fetch retention offers:', err);
      // Skip to feedback if offers can't be loaded
      setCurrentStep('feedback');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipRetention = () => {
    setCurrentStep('feedback');
  };

  const handleAcceptRetentionOffer = async (offerId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.applyRetentionOffer(offerId);
      
      if (response.success) {
        toast.success('Retention offer applied successfully!');
        onCancellationComplete();
      } else {
        throw new Error('Failed to apply retention offer');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply retention offer';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitFeedback = () => {
    if (!feedbackReason) {
      toast.error('Please select a reason for cancellation');
      return;
    }
    setCurrentStep('processing');
    processCancellation();
  };

  const processCancellation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.request('/subscriptions/cancel', {
        method: 'POST',
        body: JSON.stringify({
          reason: feedbackReason,
          comments: feedbackComments
        })
      });
      
      if (response.message) {
        // Set cancellation details
        setCancellationDetails({
          accessEndDate: currentSubscription.currentPeriodEnd,
          dataRetentionPeriod: '90 days',
          refundAmount: 0 // No refund for immediate cancellation
        });
        
        setCurrentStep('complete');
        toast.success('Subscription cancelled successfully');
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel subscription';
      setError(errorMessage);
      setCurrentStep('feedback');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderConfirmationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 p-4 rounded-full">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cancel Your Subscription?</h2>
        <p className="text-gray-600">
          We're sorry to see you go. Here's what will happen if you cancel:
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Cancellation Consequences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Access End Date</h4>
                <p className="text-sm text-gray-600">
                  Your subscription will remain active until <strong>{formatDate(currentSubscription.currentPeriodEnd)}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Billing</h4>
                <p className="text-sm text-gray-600">
                  No future charges will occur. Your next payment of {formatCurrency(currentSubscription.nextPaymentAmount)} scheduled for {formatDate(currentSubscription.currentPeriodEnd)} will be cancelled.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Data Retention</h4>
                <p className="text-sm text-gray-600">
                  Your account data will be retained for 90 days after cancellation, allowing you to reactivate your subscription with all your preferences intact.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Service History</h4>
                <p className="text-sm text-gray-600">
                  You'll lose access to your service history, booking preferences, and any unused service credits or perks.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div className="flex items-start gap-2">
          <Heart className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-1">We Value Your Feedback</h4>
            <p className="text-blue-700 text-sm">
              Before you go, we'd love to understand what we could have done better. Your feedback helps us improve our service for everyone.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          onClick={onCancel}
          variant="outline"
          disabled={isLoading}
        >
          Keep My Subscription
        </Button>
        
        <Button
          onClick={handleInitialCancel}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700"
        >
          Continue with Cancellation
        </Button>
      </div>
    </div>
  );

  const renderRetentionStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 p-4 rounded-full">
            <Heart className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Wait! We Have Special Offers</h2>
        <p className="text-gray-600">
          Before you cancel, here are some exclusive offers just for you:
        </p>
      </div>

      <div className="grid gap-4">
        {retentionOffers.map((offer) => {
          const OfferIcon = offer.icon;
          return (
            <Card 
              key={offer.id}
              className={`cursor-pointer transition-all ${
                selectedRetentionOffer === offer.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'hover:border-gray-300'
              }`}
              onClick={() => setSelectedRetentionOffer(offer.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <OfferIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{offer.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{offer.description}</p>
                        
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800">
                            {offer.value}
                          </Badge>
                          {offer.duration && (
                            <span className="text-sm text-gray-500">for {offer.duration}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {offer.discountedPrice && (
                          <div>
                            <div className="text-sm text-gray-500 line-through">
                              {formatCurrency(offer.originalPrice)}
                            </div>
                            <div className="font-semibold text-green-600">
                              {formatCurrency(offer.discountedPrice)}
                            </div>
                          </div>
                        )}
                        {offer.type === 'PAUSE' && (
                          <div className="font-semibold text-blue-600">
                            Free
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button
          onClick={handleSkipRetention}
          variant="outline"
          disabled={isLoading}
        >
          No Thanks, Continue Cancelling
        </Button>
        
        <Button
          onClick={() => selectedRetentionOffer && handleAcceptRetentionOffer(selectedRetentionOffer)}
          disabled={isLoading || !selectedRetentionOffer}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Applying Offer...
            </>
          ) : (
            'Accept This Offer'
          )}
        </Button>
      </div>
    </div>
  );

  const renderFeedbackStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-orange-100 p-4 rounded-full">
            <MessageSquare className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Help Us Improve</h2>
        <p className="text-gray-600">
          Your feedback is valuable to us. Please let us know why you're cancelling.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reason for Cancellation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cancellationReasons.map((reason) => (
              <label key={reason} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="cancellation-reason"
                  value={reason}
                  checked={feedbackReason === reason}
                  onChange={(e) => setFeedbackReason(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-gray-700">{reason}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Comments (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={feedbackComments}
            onChange={(e) => setFeedbackComments(e.target.value)}
            placeholder="Tell us more about your experience or what we could do better..."
            className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          onClick={() => setCurrentStep('retention')}
          variant="outline"
          disabled={isLoading}
        >
          Back to Offers
        </Button>
        
        <Button
          onClick={handleSubmitFeedback}
          disabled={isLoading || !feedbackReason}
          className="bg-red-600 hover:bg-red-700"
        >
          Cancel My Subscription
        </Button>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="bg-orange-100 p-6 rounded-full">
          <Loader2 className="h-12 w-12 text-orange-600 animate-spin" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Cancellation</h2>
        <p className="text-gray-600">
          Please wait while we process your cancellation request. This may take a few moments.
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Cancelled</h2>
        <p className="text-gray-600">
          Your subscription has been successfully cancelled. We're sorry to see you go!
        </p>
      </div>
      
      {cancellationDetails && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-lg">Cancellation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Access until:</span>
              <span className="font-medium">{formatDate(cancellationDetails.accessEndDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Data retention:</span>
              <span className="font-medium">{cancellationDetails.dataRetentionPeriod}</span>
            </div>
            {cancellationDetails.refundAmount && cancellationDetails.refundAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Refund amount:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(cancellationDetails.refundAmount)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg max-w-md mx-auto">
        <div className="flex items-start gap-2">
          <Heart className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 mb-1">We'd Love to Have You Back</p>
            <p className="text-blue-700">
              You can reactivate your subscription anytime within the next 90 days and keep all your preferences and history.
            </p>
          </div>
        </div>
      </div>

      <Button
        onClick={onCancellationComplete}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Return to Dashboard
      </Button>
    </div>
  );

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {error && (
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

      {currentStep === 'confirmation' && renderConfirmationStep()}
      {currentStep === 'retention' && renderRetentionStep()}
      {currentStep === 'feedback' && renderFeedbackStep()}
      {currentStep === 'processing' && renderProcessingStep()}
      {currentStep === 'complete' && renderCompleteStep()}
    </div>
  );
}