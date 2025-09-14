import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PaymentFrequencySelector from '@/components/features/payment/PaymentFrequencySelector';

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => 'mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('PaymentFrequencySelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // Mock fetch to return a pending promise
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<PaymentFrequencySelector />);
    
    expect(screen.getByText('Payment Frequency')).toBeInTheDocument();
    expect(screen.getByText('Loading frequency options...')).toBeInTheDocument();
  });

  it('renders frequency options when loaded', async () => {
    const mockOptions = [
      {
        frequency: 'MONTHLY',
        planTier: 'STARTER',
        frequencyConfig: {
          multiplier: 1,
          periodsPerYear: 12,
          discount: 0,
          label: 'Monthly',
          description: 'Charged every month'
        },
        pricing: {
          monthlyBasePrice: 29.99,
          paymentAmount: 29.99,
          baseAmount: 29.99,
          discountAmount: 0,
          discountPercentage: 0
        },
        annual: {
          totalPayments: 359.88,
          totalDiscount: 0,
          savingsVsMonthly: 0,
          savingsPercentage: 0
        },
        schedule: {
          periodsPerYear: 12,
          label: 'Monthly',
          description: 'Charged every month'
        }
      },
      {
        frequency: 'QUARTERLY',
        planTier: 'STARTER',
        frequencyConfig: {
          multiplier: 3,
          periodsPerYear: 4,
          discount: 0.05,
          label: 'Quarterly',
          description: 'Charged every 3 months (5% discount)'
        },
        pricing: {
          monthlyBasePrice: 29.99,
          paymentAmount: 85.47,
          baseAmount: 89.97,
          discountAmount: 4.50,
          discountPercentage: 5
        },
        annual: {
          totalPayments: 341.88,
          totalDiscount: 18.00,
          savingsVsMonthly: 18.00,
          savingsPercentage: 5.0
        },
        schedule: {
          periodsPerYear: 4,
          label: 'Quarterly',
          description: 'Charged every 3 months (5% discount)'
        },
        recommended: true
      }
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        options: mockOptions
      })
    });

    render(<PaymentFrequencySelector />);
    
    // Wait for the component to load
    await screen.findByText('Monthly');
    
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('Quarterly')).toBeInTheDocument();
    expect(screen.getByText('Recommended')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByText('$85.47')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    // Mock console.error to avoid test output noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<PaymentFrequencySelector />);
    
    // Wait for error handling
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(consoleSpy).toHaveBeenCalledWith('Error fetching frequency options:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  it('calls onFrequencySelect when a frequency is selected', async () => {
    const mockOnSelect = jest.fn();
    const mockOptions = [
      {
        frequency: 'MONTHLY',
        planTier: 'STARTER',
        frequencyConfig: {
          multiplier: 1,
          periodsPerYear: 12,
          discount: 0,
          label: 'Monthly',
          description: 'Charged every month'
        },
        pricing: {
          monthlyBasePrice: 29.99,
          paymentAmount: 29.99,
          baseAmount: 29.99,
          discountAmount: 0,
          discountPercentage: 0
        },
        annual: {
          totalPayments: 359.88,
          totalDiscount: 0,
          savingsVsMonthly: 0,
          savingsPercentage: 0
        },
        schedule: {
          periodsPerYear: 12,
          label: 'Monthly',
          description: 'Charged every month'
        }
      }
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        options: mockOptions
      })
    });

    render(<PaymentFrequencySelector onFrequencySelect={mockOnSelect} />);
    
    // Wait for the component to load
    const monthlyOption = await screen.findByText('Monthly');
    
    // Click on the monthly option
    monthlyOption.closest('div')?.click();
    
    expect(mockOnSelect).toHaveBeenCalledWith('MONTHLY', mockOptions[0]);
  });
});