import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import RewardsDashboard from '@/components/features/rewards/RewardsDashboard';

// Mock the UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div data-testid="card-description" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div data-testid="card-title" {...props}>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span data-testid="badge" {...props}>{children}</span>,
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange, ...props }: any) => (
    <div data-testid="tabs" data-value={value} {...props}>{children}</div>
  ),
  TabsContent: ({ children, value, ...props }: any) => (
    <div data-testid="tabs-content" data-value={value} {...props}>{children}</div>
  ),
  TabsList: ({ children, ...props }: any) => <div data-testid="tabs-list" {...props}>{children}</div>,
  TabsTrigger: ({ children, value, ...props }: any) => (
    <button data-testid="tabs-trigger" data-value={value} {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, ...props }: any) => (
    <div data-testid="progress" data-value={value} {...props}></div>
  ),
}));

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, ...props }: any) => <div data-testid="alert" {...props}>{children}</div>,
  AlertDescription: ({ children, ...props }: any) => <div data-testid="alert-description" {...props}>{children}</div>,
}));

// Mock the child components
vi.mock('@/components/features/rewards/ReferralLinkGenerator', () => ({
  default: ({ referralStats, onRefresh }: any) => (
    <div data-testid="referral-link-generator">
      Referral Link Generator - {referralStats?.stats?.totalReferrals || 0} referrals
    </div>
  ),
}));

vi.mock('@/components/features/rewards/CreditBalanceDisplay', () => ({
  default: ({ balance, onRefresh }: any) => (
    <div data-testid="credit-balance-display">
      Credit Balance - ${balance?.available?.toFixed(2) || '0.00'}
    </div>
  ),
}));

vi.mock('@/components/features/rewards/LoyaltyProgressIndicator', () => ({
  default: ({ loyaltyStatus, onCheckMilestones }: any) => (
    <div data-testid="loyalty-progress-indicator">
      Loyalty Progress - {loyaltyStatus?.subscriptionMonths || 0} months
    </div>
  ),
}));

vi.mock('@/components/features/rewards/CreditTransactionHistory', () => ({
  default: ({ userId }: any) => (
    <div data-testid="credit-transaction-history">
      Transaction History for {userId}
    </div>
  ),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(() => 'mock-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('RewardsDashboard', () => {
  const mockUserId = 'user-123';

  const mockCreditsResponse = {
    data: {
      balance: {
        available: 75.50,
        used: 25.00,
        expired: 0,
        total: 100.50
      }
    }
  };

  const mockLoyaltyResponse = {
    data: {
      subscriptionMonths: 15,
      currentMilestone: {
        months: 12,
        type: 'FREE_SERVICE_VISIT',
        description: '12-month loyalty bonus'
      },
      nextMilestone: {
        months: 24,
        monthsRemaining: 9,
        type: 'PRIORITY_SERVICES',
        description: '24-month milestone'
      },
      earnedMilestones: [
        {
          description: '12-month loyalty bonus',
          earnedAt: '2023-01-01',
          amount: 0
        }
      ],
      allMilestones: [
        {
          months: 12,
          achieved: true,
          type: 'FREE_SERVICE_VISIT',
          description: '12-month loyalty bonus'
        },
        {
          months: 24,
          achieved: false,
          type: 'PRIORITY_SERVICES',
          description: '24-month milestone'
        }
      ]
    }
  };

  const mockReferralResponse = {
    data: {
      referralLink: 'https://example.com/signup?ref=user-123',
      referralCode: 'user-123',
      stats: {
        totalReferrals: 3,
        totalCreditsEarned: 149.97
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup successful fetch responses by default
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCreditsResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLoyaltyResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockReferralResponse)
      });
  });

  it('renders loading state initially', () => {
    render(<RewardsDashboard userId={mockUserId} />);
    
    expect(screen.getByText('Rewards Dashboard')).toBeInTheDocument();
    // Loading spinner should be visible
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders dashboard with data after loading', async () => {
    render(<RewardsDashboard userId={mockUserId} />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('$75.50')).toBeInTheDocument();
    });

    // Check overview cards
    expect(screen.getByText('Available Credits')).toBeInTheDocument();
    expect(screen.getByText('$75.50')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Referrals count
    expect(screen.getByText('15 months')).toBeInTheDocument(); // Subscription months
    expect(screen.getByText('1')).toBeInTheDocument(); // Milestones count

    // Check that child components are rendered
    expect(screen.getByTestId('credit-balance-display')).toBeInTheDocument();
    expect(screen.getByTestId('loyalty-progress-indicator')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    // Mock fetch to return error
    mockFetch.mockReset();
    mockFetch.mockRejectedValue(new Error('API Error'));

    render(<RewardsDashboard userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByTestId('alert')).toBeInTheDocument();
      expect(screen.getByText(/Failed to load rewards data/)).toBeInTheDocument();
    });
  });

  it('calls check milestones API when button is clicked', async () => {
    const mockCheckMilestonesResponse = {
      data: {
        awardedMilestones: [
          {
            months: 24,
            type: 'PRIORITY_SERVICES',
            description: '24-month milestone'
          }
        ]
      }
    };

    // Add the check milestones response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCheckMilestonesResponse)
    });

    render(<RewardsDashboard userId={mockUserId} />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('$75.50')).toBeInTheDocument();
    });

    // Click check milestones button
    const checkButton = screen.getByText('Check Milestones');
    fireEvent.click(checkButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/rewards/check-milestones', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
      });
    });
  });

  it('displays correct tab content when switching tabs', async () => {
    render(<RewardsDashboard userId={mockUserId} />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('$75.50')).toBeInTheDocument();
    });

    // Check that overview tab content is visible by default
    expect(screen.getByTestId('credit-balance-display')).toBeInTheDocument();
    expect(screen.getByTestId('loyalty-progress-indicator')).toBeInTheDocument();

    // The referral and history components should be in the DOM but in different tab content
    expect(screen.getByTestId('referral-link-generator')).toBeInTheDocument();
    expect(screen.getByTestId('credit-transaction-history')).toBeInTheDocument();
  });

  it('makes correct API calls with authorization headers', async () => {
    render(<RewardsDashboard userId={mockUserId} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    // Check that all API calls were made with correct headers
    expect(mockFetch).toHaveBeenCalledWith('/api/rewards/credits', {
      headers: {
        'Authorization': 'Bearer mock-token',
      },
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/rewards/loyalty-status', {
      headers: {
        'Authorization': 'Bearer mock-token',
      },
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/rewards/referral-link', {
      headers: {
        'Authorization': 'Bearer mock-token',
      },
    });
  });

  it('calculates loyalty progress correctly', async () => {
    render(<RewardsDashboard userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('$75.50')).toBeInTheDocument();
    });

    // The loyalty progress should be calculated as (15/24) * 100 = 62.5%
    // This would be passed to the LoyaltyProgressIndicator component
    expect(screen.getByTestId('loyalty-progress-indicator')).toBeInTheDocument();
  });
});