import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessibleButton } from '@/components/ui/accessibility/AccessibleButton';
import { AccessibilityProvider } from '@/components/ui/accessibility/AccessibilityProvider';

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <AccessibilityProvider>
      {component}
    </AccessibilityProvider>
  );
};

describe('AccessibleButton', () => {
  it('renders with proper accessibility attributes', () => {
    renderWithProvider(
      <AccessibleButton id="test-button">
        Click me
      </AccessibleButton>
    );

    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
  });

  it('handles loading state with proper announcements', () => {
    renderWithProvider(
      <AccessibleButton id="test-button" loading loadingText="Processing...">
        Submit
      </AccessibleButton>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('aria-describedby', 'test-button-loading');
    expect(screen.getByText('Processing...')).toHaveClass('sr-only');
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    renderWithProvider(
      <AccessibleButton onClick={handleClick}>
        Click me
      </AccessibleButton>
    );

    const button = screen.getByRole('button');
    
    // Focus with tab
    await user.tab();
    expect(button).toHaveFocus();

    // Activate with Enter
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);

    // Activate with Space
    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('respects disabled state', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    renderWithProvider(
      <AccessibleButton disabled onClick={handleClick}>
        Disabled button
      </AccessibleButton>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');

    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies correct size classes', () => {
    const { rerender } = renderWithProvider(
      <AccessibleButton size="sm">Small</AccessibleButton>
    );

    let button = screen.getByRole('button');
    expect(button).toHaveClass('min-h-[36px]');

    rerender(
      <AccessibilityProvider>
        <AccessibleButton size="lg">Large</AccessibleButton>
      </AccessibilityProvider>
    );

    button = screen.getByRole('button');
    expect(button).toHaveClass('min-h-[48px]');
  });

  it('applies correct variant styles', () => {
    const { rerender } = renderWithProvider(
      <AccessibleButton variant="primary">Primary</AccessibleButton>
    );

    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600');

    rerender(
      <AccessibilityProvider>
        <AccessibleButton variant="secondary">Secondary</AccessibleButton>
      </AccessibilityProvider>
    );

    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-200');
  });

  it('shows loading spinner when loading', () => {
    renderWithProvider(
      <AccessibleButton loading>
        Loading button
      </AccessibleButton>
    );

    const spinner = screen.getByRole('button').querySelector('svg');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('handles focus management correctly', async () => {
    const user = userEvent.setup();

    renderWithProvider(
      <div>
        <AccessibleButton>First</AccessibleButton>
        <AccessibleButton>Second</AccessibleButton>
      </div>
    );

    const firstButton = screen.getByRole('button', { name: 'First' });
    const secondButton = screen.getByRole('button', { name: 'Second' });

    await user.tab();
    expect(firstButton).toHaveFocus();

    await user.tab();
    expect(secondButton).toHaveFocus();
  });
});