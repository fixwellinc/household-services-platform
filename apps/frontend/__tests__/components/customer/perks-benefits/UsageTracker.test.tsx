import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import UsageTracker from '@/components/customer/perks-benefits/UsageTracker';

// Mock the UI components
jest.mock('@/components/ui/shared', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardDescription: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <div className={className}>{children}</div>,
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
}));

const mockMetrics = [
  {
    id: 'metric_1',
    name: 'Service Requests',
    description: 'Number of service requests made',
    currentUsage: 3,
    limit: 10,
    unit: 'requests',
    category: 'SERVICES' as const,
    isUnlimited: false,
    resetPeriod: 'MONTHLY' as const,
    resetDate: '2024-02-01',
    trend: {
      direction: 'UP' as const,
      percentage: 25,
      period: 'last month'
    },
    history: [
      { period: '2024-01', usage: 2, date: '2024-01-31' },
      { period: '2023-12', usage: 4, date: '2023-12-31' }
    ]
  },
  {
    id: 'metric_2',
    name: 'Priority Bookings',
    description: 'Priority booking slots used',
    currentUsage: 8,
    limit: 10,
    unit: 'bookings',
    category: 'BOOKINGS' as const,
    isUnlimited: false,
    resetPeriod: 'MONTHLY' as const,
    resetDate: '2024-02-01',
    trend: {
      direction: 'DOWN' as const,
      percentage: 10,
      period: 'last month'
    },
    history: [
      { period: '2024-01', usage: 9, date: '2024-01-31' }
    ]
  },
  {
    id: 'metric_3',
    name: 'Support Tickets',
    description: 'Support tickets submitted',
    currentUsage: 5,
    limit: 0,
    unit: 'tickets',
    category: 'SUPPORT' as const,
    isUnlimited: true,
    resetPeriod: 'NEVER' as const,
    trend: {
      direction: 'STABLE' as const,
      percentage: 0,
      period: 'last month'
    },
    history: []
  },
  {
    id: 'metric_4',
    name: 'Discount Usage',
    description: 'Discount amount used',
    currentUsage: 95,
    limit: 100,
    unit: 'CAD',
    category: 'DISCOUNTS' as const,
    isUnlimited: false,
    resetPeriod: 'MONTHLY' as const,
    resetDate: '2024-02-01',
    trend: {
      direction: 'UP' as const,
      percentage: 50,
      period: 'last month'
    },
    history: []
  }
];

describe('UsageTracker', () => {
  const defaultProps = {
    metrics: mockMetrics,
    currentPeriodStart: '2024-01-01',
    currentPeriodEnd: '2024-01-31'
  };

  it('renders usage tracking header correctly', () => {
    render(<UsageTracker {...defaultProps} />);
    
    expect(screen.getByText('Usage Tracking')).toBeInTheDocument();
    expect(screen.getByText('Current period: Jan 1 - Jan 31')).toBeInTheDocument();
  });

  it('displays summary statistics correctly', () => {
    render(<UsageTracker {...defaultProps} />);
    
    expect(screen.getByText('4')).toBeInTheDocument(); // Total Metrics
    expect(screen.getByText('Total Metrics')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Unlimited
    expect(screen.getByText('Unlimited')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Warning (Priority Bookings at 80%)
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Critical (Discount Usage at 95%)
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('groups metrics by category correctly', () => {
    render(<UsageTracker {...defaultProps} />);
    
    expect(screen.getByText('Services Usage')).toBeInTheDocument();
    expect(screen.getByText('Bookings Usage')).toBeInTheDocument();
    expect(screen.getByText('Support Usage')).toBeInTheDocument();
    expect(screen.getByText('Discounts Usage')).toBeInTheDocument();
  });

  it('displays metric information correctly', () => {
    render(<UsageTracker {...defaultProps} />);
    
    expect(screen.getByText('Service Requests')).toBeInTheDocument();
    expect(screen.getByText('Number of service requests made')).toBeInTheDocument();
    expect(screen.getByText('3 of 10 requests')).toBeInTheDocument();
    expect(screen.getByText('7 remaining')).toBeInTheDocument();
  });

  it('shows usage percentages correctly', () => {
    render(<UsageTracker {...defaultProps} />);
    
    expect(screen.getByText('30%')).toBeInTheDocument(); // Service Requests (3/10)
    expect(screen.getByText('80%')).toBeInTheDocument(); // Priority Bookings (8/10)
    expect(screen.getByText('95%')).toBeInTheDocument(); // Discount Usage (95/100)
  });

  it('displays unlimited metrics correctly', () => {
    render(<UsageTracker {...defaultProps} />);
    
    expect(screen.getByText('5 tickets used (Unlimited)')).toBeInTheDocument();
  });

  it('shows trend information correctly', () => {
    render(<UsageTracker {...defaultProps} />);
    
    expect(screen.getByText('25% up vs last month')).toBeInTheDocument();
    expect(screen.getByText('10% down vs last month')).toBeInTheDocument();
    expect(screen.getByText('0% stable vs last month')).toBeInTheDocument();
  });

  it('displays reset dates correctly', () => {
    render(<UsageTracker {...defaultProps} />);
    
    expect(screen.getAllByText('Resets Feb 1')).toHaveLength(3); // Three metrics with reset dates
  });

  it('shows critical usage alerts', () => {
    render(<UsageTracker {...defaultProps} />);
    
    expect(screen.getByText('Usage Alert')).toBeInTheDocument();
    expect(screen.getByText("You're approaching your limit. Consider upgrading your plan.")).toBeInTheDocument();
  });

  it('calls onViewHistory when view history button is clicked', () => {
    const mockOnViewHistory = jest.fn();
    render(<UsageTracker {...defaultProps} onViewHistory={mockOnViewHistory} />);
    
    const viewHistoryButtons = screen.getAllByText('View Usage History');
    fireEvent.click(viewHistoryButtons[0]);
    
    expect(mockOnViewHistory).toHaveBeenCalledWith('metric_1');
  });

  it('calls onExportData when export button is clicked', () => {
    const mockOnExportData = jest.fn();
    render(<UsageTracker {...defaultProps} onExportData={mockOnExportData} />);
    
    const exportButton = screen.getByText('Export Data');
    fireEvent.click(exportButton);
    
    expect(mockOnExportData).toHaveBeenCalledTimes(1);
  });

  it('displays category badges with correct counts', () => {
    render(<UsageTracker {...defaultProps} />);
    
    expect(screen.getByText('1 metrics')).toBeInTheDocument(); // Each category has 1 metric
  });

  it('shows overall usage overview correctly', () => {
    render(<UsageTracker {...defaultProps} />);
    
    expect(screen.getByText('Usage Overview')).toBeInTheDocument();
    expect(screen.getByText('Your usage patterns for the current billing period')).toBeInTheDocument();
    
    // Total Usage: 3 + 8 + 5 + 95 = 111
    expect(screen.getByText('111')).toBeInTheDocument();
    expect(screen.getByText('Total Usage')).toBeInTheDocument();
    
    // Trending Up: Service Requests and Discount Usage = 2
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Trending Up')).toBeInTheDocument();
  });

  it('calculates average utilization correctly', () => {
    render(<UsageTracker {...defaultProps} />);
    
    // Average of non-unlimited metrics: (30% + 80% + 95%) / 3 = 68%
    expect(screen.getByText('68%')).toBeInTheDocument();
    expect(screen.getByText('Avg. Utilization')).toBeInTheDocument();
  });

  it('applies correct status colors for different usage levels', () => {
    const { container } = render(<UsageTracker {...defaultProps} />);
    
    // Should have green progress bar for normal usage (30%)
    expect(container.querySelector('.bg-blue-500')).toBeInTheDocument();
    
    // Should have yellow progress bar for warning usage (80%)
    expect(container.querySelector('.bg-yellow-500')).toBeInTheDocument();
    
    // Should have red progress bar for critical usage (95%)
    expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
  });

  it('handles metrics without history correctly', () => {
    render(<UsageTracker {...defaultProps} />);
    
    // Metrics without history should not show view history button
    const viewHistoryButtons = screen.getAllByText('View Usage History');
    expect(viewHistoryButtons).toHaveLength(2); // Only metrics with history
  });

  it('handles empty metrics array', () => {
    render(<UsageTracker {...defaultProps} metrics={[]} />);
    
    expect(screen.getByText('0')).toBeInTheDocument(); // Total Metrics
    expect(screen.getByText('Usage Overview')).toBeInTheDocument();
  });

  it('formats different units correctly', () => {
    render(<UsageTracker {...defaultProps} />);
    
    expect(screen.getByText('3 of 10 requests')).toBeInTheDocument();
    expect(screen.getByText('8 of 10 bookings')).toBeInTheDocument();
    expect(screen.getByText('5 tickets used (Unlimited)')).toBeInTheDocument();
    expect(screen.getByText('95 of 100 CAD')).toBeInTheDocument();
  });

  it('shows correct trend colors', () => {
    const { container } = render(<UsageTracker {...defaultProps} />);
    
    // UP trends should be green
    expect(container.querySelectorAll('.text-green-600')).toHaveLength(2);
    
    // DOWN trends should be red
    expect(container.querySelectorAll('.text-red-600')).toHaveLength(1);
    
    // STABLE trends should be gray
    expect(container.querySelectorAll('.text-gray-600')).toHaveLength(1);
  });
});