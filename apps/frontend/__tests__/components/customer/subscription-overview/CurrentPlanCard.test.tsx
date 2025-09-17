import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CurrentPlanCard from '../../../../components/customer/subscription-overview/CurrentPlanCard';

// Mock the UI components
jest.mock('../../components/ui/shared', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardDescription: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <div className={className}>{children}</div>,
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
}));

const mockSubscription = {
  id: 'sub_123',
  tier: 'HOMECARE' as const,
  status: 'ACTIVE' as const,
  currentPeriodStart: '2024-01-01',
  currentPeriodEnd: '2024-02-01',
  paymentFrequency: 'MONTHLY' as const,
  nextPaymentAmount: 4999,
  plan: {
    name: 'HomeCare Plan',
    description: 'Perfect for regular home maintenance',
    monthlyPrice: 4999,
    yearlyPrice: 49999,
    features: [
      'Priority booking',
      '10% discount on services',
      'Free monthly consultation',
      '24/7 emergency support',
      'Loyalty rewards program'
    ]
  }
};

describe('CurrentPlanCard', () => {
  it('renders subscription information correctly', () => {
    render(<CurrentPlanCard subscription={mockSubscription} />);
    
    expect(screen.getByText('HomeCare Plan')).toBeInTheDocument();
    expect(screen.getByText('Perfect for regular home maintenance')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('displays pricing information correctly', () => {
    render(<CurrentPlanCard subscription={mockSubscription} />);
    
    expect(screen.getByText('$49.99')).toBeInTheDocument();
    expect(screen.getByText('Monthly billing')).toBeInTheDocument();
  });

  it('shows billing dates correctly', () => {
    render(<CurrentPlanCard subscription={mockSubscription} />);
    
    expect(screen.getByText('February 1, 2024')).toBeInTheDocument();
    expect(screen.getByText('January 1, 2024 - February 1, 2024')).toBeInTheDocument();
  });

  it('displays plan features correctly', () => {
    render(<CurrentPlanCard subscription={mockSubscription} />);
    
    expect(screen.getByText('Priority booking')).toBeInTheDocument();
    expect(screen.getByText('10% discount on services')).toBeInTheDocument();
    expect(screen.getByText('Free monthly consultation')).toBeInTheDocument();
    expect(screen.getByText('+2 more features')).toBeInTheDocument();
  });

  it('shows yearly savings for annual subscriptions', () => {
    const yearlySubscription = {
      ...mockSubscription,
      paymentFrequency: 'YEARLY' as const
    };
    
    render(<CurrentPlanCard subscription={yearlySubscription} />);
    
    expect(screen.getByText('Annual billing')).toBeInTheDocument();
    expect(screen.getByText(/Save.*per year/)).toBeInTheDocument();
  });

  it('calls onPlanChange when Change Plan button is clicked', () => {
    const mockOnPlanChange = jest.fn();
    render(
      <CurrentPlanCard 
        subscription={mockSubscription} 
        onPlanChange={mockOnPlanChange}
      />
    );
    
    const changePlanButton = screen.getByText('Change Plan');
    fireEvent.click(changePlanButton);
    
    expect(mockOnPlanChange).toHaveBeenCalledTimes(1);
  });

  it('calls onCancelSubscription when Cancel Subscription button is clicked', () => {
    const mockOnCancel = jest.fn();
    render(
      <CurrentPlanCard 
        subscription={mockSubscription} 
        onCancelSubscription={mockOnCancel}
      />
    );
    
    const cancelButton = screen.getByText('Cancel Subscription');
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('displays past due warning for past due subscriptions', () => {
    const pastDueSubscription = {
      ...mockSubscription,
      status: 'PAST_DUE' as const
    };
    
    render(<CurrentPlanCard subscription={pastDueSubscription} />);
    
    expect(screen.getByText('Payment Past Due')).toBeInTheDocument();
    expect(screen.getByText(/payment is overdue/i)).toBeInTheDocument();
  });

  it('displays cancellation information for cancelled subscriptions', () => {
    const cancelledSubscription = {
      ...mockSubscription,
      status: 'CANCELLED' as const
    };
    
    render(<CurrentPlanCard subscription={cancelledSubscription} />);
    
    expect(screen.getByText('Subscription Cancelled')).toBeInTheDocument();
    expect(screen.getByText(/retain access until/i)).toBeInTheDocument();
  });

  it('does not show action buttons for non-active subscriptions', () => {
    const cancelledSubscription = {
      ...mockSubscription,
      status: 'CANCELLED' as const
    };
    
    render(<CurrentPlanCard subscription={cancelledSubscription} />);
    
    expect(screen.queryByText('Change Plan')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancel Subscription')).not.toBeInTheDocument();
  });

  it('applies correct tier styling', () => {
    const { container } = render(<CurrentPlanCard subscription={mockSubscription} />);
    
    // Check for HOMECARE tier gradient class
    expect(container.querySelector('.from-purple-500')).toBeInTheDocument();
  });

  it('handles different subscription tiers correctly', () => {
    const starterSubscription = {
      ...mockSubscription,
      tier: 'STARTER' as const
    };
    
    const { container } = render(<CurrentPlanCard subscription={starterSubscription} />);
    
    // Check for STARTER tier gradient class
    expect(container.querySelector('.from-blue-500')).toBeInTheDocument();
  });
});