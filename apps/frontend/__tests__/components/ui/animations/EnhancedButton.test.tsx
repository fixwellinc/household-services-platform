import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnhancedButton, ButtonPresets } from '@/components/ui/animations/EnhancedButton';

// Mock LoadingSpinner component
jest.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ className }: { className?: string }) => (
    <div className={className} data-testid="loading-spinner">Loading...</div>
  ),
}));

describe('EnhancedButton', () => {
  it('should render children correctly', () => {
    render(<EnhancedButton>Click me</EnhancedButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should apply variant classes correctly', () => {
    render(<EnhancedButton variant="premium">Premium Button</EnhancedButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gradient-to-r');
  });

  it('should show loading state correctly', () => {
    render(
      <EnhancedButton loading loadingText="Processing...">
        Submit
      </EnhancedButton>
    );
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toHaveClass('opacity-0');
  });

  it('should be disabled when loading', () => {
    render(<EnhancedButton loading>Submit</EnhancedButton>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should render icon in correct position', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;
    
    render(
      <EnhancedButton icon={<TestIcon />} iconPosition="left">
        Button with Icon
      </EnhancedButton>
    );
    
    const icon = screen.getByTestId('test-icon');
    const button = screen.getByRole('button');
    
    expect(icon).toBeInTheDocument();
    expect(button).toContainElement(icon);
  });

  it('should handle click events correctly', () => {
    const handleClick = jest.fn();
    render(<EnhancedButton onClick={handleClick}>Click me</EnhancedButton>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(
      <EnhancedButton onClick={handleClick} disabled>
        Disabled Button
      </EnhancedButton>
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should not call onClick when loading', () => {
    const handleClick = jest.fn();
    render(
      <EnhancedButton onClick={handleClick} loading>
        Loading Button
      </EnhancedButton>
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should create ripple effect on click', async () => {
    render(<EnhancedButton ripple>Ripple Button</EnhancedButton>);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    // Check if ripple element is created
    await waitFor(() => {
      const ripple = button.querySelector('.animate-ping');
      expect(ripple).toBeInTheDocument();
    });
  });

  it('should not create ripple when disabled', () => {
    render(
      <EnhancedButton ripple disabled>
        Disabled Ripple
      </EnhancedButton>
    );
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    const ripple = button.querySelector('.animate-ping');
    expect(ripple).not.toBeInTheDocument();
  });
});

describe('ButtonPresets', () => {
  it('should render CTA preset correctly', () => {
    render(<ButtonPresets.CTA>Call to Action</ButtonPresets.CTA>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gradient-to-r');
    expect(screen.getByText('Call to Action')).toBeInTheDocument();
  });

  it('should render Primary preset correctly', () => {
    render(<ButtonPresets.Primary>Primary Action</ButtonPresets.Primary>);
    expect(screen.getByText('Primary Action')).toBeInTheDocument();
  });

  it('should render Glass preset correctly', () => {
    render(<ButtonPresets.Glass>Glass Button</ButtonPresets.Glass>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('backdrop-blur-md');
  });

  it('should render Subtle preset correctly', () => {
    render(<ButtonPresets.Subtle>Subtle Button</ButtonPresets.Subtle>);
    expect(screen.getByText('Subtle Button')).toBeInTheDocument();
  });
});