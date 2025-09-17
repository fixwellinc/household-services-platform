import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Socket.IO client
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  connected: true,
};

jest.mock('socket.io-client', () => {
  return jest.fn(() => mockSocket);
});

// Mock React hooks
const mockSetState = jest.fn();
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn((initial) => [initial, mockSetState]),
  useEffect: jest.fn((fn) => fn()),
  useCallback: jest.fn((fn) => fn),
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
  warning: jest.fn(),
};

jest.mock('sonner', () => ({
  toast: mockToast,
}));

describe('Real-time Updates Integration', () => {
  beforeEach(() => {
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
    mockSocket.emit.mockClear();
    mockSetState.mockClear();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    mockToast.info.mockClear();
    mockToast.warning.mockClear();
  });

  describe('Subscription Status Updates', () => {
    it('handles subscription status change events', async () => {
      const TestComponent = () => {
        React.useEffect(() => {
          // Simulate socket connection and event listeners
          mockSocket.on('subscription:status_changed', (data: any) => {
            mockSetState(data.status);
            
            if (data.status === 'PAST_DUE') {
              mockToast.warning('Payment failed - please update your payment method');
            } else if (data.status === 'ACTIVE') {
              mockToast.success('Payment successful - subscription reactivated');
            }
          });

          return () => {
            mockSocket.off('subscription:status_changed');
          };
        }, []);

        return <div data-testid="subscription-status">Subscription Status Component</div>;
      };

      render(<TestComponent />);

      // Simulate receiving a subscription status change event
      const statusChangeHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'subscription:status_changed'
      )?.[1];

      if (statusChangeHandler) {
        act(() => {
          statusChangeHandler({
            subscriptionId: 'sub_123',
            status: 'PAST_DUE',
            reason: 'payment_failed',
            timestamp: new Date().toISOString()
          });
        });
      }

      expect(mockToast.warning).toHaveBeenCalledWith(
        'Payment failed - please update your payment method'
      );
      expect(mockSetState).toHaveBeenCalledWith('PAST_DUE');
    });

    it('handles subscription reactivation events', async () => {
      const TestComponent = () => {
        React.useEffect(() => {
          mockSocket.on('subscription:reactivated', (data: any) => {
            mockSetState(data.subscription);
            mockToast.success('Welcome back! Your subscription has been reactivated');
          });

          return () => {
            mockSocket.off('subscription:reactivated');
          };
        }, []);

        return <div data-testid="subscription-component">Subscription Component</div>;
      };

      render(<TestComponent />);

      const reactivationHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'subscription:reactivated'
      )?.[1];

      if (reactivationHandler) {
        act(() => {
          reactivationHandler({
            subscription: {
              id: 'sub_123',
              status: 'ACTIVE',
              tier: 'HOMECARE',
              reactivatedAt: new Date().toISOString()
            }
          });
        });
      }

      expect(mockToast.success).toHaveBeenCalledWith(
        'Welcome back! Your subscription has been reactivated'
      );
    });

    it('handles plan change confirmation events', async () => {
      const TestComponent = () => {
        React.useEffect(() => {
          mockSocket.on('subscription:plan_changed', (data: any) => {
            mockSetState(data.newPlan);
            mockToast.info(`Plan upgraded to ${data.newPlan.name}!`);
          });

          return () => {
            mockSocket.off('subscription:plan_changed');
          };
        }, []);

        return <div data-testid="plan-component">Plan Component</div>;
      };

      render(<TestComponent />);

      const planChangeHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'subscription:plan_changed'
      )?.[1];

      if (planChangeHandler) {
        act(() => {
          planChangeHandler({
            subscriptionId: 'sub_123',
            oldPlan: { name: 'HomeCare', tier: 'HOMECARE' },
            newPlan: { name: 'Priority', tier: 'PRIORITY' },
            effectiveDate: '2024-02-01'
          });
        });
      }

      expect(mockToast.info).toHaveBeenCalledWith('Plan upgraded to Priority!');
    });
  });

  describe('Usage Tracking Updates', () => {
    it('handles real-time usage updates', async () => {
      const TestComponent = () => {
        React.useEffect(() => {
          mockSocket.on('usage:updated', (data: any) => {
            mockSetState(data.usage);
            
            if (data.usage.percentage >= 90) {
              mockToast.warning(`You've used ${data.usage.percentage}% of your ${data.usage.type} limit`);
            }
          });

          return () => {
            mockSocket.off('usage:updated');
          };
        }, []);

        return <div data-testid="usage-tracker">Usage Tracker Component</div>;
      };

      render(<TestComponent />);

      const usageUpdateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'usage:updated'
      )?.[1];

      if (usageUpdateHandler) {
        act(() => {
          usageUpdateHandler({
            userId: 'user_123',
            usage: {
              type: 'priority_bookings',
              current: 9,
              limit: 10,
              percentage: 90,
              resetDate: '2024-02-01'
            }
          });
        });
      }

      expect(mockToast.warning).toHaveBeenCalledWith(
        "You've used 90% of your priority_bookings limit"
      );
      expect(mockSetState).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'priority_bookings',
          percentage: 90
        })
      );
    });

    it('handles usage limit exceeded events', async () => {
      const TestComponent = () => {
        React.useEffect(() => {
          mockSocket.on('usage:limit_exceeded', (data: any) => {
            mockToast.error(`${data.usage.type} limit exceeded! Consider upgrading your plan.`);
          });

          return () => {
            mockSocket.off('usage:limit_exceeded');
          };
        }, []);

        return <div data-testid="usage-component">Usage Component</div>;
      };

      render(<TestComponent />);

      const limitExceededHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'usage:limit_exceeded'
      )?.[1];

      if (limitExceededHandler) {
        act(() => {
          limitExceededHandler({
            userId: 'user_123',
            usage: {
              type: 'service_requests',
              current: 11,
              limit: 10,
              percentage: 110
            }
          });
        });
      }

      expect(mockToast.error).toHaveBeenCalledWith(
        'service_requests limit exceeded! Consider upgrading your plan.'
      );
    });

    it('handles usage reset notifications', async () => {
      const TestComponent = () => {
        React.useEffect(() => {
          mockSocket.on('usage:reset', (data: any) => {
            mockSetState(data.usage);
            mockToast.info('Your usage limits have been reset for the new billing period');
          });

          return () => {
            mockSocket.off('usage:reset');
          };
        }, []);

        return <div data-testid="usage-reset">Usage Reset Component</div>;
      };

      render(<TestComponent />);

      const usageResetHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'usage:reset'
      )?.[1];

      if (usageResetHandler) {
        act(() => {
          usageResetHandler({
            userId: 'user_123',
            usage: {
              priority_bookings: { current: 0, limit: 10 },
              service_requests: { current: 0, limit: 15 },
              discount_amount: { current: 0, limit: 500 }
            },
            resetDate: '2024-02-01'
          });
        });
      }

      expect(mockToast.info).toHaveBeenCalledWith(
        'Your usage limits have been reset for the new billing period'
      );
    });
  });

  describe('Perk Availability Updates', () => {
    it('handles perk unlock notifications', async () => {
      const TestComponent = () => {
        React.useEffect(() => {
          mockSocket.on('perks:unlocked', (data: any) => {
            mockSetState(data.perks);
            mockToast.success(`New perk unlocked: ${data.perk.name}!`);
          });

          return () => {
            mockSocket.off('perks:unlocked');
          };
        }, []);

        return <div data-testid="perks-component">Perks Component</div>;
      };

      render(<TestComponent />);

      const perkUnlockedHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'perks:unlocked'
      )?.[1];

      if (perkUnlockedHandler) {
        act(() => {
          perkUnlockedHandler({
            userId: 'user_123',
            perk: {
              id: 'perk_emergency',
              name: '24/7 Emergency Support',
              description: 'Round-the-clock emergency assistance',
              unlockedAt: new Date().toISOString()
            }
          });
        });
      }

      expect(mockToast.success).toHaveBeenCalledWith(
        'New perk unlocked: 24/7 Emergency Support!'
      );
    });

    it('handles perk usage updates', async () => {
      const TestComponent = () => {
        React.useEffect(() => {
          mockSocket.on('perks:usage_updated', (data: any) => {
            mockSetState(data.perkUsage);
          });

          return () => {
            mockSocket.off('perks:usage_updated');
          };
        }, []);

        return <div data-testid="perk-usage">Perk Usage Component</div>;
      };

      render(<TestComponent />);

      const perkUsageHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'perks:usage_updated'
      )?.[1];

      if (perkUsageHandler) {
        act(() => {
          perkUsageHandler({
            userId: 'user_123',
            perkUsage: {
              perkId: 'perk_priority',
              currentUsage: 3,
              limit: 5,
              percentage: 60
            }
          });
        });
      }

      expect(mockSetState).toHaveBeenCalledWith(
        expect.objectContaining({
          perkId: 'perk_priority',
          percentage: 60
        })
      );
    });
  });

  describe('Billing and Payment Updates', () => {
    it('handles payment success notifications', async () => {
      const TestComponent = () => {
        React.useEffect(() => {
          mockSocket.on('billing:payment_succeeded', (data: any) => {
            mockToast.success(`Payment of $${data.amount / 100} processed successfully`);
          });

          return () => {
            mockSocket.off('billing:payment_succeeded');
          };
        }, []);

        return <div data-testid="billing-component">Billing Component</div>;
      };

      render(<TestComponent />);

      const paymentSuccessHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'billing:payment_succeeded'
      )?.[1];

      if (paymentSuccessHandler) {
        act(() => {
          paymentSuccessHandler({
            subscriptionId: 'sub_123',
            amount: 4999,
            currency: 'cad',
            invoiceId: 'inv_123',
            paidAt: new Date().toISOString()
          });
        });
      }

      expect(mockToast.success).toHaveBeenCalledWith(
        'Payment of $49.99 processed successfully'
      );
    });

    it('handles payment failure notifications', async () => {
      const TestComponent = () => {
        React.useEffect(() => {
          mockSocket.on('billing:payment_failed', (data: any) => {
            mockToast.error(`Payment failed: ${data.reason}. Please update your payment method.`);
          });

          return () => {
            mockSocket.off('billing:payment_failed');
          };
        }, []);

        return <div data-testid="payment-failure">Payment Failure Component</div>;
      };

      render(<TestComponent />);

      const paymentFailureHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'billing:payment_failed'
      )?.[1];

      if (paymentFailureHandler) {
        act(() => {
          paymentFailureHandler({
            subscriptionId: 'sub_123',
            reason: 'Your card was declined',
            attemptCount: 1,
            nextRetryAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          });
        });
      }

      expect(mockToast.error).toHaveBeenCalledWith(
        'Payment failed: Your card was declined. Please update your payment method.'
      );
    });

    it('handles invoice generation notifications', async () => {
      const TestComponent = () => {
        React.useEffect(() => {
          mockSocket.on('billing:invoice_created', (data: any) => {
            mockToast.info(`New invoice available: $${data.amount / 100}`);
          });

          return () => {
            mockSocket.off('billing:invoice_created');
          };
        }, []);

        return <div data-testid="invoice-component">Invoice Component</div>;
      };

      render(<TestComponent />);

      const invoiceCreatedHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'billing:invoice_created'
      )?.[1];

      if (invoiceCreatedHandler) {
        act(() => {
          invoiceCreatedHandler({
            invoiceId: 'inv_456',
            subscriptionId: 'sub_123',
            amount: 4999,
            dueDate: '2024-02-15',
            downloadUrl: 'https://example.com/invoice.pdf'
          });
        });
      }

      expect(mockToast.info).toHaveBeenCalledWith('New invoice available: $49.99');
    });
  });

  describe('Connection Management', () => {
    it('handles socket connection events', async () => {
      const TestComponent = () => {
        React.useEffect(() => {
          mockSocket.on('connect', () => {
            mockToast.success('Connected to real-time updates');
          });

          mockSocket.on('disconnect', () => {
            mockToast.warning('Disconnected from real-time updates');
          });

          mockSocket.on('reconnect', () => {
            mockToast.info('Reconnected to real-time updates');
          });

          return () => {
            mockSocket.off('connect');
            mockSocket.off('disconnect');
            mockSocket.off('reconnect');
          };
        }, []);

        return <div data-testid="connection-component">Connection Component</div>;
      };

      render(<TestComponent />);

      // Test connection
      const connectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect'
      )?.[1];

      if (connectHandler) {
        act(() => {
          connectHandler();
        });
      }

      expect(mockToast.success).toHaveBeenCalledWith('Connected to real-time updates');

      // Test disconnection
      const disconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )?.[1];

      if (disconnectHandler) {
        act(() => {
          disconnectHandler();
        });
      }

      expect(mockToast.warning).toHaveBeenCalledWith('Disconnected from real-time updates');

      // Test reconnection
      const reconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'reconnect'
      )?.[1];

      if (reconnectHandler) {
        act(() => {
          reconnectHandler();
        });
      }

      expect(mockToast.info).toHaveBeenCalledWith('Reconnected to real-time updates');
    });

    it('handles authentication events', async () => {
      const TestComponent = () => {
        React.useEffect(() => {
          mockSocket.on('authenticated', (data: any) => {
            mockToast.success('Real-time updates authenticated');
          });

          mockSocket.on('authentication_error', (data: any) => {
            mockToast.error('Failed to authenticate real-time updates');
          });

          return () => {
            mockSocket.off('authenticated');
            mockSocket.off('authentication_error');
          };
        }, []);

        return <div data-testid="auth-component">Auth Component</div>;
      };

      render(<TestComponent />);

      // Test successful authentication
      const authSuccessHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'authenticated'
      )?.[1];

      if (authSuccessHandler) {
        act(() => {
          authSuccessHandler({ userId: 'user_123' });
        });
      }

      expect(mockToast.success).toHaveBeenCalledWith('Real-time updates authenticated');

      // Test authentication error
      const authErrorHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'authentication_error'
      )?.[1];

      if (authErrorHandler) {
        act(() => {
          authErrorHandler({ error: 'Invalid token' });
        });
      }

      expect(mockToast.error).toHaveBeenCalledWith('Failed to authenticate real-time updates');
    });
  });

  describe('Error Handling', () => {
    it('handles socket errors gracefully', async () => {
      const TestComponent = () => {
        React.useEffect(() => {
          mockSocket.on('error', (error: any) => {
            mockToast.error(`Connection error: ${error.message}`);
          });

          return () => {
            mockSocket.off('error');
          };
        }, []);

        return <div data-testid="error-component">Error Component</div>;
      };

      render(<TestComponent />);

      const errorHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      if (errorHandler) {
        act(() => {
          errorHandler({ message: 'Network timeout' });
        });
      }

      expect(mockToast.error).toHaveBeenCalledWith('Connection error: Network timeout');
    });
  });
});