import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WeeklyScheduleGrid from '@/components/admin/appointments/WeeklyScheduleGrid';

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <h3 className={className}>{children}</h3>
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, ...props }: any) => (
    <button 
      onClick={onClick} 
      data-variant={variant} 
      data-size={size}
      {...props}
    >
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-variant={variant}>{children}</span>
  )
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => (
    <div data-variant={variant} role="alert">{children}</div>
  ),
  AlertDescription: ({ children }: any) => <div>{children}</div>
}));

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }: any) => asChild ? children : <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Calendar: () => <div data-testid="calendar-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Minus: () => <div data-testid="minus-icon" />,
  Info: () => <div data-testid="info-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  XCircle: () => <div data-testid="x-circle-icon" />
}));

describe('WeeklyScheduleGrid', () => {
  const mockOnRuleUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRules = [
    {
      id: 'rule-1',
      dayOfWeek: 1, // Monday
      isAvailable: true,
      startTime: '09:00',
      endTime: '17:00',
      serviceType: null,
      bufferMinutes: 30,
      maxBookingsPerDay: 8
    },
    {
      id: 'rule-2',
      dayOfWeek: 2, // Tuesday
      isAvailable: false,
      startTime: '09:00',
      endTime: '17:00',
      serviceType: null,
      bufferMinutes: 30,
      maxBookingsPerDay: 8
    },
    {
      id: 'rule-3',
      dayOfWeek: 5, // Friday
      isAvailable: true,
      startTime: '10:00',
      endTime: '16:00',
      serviceType: null,
      bufferMinutes: 30,
      maxBookingsPerDay: 6
    }
  ];

  const mockBookingData = {
    '1-10:00': 2, // Monday 10:00 AM - 2 bookings
    '1-14:00': 5, // Monday 2:00 PM - 5 bookings
    '5-11:00': 1  // Friday 11:00 AM - 1 booking
  };

  it('renders the weekly schedule grid', () => {
    render(
      <WeeklyScheduleGrid 
        rules={mockRules} 
        onRuleUpdate={mockOnRuleUpdate}
      />
    );

    expect(screen.getByText('Weekly Schedule Grid')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    
    // Check day headers
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  it('displays time slots correctly', () => {
    render(
      <WeeklyScheduleGrid 
        rules={mockRules} 
        onRuleUpdate={mockOnRuleUpdate}
      />
    );

    // Check some time labels are present
    expect(screen.getByText('06:00')).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('12:00')).toBeInTheDocument();
    expect(screen.getByText('17:00')).toBeInTheDocument();
    expect(screen.getByText('22:00')).toBeInTheDocument();
  });

  it('shows available and unavailable time slots correctly', () => {
    render(
      <WeeklyScheduleGrid 
        rules={mockRules} 
        onRuleUpdate={mockOnRuleUpdate}
      />
    );

    // Monday should have available slots from 9 AM to 5 PM
    const mondaySlots = screen.getAllByTestId('check-circle-icon');
    expect(mondaySlots.length).toBeGreaterThan(0);

    // Tuesday should have no available slots (all unavailable)
    const unavailableSlots = screen.getAllByTestId('x-circle-icon');
    expect(unavailableSlots.length).toBeGreaterThan(0);
  });

  it('displays booking counts when showBookings is true', () => {
    render(
      <WeeklyScheduleGrid 
        rules={mockRules} 
        onRuleUpdate={mockOnRuleUpdate}
        showBookings={true}
        bookingData={mockBookingData}
      />
    );

    // Should show booking counts
    expect(screen.getByText('2')).toBeInTheDocument(); // Monday 10:00 AM
    expect(screen.getByText('5')).toBeInTheDocument(); // Monday 2:00 PM
    expect(screen.getByText('1')).toBeInTheDocument(); // Friday 11:00 AM
  });

  it('applies quick schedule presets correctly', () => {
    render(
      <WeeklyScheduleGrid 
        rules={mockRules} 
        onRuleUpdate={mockOnRuleUpdate}
      />
    );

    const businessHoursButton = screen.getByText('Business Hours');
    fireEvent.click(businessHoursButton);

    // Should call onRuleUpdate for each day with business hours settings
    expect(mockOnRuleUpdate).toHaveBeenCalledTimes(7); // 7 days
    
    // Check that Monday-Friday are set to available
    expect(mockOnRuleUpdate).toHaveBeenCalledWith(1, {
      isAvailable: true,
      startTime: '09:00',
      endTime: '17:00'
    });
    
    // Check that Sunday is set to unavailable
    expect(mockOnRuleUpdate).toHaveBeenCalledWith(0, {
      isAvailable: false,
      startTime: '09:00',
      endTime: '17:00'
    });
  });

  it('applies weekend only preset correctly', () => {
    render(
      <WeeklyScheduleGrid 
        rules={mockRules} 
        onRuleUpdate={mockOnRuleUpdate}
      />
    );

    const weekendButton = screen.getByText('Weekends Only');
    fireEvent.click(weekendButton);

    expect(mockOnRuleUpdate).toHaveBeenCalledTimes(7);
    
    // Check that Saturday and Sunday are available
    expect(mockOnRuleUpdate).toHaveBeenCalledWith(0, {
      isAvailable: true,
      startTime: '10:00',
      endTime: '16:00'
    });
    
    expect(mockOnRuleUpdate).toHaveBeenCalledWith(6, {
      isAvailable: true,
      startTime: '10:00',
      endTime: '16:00'
    });
    
    // Check that weekdays are unavailable
    expect(mockOnRuleUpdate).toHaveBeenCalledWith(1, {
      isAvailable: false,
      startTime: '10:00',
      endTime: '16:00'
    });
  });

  it('applies full week preset correctly', () => {
    render(
      <WeeklyScheduleGrid 
        rules={mockRules} 
        onRuleUpdate={mockOnRuleUpdate}
      />
    );

    const fullWeekButton = screen.getByText('Full Week');
    fireEvent.click(fullWeekButton);

    expect(mockOnRuleUpdate).toHaveBeenCalledTimes(7);
    
    // All days should be available
    for (let day = 0; day < 7; day++) {
      expect(mockOnRuleUpdate).toHaveBeenCalledWith(day, {
        isAvailable: true,
        startTime: '08:00',
        endTime: '20:00'
      });
    }
  });

  it('clears all availability when clear preset is used', () => {
    render(
      <WeeklyScheduleGrid 
        rules={mockRules} 
        onRuleUpdate={mockOnRuleUpdate}
      />
    );

    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);

    expect(mockOnRuleUpdate).toHaveBeenCalledTimes(7);
    
    // All days should be unavailable
    for (let day = 0; day < 7; day++) {
      expect(mockOnRuleUpdate).toHaveBeenCalledWith(day, {
        isAvailable: false
      });
    }
  });

  it('handles cell selection for making slots available', () => {
    render(
      <WeeklyScheduleGrid 
        rules={mockRules} 
        onRuleUpdate={mockOnRuleUpdate}
      />
    );

    // Find a cell that's currently unavailable (e.g., Tuesday 10:00)
    const gridCells = screen.getAllByRole('generic');
    const tuesdayCell = gridCells.find(cell => 
      cell.className?.includes('bg-gray-100')
    );

    if (tuesdayCell) {
      // Simulate mouse down to start selection
      fireEvent.mouseDown(tuesdayCell);
      
      // Simulate mouse up to complete selection
      fireEvent.mouseUp(tuesdayCell);

      // Should call onRuleUpdate to make the slot available
      expect(mockOnRuleUpdate).toHaveBeenCalled();
    }
  });

  it('shows legend correctly', () => {
    render(
      <WeeklyScheduleGrid 
        rules={mockRules} 
        onRuleUpdate={mockOnRuleUpdate}
        showBookings={true}
      />
    );

    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Booking Count')).toBeInTheDocument();
    expect(screen.getByText('Fully Booked')).toBeInTheDocument();
  });

  it('shows selection feedback during drag selection', () => {
    render(
      <WeeklyScheduleGrid 
        rules={mockRules} 
        onRuleUpdate={mockOnRuleUpdate}
      />
    );

    const gridCells = screen.getAllByRole('generic');
    const firstCell = gridCells.find(cell => 
      cell.className?.includes('cursor-pointer')
    );

    if (firstCell) {
      // Start selection
      fireEvent.mouseDown(firstCell);

      // Should show selection feedback
      expect(screen.getByText(/selected/)).toBeInTheDocument();
    }
  });

  it('handles mouse leave during selection', () => {
    render(
      <WeeklyScheduleGrid 
        rules={mockRules} 
        onRuleUpdate={mockOnRuleUpdate}
      />
    );

    const grid = screen.getByText('Weekly Schedule Grid').closest('div');
    const gridContainer = grid?.querySelector('.grid');

    if (gridContainer) {
      // Start selection on a cell
      const cells = gridContainer.querySelectorAll('[role="generic"]');
      const firstCell = cells[0];
      
      if (firstCell) {
        fireEvent.mouseDown(firstCell);
        
        // Mouse leave should complete the selection
        fireEvent.mouseLeave(gridContainer);
        
        expect(mockOnRuleUpdate).toHaveBeenCalled();
      }
    }
  });

  it('calculates time slots correctly', () => {
    render(
      <WeeklyScheduleGrid 
        rules={mockRules} 
        onRuleUpdate={mockOnRuleUpdate}
      />
    );

    // Should have time slots from 6:00 AM to 10:30 PM in 30-minute intervals
    // That's 16.5 hours * 2 slots per hour = 33 slots
    const timeLabels = screen.getAllByText(/^\d{2}:\d{2}$/);
    expect(timeLabels.length).toBeGreaterThan(30);
  });

  it('shows correct availability based on rule times', () => {
    const customRules = [
      {
        id: 'rule-1',
        dayOfWeek: 1, // Monday
        isAvailable: true,
        startTime: '10:00',
        endTime: '14:00', // Only 4 hours available
        serviceType: null,
        bufferMinutes: 30,
        maxBookingsPerDay: 8
      }
    ];

    render(
      <WeeklyScheduleGrid 
        rules={customRules} 
        onRuleUpdate={mockOnRuleUpdate}
      />
    );

    // Monday should only have available slots from 10:00 to 14:00
    // Slots before 10:00 and after 14:00 should be unavailable
    const availableIcons = screen.getAllByTestId('check-circle-icon');
    const unavailableIcons = screen.getAllByTestId('x-circle-icon');
    
    // Should have more unavailable than available slots for Monday
    expect(unavailableIcons.length).toBeGreaterThan(availableIcons.length);
  });
});