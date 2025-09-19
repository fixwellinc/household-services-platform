import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessibleInput } from '@/components/ui/accessibility/AccessibleInput';
import { AccessibilityProvider } from '@/components/ui/accessibility/AccessibilityProvider';

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <AccessibilityProvider>
      {component}
    </AccessibilityProvider>
  );
};

describe('AccessibleInput', () => {
  it('renders with proper accessibility attributes', () => {
    renderWithProvider(
      <AccessibleInput 
        label="Email address" 
        type="email"
        id="email-input"
      />
    );

    const input = screen.getByLabelText('Email address');
    const label = screen.getByText('Email address');

    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('id', 'email-input');
    expect(label).toHaveAttribute('for', 'email-input');
  });

  it('shows required indicator', () => {
    renderWithProvider(
      <AccessibleInput 
        label="Required field" 
        required
      />
    );

    const requiredIndicator = screen.getByLabelText('required');
    expect(requiredIndicator).toBeInTheDocument();
    expect(requiredIndicator).toHaveTextContent('*');
  });

  it('displays error message with proper ARIA attributes', () => {
    renderWithProvider(
      <AccessibleInput 
        label="Email" 
        error="Please enter a valid email"
        id="email-input"
      />
    );

    const input = screen.getByLabelText('Email');
    const errorMessage = screen.getByRole('alert');

    expect(errorMessage).toHaveTextContent('Please enter a valid email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-input-error');
  });

  it('displays helper text', () => {
    renderWithProvider(
      <AccessibleInput 
        label="Password" 
        helperText="Must be at least 8 characters"
        id="password-input"
      />
    );

    const input = screen.getByLabelText('Password');
    const helperText = screen.getByText('Must be at least 8 characters');

    expect(helperText).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-describedby', 'password-input-helper');
  });

  it('combines error and helper text in aria-describedby', () => {
    renderWithProvider(
      <AccessibleInput 
        label="Username" 
        helperText="Choose a unique username"
        error="Username is already taken"
        id="username-input"
      />
    );

    const input = screen.getByLabelText('Username');
    expect(input).toHaveAttribute('aria-describedby', 'username-input-error username-input-helper');
  });

  it('handles focus and blur events', async () => {
    const user = userEvent.setup();
    const handleBlur = jest.fn();

    renderWithProvider(
      <AccessibleInput 
        label="Test input" 
        onBlur={handleBlur}
      />
    );

    const input = screen.getByLabelText('Test input');

    await user.click(input);
    expect(input).toHaveFocus();

    await user.tab();
    expect(handleBlur).toHaveBeenCalled();
  });

  it('supports hidden label', () => {
    renderWithProvider(
      <AccessibleInput 
        label="Search" 
        showLabel={false}
        placeholder="Search..."
      />
    );

    const label = screen.getByText('Search');
    expect(label).toHaveClass('sr-only');
  });

  it('handles change events', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    renderWithProvider(
      <AccessibleInput 
        label="Test input" 
        onChange={handleChange}
      />
    );

    const input = screen.getByLabelText('Test input');
    await user.type(input, 'test value');

    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('test value');
  });

  it('applies error styling', () => {
    renderWithProvider(
      <AccessibleInput 
        label="Email" 
        error="Invalid email"
      />
    );

    const input = screen.getByLabelText('Email');
    expect(input).toHaveClass('border-red-500');
  });

  it('supports disabled state', () => {
    renderWithProvider(
      <AccessibleInput 
        label="Disabled input" 
        disabled
      />
    );

    const input = screen.getByLabelText('Disabled input');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:opacity-50');
  });

  it('generates unique IDs when not provided', () => {
    const { container } = renderWithProvider(
      <div>
        <AccessibleInput label="First input" />
        <AccessibleInput label="Second input" />
      </div>
    );

    const inputs = container.querySelectorAll('input');
    expect(inputs[0].id).toBeTruthy();
    expect(inputs[1].id).toBeTruthy();
    expect(inputs[0].id).not.toBe(inputs[1].id);
  });
});