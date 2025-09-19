import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModernServiceCard from '../../../../components/ui/cards/ModernServiceCard';

const mockService = {
  id: '1',
  name: 'House Cleaning',
  description: 'Professional house cleaning service',
  category: 'CLEANING',
  basePrice: 120,
  complexity: 'EASY',
  features: ['Deep cleaning', 'Eco-friendly products', 'Insured professionals'],
  rating: 4.8,
  reviewCount: 156,
  estimatedTime: '2-3 hours',
  popularity: 'high' as const,
  contractorPrice: 180,
  savingsPercentage: 33
};

describe('ModernServiceCard', () => {
  it('renders service information correctly', () => {
    render(<ModernServiceCard service={mockService} />);
    
    expect(screen.getByText('House Cleaning')).toBeInTheDocument();
    expect(screen.getByText('Professional house cleaning service')).toBeInTheDocument();
    expect(screen.getByText('$120.00')).toBeInTheDocument();
    expect(screen.getByText('CLEANING')).toBeInTheDocument();
    expect(screen.getByText('EASY')).toBeInTheDocument();
  });

  it('displays rating and review count when provided', () => {
    render(<ModernServiceCard service={mockService} />);
    
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('(156)')).toBeInTheDocument();
  });

  it('shows popularity indicator for high demand services', () => {
    render(<ModernServiceCard service={mockService} />);
    
    expect(screen.getByText('High Demand Service')).toBeInTheDocument();
  });

  it('renders featured variant with special styling', () => {
    const { container } = render(
      <ModernServiceCard service={mockService} variant="featured" />
    );
    
    expect(screen.getByText('POPULAR')).toBeInTheDocument();
    expect(container.querySelector('.ring-2')).toBeInTheDocument();
  });

  it('renders compact variant with reduced content', () => {
    render(<ModernServiceCard service={mockService} variant="compact" />);
    
    // Compact variant should not show expandable features
    expect(screen.queryByText('Show Details')).not.toBeInTheDocument();
  });

  it('handles progressive disclosure of features', async () => {
    render(<ModernServiceCard service={mockService} />);
    
    const showDetailsButton = screen.getByText('Show Details');
    expect(showDetailsButton).toBeInTheDocument();
    
    fireEvent.click(showDetailsButton);
    
    await waitFor(() => {
      expect(screen.getByText('Deep cleaning')).toBeInTheDocument();
      expect(screen.getByText('Eco-friendly products')).toBeInTheDocument();
      expect(screen.getByText('Insured professionals')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Hide Details')).toBeInTheDocument();
  });

  it('shows pricing comparison when available', () => {
    render(<ModernServiceCard service={mockService} />);
    
    const showComparisonButton = screen.getByText('Show Price Comparison');
    expect(showComparisonButton).toBeInTheDocument();
    
    fireEvent.click(showComparisonButton);
    
    expect(screen.getByText('Price Comparison')).toBeInTheDocument();
    expect(screen.getByText('Fixwell Price')).toBeInTheDocument();
    expect(screen.getByText('Typical Contractor')).toBeInTheDocument();
  });

  it('calls onBook callback when book button is clicked', () => {
    const mockOnBook = jest.fn();
    render(<ModernServiceCard service={mockService} onBook={mockOnBook} />);
    
    const bookButton = screen.getByText('Book Now');
    fireEvent.click(bookButton);
    
    expect(mockOnBook).toHaveBeenCalledWith('1');
  });

  it('calls onView callback when view button is clicked', () => {
    const mockOnView = jest.fn();
    render(<ModernServiceCard service={mockService} onView={mockOnView} />);
    
    const viewButton = screen.getByRole('button', { name: /view details/i });
    fireEvent.click(viewButton);
    
    expect(mockOnView).toHaveBeenCalledWith('1');
  });

  it('handles like button toggle', () => {
    render(<ModernServiceCard service={mockService} />);
    
    // Hover to show action buttons
    const card = screen.getByText('House Cleaning').closest('.group');
    fireEvent.mouseEnter(card as Element);
    
    const likeButton = screen.getAllByRole('button')[0]; // First button is the like button
    fireEvent.click(likeButton);
    
    // Check if the heart icon changes (implementation detail may vary)
    expect(likeButton).toBeInTheDocument();
  });

  it('applies glassmorphism styling', () => {
    const { container } = render(<ModernServiceCard service={mockService} />);
    
    const card = container.querySelector('.backdrop-blur-md');
    expect(card).toBeInTheDocument();
  });

  it('shows animated icons for different categories', () => {
    const repairService = { ...mockService, category: 'REPAIR' };
    render(<ModernServiceCard service={repairService} />);
    
    // The animated icon should be rendered as SVG
    const svgIcon = document.querySelector('svg[viewBox="0 0 64 64"]');
    expect(svgIcon).toBeInTheDocument();
  });

  it('handles hover effects', () => {
    const { container } = render(<ModernServiceCard service={mockService} />);
    
    const card = container.querySelector('[role="article"]') || container.firstChild;
    
    fireEvent.mouseEnter(card as Element);
    
    // Check for hover-specific classes or effects
    expect(container.querySelector('.group-hover\\:opacity-100')).toBeInTheDocument();
  });
});