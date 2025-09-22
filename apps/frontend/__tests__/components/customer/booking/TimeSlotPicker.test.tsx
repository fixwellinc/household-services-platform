import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TimeSlotPicker } from '@/components/customer/booking/TimeSlotPicker';
import { AvailableSlot } from '@/types/appointments';

describe('TimeSlotPicker', () => {
  const mockSlots: AvailableSlot[] = [
    { time: '09:00', duration: 60 },
    { time: '10:00', duration: 60 },
    { time: '14:00', duration: 60 },
    { time: '15:00', duration: 60 },
    { time: '18:00', duration: 60 },
  ];

  const mockOnTimeSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders time slots grouped by period', () => {
    render(<TimeSlotPicker slots={mockSlots} onTimeSelect={mockOnTimeSelect} />);
    
    expect(screen.getByText('Morning')).toBeInTheDocument();
    expect(screen.getByText('Afternoon')).toBeInTheDocument();
    expect(screen.getByText('Evening')).toBeInTheDocument();
  });

  it('displays time slots in correct format', () => {
    render(<TimeSlotPicker slots={mockSlots} onTimeSelect={mockOnTimeSelect} />);
    
    expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    expect(screen.getByText('2:00 PM')).toBeInTheDocument();
    expect(screen.getByText('3:00 PM')).toBeInTheDocument();
    expect(screen.getByText('6:00 PM')).toBeInTheDocument();
  });

  it('calls onTimeSelect when a time slot is clicked', () => {
    render(<TimeSlotPicker slots={mockSlots} onTimeSelect={mockOnTimeSelect} />);
    
    fireEvent.click(screen.getByText('9:00 AM'));
    
    expect(mockOnTimeSelect).toHaveBeenCalledWith('09:00');
  });

  it('highlights selected time slot', () => {
    render(
      <TimeSlotPicker 
        slots={mockSlots} 
        selectedTime="09:00" 
        onTimeSelect={mockOnTimeSelect} 
      />
    );
    
    const selectedButton = screen.getByText('9:00 AM');
    expect(selectedButton).toHaveClass('bg-primary'); // Assuming default variant has this class
  });

  it('shows selected time information', () => {
    render(
      <TimeSlotPicker 
        slots={mockSlots} 
        selectedTime="09:00" 
        onTimeSelect={mockOnTimeSelect} 
      />
    );
    
    expect(screen.getByText('Selected time:')).toBeInTheDocument();
    expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    expect(screen.getByText('Duration: 60 minutes (estimated)')).toBeInTheDocument();
  });

  it('displays empty state when no slots are available', () => {
    render(<TimeSlotPicker slots={[]} onTimeSelect={mockOnTimeSelect} />);
    
    expect(screen.getByText('No available time slots for this date.')).toBeInTheDocument();
    expect(screen.getByText('Please select a different date or contact us directly.')).toBeInTheDocument();
  });

  it('does not show period headers when no slots in that period', () => {
    const morningSlots: AvailableSlot[] = [
      { time: '09:00', duration: 60 },
      { time: '10:00', duration: 60 },
    ];

    render(<TimeSlotPicker slots={morningSlots} onTimeSelect={mockOnTimeSelect} />);
    
    expect(screen.getByText('Morning')).toBeInTheDocument();
    expect(screen.queryByText('Afternoon')).not.toBeInTheDocument();
    expect(screen.queryByText('Evening')).not.toBeInTheDocument();
  });

  it('handles edge case times correctly', () => {
    const edgeCaseSlots: AvailableSlot[] = [
      { time: '00:00', duration: 60 }, // Midnight
      { time: '12:00', duration: 60 }, // Noon
      { time: '23:30', duration: 60 }, // Late evening
    ];

    render(<TimeSlotPicker slots={edgeCaseSlots} onTimeSelect={mockOnTimeSelect} />);
    
    expect(screen.getByText('12:00 AM')).toBeInTheDocument(); // Midnight
    expect(screen.getByText('12:00 PM')).toBeInTheDocument(); // Noon
    expect(screen.getByText('11:30 PM')).toBeInTheDocument(); // Late evening
  });

  it('applies custom className', () => {
    const { container } = render(
      <TimeSlotPicker 
        slots={mockSlots} 
        onTimeSelect={mockOnTimeSelect} 
        className="custom-class"
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});