import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnhancedInput, InputPresets } from '@/components/ui/animations/EnhancedInput';

describe('EnhancedInput', () => {
  it('should render input with label correctly', () => {
    render(<EnhancedInput label="Test Label" placeholder="Enter text" />);
    
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should show helper text when provided', () => {
    render(<EnhancedInput helperText="This is helper text" />);
    expect(screen.getByText('This is helper text')).toBeInTheDocument();
  });

  it('should handle validation state correctly', () => {
    const validation = {
      isValid: false,
      message: 'This field is required',
    };
    
    render(<EnhancedInput validation={validation} />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should call onValidate when value changes', async () => {
    const mockValidate = jest.fn().mockResolvedValue({
      isValid: true,
      message: 'Valid input',
    });
    
    render(<EnhancedInput onValidate={mockValidate} debounceMs={100} />);
    const input = screen.getByRole('textbox');
    
    fireEvent.change(input, { target: { value: 'test' } });
    
    await waitFor(() => {
      expect(mockValidate).toHaveBeenCalledWith('test');
    }, { timeout: 200 });
  });

  it('should show validation loading state', async () => {
    const mockValidate = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ isValid: true }), 200))
    );
    
    render(<EnhancedInput onValidate={mockValidate} debounceMs={50} />);
    const input = screen.getByRole('textbox');
    
    fireEvent.change(input, { target: { value: 'test' } });
    
    await waitFor(() => {
      const spinner = screen.getByRole('textbox').parentElement?.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  it('should show success icon for valid input', async () => {
    render(
      <EnhancedInput 
        validation={{ isValid: true, message: 'Valid' }}
        showValidationIcon 
      />
    );
    
    await waitFor(() => {
      const successIcon = screen.getByRole('textbox').parentElement?.querySelector('.text-green-500');
      expect(successIcon).toBeInTheDocument();
    });
  });

  it('should show error icon for invalid input', async () => {
    render(
      <EnhancedInput 
        validation={{ isValid: false, message: 'Invalid' }}
        showValidationIcon 
      />
    );
    
    await waitFor(() => {
      const errorIcon = screen.getByRole('textbox').parentElement?.querySelector('.text-red-500');
      expect(errorIcon).toBeInTheDocument();
    });
  });

  it('should toggle password visibility', () => {
    render(<EnhancedInput type="password" showPasswordToggle />);
    
    const input = document.querySelector('input[type="password"]') as HTMLInputElement;
    const toggleButton = screen.getByRole('button');
    
    expect(input.type).toBe('password');
    
    fireEvent.click(toggleButton);
    expect(input.type).toBe('text');
    
    fireEvent.click(toggleButton);
    expect(input.type).toBe('password');
  });

  it('should handle focus and blur events', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    
    render(<EnhancedInput onFocus={onFocus} onBlur={onBlur} label="Test" />);
    const input = screen.getByRole('textbox');
    
    fireEvent.focus(input);
    expect(onFocus).toHaveBeenCalled();
    
    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalled();
  });
});

describe('InputPresets', () => {
  it('should validate email format correctly', async () => {
    render(<InputPresets.Email />);
    const input = screen.getByRole('textbox');
    
    // Test invalid email
    fireEvent.change(input, { target: { value: 'invalid-email' } });
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
    
    // Test valid email
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    
    await waitFor(() => {
      expect(screen.getByText('Valid email address')).toBeInTheDocument();
    });
  });

  it('should validate password strength correctly', async () => {
    render(<InputPresets.Password />);
    const input = document.querySelector('input[type="password"]') as HTMLInputElement;
    
    // Test weak password
    fireEvent.change(input, { target: { value: '123' } });
    
    await waitFor(() => {
      expect(screen.getByText('Password too weak')).toBeInTheDocument();
    });
    
    // Test strong password
    fireEvent.change(input, { target: { value: 'StrongPass123!' } });
    
    await waitFor(() => {
      expect(screen.getByText('Strong password')).toBeInTheDocument();
    });
  });

  it('should validate phone number correctly', async () => {
    render(<InputPresets.Phone />);
    const input = screen.getByRole('textbox');
    
    // Test invalid phone
    fireEvent.change(input, { target: { value: '123' } });
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
    });
    
    // Test valid phone
    fireEvent.change(input, { target: { value: '+1 (555) 123-4567' } });
    
    await waitFor(() => {
      expect(screen.getByText('Valid phone number')).toBeInTheDocument();
    });
  });
});