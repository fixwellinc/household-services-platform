import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PerksList from '@/components/customer/perks-benefits/PerksList';

// Mock the UI components
jest.mock('@/components/ui/shared', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
}));

const mockPerks = [
  {
    id: 'perk_1',
    name: 'Priority Booking',
    description: 'Skip the queue and get priority scheduling',
    icon: 'star',
    isIncluded: true,
    isPremium: false,
    requiredTier: 'STARTER' as const,
    usageLimit: 5,
    currentUsage: 2,
    category: 'BOOKING' as const
  },
  {
    id: 'perk_2',
    name: '24/7 Emergency Support',
    description: 'Round-the-clock emergency assistance',
    icon: 'phone',
    isIncluded: true,
    isPremium: true,
    requiredTier: 'HOMECARE' as const,
    category: 'SUPPORT' as const
  },
  {
    id: 'perk_3',
    name: 'Premium Concierge',
    description: 'Dedicated concierge service',
    icon: 'crown',
    isIncluded: false,
    isPremium: true,
    requiredTier: 'PRIORITY' as const,
    category: 'EXCLUSIVE' as const
  },
  {
    id: 'perk_4',
    name: '15% Service Discount',
    description: 'Save on all service bookings',
    icon: 'percent',
    isIncluded: true,
    isPremium: false,
    requiredTier: 'HOMECARE' as const,
    category: 'BILLING' as const
  }
];

describe('PerksList', () => {
  it('renders perks grouped by category', () => {
    render(<PerksList userTier="HOMECARE" perks={mockPerks} />);
    
    expect(screen.getByText('Booking Benefits')).toBeInTheDocument();
    expect(screen.getByText('Support Benefits')).toBeInTheDocument();
    expect(screen.getByText('Exclusive Benefits')).toBeInTheDocument();
    expect(screen.getByText('Billing Benefits')).toBeInTheDocument();
  });

  it('displays accessible perks correctly', () => {
    render(<PerksList userTier="HOMECARE" perks={mockPerks} />);
    
    expect(screen.getByText('Priority Booking')).toBeInTheDocument();
    expect(screen.getByText('24/7 Emergency Support')).toBeInTheDocument();
    expect(screen.getByText('15% Service Discount')).toBeInTheDocument();
  });

  it('shows usage tracking for perks with limits', () => {
    render(<PerksList userTier="HOMECARE" perks={mockPerks} />);
    
    expect(screen.getByText('2 of 5 used')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('displays unlimited indicator for perks without limits', () => {
    render(<PerksList userTier="HOMECARE" perks={mockPerks} />);
    
    // Emergency support should show unlimited
    expect(screen.getByText('Unlimited')).toBeInTheDocument();
  });

  it('shows premium badges for premium perks', () => {
    render(<PerksList userTier="HOMECARE" perks={mockPerks} />);
    
    const premiumBadges = screen.getAllByText('Premium');
    expect(premiumBadges).toHaveLength(2); // Emergency Support and Premium Concierge
  });

  it('displays locked perks with upgrade prompts', () => {
    render(<PerksList userTier="HOMECARE" perks={mockPerks} />);
    
    expect(screen.getByText('Premium Concierge')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to Priority')).toBeInTheDocument();
  });

  it('calls onUpgradeClick when upgrade button is clicked', () => {
    const mockOnUpgrade = jest.fn();
    render(<PerksList userTier="HOMECARE" perks={mockPerks} onUpgradeClick={mockOnUpgrade} />);
    
    const upgradeButton = screen.getByText('Upgrade to Priority');
    fireEvent.click(upgradeButton);
    
    expect(mockOnUpgrade).toHaveBeenCalledWith('PRIORITY');
  });

  it('shows correct tier badge in header', () => {
    render(<PerksList userTier="HOMECARE" perks={mockPerks} />);
    
    expect(screen.getByText('HomeCare Plan')).toBeInTheDocument();
  });

  it('displays category counts correctly', () => {
    render(<PerksList userTier="HOMECARE" perks={mockPerks} />);
    
    expect(screen.getByText('1 of 1')).toBeInTheDocument(); // Booking category
    expect(screen.getByText('1 of 1')).toBeInTheDocument(); // Support category
    expect(screen.getByText('0 of 1')).toBeInTheDocument(); // Exclusive category (locked)
    expect(screen.getByText('1 of 1')).toBeInTheDocument(); // Billing category
  });

  it('shows total benefits summary', () => {
    render(<PerksList userTier="HOMECARE" perks={mockPerks} />);
    
    expect(screen.getByText('Total Benefits')).toBeInTheDocument();
    expect(screen.getByText('You have access to 3 out of 4 available perks')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Active Perks count
    expect(screen.getByText('Active Perks')).toBeInTheDocument();
  });

  it('applies correct styling for accessible vs locked perks', () => {
    const { container } = render(<PerksList userTier="HOMECARE" perks={mockPerks} />);
    
    // Check for green checkmark icons (accessible perks)
    expect(container.querySelectorAll('.text-green-600')).toHaveLength(3);
    
    // Check for gray lock icons (locked perks)
    expect(container.querySelectorAll('.text-gray-400')).toHaveLength(1);
  });

  it('handles different tier levels correctly', () => {
    render(<PerksList userTier="STARTER" perks={mockPerks} />);
    
    // STARTER tier should only have access to STARTER perks
    expect(screen.getByText('You have access to 1 out of 4 available perks')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to HomeCare')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to Priority')).toBeInTheDocument();
  });

  it('shows all perks as accessible for PRIORITY tier', () => {
    render(<PerksList userTier="PRIORITY" perks={mockPerks} />);
    
    expect(screen.getByText('You have access to 4 out of 4 available perks')).toBeInTheDocument();
    expect(screen.queryByText(/Upgrade to/)).not.toBeInTheDocument();
  });

  it('displays usage progress bars with correct colors', () => {
    const highUsagePerk = {
      ...mockPerks[0],
      currentUsage: 4, // 80% usage
      usageLimit: 5
    };
    
    render(<PerksList userTier="HOMECARE" perks={[highUsagePerk]} />);
    
    expect(screen.getByText('4 of 5 used')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('shows critical usage warning for near-limit perks', () => {
    const criticalUsagePerk = {
      ...mockPerks[0],
      currentUsage: 5, // 100% usage
      usageLimit: 5
    };
    
    const { container } = render(<PerksList userTier="HOMECARE" perks={[criticalUsagePerk]} />);
    
    expect(screen.getByText('5 of 5 used')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    
    // Should show red progress bar for 100% usage
    expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
  });

  it('handles perks without required tier correctly', () => {
    const universalPerk = {
      ...mockPerks[0],
      requiredTier: undefined
    };
    
    render(<PerksList userTier="STARTER" perks={[universalPerk]} />);
    
    expect(screen.getByText('Priority Booking')).toBeInTheDocument();
    // Should be accessible regardless of tier
  });

  it('displays correct tier names in upgrade prompts', () => {
    render(<PerksList userTier="STARTER" perks={mockPerks} />);
    
    expect(screen.getByText('Upgrade to HomeCare')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to Priority')).toBeInTheDocument();
  });
});