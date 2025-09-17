import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BillingInformation from '@/components/customer/subscription-overview/BillingInformation';

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

const mockPaymentMethods = [
  {
    id: 'pm_123',
    type: 'card' as const,
    last4: '4242',
    brand: 'visa',
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true
  },
  {
    id: 'pm_456',
    type: 'card' as const,
    last4: '1234',
    brand: 'mastercard',
    expiryMonth: 6,
    expiryYear: 2026,
    isDefault: false
  }
];

const mockInvoices = [
  {
    id: 'inv_123',
    number: 'INV-001',
    amount: 4999,
    currency: 'CAD',
    status: 'paid' as const,
    date: '2024-01-01',
    downloadUrl: 'https://example.com/invoice.pdf',
    hostedInvoiceUrl: 'https://example.com/invoice',
    description: 'HomeCare Plan - Monthly'
  },
  {
    id: 'inv_456',
    number: 'INV-002',
    amount: 4999,
    currency: 'CAD',
    status: 'pending' as const,
    date: '2024-02-01',
    dueDate: '2024-02-15',
    description: 'HomeCare Plan - Monthly'
  },
  {
    id: 'inv_789',
    number: 'INV-003',
    amount: 4999,
    currency: 'CAD',
    status: 'failed' as const,
    date: '2024-03-01',
    dueDate: '2024-03-15',
    description: 'HomeCare Plan - Monthly'
  }
];

describe('BillingInformation', () => {
  it('renders payment method information correctly', () => {
    render(
      <BillingInformation 
        paymentMethods={mockPaymentMethods}
        invoices={[]}
      />
    );
    
    expect(screen.getByText('💳 •••• 4242')).toBeInTheDocument();
    expect(screen.getByText('Expires 12/25')).toBeInTheDocument();
    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('displays multiple payment methods correctly', () => {
    render(
      <BillingInformation 
        paymentMethods={mockPaymentMethods}
        invoices={[]}
      />
    );
    
    expect(screen.getByText('Other Payment Methods')).toBeInTheDocument();
    expect(screen.getByText('💳 •••• 1234')).toBeInTheDocument();
  });

  it('shows no payment method warning when none exists', () => {
    render(
      <BillingInformation 
        paymentMethods={[]}
        invoices={[]}
      />
    );
    
    expect(screen.getByText('No payment method on file')).toBeInTheDocument();
    expect(screen.getByText('Add Method')).toBeInTheDocument();
  });

  it('displays invoice history correctly', () => {
    render(
      <BillingInformation 
        paymentMethods={mockPaymentMethods}
        invoices={mockInvoices}
      />
    );
    
    expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
    expect(screen.getByText('$49.99')).toBeInTheDocument();
    expect(screen.getByText('Invoice #INV-001')).toBeInTheDocument();
    expect(screen.getByText('PAID')).toBeInTheDocument();
  });

  it('shows different invoice statuses correctly', () => {
    render(
      <BillingInformation 
        paymentMethods={mockPaymentMethods}
        invoices={mockInvoices}
      />
    );
    
    expect(screen.getByText('PAID')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('FAILED')).toBeInTheDocument();
  });

  it('displays failed payment information', () => {
    render(
      <BillingInformation 
        paymentMethods={mockPaymentMethods}
        invoices={mockInvoices}
      />
    );
    
    expect(screen.getByText('Payment failed - Due: Mar 15, 2024')).toBeInTheDocument();
  });

  it('calls onUpdatePaymentMethod when update button is clicked', () => {
    const mockOnUpdate = jest.fn();
    render(
      <BillingInformation 
        paymentMethods={mockPaymentMethods}
        invoices={[]}
        onUpdatePaymentMethod={mockOnUpdate}
      />
    );
    
    const updateButtons = screen.getAllByText('Update');
    fireEvent.click(updateButtons[0]);
    
    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
  });

  it('calls onDownloadInvoice when download button is clicked', () => {
    const mockOnDownload = jest.fn();
    render(
      <BillingInformation 
        paymentMethods={mockPaymentMethods}
        invoices={mockInvoices}
        onDownloadInvoice={mockOnDownload}
      />
    );
    
    // Find download buttons (they have title="Download Invoice")
    const downloadButtons = screen.getAllByTitle('Download Invoice');
    fireEvent.click(downloadButtons[0]);
    
    expect(mockOnDownload).toHaveBeenCalledWith('inv_123');
  });

  it('calls onViewInvoice when view button is clicked', () => {
    const mockOnView = jest.fn();
    render(
      <BillingInformation 
        paymentMethods={mockPaymentMethods}
        invoices={mockInvoices}
        onViewInvoice={mockOnView}
      />
    );
    
    // Find view buttons (they have title="View Invoice")
    const viewButtons = screen.getAllByTitle('View Invoice');
    fireEvent.click(viewButtons[0]);
    
    expect(mockOnView).toHaveBeenCalledWith('inv_123');
  });

  it('shows "View All" button when there are more than 5 invoices', () => {
    const manyInvoices = Array.from({ length: 7 }, (_, i) => ({
      ...mockInvoices[0],
      id: `inv_${i}`,
      number: `INV-${i.toString().padStart(3, '0')}`
    }));

    render(
      <BillingInformation 
        paymentMethods={mockPaymentMethods}
        invoices={manyInvoices}
      />
    );
    
    expect(screen.getByText('View All (7)')).toBeInTheDocument();
  });

  it('expands invoice list when "View All" is clicked', () => {
    const manyInvoices = Array.from({ length: 7 }, (_, i) => ({
      ...mockInvoices[0],
      id: `inv_${i}`,
      number: `INV-${i.toString().padStart(3, '0')}`
    }));

    render(
      <BillingInformation 
        paymentMethods={mockPaymentMethods}
        invoices={manyInvoices}
      />
    );
    
    const viewAllButton = screen.getByText('View All (7)');
    fireEvent.click(viewAllButton);
    
    expect(screen.getByText('Show Less')).toBeInTheDocument();
  });

  it('shows empty state when no invoices exist', () => {
    render(
      <BillingInformation 
        paymentMethods={mockPaymentMethods}
        invoices={[]}
      />
    );
    
    expect(screen.getByText('No billing history available')).toBeInTheDocument();
    expect(screen.getByText('Your invoices will appear here once billing begins')).toBeInTheDocument();
  });

  it('handles loading state correctly', () => {
    render(
      <BillingInformation 
        paymentMethods={mockPaymentMethods}
        invoices={[]}
        isLoading={true}
      />
    );
    
    const updateButtons = screen.getAllByText('Update');
    expect(updateButtons[0]).toBeDisabled();
  });

  it('formats currency correctly for different currencies', () => {
    const usdInvoice = {
      ...mockInvoices[0],
      currency: 'USD'
    };

    render(
      <BillingInformation 
        paymentMethods={mockPaymentMethods}
        invoices={[usdInvoice]}
      />
    );
    
    // Should still format as CAD since we're using en-CA locale
    expect(screen.getByText('$49.99')).toBeInTheDocument();
  });

  it('handles bank account payment methods correctly', () => {
    const bankPaymentMethod = {
      id: 'pm_bank',
      type: 'bank_account' as const,
      last4: '1234',
      isDefault: true
    };

    render(
      <BillingInformation 
        paymentMethods={[bankPaymentMethod]}
        invoices={[]}
      />
    );
    
    expect(screen.getByText('🏦 •••• 1234')).toBeInTheDocument();
    expect(screen.getByText('Bank Account')).toBeInTheDocument();
  });
});