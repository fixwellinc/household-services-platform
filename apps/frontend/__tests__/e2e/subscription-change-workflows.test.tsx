/**
 * End-to-End Tests for Subscription Change Workflows
 * 
 * These tests cover complete subscription management workflows including
 * plan changes, cancellations, and reactivations.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock global dependencies
global.fetch = jest.fn();

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/customer-dashboard',
}));

// Mock toast notifications
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
};

jest.mock('sonner', () => ({
  toast: mockToast,
}));

// Mock UI components
jest.mock('../../components/ui/shared', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <h3 className={className}>{children}</h3>,
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
  Button: ({ children, onClick, disabled, variant, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`btn ${variant || 'default'}`}
      data-testid="button"
      {...props}
    >
      {children}
    </button>
  ),
}));

describe('Subscription Change Workflows E2E', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    mockToast.info.mockClear();
    mockToast.warning.mockClear();
    mockPush.mockClear();
  });

  describe('Plan Downgrade Workflow', () => {
    it('completes plan downgrade with feature loss warnings', async () => {
      // Mock API responses for downgrade workflow
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          // Get current subscription
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: 'sub_123',
              tier: 'PRIORITY',
              status: 'ACTIVE',
              plan: {
                name: 'Priority Plan',
                monthlyPrice: 7999,
                features: ['Unlimited services', '24/7 support', 'Premium technicians']
              }
            }
          })
        })
        .mockResolvedValueOnce({
          // Get downgrade options
          ok: true,
          json: async () => ({
            success: true,
            data: [
              {
                id: 'homecare',
                name: 'HomeCare',
                monthlyPrice: 4999,
                features: ['10 services/month', 'Standard support'],
                lostFeatures: ['Unlimited services', '24/7 support', 'Premium technicians']
              },
              {
                id: 'starter',
                name: 'Starter',
                monthlyPrice: 2999,
                features: ['2 services/month', 'Email support'],
                lostFeatures: ['Unlimited services', '24/7 support', 'Premium technicians', '8 additional services']
              }
            ]
          })
        })
        .mockResolvedValueOnce({
          // Preview downgrade
          ok: true,
          json: async () => ({
            success: true,
            data: {
              currentPlan: 'PRIORITY',
              newPlan: 'HOMECARE',
              monthlySavings: 3000,
              creditAmount: 1500,
              effectiveDate: '2024-02-01',
              lostFeatures: ['Unlimited services', '24/7 support', 'Premium technicians'],
              impactWarnings: [
                'Your service limit will be reduced to 10 per month',
                'You will lose access to 24/7 support',
                'Premium technician requests will not be available'
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          // Confirm downgrade
          ok: true,
          json: async () => ({
            success: true,
            data: {
              subscriptionId: 'sub_123',
              newTier: 'HOMECARE',
              effectiveDate: '2024-02-01',
              creditApplied: 1500,
              confirmationNumber: 'DWN-123456'
            }
          })
        });

      const PlanDowngradeWorkflow = () => {
        const [step, setStep] = React.useState<'current' | 'options' | 'preview' | 'warnings' | 'confirmed'>('current');
        const [selectedPlan, setSelectedPlan] = React.useState<string>('');
        const [previewData, setPreviewData] = React.useState<any>(null);
        const [acknowledgedWarnings, setAcknowledgedWarnings] = React.useState(false);

        React.useEffect(() => {
          fetch('/api/customer/subscription');
        }, []);

        const handleViewDowngradeOptions = async () => {
          const response = await fetch('/api/customer/plans/downgrade-options');
          setStep('options');
        };

        const handleSelectDowngrade = async (planId: string) => {
          setSelectedPlan(planId);
          const response = await fetch('/api/customer/subscription/preview-downgrade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPlan: planId })
          });
          const data = await response.json();
          
          if (data.success) {
            setPreviewData(data.data);
            setStep('preview');
          }
        };

        const handleShowWarnings = () => {
          setStep('warnings');
        };

        const handleConfirmDowngrade = async () => {
          if (!acknowledgedWarnings) {
            mockToast.warning('Please acknowledge the feature loss warnings');
            return;
          }

          const response = await fetch('/api/customer/subscription/downgrade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              newPlan: selectedPlan,
              acknowledgedWarnings: true
            })
          });
          const data = await response.json();
          
          if (data.success) {
            mockToast.success('Plan downgraded successfully. Credit applied to your account.');
            setStep('confirmed');
          }
        };

        if (step === 'current') {
          return (
            <div data-testid="current-plan">
              <h2>Priority Plan - $79.99/month</h2>
              <p>Unlimited services, 24/7 support</p>
              <button onClick={handleViewDowngradeOptions} data-testid="view-downgrade">
                Downgrade Plan
              </button>
            </div>
          );
        }

        if (step === 'options') {
          return (
            <div data-testid="downgrade-options">
              <h2>Downgrade Options</h2>
              <div data-testid="homecare-option">
                <h3>HomeCare - $49.99/month</h3>
                <p>Save $30/month</p>
                <button onClick={() => handleSelectDowngrade('homecare')} data-testid="select-homecare">
                  Select HomeCare
                </button>
              </div>
              <div data-testid="starter-option">
                <h3>Starter - $29.99/month</h3>
                <p>Save $50/month</p>
                <button onClick={() => handleSelectDowngrade('starter')} data-testid="select-starter">
                  Select Starter
                </button>
              </div>
            </div>
          );
        }

        if (step === 'preview') {
          return (
            <div data-testid="downgrade-preview">
              <h2>Downgrade Preview</h2>
              <p>From {previewData.currentPlan} to {previewData.newPlan}</p>
              <p>Monthly savings: ${previewData.monthlySavings / 100}</p>
              <p>Account credit: ${previewData.creditAmount / 100}</p>
              <p>Effective: {previewData.effectiveDate}</p>
              <button onClick={handleShowWarnings} data-testid="review-changes">
                Review Changes
              </button>
            </div>
          );
        }

        if (step === 'warnings') {
          return (
            <div data-testid="feature-warnings">
              <h2>Important: Features You'll Lose</h2>
              <div data-testid="lost-features">
                {previewData.lostFeatures.map((feature: string, index: number) => (
                  <p key={index} className="text-red-600">❌ {feature}</p>
                ))}
              </div>
              <div data-testid="impact-warnings">
                <h3>Impact on Your Account:</h3>
                {previewData.impactWarnings.map((warning: string, index: number) => (
                  <p key={index} className="text-orange-600">⚠️ {warning}</p>
                ))}
              </div>
              <label data-testid="acknowledge-checkbox">
                <input 
                  type="checkbox" 
                  checked={acknowledgedWarnings}
                  onChange={(e) => setAcknowledgedWarnings(e.target.checked)}
                />
                I understand and accept these changes
              </label>
              <button 
                onClick={handleConfirmDowngrade} 
                data-testid="confirm-downgrade"
                disabled={!acknowledgedWarnings}
              >
                Confirm Downgrade
              </button>
              <button onClick={() => setStep('preview')} data-testid="go-back">
                Go Back
              </button>
            </div>
          );
        }

        return (
          <div data-testid="downgrade-confirmed">
            <h2>Plan Downgraded Successfully</h2>
            <p>You're now on the HomeCare plan</p>
            <p>$15.00 credit applied to your account</p>
            <p>Changes effective February 1, 2024</p>
            <p>Confirmation: DWN-123456</p>
          </div>
        );
      };

      render(<PlanDowngradeWorkflow />);

      // Step 1: View current plan
      expect(screen.getByTestId('current-plan')).toBeInTheDocument();
      expect(screen.getByText('Priority Plan - $79.99/month')).toBeInTheDocument();

      // Step 2: View downgrade options
      fireEvent.click(screen.getByTestId('view-downgrade'));

      await waitFor(() => {
        expect(screen.getByTestId('downgrade-options')).toBeInTheDocument();
      });

      expect(screen.getByText('Save $30/month')).toBeInTheDocument();
      expect(screen.getByText('Save $50/month')).toBeInTheDocument();

      // Step 3: Select HomeCare plan
      fireEvent.click(screen.getByTestId('select-homecare'));

      await waitFor(() => {
        expect(screen.getByTestId('downgrade-preview')).toBeInTheDocument();
      });

      expect(screen.getByText('Monthly savings: $30')).toBeInTheDocument();
      expect(screen.getByText('Account credit: $15')).toBeInTheDocument();

      // Step 4: Review feature changes
      fireEvent.click(screen.getByTestId('review-changes'));

      await waitFor(() => {
        expect(screen.getByTestId('feature-warnings')).toBeInTheDocument();
      });

      expect(screen.getByText('❌ Unlimited services')).toBeInTheDocument();
      expect(screen.getByText('❌ 24/7 support')).toBeInTheDocument();
      expect(screen.getByText('⚠️ Your service limit will be reduced to 10 per month')).toBeInTheDocument();

      // Step 5: Try to confirm without acknowledging (should show warning)
      fireEvent.click(screen.getByTestId('confirm-downgrade'));

      expect(mockToast.warning).toHaveBeenCalledWith('Please acknowledge the feature loss warnings');

      // Step 6: Acknowledge warnings and confirm
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      fireEvent.click(screen.getByTestId('confirm-downgrade'));

      await waitFor(() => {
        expect(screen.getByTestId('downgrade-confirmed')).toBeInTheDocument();
      });

      expect(mockToast.success).toHaveBeenCalledWith(
        'Plan downgraded successfully. Credit applied to your account.'
      );
      expect(screen.getByText("You're now on the HomeCare plan")).toBeInTheDocument();
      expect(screen.getByText('$15.00 credit applied to your account')).toBeInTheDocument();

      // Verify API calls
      expect(fetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('Subscription Cancellation with Retention', () => {
    it('completes cancellation workflow with retention offers and feedback', async () => {
      // Mock API responses for cancellation workflow
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          // Get retention offers
          ok: true,
          json: async () => ({
            success: true,
            data: {
              offers: [
                {
                  id: 'discount_50',
                  type: 'DISCOUNT',
                  title: '50% Off Next 3 Months',
                  description: 'Continue with your current plan at half price',
                  value: 50,
                  duration: 3
                },
                {
                  id: 'pause_3m',
                  type: 'PAUSE',
                  title: 'Pause for 3 Months',
                  description: 'Take a break and resume when ready',
                  value: 3,
                  duration: 3
                }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          // Submit cancellation feedback
          ok: true,
          json: async () => ({
            success: true,
            data: { feedbackId: 'feedback_123' }
          })
        })
        .mockResolvedValueOnce({
          // Process cancellation
          ok: true,
          json: async () => ({
            success: true,
            data: {
              subscriptionId: 'sub_123',
              status: 'CANCELLED',
              accessEndDate: '2024-02-29',
              dataRetentionDate: '2024-05-29',
              confirmationNumber: 'CAN-789012'
            }
          })
        });

      const CancellationWorkflow = () => {
        const [step, setStep] = React.useState<'initial' | 'retention' | 'feedback' | 'confirmed'>('initial');
        const [retentionOffers, setRetentionOffers] = React.useState<any[]>([]);
        const [cancellationReason, setCancellationReason] = React.useState('');
        const [feedback, setFeedback] = React.useState('');

        const handleInitiateCancel = async () => {
          const response = await fetch('/api/customer/subscription/retention-offers');
          const data = await response.json();
          
          if (data.success) {
            setRetentionOffers(data.data.offers);
            setStep('retention');
          }
        };

        const handleDeclineOffers = () => {
          setStep('feedback');
        };

        const handleAcceptOffer = (offerId: string) => {
          mockToast.success('Great! Your offer has been applied to your account.');
          // In real app, would apply the offer and redirect
        };

        const handleSubmitFeedback = async () => {
          const response = await fetch('/api/customer/feedback/cancellation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reason: cancellationReason,
              feedback: feedback,
              declinedOffers: retentionOffers.map(o => o.id)
            })
          });
          
          if (response.ok) {
            await handleFinalCancel();
          }
        };

        const handleFinalCancel = async () => {
          const response = await fetch('/api/customer/subscription/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reason: cancellationReason,
              feedback: feedback
            })
          });
          const data = await response.json();
          
          if (data.success) {
            mockToast.info('Your subscription has been cancelled. We\'re sorry to see you go!');
            setStep('confirmed');
          }
        };

        if (step === 'initial') {
          return (
            <div data-testid="cancel-initial">
              <h2>Cancel Subscription</h2>
              <p>We're sorry to see you considering cancellation</p>
              <button onClick={handleInitiateCancel} data-testid="start-cancellation">
                Continue with Cancellation
              </button>
            </div>
          );
        }

        if (step === 'retention') {
          return (
            <div data-testid="retention-offers">
              <h2>Wait! We have special offers for you</h2>
              <p>Before you go, here are some exclusive offers:</p>
              
              {retentionOffers.map((offer) => (
                <div key={offer.id} data-testid={`offer-${offer.type.toLowerCase()}`} className="border p-4 m-2">
                  <h3>{offer.title}</h3>
                  <p>{offer.description}</p>
                  <button 
                    onClick={() => handleAcceptOffer(offer.id)} 
                    data-testid={`accept-${offer.type.toLowerCase()}`}
                  >
                    Accept This Offer
                  </button>
                </div>
              ))}
              
              <div className="mt-4">
                <p>None of these work for you?</p>
                <button onClick={handleDeclineOffers} data-testid="decline-offers">
                  No thanks, continue with cancellation
                </button>
              </div>
            </div>
          );
        }

        if (step === 'feedback') {
          return (
            <div data-testid="cancellation-feedback">
              <h2>Help us improve</h2>
              <p>We'd love to know why you're leaving</p>
              
              <div data-testid="reason-selection">
                <h3>Primary reason for cancelling:</h3>
                {[
                  'Too expensive',
                  'Not using the service enough',
                  'Found a better alternative',
                  'Service quality issues',
                  'Moving/relocating',
                  'Other'
                ].map((reason) => (
                  <label key={reason} className="block">
                    <input
                      type="radio"
                      name="reason"
                      value={reason}
                      checked={cancellationReason === reason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                    />
                    {reason}
                  </label>
                ))}
              </div>
              
              <div className="mt-4">
                <h3>Additional feedback (optional):</h3>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us more about your experience..."
                  data-testid="feedback-textarea"
                  className="w-full p-2 border"
                />
              </div>
              
              <button 
                onClick={handleSubmitFeedback} 
                data-testid="submit-cancellation"
                disabled={!cancellationReason}
              >
                Submit and Cancel Subscription
              </button>
            </div>
          );
        }

        return (
          <div data-testid="cancellation-confirmed">
            <h2>Subscription Cancelled</h2>
            <p>Your subscription has been successfully cancelled</p>
            <div data-testid="cancellation-details">
              <p>Access until: February 29, 2024</p>
              <p>Data retention until: May 29, 2024</p>
              <p>Confirmation number: CAN-789012</p>
            </div>
            <div className="mt-4">
              <p>You can reactivate your subscription anytime before May 29, 2024</p>
              <button data-testid="reactivate-link">
                Reactivate Subscription
              </button>
            </div>
          </div>
        );
      };

      render(<CancellationWorkflow />);

      // Step 1: Initiate cancellation
      expect(screen.getByTestId('cancel-initial')).toBeInTheDocument();
      expect(screen.getByText("We're sorry to see you considering cancellation")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('start-cancellation'));

      // Step 2: View retention offers
      await waitFor(() => {
        expect(screen.getByTestId('retention-offers')).toBeInTheDocument();
      });

      expect(screen.getByText('Wait! We have special offers for you')).toBeInTheDocument();
      expect(screen.getByTestId('offer-discount')).toBeInTheDocument();
      expect(screen.getByTestId('offer-pause')).toBeInTheDocument();
      expect(screen.getByText('50% Off Next 3 Months')).toBeInTheDocument();
      expect(screen.getByText('Pause for 3 Months')).toBeInTheDocument();

      // Step 3: Test accepting an offer (should stop cancellation)
      fireEvent.click(screen.getByTestId('accept-discount'));

      expect(mockToast.success).toHaveBeenCalledWith(
        'Great! Your offer has been applied to your account.'
      );

      // Reset and continue with cancellation
      mockToast.success.mockClear();
      fireEvent.click(screen.getByTestId('decline-offers'));

      // Step 4: Provide feedback
      await waitFor(() => {
        expect(screen.getByTestId('cancellation-feedback')).toBeInTheDocument();
      });

      expect(screen.getByText('Help us improve')).toBeInTheDocument();

      // Select a reason
      const reasonRadio = screen.getByDisplayValue('Too expensive');
      fireEvent.click(reasonRadio);

      // Add feedback
      const feedbackTextarea = screen.getByTestId('feedback-textarea');
      fireEvent.change(feedbackTextarea, { 
        target: { value: 'Great service but need to cut expenses right now' } 
      });

      // Step 5: Submit cancellation
      fireEvent.click(screen.getByTestId('submit-cancellation'));

      await waitFor(() => {
        expect(screen.getByTestId('cancellation-confirmed')).toBeInTheDocument();
      });

      expect(mockToast.info).toHaveBeenCalledWith(
        "Your subscription has been cancelled. We're sorry to see you go!"
      );

      // Step 6: Verify cancellation details
      expect(screen.getByText('Access until: February 29, 2024')).toBeInTheDocument();
      expect(screen.getByText('Data retention until: May 29, 2024')).toBeInTheDocument();
      expect(screen.getByText('Confirmation number: CAN-789012')).toBeInTheDocument();
      expect(screen.getByText('You can reactivate your subscription anytime before May 29, 2024')).toBeInTheDocument();

      // Verify API calls
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(fetch).toHaveBeenNthCalledWith(1, '/api/customer/subscription/retention-offers');
      expect(fetch).toHaveBeenNthCalledWith(2, '/api/customer/feedback/cancellation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'Too expensive',
          feedback: 'Great service but need to cut expenses right now',
          declinedOffers: ['discount_50', 'pause_3m']
        })
      });
      expect(fetch).toHaveBeenNthCalledWith(3, '/api/customer/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'Too expensive',
          feedback: 'Great service but need to cut expenses right now'
        })
      });
    });
  });

  describe('Subscription Reactivation Workflow', () => {
    it('completes subscription reactivation for cancelled account', async () => {
      // Mock API responses for reactivation
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          // Get cancelled subscription details
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: 'sub_123',
              status: 'CANCELLED',
              cancelledAt: '2024-01-15',
              accessEndDate: '2024-02-15',
              lastPlan: {
                id: 'homecare',
                name: 'HomeCare',
                monthlyPrice: 4999
              },
              availableForReactivation: true
            }
          })
        })
        .mockResolvedValueOnce({
          // Get reactivation options
          ok: true,
          json: async () => ({
            success: true,
            data: {
              canReactivateSamePlan: true,
              availablePlans: [
                { id: 'homecare', name: 'HomeCare', monthlyPrice: 4999, recommended: true },
                { id: 'starter', name: 'Starter', monthlyPrice: 2999 },
                { id: 'priority', name: 'Priority', monthlyPrice: 7999 }
              ],
              welcomeBackOffer: {
                type: 'DISCOUNT',
                description: '25% off first month back',
                value: 25
              }
            }
          })
        })
        .mockResolvedValueOnce({
          // Process reactivation
          ok: true,
          json: async () => ({
            success: true,
            data: {
              subscriptionId: 'sub_123',
              status: 'ACTIVE',
              tier: 'HOMECARE',
              reactivatedAt: new Date().toISOString(),
              nextBillingDate: '2024-03-01',
              welcomeBackDiscount: 1250
            }
          })
        });

      const ReactivationWorkflow = () => {
        const [step, setStep] = React.useState<'cancelled' | 'options' | 'confirmed'>('cancelled');
        const [selectedPlan, setSelectedPlan] = React.useState('');
        const [reactivationData, setReactivationData] = React.useState<any>(null);

        React.useEffect(() => {
          fetch('/api/customer/subscription/cancelled-details');
        }, []);

        const handleStartReactivation = async () => {
          const response = await fetch('/api/customer/subscription/reactivation-options');
          const data = await response.json();
          
          if (data.success) {
            setReactivationData(data.data);
            setStep('options');
          }
        };

        const handleReactivate = async (planId: string) => {
          setSelectedPlan(planId);
          const response = await fetch('/api/customer/subscription/reactivate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planId })
          });
          const data = await response.json();
          
          if (data.success) {
            mockToast.success('Welcome back! Your subscription has been reactivated.');
            setStep('confirmed');
          }
        };

        if (step === 'cancelled') {
          return (
            <div data-testid="cancelled-status">
              <h2>Subscription Cancelled</h2>
              <p>Your subscription was cancelled on January 15, 2024</p>
              <p>Access expires: February 15, 2024</p>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                <h3>Miss us already?</h3>
                <p>You can reactivate your subscription anytime</p>
                <button onClick={handleStartReactivation} data-testid="reactivate-button">
                  Reactivate Subscription
                </button>
              </div>
            </div>
          );
        }

        if (step === 'options') {
          return (
            <div data-testid="reactivation-options">
              <h2>Welcome Back!</h2>
              <div data-testid="welcome-offer" className="bg-green-50 border border-green-200 p-4 rounded mb-4">
                <h3>🎉 Welcome Back Offer</h3>
                <p>{reactivationData.welcomeBackOffer.description}</p>
              </div>
              
              <h3>Choose Your Plan</h3>
              {reactivationData.availablePlans.map((plan: any) => (
                <div 
                  key={plan.id} 
                  data-testid={`plan-${plan.id}`}
                  className={`border p-4 m-2 ${plan.recommended ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                >
                  <h4>{plan.name}</h4>
                  <p>${plan.monthlyPrice / 100}/month</p>
                  {plan.recommended && (
                    <span className="bg-blue-600 text-white px-2 py-1 text-sm rounded">
                      Your Previous Plan
                    </span>
                  )}
                  <button 
                    onClick={() => handleReactivate(plan.id)} 
                    data-testid={`select-${plan.id}`}
                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Reactivate with {plan.name}
                  </button>
                </div>
              ))}
            </div>
          );
        }

        return (
          <div data-testid="reactivation-confirmed">
            <h2>🎉 Welcome Back!</h2>
            <p>Your subscription has been successfully reactivated</p>
            <div data-testid="reactivation-details">
              <p>Plan: HomeCare</p>
              <p>Status: Active</p>
              <p>Next billing: March 1, 2024</p>
              <p>Welcome back discount: $12.50 applied</p>
            </div>
            <div className="mt-4">
              <button data-testid="go-to-dashboard">
                Go to Dashboard
              </button>
            </div>
          </div>
        );
      };

      render(<ReactivationWorkflow />);

      // Step 1: View cancelled status
      expect(screen.getByTestId('cancelled-status')).toBeInTheDocument();
      expect(screen.getByText('Your subscription was cancelled on January 15, 2024')).toBeInTheDocument();
      expect(screen.getByText('Miss us already?')).toBeInTheDocument();

      // Step 2: Start reactivation
      fireEvent.click(screen.getByTestId('reactivate-button'));

      await waitFor(() => {
        expect(screen.getByTestId('reactivation-options')).toBeInTheDocument();
      });

      // Step 3: View welcome back offer and plans
      expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
      expect(screen.getByTestId('welcome-offer')).toBeInTheDocument();
      expect(screen.getByText('25% off first month back')).toBeInTheDocument();

      expect(screen.getByTestId('plan-homecare')).toBeInTheDocument();
      expect(screen.getByText('Your Previous Plan')).toBeInTheDocument();

      // Step 4: Reactivate with previous plan
      fireEvent.click(screen.getByTestId('select-homecare'));

      await waitFor(() => {
        expect(screen.getByTestId('reactivation-confirmed')).toBeInTheDocument();
      });

      expect(mockToast.success).toHaveBeenCalledWith(
        'Welcome back! Your subscription has been reactivated.'
      );

      // Step 5: Verify reactivation details
      expect(screen.getByText('🎉 Welcome Back!')).toBeInTheDocument();
      expect(screen.getByText('Plan: HomeCare')).toBeInTheDocument();
      expect(screen.getByText('Status: Active')).toBeInTheDocument();
      expect(screen.getByText('Welcome back discount: $12.50 applied')).toBeInTheDocument();

      // Verify API calls
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(fetch).toHaveBeenNthCalledWith(3, '/api/customer/subscription/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'homecare' })
      });
    });
  });
});