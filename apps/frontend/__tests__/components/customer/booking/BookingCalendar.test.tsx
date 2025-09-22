import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BookingCalendar } from '@/components/customer/booking/BookingCalendar';

// Mock fetch
global.fetch = jest.fn();

// Mock react-day-picker
jest.mock('react-day-picker', () => ({
  DayPicker: ({ onSelect, selected }: any) => {
    const handleDateSelect = () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      onSelect(futureDate);
    };
    
    return (
      <div data-testid="day-picker">
        <button
          onClick={handleDateSelect}
          data-testid="select-date"
        >
          Select Date
        </button>
        {selected && <div data-testid="selected-date">{selected.toDateString()}</div>}
      </div>
    );
  },
}));

// Mock child components
jest.mock('@/components/customer/booking/TimeSlotPicker', () => ({
  TimeSlotPicker: ({ slots, onTimeSelect }: any) => (
    <div data-testid="time-slot-picker">
      {slots.map((slot: any) => (
        <button
          key={slot.time}
          onClick={() => onTimeSelect(slot.time)}
          data-testid={`time-slot-${slot.time}`}
        >
          {slot.time}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('@/components/customer/booking/BookingForm', () => ({
  BookingForm: ({ onSubmit, onCancel }: any) => (
    <div data-testid="booking-form">
      <button onClick={() => onSubmit({
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        propertyAddress: '123 Test St',
      })} data-testid="submit-booking">
        Submit
      </button>
      <button onClick={onCancel} data-testid="cancel-booking">
        Cancel
      </button>
    </div>
  ),
}));

jest.mock('@/components/customer/booking/ConfirmationModal', () => ({
  ConfirmationModal: ({ onClose }: any) => (
    <div data-testid="confirmation-modal">
      <button onClick={onClose} data-testid="close-confirmation">
        Close
      </button>
    </div>
  ),
}));

describe('BookingCalendar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the booking calendar with service type selection', () => {
    render(<BookingCalendar />);
    
    expect(screen.getByText('Book Your Appointment')).toBeInTheDocument();
    expect(screen.getByText('Service Type')).toBeInTheDocument();
    expect(screen.getByText('Select Date')).toBeInTheDocument();
  });

  it('displays service type options', () => {
    const serviceTypes = ['Plumbing', 'Electrical'];
    render(<BookingCalendar serviceTypes={serviceTypes} />);
    
    const select = screen.getByDisplayValue('Plumbing');
    expect(select).toBeInTheDocument();
  });

  it('fetches availability when date is selected', async () => {
    const mockAvailability = {
      date: '2024-12-25',
      availableSlots: [
        { time: '09:00', duration: 60 },
        { time: '10:00', duration: 60 },
      ],
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAvailability,
    });

    render(<BookingCalendar />);
    
    fireEvent.click(screen.getByTestId('select-date'));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/appointments/availability?date=2024-12-25')
      );
    });
  });

  it('displays time slots when availability is loaded', async () => {
    const mockAvailability = {
      date: '2024-12-25',
      availableSlots: [
        { time: '09:00', duration: 60 },
        { time: '10:00', duration: 60 },
      ],
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAvailability,
    });

    render(<BookingCalendar />);
    
    fireEvent.click(screen.getByTestId('select-date'));
    
    await waitFor(() => {
      expect(screen.getByTestId('time-slot-09:00')).toBeInTheDocument();
      expect(screen.getByTestId('time-slot-10:00')).toBeInTheDocument();
    });
  });

  it('shows proceed button when date and time are selected', async () => {
    const mockAvailability = {
      date: '2024-12-25',
      availableSlots: [{ time: '09:00', duration: 60 }],
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAvailability,
    });

    render(<BookingCalendar />);
    
    fireEvent.click(screen.getByTestId('select-date'));
    
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('time-slot-09:00'));
    });

    await waitFor(() => {
      expect(screen.getByText('Proceed to Booking Details')).toBeInTheDocument();
    });
  });

  it('opens booking form when proceed button is clicked', async () => {
    const mockAvailability = {
      date: '2024-12-25',
      availableSlots: [{ time: '09:00', duration: 60 }],
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAvailability,
    });

    render(<BookingCalendar />);
    
    fireEvent.click(screen.getByTestId('select-date'));
    
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('time-slot-09:00'));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByText('Proceed to Booking Details'));
    });

    expect(screen.getByTestId('booking-form')).toBeInTheDocument();
  });

  it('handles booking submission successfully', async () => {
    const mockAvailability = {
      date: '2024-12-25',
      availableSlots: [{ time: '09:00', duration: 60 }],
    };

    const mockBookingResponse = {
      appointmentId: '123',
      confirmationNumber: 'APT-12345678',
      status: 'PENDING',
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAvailability,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBookingResponse,
      });

    const onBookingComplete = jest.fn();
    render(<BookingCalendar onBookingComplete={onBookingComplete} />);
    
    fireEvent.click(screen.getByTestId('select-date'));
    
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('time-slot-09:00'));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByText('Proceed to Booking Details'));
    });

    fireEvent.click(screen.getByTestId('submit-booking'));

    await waitFor(() => {
      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      expect(onBookingComplete).toHaveBeenCalledWith(mockBookingResponse);
    });
  });

  it('displays error message when availability fetch fails', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<BookingCalendar />);
    
    fireEvent.click(screen.getByTestId('select-date'));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load available time slots. Please try again.')).toBeInTheDocument();
    });
  });

  it('displays error message when booking fails', async () => {
    const mockAvailability = {
      date: '2024-12-25',
      availableSlots: [{ time: '09:00', duration: 60 }],
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAvailability,
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Booking failed' }),
      });

    render(<BookingCalendar />);
    
    fireEvent.click(screen.getByTestId('select-date'));
    
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('time-slot-09:00'));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByText('Proceed to Booking Details'));
    });

    fireEvent.click(screen.getByTestId('submit-booking'));

    await waitFor(() => {
      expect(screen.getByText('Booking failed')).toBeInTheDocument();
    });
  });
});