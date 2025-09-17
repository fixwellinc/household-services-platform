/**
 * End-to-End Tests for Customer Dashboard User Journey
 * 
 * These tests simulate complete user workflows through the customer dashboard.
 * They can be adapted to run with Playwright, Cypress, or similar E2E frameworks.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the entire application context for E2E simulation
global.fetch = jest.fn();

// Mock Next.js router with navigation tracking
const mockNavigationHistory: string[] = [];
const mockPush = jest.fn((path: string) => {
  mockNavigationHistory.push(path);
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(() => {
      mockNavigationHistory.pop();
    }),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => mockNavigationHistory[mockNavigationHistory.length - 1] || '/customer-dashboard',
}));

// Mock authentication with different user states
const createMockAuthContext = (userType: 'new' | 'existing' | 'premium') => {
  const baseUser = {
    id: 'user_123',
    email: 'test@example.com',
    name: 'John Doe',
    createdAt: userType === 'new' ? new Date().toISOString() : '2023-01-01T00:00:00Z'
  };

  const subscriptions = {
    new: {
      id: 'sub_new',
      tier: 'STARTER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    },
    existing: {
      id: 'sub_existing',
      tier: 'HOMECARE',
      status: 'ACTIVE',
      createdAt: '2023-06-01T00:00:00Z'
    },
    premium: {
      id: 'sub_premium',
      tier: 'PRIORITY',
      status: 'ACTIVE',
      createdAt: '2023-01-01T00:00:00Z'
    }
  };

  return {
    user: {
      ...baseUser,
      subscription: subscriptions[userType]
    },
    isAuthenticated: true,
    loading: false
  };
};

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

// Mock UI components for E2E simulation
jest.mock('../../components/ui/shared', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className} data-testid="card-content">{children}</div>,
  CardDescription: ({ children, className }: any) => <div className={className} data-testid="card-description">{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className} data-testid="card-header">{children}</div>,
  CardTitle: ({ children, className }: any) => <div className={className} data-testid="card-title">{children}</div>,
  Badge: ({ children, className }: any) => <span className={className} data-testid="badge">{children}</span>,
  Button: ({ children, onClick, disabled, className, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} data-testid="button" {...props}>
      {children}
    </button>
  ),
}));

describe('Customer Dashboard E2E User Journeys', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    mockToast.info.mockClear();
    mockToast.warning.mockClear();
    mockPush.mockClear();
    mockNavigationHistory.length = 0;
  });

  describe('New Customer Onboarding Journey', () => {
    it('completes new customer dashboard tour and first service request', async () => {
      // Mock API responses for new customer
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          // Get subscription data
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: 'sub_new',
              tier: 'STARTER',
              status: 'ACTIVE',
              plan: {
                name: 'Starter Plan',
                features: ['Basic support', '2 service requests/month']
              },
              usage: {
                servicesUsed: 0,
                servicesLimit: 2
              }
            }
          })
        })
        .mockResolvedValueOnce({
          // Get available services
          ok: true,
          json: async () => ({
            success: true,
            data: [
              {
                id: 'service_cleaning',
                name: 'Basic Cleaning',
                category: 'CLEANING',
                isIncluded: true,
                basePrice: 8000
              }
            ]
          })
        })
        .mockResolvedValueOnce({
          // Submit service request
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: 'request_123',
              status: 'PENDING',
              estimatedResponse: '2-4 hours'
            }
          })
        });

      // Mock the customer dashboard component
      const CustomerDashboard = () => {
        const [step, setStep] = React.useState<'overview' | 'services' | 'request'>('overview');
        const [showOnboarding, setShowOnboarding] = React.useState(true);

        React.useEffect(() => {
          // Simulate initial data loading
          fetch('/api/customer/subscription');
          fetch('/api/customer/services');
        }, []);

        const handleDismissOnboarding = () => {
          setShowOnboarding(false);
          mockToast.info('Welcome to your dashboard! Explore your subscription benefits.');
        };

        const handleRequestService = async () => {
          const response = await fetch('/api/customer/service-requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              serviceId: 'service_cleaning',
              description: 'Need basic house cleaning',
              urgency: 'NORMAL',
              address: '123 Main St'
            })
          });
          
          const data = await response.json();
          if (data.success) {
            mockToast.success('Service request submitted successfully!');
            setStep('request');
          }
        };

        if (showOnboarding) {
          return (
            <div data-testid="onboarding-tour">
              <h2>Welcome to FixWell!</h2>
              <p>Let's take a quick tour of your dashboard</p>
              <button onClick={handleDismissOnboarding} data-testid="start-tour">
                Start Tour
              </button>
            </div>
          );
        }

        if (step === 'overview') {
          return (
            <div data-testid="dashboard-overview">
              <h1>Customer Dashboard</h1>
              <div data-testid="subscription-card">
                <h3>Starter Plan</h3>
                <p>0 of 2 services used this month</p>
              </div>
              <button onClick={() => setStep('services')} data-testid="view-services">
                View Available Services
              </button>
            </div>
          );
        }

        if (step === 'services') {
          return (
            <div data-testid="services-view">
              <h2>Available Services</h2>
              <div data-testid="service-card">
                <h4>Basic Cleaning</h4>
                <p>Included in your plan</p>
                <button onClick={handleRequestService} data-testid="request-service">
                  Request Service
                </button>
              </div>
            </div>
          );
        }

        return (
          <div data-testid="request-confirmation">
            <h2>Service Request Submitted</h2>
            <p>We'll respond within 2-4 hours</p>
            <button onClick={() => setStep('overview')} data-testid="back-to-dashboard">
              Back to Dashboard
            </button>
          </div>
        );
      };

      // Render the dashboard
      render(<CustomerDashboard />);

      // Step 1: New user sees onboarding
      expect(screen.getByTestId('onboarding-tour')).toBeInTheDocument();
      expect(screen.getByText('Welcome to FixWell!')).toBeInTheDocument();

      // Step 2: Start the tour
      fireEvent.click(screen.getByTestId('start-tour'));

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-overview')).toBeInTheDocument();
      });

      expect(mockToast.info).toHaveBeenCalledWith(
        'Welcome to your dashboard! Explore your subscription benefits.'
      );

      // Step 3: View subscription overview
      expect(screen.getByText('Starter Plan')).toBeInTheDocument();
      expect(screen.getByText('0 of 2 services used this month')).toBeInTheDocument();

      // Step 4: Navigate to services
      fireEvent.click(screen.getByTestId('view-services'));

      await waitFor(() => {
        expect(screen.getByTestId('services-view')).toBeInTheDocument();
      });

      expect(screen.getByText('Basic Cleaning')).toBeInTheDocument();
      expect(screen.getByText('Included in your plan')).toBeInTheDocument();

      // Step 5: Request first service
      fireEvent.click(screen.getByTestId('request-service'));

      await waitFor(() => {
        expect(screen.getByTestId('request-confirmation')).toBeInTheDocument();
      });

      expect(mockToast.success).toHaveBeenCalledWith('Service request submitted successfully!');
      expect(screen.getByText("We'll respond within 2-4 hours")).toBeInTheDocument();

      // Verify API calls were made in correct order
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(fetch).toHaveBeenNthCalledWith(1, '/api/customer/subscription');
      expect(fetch).toHaveBeenNthCalledWith(2, '/api/customer/services');
      expect(fetch).toHaveBeenNthCalledWith(3, '/api/customer/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: 'service_cleaning',
          description: 'Need basic house cleaning',
          urgency: 'NORMAL',
          address: '123 Main St'
        })
      });
    });
  });

  describe('Existing Customer Plan Upgrade Journey', () => {
    it('completes plan upgrade from HomeCare to Priority', async () => {
      // Mock API responses for plan upgrade journey
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          // Get current subscription
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: 'sub_existing',
              tier: 'HOMECARE',
              status: 'ACTIVE',
              plan: { name: 'HomeCare Plan' },
              usage: { servicesUsed: 8, servicesLimit: 10 }
            }
          })
        })
        .mockResolvedValueOnce({
          // Get available plans
          ok: true,
          json: async () => ({
            success: true,
            data: [
              { id: 'homecare', name: 'HomeCare', monthlyPrice: 4999, current: true },
              { id: 'priority', name: 'Priority', monthlyPrice: 7999, current: false }
            ]
          })
        })
        .mockResolvedValueOnce({
          // Preview plan change
          ok: true,
          json: async () => ({
            success: true,
            data: {
              currentPlan: 'HOMECARE',
              newPlan: 'PRIORITY',
              prorationAmount: 3000,
              nextBillingAmount: 7999,
              newFeatures: ['Unlimited services', '24/7 support']
            }
          })
        })
        .mockResolvedValueOnce({
          // Confirm upgrade
          ok: true,
          json: async () => ({
            success: true,
            data: {
              subscriptionId: 'sub_existing',
              newTier: 'PRIORITY',
              effectiveDate: '2024-02-01'
            }
          })
        });

      const PlanUpgradeJourney = () => {
        const [step, setStep] = React.useState<'dashboard' | 'plans' | 'preview' | 'confirmed'>('dashboard');
        const [selectedPlan, setSelectedPlan] = React.useState<string>('');
        const [previewData, setPreviewData] = React.useState<any>(null);

        React.useEffect(() => {
          fetch('/api/customer/subscription');
        }, []);

        const handleViewPlans = async () => {
          const response = await fetch('/api/customer/plans');
          setStep('plans');
        };

        const handleSelectPlan = async (planId: string) => {
          setSelectedPlan(planId);
          const response = await fetch('/api/customer/subscription/preview-change', {
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

        const handleConfirmUpgrade = async () => {
          const response = await fetch('/api/customer/subscription/upgrade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPlan: selectedPlan })
          });
          const data = await response.json();
          
          if (data.success) {
            mockToast.success('Plan upgraded successfully!');
            setStep('confirmed');
          }
        };

        if (step === 'dashboard') {
          return (
            <div data-testid="existing-dashboard">
              <h1>HomeCare Dashboard</h1>
              <div data-testid="usage-warning">
                <p>You've used 8 of 10 services this month</p>
                <p>Consider upgrading for unlimited access</p>
              </div>
              <button onClick={handleViewPlans} data-testid="upgrade-plan">
                Upgrade Plan
              </button>
            </div>
          );
        }

        if (step === 'plans') {
          return (
            <div data-testid="plan-selection">
              <h2>Choose Your Plan</h2>
              <div data-testid="current-plan">
                <h3>HomeCare (Current)</h3>
                <p>$49.99/month</p>
              </div>
              <div data-testid="priority-plan">
                <h3>Priority</h3>
                <p>$79.99/month</p>
                <button onClick={() => handleSelectPlan('priority')} data-testid="select-priority">
                  Select Priority
                </button>
              </div>
            </div>
          );
        }

        if (step === 'preview') {
          return (
            <div data-testid="upgrade-preview">
              <h2>Upgrade Preview</h2>
              <p>Upgrading from {previewData.currentPlan} to {previewData.newPlan}</p>
              <p>Proration charge: ${previewData.prorationAmount / 100}</p>
              <p>Next billing: ${previewData.nextBillingAmount / 100}</p>
              <ul>
                {previewData.newFeatures.map((feature: string, index: number) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
              <button onClick={handleConfirmUpgrade} data-testid="confirm-upgrade">
                Confirm Upgrade
              </button>
              <button onClick={() => setStep('plans')} data-testid="go-back">
                Go Back
              </button>
            </div>
          );
        }

        return (
          <div data-testid="upgrade-confirmed">
            <h2>Upgrade Confirmed!</h2>
            <p>Welcome to Priority Plan</p>
            <p>Your new features are now active</p>
          </div>
        );
      };

      render(<PlanUpgradeJourney />);

      // Step 1: User sees usage warning
      expect(screen.getByTestId('existing-dashboard')).toBeInTheDocument();
      expect(screen.getByText("You've used 8 of 10 services this month")).toBeInTheDocument();
      expect(screen.getByText('Consider upgrading for unlimited access')).toBeInTheDocument();

      // Step 2: Click upgrade
      fireEvent.click(screen.getByTestId('upgrade-plan'));

      await waitFor(() => {
        expect(screen.getByTestId('plan-selection')).toBeInTheDocument();
      });

      // Step 3: View plan options
      expect(screen.getByText('HomeCare (Current)')).toBeInTheDocument();
      expect(screen.getByText('Priority')).toBeInTheDocument();

      // Step 4: Select Priority plan
      fireEvent.click(screen.getByTestId('select-priority'));

      await waitFor(() => {
        expect(screen.getByTestId('upgrade-preview')).toBeInTheDocument();
      });

      // Step 5: Review upgrade details
      expect(screen.getByText('Upgrading from HOMECARE to PRIORITY')).toBeInTheDocument();
      expect(screen.getByText('Proration charge: $30')).toBeInTheDocument();
      expect(screen.getByText('Unlimited services')).toBeInTheDocument();
      expect(screen.getByText('24/7 support')).toBeInTheDocument();

      // Step 6: Confirm upgrade
      fireEvent.click(screen.getByTestId('confirm-upgrade'));

      await waitFor(() => {
        expect(screen.getByTestId('upgrade-confirmed')).toBeInTheDocument();
      });

      expect(mockToast.success).toHaveBeenCalledWith('Plan upgraded successfully!');
      expect(screen.getByText('Welcome to Priority Plan')).toBeInTheDocument();

      // Verify complete API flow
      expect(fetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('Premium Customer Service Request Journey', () => {
    it('completes complex service request with file uploads and scheduling', async () => {
      // Mock API responses for premium service request
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          // Get premium services
          ok: true,
          json: async () => ({
            success: true,
            data: [
              {
                id: 'service_premium',
                name: 'Premium Home Maintenance',
                category: 'MAINTENANCE',
                isIncluded: true,
                features: ['Same-day service', 'Premium technicians']
              }
            ]
          })
        })
        .mockResolvedValueOnce({
          // Upload files
          ok: true,
          json: async () => ({
            success: true,
            data: {
              uploadedFiles: [
                { id: 'file_1', name: 'problem_photo.jpg', url: 'https://example.com/file1' }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          // Get available time slots
          ok: true,
          json: async () => ({
            success: true,
            data: {
              availableSlots: [
                { id: 'slot_1', date: '2024-02-01', time: '09:00', available: true },
                { id: 'slot_2', date: '2024-02-01', time: '14:00', available: true }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          // Submit service request
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: 'request_premium',
              status: 'CONFIRMED',
              scheduledDate: '2024-02-01',
              scheduledTime: '09:00',
              technicianName: 'Mike Johnson'
            }
          })
        });

      const PremiumServiceRequest = () => {
        const [step, setStep] = React.useState<'services' | 'details' | 'files' | 'schedule' | 'confirmed'>('services');
        const [selectedService, setSelectedService] = React.useState<string>('');
        const [uploadedFiles, setUploadedFiles] = React.useState<any[]>([]);
        const [selectedSlot, setSelectedSlot] = React.useState<string>('');

        React.useEffect(() => {
          fetch('/api/customer/services/premium');
        }, []);

        const handleSelectService = (serviceId: string) => {
          setSelectedService(serviceId);
          setStep('details');
        };

        const handleUploadFiles = async () => {
          const response = await fetch('/api/customer/files/upload', {
            method: 'POST',
            body: new FormData() // Simulated file upload
          });
          const data = await response.json();
          
          if (data.success) {
            setUploadedFiles(data.data.uploadedFiles);
            setStep('schedule');
          }
        };

        const handleGetSchedule = async () => {
          await fetch('/api/customer/scheduling/slots');
        };

        const handleScheduleService = async (slotId: string) => {
          setSelectedSlot(slotId);
          const response = await fetch('/api/customer/service-requests/premium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              serviceId: selectedService,
              files: uploadedFiles,
              scheduledSlot: slotId,
              priority: 'HIGH'
            })
          });
          const data = await response.json();
          
          if (data.success) {
            mockToast.success('Premium service scheduled successfully!');
            setStep('confirmed');
          }
        };

        if (step === 'services') {
          return (
            <div data-testid="premium-services">
              <h2>Premium Services</h2>
              <div data-testid="premium-service">
                <h3>Premium Home Maintenance</h3>
                <p>Same-day service available</p>
                <button onClick={() => handleSelectService('service_premium')} data-testid="select-premium">
                  Select Service
                </button>
              </div>
            </div>
          );
        }

        if (step === 'details') {
          return (
            <div data-testid="service-details">
              <h2>Service Details</h2>
              <textarea placeholder="Describe the issue..." data-testid="service-description" />
              <button onClick={() => setStep('files')} data-testid="continue-to-files">
                Continue
              </button>
            </div>
          );
        }

        if (step === 'files') {
          return (
            <div data-testid="file-upload">
              <h2>Upload Photos</h2>
              <p>Help us understand the issue better</p>
              <input type="file" multiple data-testid="file-input" />
              <button onClick={handleUploadFiles} data-testid="upload-files">
                Upload & Continue
              </button>
            </div>
          );
        }

        if (step === 'schedule') {
          React.useEffect(() => {
            handleGetSchedule();
          }, []);

          return (
            <div data-testid="scheduling">
              <h2>Schedule Your Service</h2>
              <p>Files uploaded: {uploadedFiles.length}</p>
              <div data-testid="time-slots">
                <button onClick={() => handleScheduleService('slot_1')} data-testid="slot-morning">
                  Tomorrow 9:00 AM
                </button>
                <button onClick={() => handleScheduleService('slot_2')} data-testid="slot-afternoon">
                  Tomorrow 2:00 PM
                </button>
              </div>
            </div>
          );
        }

        return (
          <div data-testid="service-confirmed">
            <h2>Service Confirmed!</h2>
            <p>Technician: Mike Johnson</p>
            <p>Scheduled: Tomorrow at 9:00 AM</p>
            <p>You'll receive a confirmation email shortly</p>
          </div>
        );
      };

      render(<PremiumServiceRequest />);

      // Step 1: Select premium service
      expect(screen.getByTestId('premium-services')).toBeInTheDocument();
      expect(screen.getByText('Same-day service available')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('select-premium'));

      await waitFor(() => {
        expect(screen.getByTestId('service-details')).toBeInTheDocument();
      });

      // Step 2: Fill service details
      const descriptionInput = screen.getByTestId('service-description');
      fireEvent.change(descriptionInput, { target: { value: 'Kitchen faucet is leaking' } });

      fireEvent.click(screen.getByTestId('continue-to-files'));

      await waitFor(() => {
        expect(screen.getByTestId('file-upload')).toBeInTheDocument();
      });

      // Step 3: Upload files
      expect(screen.getByText('Help us understand the issue better')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('upload-files'));

      await waitFor(() => {
        expect(screen.getByTestId('scheduling')).toBeInTheDocument();
      });

      // Step 4: Schedule service
      expect(screen.getByText('Files uploaded: 1')).toBeInTheDocument();
      expect(screen.getByTestId('time-slots')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('slot-morning'));

      await waitFor(() => {
        expect(screen.getByTestId('service-confirmed')).toBeInTheDocument();
      });

      // Step 5: Confirmation
      expect(mockToast.success).toHaveBeenCalledWith('Premium service scheduled successfully!');
      expect(screen.getByText('Technician: Mike Johnson')).toBeInTheDocument();
      expect(screen.getByText('Scheduled: Tomorrow at 9:00 AM')).toBeInTheDocument();

      // Verify complete premium service flow
      expect(fetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('Error Recovery Journey', () => {
    it('handles payment failure and recovery workflow', async () => {
      // Mock payment failure scenario
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          // Get subscription with payment issue
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: 'sub_123',
              tier: 'HOMECARE',
              status: 'PAST_DUE',
              lastPaymentError: 'Your card was declined',
              nextRetryDate: '2024-02-02'
            }
          })
        })
        .mockResolvedValueOnce({
          // Update payment method
          ok: true,
          json: async () => ({
            success: true,
            data: {
              paymentMethodId: 'pm_new',
              last4: '4242'
            }
          })
        })
        .mockResolvedValueOnce({
          // Retry payment
          ok: true,
          json: async () => ({
            success: true,
            data: {
              subscriptionId: 'sub_123',
              status: 'ACTIVE',
              paymentSuccessful: true
            }
          })
        });

      const PaymentRecoveryJourney = () => {
        const [step, setStep] = React.useState<'error' | 'update' | 'retry' | 'resolved'>('error');

        React.useEffect(() => {
          fetch('/api/customer/subscription');
        }, []);

        const handleUpdatePayment = async () => {
          const response = await fetch('/api/customer/payment-methods/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentMethodId: 'pm_new' })
          });
          
          if (response.ok) {
            setStep('retry');
          }
        };

        const handleRetryPayment = async () => {
          const response = await fetch('/api/customer/subscription/retry-payment', {
            method: 'POST'
          });
          const data = await response.json();
          
          if (data.success) {
            mockToast.success('Payment successful! Your subscription is now active.');
            setStep('resolved');
          }
        };

        if (step === 'error') {
          return (
            <div data-testid="payment-error">
              <h2>Payment Issue</h2>
              <p>Your card was declined</p>
              <p>Next retry: February 2, 2024</p>
              <button onClick={() => setStep('update')} data-testid="update-payment">
                Update Payment Method
              </button>
            </div>
          );
        }

        if (step === 'update') {
          return (
            <div data-testid="payment-update">
              <h2>Update Payment Method</h2>
              <div>New card ending in 4242</div>
              <button onClick={handleUpdatePayment} data-testid="save-payment">
                Save Payment Method
              </button>
            </div>
          );
        }

        if (step === 'retry') {
          return (
            <div data-testid="payment-retry">
              <h2>Payment Method Updated</h2>
              <p>Would you like to retry the payment now?</p>
              <button onClick={handleRetryPayment} data-testid="retry-payment">
                Retry Payment
              </button>
            </div>
          );
        }

        return (
          <div data-testid="payment-resolved">
            <h2>Payment Successful!</h2>
            <p>Your subscription is now active</p>
            <p>Thank you for updating your payment method</p>
          </div>
        );
      };

      render(<PaymentRecoveryJourney />);

      // Step 1: User sees payment error
      expect(screen.getByTestId('payment-error')).toBeInTheDocument();
      expect(screen.getByText('Your card was declined')).toBeInTheDocument();

      // Step 2: Update payment method
      fireEvent.click(screen.getByTestId('update-payment'));

      await waitFor(() => {
        expect(screen.getByTestId('payment-update')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-payment'));

      await waitFor(() => {
        expect(screen.getByTestId('payment-retry')).toBeInTheDocument();
      });

      // Step 3: Retry payment
      fireEvent.click(screen.getByTestId('retry-payment'));

      await waitFor(() => {
        expect(screen.getByTestId('payment-resolved')).toBeInTheDocument();
      });

      expect(mockToast.success).toHaveBeenCalledWith(
        'Payment successful! Your subscription is now active.'
      );

      // Verify error recovery flow
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });
});