import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubscriptionStatus from '@/components/customer/subscription-overview/SubscriptionStatus';

// Mock the UI components
jest.mock('@/components/ui/shared', () => ({
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

describe('SubscriptionStatus', () => {
  it('renders active status correctly', () => {
    render(<SubscriptionStatus status="ACTIVE" />);
    
    expect(screen.getByText('Subscription Active')).toBeInTheDocument();
    expect(screen.getByText('All systems operational')).toBeInTheDocument();
    expect(screen.getByText('Your subscription is active and all features are available. Billing will continue as scheduled.')).toBeInTheDocument();
  });

  it('renders past due status with payment failure information', () => {
    render(
      <SubscriptionStatus 
        status="PAST_DUE"
        paymentFailureReason="Your card was declined"
        lastPaymentAttempt="2024-01-15T10:30:00Z"
        nextRetryDate="2024-01-16T10:30:00Z"
      />
    );
    
    expect(screen.getByText('Payment Past Due')).toBeInTheDocument();
    expect(screen.getByText('Payment Required')).toBeInTheDocument();
    expect(screen.getByText('Reason: Your card was declined')).toBeInTheDocument();
    expect(screen.getByText(/Last attempt:/)).toBeInTheDocument();
    expect(screen.getByText(/Next retry:/)).toBeInTheDocument();
  });

  it('renders cancelled status with cancellation information', () => {
    render(
      <SubscriptionStatus 
        status="CANCELLED"
        cancellationDate="2024-01-10"
        accessEndDate="2024-02-10"
      />
    );
    
    expect(screen.getByText('Subscription Cancelled')).toBeInTheDocument();
    expect(screen.getByText('Subscription Ended')).toBeInTheDocument();
    expect(screen.getByText('Cancelled on: January 10, 2024')).toBeInTheDocument();
    expect(screen.getByText('Access until: February 10, 2024')).toBeInTheDocument();
    expect(screen.getByText('Want to come back?')).toBeInTheDocument();
  });

  it('renders incomplete status correctly', () => {
    render(<SubscriptionStatus status="INCOMPLETE" />);
    
    expect(screen.getByText('Payment Incomplete')).toBeInTheDocument();
    expect(screen.getByText('Action Required')).toBeInTheDocument();
    expect(screen.getByText('3D Secure authentication')).toBeInTheDocument();
    expect(screen.getByText('Bank verification')).toBeInTheDocument();
  });

  it('renders paused status with resume date', () => {
    render(
      <SubscriptionStatus 
        status="PAUSED"
        pausedUntil="2024-02-15"
      />
    );
    
    expect(screen.getByText('Subscription Paused')).toBeInTheDocument();
    expect(screen.getByText('Temporarily Paused')).toBeInTheDocument();
    expect(screen.getByText('Resumes on: February 15, 2024')).toBeInTheDocument();
  });

  it('calls onRetryPayment when retry button is clicked', () => {
    const mockRetryPayment = jest.fn();
    render(
      <SubscriptionStatus 
        status="PAST_DUE"
        onRetryPayment={mockRetryPayment}
      />
    );
    
    const retryButton = screen.getByText('Retry Payment');
    fireEvent.click(retryButton);
    
    expect(mockRetryPayment).toHaveBeenCalledTimes(1);
  });

  it('calls onUpdatePaymentMethod when update payment method button is clicked', () => {
    const mockUpdatePayment = jest.fn();
    render(
      <SubscriptionStatus 
        status="PAST_DUE"
        onUpdatePaymentMethod={mockUpdatePayment}
      />
    );
    
    const updateButton = screen.getByText('Update Payment Method');
    fireEvent.click(updateButton);
    
    expect(mockUpdatePayment).toHaveBeenCalledTimes(1);
  });

  it('calls onReactivateSubscription when reactivate button is clicked', () => {
    const mockReactivate = jest.fn();
    render(
      <SubscriptionStatus 
        status="CANCELLED"
        onReactivateSubscription={mockReactivate}
      />
    );
    
    const reactivateButton = screen.getByText('Reactivate Subscription');
    fireEvent.click(reactivateButton);
    
    expect(mockReactivate).toHaveBeenCalledTimes(1);
  });

  it('calls onContactSupport when contact support button is clicked', () => {
    const mockContactSupport = jest.fn();
    render(
      <SubscriptionStatus 
        status="INCOMPLETE"
        onContactSupport={mockContactSupport}
      />
    );
    
    const contactButton = screen.getByText('Contact Support');
    fireEvent.click(contactButton);
    
    expect(mockContactSupport).toHaveBeenCalledTimes(1);
  });

  it('shows processing state correctly', () => {
    render(
      <SubscriptionStatus 
        status="PAST_DUE"
        onRetryPayment={() => {}}
        isProcessing={true}
      />
    );
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    const retryButton = screen.getByText('Processing...');
    expect(retryButton).toBeDisabled();
  });

  it('shows reactivating state correctly', () => {
    render(
      <SubscriptionStatus 
        status="CANCELLED"
        onReactivateSubscription={() => {}}
        isProcessing={true}
      />
    );
    
    expect(screen.getByText('Reactivating...')).toBeInTheDocument();
  });

  it('shows resuming state for paused subscriptions', () => {
    render(
      <SubscriptionStatus 
        status="PAUSED"
        onReactivateSubscription={() => {}}
        isProcessing={true}
      />
    );
    
    expect(screen.getByText('Resuming...')).toBeInTheDocument();
  });

  it('displays help section for problematic statuses', () => {
    render(<SubscriptionStatus status="PAST_DUE" />);
    
    expect(screen.getByText('Need Help?')).toBeInTheDocument();
    expect(screen.getByText(/If you're experiencing payment issues/)).toBeInTheDocument();
  });

  it('shows contact support link in help section', () => {
    const mockContactSupport = jest.fn();
    render(
      <SubscriptionStatus 
        status="INCOMPLETE"
        onContactSupport={mockContactSupport}
      />
    );
    
    const contactLink = screen.getByText('Contact support');
    fireEvent.click(contactLink);
    
    expect(mockContactSupport).toHaveBeenCalledTimes(1);
  });

  it('applies correct status badge styling', () => {
    const { container } = render(<SubscriptionStatus status="ACTIVE" />);
    
    const badge = container.querySelector('.bg-green-100');
    expect(badge).toBeInTheDocument();
  });

  it('applies correct status colors for different statuses', () => {
    const { rerender, container } = render(<SubscriptionStatus status="PAST_DUE" />);
    
    expect(container.querySelector('.bg-red-100')).toBeInTheDocument();
    
    rerender(<SubscriptionStatus status="CANCELLED" />);
    expect(container.querySelector('.bg-gray-100')).toBeInTheDocument();
    
    rerender(<SubscriptionStatus status="INCOMPLETE" />);
    expect(container.querySelector('.bg-yellow-100')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(
      <SubscriptionStatus 
        status="CANCELLED"
        cancellationDate="2024-01-15"
        accessEndDate="2024-02-15"
      />
    );
    
    expect(screen.getByText('Cancelled on: January 15, 2024')).toBeInTheDocument();
    expect(screen.getByText('Access until: February 15, 2024')).toBeInTheDocument();
  });

  it('formats date-time correctly for payment attempts', () => {
    render(
      <SubscriptionStatus 
        status="PAST_DUE"
        lastPaymentAttempt="2024-01-15T14:30:00Z"
        nextRetryDate="2024-01-16T14:30:00Z"
      />
    );
    
    expect(screen.getByText(/Last attempt: Jan 15, 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Next retry: Jan 16, 2024/)).toBeInTheDocument();
  });
});