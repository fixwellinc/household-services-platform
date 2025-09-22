import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConfirmationModal } from '@/components/customer/booking/ConfirmationModal';
import { BookingResponse } from '@/types/appointments';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('ConfirmationModal', () => {
  const mockBooking: BookingResponse = {
    appointmentId: '123',
    confirmationNumber: 'APT-12345678',
    status: 'PENDING',
  };

  const mockProps = {
    booking: mockBooking,
    selectedDate: new Date('2024-12-25T10:00:00'),
    selectedTime: '09:00',
    serviceType: 'General Consultation',
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders confirmation modal with success message', () => {
    render(<ConfirmationModal {...mockProps} />);
    
    expect(screen.getByText('Booking Confirmed!')).toBeInTheDocument();
    expect(screen.getByText('Your appointment has been successfully scheduled.')).toBeInTheDocument();
  });

  it('displays confirmation number', () => {
    render(<ConfirmationModal {...mockProps} />);
    
    expect(screen.getByText('Confirmation Number')).toBeInTheDocument();
    expect(screen.getByText('APT-12345678')).toBeInTheDocument();
  });

  it('displays appointment details correctly', () => {
    render(<ConfirmationModal {...mockProps} />);
    
    expect(screen.getByText('Tuesday, December 25, 2024')).toBeInTheDocument();
    expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    expect(screen.getByText('General Consultation')).toBeInTheDocument();
  });

  it('copies confirmation number to clipboard', async () => {
    const mockWriteText = jest.fn().mockResolvedValue(undefined);
    (navigator.clipboard.writeText as jest.Mock) = mockWriteText;

    render(<ConfirmationModal {...mockProps} />);
    
    const copyButton = screen.getByText('Copy');
    fireEvent.click(copyButton);
    
    expect(mockWriteText).toHaveBeenCalledWith('APT-12345678');
    
    // Should show "Copied" text temporarily
    expect(screen.getByText('Copied')).toBeInTheDocument();
  });

  it('handles clipboard copy failure gracefully', async () => {
    const mockWriteText = jest.fn().mockRejectedValue(new Error('Copy failed'));
    (navigator.clipboard.writeText as jest.Mock) = mockWriteText;
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<ConfirmationModal {...mockProps} />);
    
    const copyButton = screen.getByText('Copy');
    fireEvent.click(copyButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to copy confirmation number:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  it('displays next steps information', () => {
    render(<ConfirmationModal {...mockProps} />);
    
    expect(screen.getByText('What happens next?')).toBeInTheDocument();
    expect(screen.getByText(/You'll receive a confirmation email/)).toBeInTheDocument();
    expect(screen.getByText(/We may call to confirm details/)).toBeInTheDocument();
    expect(screen.getByText(/You'll receive a reminder 24 hours/)).toBeInTheDocument();
  });

  it('displays important notes', () => {
    render(<ConfirmationModal {...mockProps} />);
    
    expect(screen.getByText('Important Notes:')).toBeInTheDocument();
    expect(screen.getByText(/Please be available at the scheduled time/)).toBeInTheDocument();
    expect(screen.getByText(/If you need to reschedule/)).toBeInTheDocument();
  });

  it('displays contact information', () => {
    render(<ConfirmationModal {...mockProps} />);
    
    expect(screen.getByText('Need to make changes or have questions?')).toBeInTheDocument();
    expect(screen.getByText('support@fixwell.com')).toBeInTheDocument();
    expect(screen.getByText('(555) 012-3456')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<ConfirmationModal {...mockProps} />);
    
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when X button is clicked', () => {
    render(<ConfirmationModal {...mockProps} />);
    
    const xButton = screen.getByLabelText('Close');
    fireEvent.click(xButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('formats time correctly for different hours', () => {
    const props = {
      ...mockProps,
      selectedTime: '14:30',
    };

    render(<ConfirmationModal {...props} />);
    
    expect(screen.getByText('2:30 PM')).toBeInTheDocument();
  });

  it('handles midnight and noon times correctly', () => {
    const midnightProps = {
      ...mockProps,
      selectedTime: '00:00',
    };

    const { rerender } = render(<ConfirmationModal {...midnightProps} />);
    expect(screen.getByText('12:00 AM')).toBeInTheDocument();

    const noonProps = {
      ...mockProps,
      selectedTime: '12:00',
    };

    rerender(<ConfirmationModal {...noonProps} />);
    expect(screen.getByText('12:00 PM')).toBeInTheDocument();
  });
});