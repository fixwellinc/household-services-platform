import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock fetch globally
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

// Mock authentication context
const mockAuthContext = {
  user: {
    id: 'user_123',
    email: 'test@example.com',
    subscription: {
      id: 'sub_123',
      tier: 'HOMECARE',
      status: 'ACTIVE'
    }
  },
  isAuthenticated: true,
  loading: false
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

// Mock toast notifications
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
};

jest.mock('sonner', () => ({
  toast: mockToast,
}));

// Mock UI components
jest.mock('../../components/ui/shared', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardDescription: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <div className={className}>{children}</div>,
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
  Button: ({ children, onClick, disabled, className, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} {...props}>
      {children}
    </button>
  ),
}));

// Mock subscription management components
const MockPlanComparison = ({ onPlanSelect }: { onPlanSelect: (plan: string) => void }) => (
  <div data-testid="plan-comparison">
    <h3>Choose Your Plan</h3>
    <button onClick={() => onPlanSelect('STARTER')}>Select Starter</button>
    <button onClick={() => onPlanSelect('HOMECARE')}>Select HomeCare</button>
    <button onClick={() => onPlanSelect('PRIORITY')}>Select Priority</button>
  </div>
);

const MockCancellationFlow = ({ onCancel, onKeepSubscription }: { 
  onCancel: (reason: string) => void;
  onKeepSubscription: () => void;
}) => (
  <div data-testid="cancellation-flow">
    <h3>Cancel Subscription</h3>
    <p>Are you sure you want to cancel?</p>
    <button onClick={() => onCancel('No longer needed')}>Confirm Cancel</button>
    <button onClick={onKeepSubscription}>Keep Subscription</button>
  </div>
);

describe('Subscription Management Workflow Integration', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    mockToast.info.mockClear();
    mockPush.mockClear();
  });

  describe('Plan Upgrade Workflow', () => {
    it('completes plan upgrade workflow successfully', async () => {
      // Mock API responses for plan upgrade
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          // Get available plans
          ok: true,
          json: async () => ({
            success: true,
            data: [
              { id: 'starter', name: 'Starter', monthlyPrice: 2999 },
              { id: 'homecare', name: 'HomeCare', monthlyPrice: 4999 },
              { id: 'priority', name: 'Priority', monthlyPrice: 7999 }
            ]
          })
        })
        .mockResolvedValueOnce({
          // Plan change preview
          ok: true,
          json: async () => ({
            success: true,
            data: {
              currentPlan: 'HOMECARE',
              newPlan: 'PRIORITY',
              prorationAmount: 3000,
              effectiveDate: '2024-02-01',
              nextBillingAmount: 7999
            }
          })
        })
        .mockResolvedValueOnce({
          // Confirm plan change
          ok: true,
          json: async () => ({
            success: true,
            data: {
              subscriptionId: 'sub_123',
              newTier: 'PRIORITY',
              effectiveDate: '2024-02-01',
              confirmationNumber: 'UPG-123456'
            }
          })
        });

      const TestComponent = () => {
        const [step, setStep] = React.useState<'select' | 'preview' | 'confirm'>('select');
        const [selectedPlan, setSelectedPlan] = React.useState<string>('');
        const [previewData, setPreviewData] = React.useState<any>(null);

        const handlePlanSelect = async (plan: string) => {
          setSelectedPlan(plan);
          
          // Get plan change preview
          const response = await fetch('/api/customer/subscription/preview-change', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPlan: plan })
          });
          const data = await response.json();
          
          if (data.success) {
            setPreviewData(data.data);
            setStep('preview');
          }
        };

        const handleConfirmChange = async () => {
          const response = await fetch('/api/customer/subscription/change-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPlan: selectedPlan })
          });
          const data = await response.json();
          
          if (data.success) {
            mockToast.success('Plan upgraded successfully!');
            setStep('confirm');
          }
        };

        if (step === 'select') {
          return <MockPlanComparison onPlanSelect={handlePlanSelect} />;
        }

        if (step === 'preview') {
          return (
            <div data-testid="plan-preview">
              <h3>Plan Change Preview</h3>
              <p>Current: {previewData.currentPlan}</p>
              <p>New: {previewData.newPlan}</p>
              <p>Proration: ${previewData.prorationAmount / 100}</p>
              <button onClick={handleConfirmChange}>Confirm Change</button>
              <button onClick={() => setStep('select')}>Go Back</button>
            </div>
          );
        }

        return (
          <div data-testid="plan-confirmed">
            <h3>Plan Change Confirmed</h3>
            <p>Your plan has been upgraded to {selectedPlan}</p>
          </div>
        );
      };

      render(<TestComponent />);

      // Step 1: Select new plan
      expect(screen.getByTestId('plan-comparison')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Select Priority'));

      // Step 2: Review preview
      await waitFor(() => {
        expect(screen.getByTestId('plan-preview')).toBeInTheDocument();
      });

      expect(screen.getByText('Current: HOMECARE')).toBeInTheDocument();
      expect(screen.getByText('New: PRIORITY')).toBeInTheDocument();
      expect(screen.getByText('Proration: $30')).toBeInTheDocument();

      // Step 3: Confirm change
      fireEvent.click(screen.getByText('Confirm Change'));

      await waitFor(() => {
        expect(screen.getByTestId('plan-confirmed')).toBeInTheDocument();
      });

      expect(mockToast.success).toHaveBeenCalledWith('Plan upgraded successfully!');
      expect(screen.getByText('Your plan has been upgraded to PRIORITY')).toBeInTheDocument();

      // Verify API calls
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenNthCalledWith(1, '/api/customer/subscription/preview-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPlan: 'PRIORITY' })
      });
      expect(fetch).toHaveBeenNthCalledWith(2, '/api/customer/subscription/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPlan: 'PRIORITY' })
      });
    });

    it('handles plan upgrade errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Cannot upgrade to the same plan'
        })
      });

      const TestComponent = () => {
        const handlePlanSelect = async (plan: string) => {
          const response = await fetch('/api/customer/subscription/preview-change', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPlan: plan })
          });
          const data = await response.json();
          
          if (!data.success) {
            mockToast.error(data.error);
          }
        };

        return <MockPlanComparison onPlanSelect={handlePlanSelect} />;
      };

      render(<TestComponent />);

      fireEvent.click(screen.getByText('Select HomeCare'));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Cannot upgrade to the same plan');
      });
    });
  });

  describe('Subscription Cancellation Workflow', () => {
    it('completes cancellation workflow with retention offers', async () => {
      // Mock API responses
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          // Get retention offers
          ok: true,
          json: async () => ({
            success: true,
            data: {
              offers: [
                { type: 'DISCOUNT', description: '50% off next 3 months', value: 50 },
                { type: 'PAUSE', description: 'Pause subscription for 3 months', value: 3 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          // Confirm cancellation
          ok: true,
          json: async () => ({
            success: true,
            data: {
              subscriptionId: 'sub_123',
              status: 'CANCELLED',
              accessEndDate: '2024-02-01',
              confirmationNumber: 'CAN-123456'
            }
          })
        });

      const TestComponent = () => {
        const [step, setStep] = React.useState<'initial' | 'retention' | 'confirmed'>('initial');
        const [retentionOffers, setRetentionOffers] = React.useState<any[]>([]);

        const handleInitiateCancel = async () => {
          // Get retention offers
          const response = await fetch('/api/customer/subscription/retention-offers');
          const data = await response.json();
          
          if (data.success) {
            setRetentionOffers(data.data.offers);
            setStep('retention');
          }
        };

        const handleConfirmCancel = async (reason: string) => {
          const response = await fetch('/api/customer/subscription/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason, declinedOffers: retentionOffers.map(o => o.type) })
          });
          const data = await response.json();
          
          if (data.success) {
            mockToast.success('Subscription cancelled successfully');
            setStep('confirmed');
          }
        };

        const handleKeepSubscription = () => {
          mockToast.info('Great! Your subscription remains active');
          setStep('initial');
        };

        if (step === 'initial') {
          return (
            <div data-testid="cancel-initial">
              <button onClick={handleInitiateCancel}>Cancel Subscription</button>
            </div>
          );
        }

        if (step === 'retention') {
          return (
            <div data-testid="retention-offers">
              <h3>Wait! We have special offers for you</h3>
              {retentionOffers.map((offer, index) => (
                <div key={index} data-testid={`offer-${offer.type}`}>
                  <p>{offer.description}</p>
                  <button onClick={handleKeepSubscription}>Accept Offer</button>
                </div>
              ))}
              <MockCancellationFlow 
                onCancel={handleConfirmCancel}
                onKeepSubscription={handleKeepSubscription}
              />
            </div>
          );
        }

        return (
          <div data-testid="cancel-confirmed">
            <h3>Subscription Cancelled</h3>
            <p>Your subscription has been cancelled</p>
            <p>Access until: February 1, 2024</p>
          </div>
        );
      };

      render(<TestComponent />);

      // Step 1: Initiate cancellation
      fireEvent.click(screen.getByText('Cancel Subscription'));

      // Step 2: Show retention offers
      await waitFor(() => {
        expect(screen.getByTestId('retention-offers')).toBeInTheDocument();
      });

      expect(screen.getByText('Wait! We have special offers for you')).toBeInTheDocument();
      expect(screen.getByTestId('offer-DISCOUNT')).toBeInTheDocument();
      expect(screen.getByTestId('offer-PAUSE')).toBeInTheDocument();

      // Step 3: Decline offers and confirm cancellation
      fireEvent.click(screen.getByText('Confirm Cancel'));

      await waitFor(() => {
        expect(screen.getByTestId('cancel-confirmed')).toBeInTheDocument();
      });

      expect(mockToast.success).toHaveBeenCalledWith('Subscription cancelled successfully');
      expect(screen.getByText('Access until: February 1, 2024')).toBeInTheDocument();

      // Verify API calls
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenNthCalledWith(1, '/api/customer/subscription/retention-offers');
      expect(fetch).toHaveBeenNthCalledWith(2, '/api/customer/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reason: 'No longer needed', 
          declinedOffers: ['DISCOUNT', 'PAUSE'] 
        })
      });
    });

    it('handles retention offer acceptance', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              offers: [
                { type: 'DISCOUNT', description: '50% off next 3 months', value: 50 }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              subscriptionId: 'sub_123',
              appliedOffer: 'DISCOUNT',
              newPrice: 2499,
              offerDuration: 3
            }
          })
        });

      const TestComponent = () => {
        const [step, setStep] = React.useState<'initial' | 'retention'>('initial');

        const handleInitiateCancel = async () => {
          const response = await fetch('/api/customer/subscription/retention-offers');
          const data = await response.json();
          
          if (data.success) {
            setStep('retention');
          }
        };

        const handleAcceptOffer = async (offerType: string) => {
          const response = await fetch('/api/customer/subscription/accept-retention-offer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ offerType })
          });
          const data = await response.json();
          
          if (data.success) {
            mockToast.success('Offer applied successfully!');
          }
        };

        if (step === 'initial') {
          return (
            <div>
              <button onClick={handleInitiateCancel}>Cancel Subscription</button>
            </div>
          );
        }

        return (
          <div data-testid="retention-offers">
            <h3>Special Offer</h3>
            <p>50% off next 3 months</p>
            <button onClick={() => handleAcceptOffer('DISCOUNT')}>Accept Offer</button>
          </div>
        );
      };

      render(<TestComponent />);

      fireEvent.click(screen.getByText('Cancel Subscription'));

      await waitFor(() => {
        expect(screen.getByTestId('retention-offers')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Accept Offer'));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Offer applied successfully!');
      });

      expect(fetch).toHaveBeenNthCalledWith(2, '/api/customer/subscription/accept-retention-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerType: 'DISCOUNT' })
      });
    });
  });

  describe('Payment Method Update Workflow', () => {
    it('completes payment method update successfully', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          // Create setup intent
          ok: true,
          json: async () => ({
            success: true,
            data: {
              clientSecret: 'seti_123_secret_456',
              setupIntentId: 'seti_123'
            }
          })
        })
        .mockResolvedValueOnce({
          // Confirm payment method
          ok: true,
          json: async () => ({
            success: true,
            data: {
              paymentMethodId: 'pm_new123',
              last4: '4242',
              brand: 'visa',
              isDefault: true
            }
          })
        });

      const TestComponent = () => {
        const [step, setStep] = React.useState<'form' | 'processing' | 'success'>('form');

        const handleSubmitPaymentMethod = async () => {
          setStep('processing');
          
          // Create setup intent
          const setupResponse = await fetch('/api/customer/payment-methods/setup-intent', {
            method: 'POST'
          });
          const setupData = await setupResponse.json();
          
          if (setupData.success) {
            // Simulate Stripe confirmation (normally done by Stripe Elements)
            const confirmResponse = await fetch('/api/customer/payment-methods/confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                setupIntentId: setupData.data.setupIntentId,
                paymentMethodId: 'pm_new123'
              })
            });
            const confirmData = await confirmResponse.json();
            
            if (confirmData.success) {
              mockToast.success('Payment method updated successfully!');
              setStep('success');
            }
          }
        };

        if (step === 'form') {
          return (
            <div data-testid="payment-form">
              <h3>Update Payment Method</h3>
              <div>Card Number: **** **** **** 4242</div>
              <button onClick={handleSubmitPaymentMethod}>Update Payment Method</button>
            </div>
          );
        }

        if (step === 'processing') {
          return (
            <div data-testid="payment-processing">
              <p>Processing payment method...</p>
            </div>
          );
        }

        return (
          <div data-testid="payment-success">
            <h3>Payment Method Updated</h3>
            <p>Your new payment method ending in 4242 is now active</p>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('payment-form')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Update Payment Method'));

      await waitFor(() => {
        expect(screen.getByTestId('payment-processing')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId('payment-success')).toBeInTheDocument();
      });

      expect(mockToast.success).toHaveBeenCalledWith('Payment method updated successfully!');
      expect(screen.getByText('Your new payment method ending in 4242 is now active')).toBeInTheDocument();

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenNthCalledWith(1, '/api/customer/payment-methods/setup-intent', {
        method: 'POST'
      });
    });
  });
});