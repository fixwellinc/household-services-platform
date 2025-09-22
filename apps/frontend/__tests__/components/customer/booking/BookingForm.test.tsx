import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BookingForm } from '@/components/customer/booking/BookingForm';

describe('BookingForm', () => {
  const mockProps = {
    selectedDate: new Date('2024-12-25T10:00:00'),
    selectedTime: '09:00',
    serviceType: 'General Consultation',
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders booking form with all fields', () => {
    render(<BookingForm {...mockProps} />);
    
    expect(screen.getByText('Complete Your Booking')).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Property Address/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Additional Notes/)).toBeInTheDocument();
  });

  it('displays booking summary correctly', () => {
    render(<BookingForm {...mockProps} />);
    
    expect(screen.getByText('Tuesday, December 25, 2024')).toBeInTheDocument();
    expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    expect(screen.getByText('General Consultation')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<BookingForm {...mockProps} />);
    
    const submitButton = screen.getByText('Confirm Booking');
    expect(submitButton).toBeDisabled();
    
    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Full Name/), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Email Address/), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Property Address/), {
      target: { value: '123 Main St' },
    });

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('shows validation errors for invalid inputs', async () => {
    render(<BookingForm {...mockProps} />);
    
    const emailInput = screen.getByLabelText(/Email Address/);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('submits form with correct data', async () => {
    render(<BookingForm {...mockProps} />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/Full Name/), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Email Address/), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/), {
      target: { value: '555-0123' },
    });
    fireEvent.change(screen.getByLabelText(/Property Address/), {
      target: { value: '123 Main St' },
    });
    fireEvent.change(screen.getByLabelText(/Additional Notes/), {
      target: { value: 'Test notes' },
    });

    await waitFor(() => {
      fireEvent.click(screen.getByText('Confirm Booking'));
    });

    expect(mockProps.onSubmit).toHaveBeenCalledWith({
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '555-0123',
      propertyAddress: '123 Main St',
      notes: 'Test notes',
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<BookingForm {...mockProps} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('shows loading state when isLoading is true', () => {
    render(<BookingForm {...mockProps} isLoading={true} />);
    
    expect(screen.getByText('Booking...')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeDisabled();
    
    // All form fields should be disabled
    expect(screen.getByLabelText(/Full Name/)).toBeDisabled();
    expect(screen.getByLabelText(/Email Address/)).toBeDisabled();
  });

  it('displays terms notice', () => {
    render(<BookingForm {...mockProps} />);
    
    expect(screen.getByText(/By confirming this booking, you agree to our terms/)).toBeInTheDocument();
  });

  it('handles form submission error', async () => {
    const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Submission failed'));
    render(<BookingForm {...mockProps} onSubmit={mockOnSubmit} />);
    
    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Full Name/), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Email Address/), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Property Address/), {
      target: { value: '123 Main St' },
    });

    await waitFor(() => {
      fireEvent.click(screen.getByText('Confirm Booking'));
    });

    await waitFor(() => {
      expect(screen.getByText('Submission failed')).toBeInTheDocument();
    });
  });

  it('validates field length limits', async () => {
    render(<BookingForm {...mockProps} />);
    
    const longName = 'a'.repeat(101);
    fireEvent.change(screen.getByLabelText(/Full Name/), {
      target: { value: longName },
    });
    fireEvent.blur(screen.getByLabelText(/Full Name/));

    await waitFor(() => {
      expect(screen.getByText('Name is too long')).toBeInTheDocument();
    });
  });
});