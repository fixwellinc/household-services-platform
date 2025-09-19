import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TouchOptimizedButton } from '@/components/ui/touch/TouchOptimizedButton';

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: jest.fn(),
});

describe('TouchOptimizedButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<TouchOptimizedButton>Test Button</TouchOptimizedButton>);
    
    const button = screen.getByRole('button', { name: 'Test Button' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('h-12'); // Default size
  });

  it('applies touch-optimized sizing', () => {
    render(<TouchOptimizedButton size="lg">Large Button</TouchOptimizedButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-14'); // Large size
    expect(button).toHaveClass('min-w-[56px]'); // Minimum touch target
  });

  it('handles touch events with haptic feedback', () => {
    const onTouchStart = jest.fn();
    const onTouchEnd = jest.fn();
    
    render(
      <TouchOptimizedButton 
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        hapticFeedback={true}
      >
        Touch Button
      </TouchOptimizedButton>
    );
    
    const button = screen.getByRole('button');
    
    // Simulate touch start
    fireEvent.touchStart(button, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    
    expect(onTouchStart).toHaveBeenCalled();
    expect(navigator.vibrate).toHaveBeenCalledWith(10);
    
    // Simulate touch end
    fireEvent.touchEnd(button);
    expect(onTouchEnd).toHaveBeenCalled();
  });

  it('creates ripple effect on touch', async () => {
    render(<TouchOptimizedButton touchRipple={true}>Ripple Button</TouchOptimizedButton>);
    
    const button = screen.getByRole('button');
    
    // Simulate touch with coordinates
    fireEvent.touchStart(button, {
      touches: [{ clientX: 50, clientY: 50 }],
    });
    
    // Check for ripple element
    await waitFor(() => {
      const ripple = button.querySelector('.animate-ping');
      expect(ripple).toBeInTheDocument();
    });
  });

  it('shows loading state correctly', () => {
    render(
      <TouchOptimizedButton loading={true} loadingText="Processing...">
        Submit
      </TouchOptimizedButton>
    );
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders with icon in correct position', () => {
    const TestIcon = () => <span data-testid="test-icon">🔧</span>;
    
    render(
      <TouchOptimizedButton 
        icon={<TestIcon />} 
        iconPosition="left"
      >
        Button Text
      </TouchOptimizedButton>
    );
    
    const icon = screen.getByTestId('test-icon');
    const button = screen.getByRole('button');
    
    expect(icon).toBeInTheDocument();
    expect(button).toContainElement(icon);
  });

  it('applies touch feedback classes', () => {
    render(
      <TouchOptimizedButton touchFeedback="medium">
        Feedback Button
      </TouchOptimizedButton>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('active:scale-90');
  });

  it('handles click events with ripple', async () => {
    const onClick = jest.fn();
    
    render(
      <TouchOptimizedButton onClick={onClick} touchRipple={true}>
        Click Button
      </TouchOptimizedButton>
    );
    
    const button = screen.getByRole('button');
    
    // Mock getBoundingClientRect for ripple positioning
    button.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      width: 100,
      height: 50,
      right: 100,
      bottom: 50,
      x: 0,
      y: 0,
      toJSON: jest.fn(),
    }));
    
    fireEvent.click(button, { clientX: 50, clientY: 25 });
    
    expect(onClick).toHaveBeenCalled();
    expect(navigator.vibrate).toHaveBeenCalledWith(10);
    
    // Check for ripple
    await waitFor(() => {
      const ripple = button.querySelector('.animate-ping');
      expect(ripple).toBeInTheDocument();
    });
  });

  it('disables interactions when disabled', () => {
    const onClick = jest.fn();
    
    render(
      <TouchOptimizedButton disabled onClick={onClick}>
        Disabled Button
      </TouchOptimizedButton>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(navigator.vibrate).not.toHaveBeenCalled();
  });

  it('supports different variants', () => {
    const { rerender } = render(
      <TouchOptimizedButton variant="premium">Premium</TouchOptimizedButton>
    );
    
    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gradient-to-r');
    expect(button).toHaveClass('from-purple-600');
    
    rerender(<TouchOptimizedButton variant="outline">Outline</TouchOptimizedButton>);
    
    button = screen.getByRole('button');
    expect(button).toHaveClass('border-2');
    expect(button).toHaveClass('border-primary-200');
  });

  it('maintains minimum touch target size for icon buttons', () => {
    render(
      <TouchOptimizedButton size="icon">
        <span>🔧</span>
      </TouchOptimizedButton>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-12');
    expect(button).toHaveClass('w-12');
    expect(button).toHaveClass('min-w-[48px]');
  });

  it('removes ripples after animation timeout', async () => {
    jest.useFakeTimers();
    
    render(<TouchOptimizedButton touchRipple={true}>Ripple Test</TouchOptimizedButton>);
    
    const button = screen.getByRole('button');
    button.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      width: 100,
      height: 50,
      right: 100,
      bottom: 50,
      x: 0,
      y: 0,
      toJSON: jest.fn(),
    }));
    
    fireEvent.click(button, { clientX: 50, clientY: 25 });
    
    // Ripple should be present
    await waitFor(() => {
      expect(button.querySelector('.animate-ping')).toBeInTheDocument();
    });
    
    // Fast-forward time to trigger ripple removal
    jest.advanceTimersByTime(600);
    
    await waitFor(() => {
      expect(button.querySelector('.animate-ping')).not.toBeInTheDocument();
    });
    
    jest.useRealTimers();
  });
});