import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TouchOptimizedInput } from '@/components/ui/touch/TouchOptimizedInput';

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: jest.fn(),
});

describe('TouchOptimizedInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with label and placeholder', () => {
    render(
      <TouchOptimizedInput
        label="Email Address"
        placeholder="Enter your email"
        type="email"
      />
    );

    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  });

  it('shows required indicator when field is required', () => {
    render(
      <TouchOptimizedInput
        label="Name"
        validationRules={{ required: true }}
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('triggers haptic feedback on focus', () => {
    render(<TouchOptimizedInput hapticFeedback={true} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    
    expect(navigator.vibrate).toHaveBeenCalledWith(10);
  });

  it('validates email format when autoValidate is enabled', async () => {
    render(
      <TouchOptimizedInput
        type="email"
        autoValidate={true}
        validationRules={{ email: true }}
      />
    );

    const input = screen.getByRole('textbox');
    
    // Enter invalid email
    fireEvent.change(input, { target: { value: 'invalid-email' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    // Enter valid email
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Valid input')).toBeInTheDocument();
    });
  });

  it('shows password toggle for password inputs', () => {
    render(
      <TouchOptimizedInput
        type="password"
        showPasswordToggle={true}
      />
    );

    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toBeInTheDocument();
    
    const input = screen.getByDisplayValue('') as HTMLInputElement;
    expect(input.type).toBe('password');
    
    // Click toggle
    fireEvent.click(toggleButton);
    expect(input.type).toBe('text');
  });

  it('validates minimum length requirement', async () => {
    render(
      <TouchOptimizedInput
        autoValidate={true}
        validationRules={{ minLength: 5 }}
      />
    );

    const input = screen.getByRole('textbox');
    
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Minimum 5 characters required')).toBeInTheDocument();
    });
  });

  it('validates phone number format', async () => {
    render(
      <TouchOptimizedInput
        type="tel"
        autoValidate={true}
        validationRules={{ phone: true }}
      />
    );

    const input = screen.getByRole('textbox');
    
    // Invalid phone
    fireEvent.change(input, { target: { value: 'abc123' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
    });

    // Valid phone
    fireEvent.change(input, { target: { value: '+1234567890' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Valid input')).toBeInTheDocument();
    });
  });

  it('shows loading state correctly', () => {
    render(<TouchOptimizedInput loading={true} />);
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    // Check for loading spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<TouchOptimizedInput error="This field is required" />);
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('border-red-300');
  });

  it('displays success message', () => {
    render(<TouchOptimizedInput success="Valid input" />);
    
    expect(screen.getByText('Valid input')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('border-green-300');
  });

  it('displays hint text when no error or success', () => {
    render(<TouchOptimizedInput hint="Enter your full name" />);
    
    expect(screen.getByText('Enter your full name')).toBeInTheDocument();
  });

  it('renders with left icon', () => {
    const TestIcon = () => <span data-testid="test-icon">📧</span>;
    
    render(
      <TouchOptimizedInput
        icon={<TestIcon />}
        iconPosition="left"
      />
    );

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('pl-10');
  });

  it('renders with right icon', () => {
    const TestIcon = () => <span data-testid="test-icon">📧</span>;
    
    render(
      <TouchOptimizedInput
        icon={<TestIcon />}
        iconPosition="right"
      />
    );

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('pr-10');
  });

  it('has proper input mode for different types', () => {
    const { rerender } = render(<TouchOptimizedInput type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('inputMode', 'email');

    rerender(<TouchOptimizedInput type="tel" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('inputMode', 'tel');

    rerender(<TouchOptimizedInput type="number" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('inputMode', 'numeric');
  });

  it('validates pattern requirement', async () => {
    const pattern = /^[A-Z]{2,}$/; // At least 2 uppercase letters
    
    render(
      <TouchOptimizedInput
        autoValidate={true}
        validationRules={{ pattern }}
      />
    );

    const input = screen.getByRole('textbox');
    
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid format')).toBeInTheDocument();
    });

    fireEvent.change(input, { target: { value: 'ABC' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Valid input')).toBeInTheDocument();
    });
  });

  it('handles touch feedback correctly', () => {
    render(<TouchOptimizedInput touchFeedback={true} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('active:scale-[0.995]');
  });

  it('disables touch feedback when specified', () => {
    render(<TouchOptimizedInput touchFeedback={false} />);
    
    const input = screen.getByRole('textbox');
    expect(input).not.toHaveClass('active:scale-[0.995]');
  });
});