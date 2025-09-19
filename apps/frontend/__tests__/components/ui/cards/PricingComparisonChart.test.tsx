import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PricingComparisonChart from '../../../../components/ui/cards/PricingComparisonChart';

describe('PricingComparisonChart', () => {
  it('renders pricing comparison with provided values', () => {
    render(
      <PricingComparisonChart
        servicePrice={120}
        contractorPrice={180}
        savingsPercentage={33}
      />
    );
    
    expect(screen.getByText('Price Comparison')).toBeInTheDocument();
    expect(screen.getByText('Fixwell Price')).toBeInTheDocument();
    expect(screen.getByText('Typical Contractor')).toBeInTheDocument();
    expect(screen.getByText('$120.00')).toBeInTheDocument();
    expect(screen.getByText('$180.00')).toBeInTheDocument();
    expect(screen.getByText('Save 33%')).toBeInTheDocument();
  });

  it('calculates contractor price when not provided', () => {
    render(
      <PricingComparisonChart
        servicePrice={100}
      />
    );
    
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('$140.00')).toBeInTheDocument(); // 40% more expensive
  });

  it('calculates savings percentage correctly', () => {
    render(
      <PricingComparisonChart
        servicePrice={120}
        contractorPrice={180}
      />
    );
    
    // Savings should be calculated as ((180-120)/180)*100 = 33%
    expect(screen.getAllByText(/33%/)[0]).toBeInTheDocument();
  });

  it('displays savings amount correctly', () => {
    render(
      <PricingComparisonChart
        servicePrice={120}
        contractorPrice={180}
      />
    );
    
    expect(screen.getByText('$60.00')).toBeInTheDocument(); // 180 - 120 = 60
  });

  it('handles animation when enabled', async () => {
    const { container } = render(
      <PricingComparisonChart
        servicePrice={120}
        contractorPrice={180}
        animated={true}
      />
    );
    
    // Check for animation classes
    await waitFor(() => {
      const animatedElements = container.querySelectorAll('.transition-all');
      expect(animatedElements.length).toBeGreaterThan(0);
    });
  });

  it('applies custom className', () => {
    const { container } = render(
      <PricingComparisonChart
        servicePrice={120}
        className="custom-class"
      />
    );
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('shows proper visual indicators', () => {
    render(
      <PricingComparisonChart
        servicePrice={120}
        contractorPrice={180}
      />
    );
    
    // Check for icons
    const trendingIcon = document.querySelector('.lucide-trending-down');
    expect(trendingIcon).toBeInTheDocument();
  });

  it('handles edge case with same prices', () => {
    render(
      <PricingComparisonChart
        servicePrice={120}
        contractorPrice={120}
      />
    );
    
    expect(screen.getAllByText('$120.00')[0]).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument(); // No savings
    expect(screen.getByText('Save 0%')).toBeInTheDocument();
  });

  it('formats prices correctly', () => {
    render(
      <PricingComparisonChart
        servicePrice={99.99}
        contractorPrice={149.99}
      />
    );
    
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('$149.99')).toBeInTheDocument();
  });
});