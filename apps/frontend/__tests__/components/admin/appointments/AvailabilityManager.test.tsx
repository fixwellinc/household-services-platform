import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AvailabilityManager from '@/components/admin/appointments/AvailabilityManager';

// Mock the toast hook
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <h3 className={className}>{children}</h3>
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} {...props}>
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, type, ...props }: any) => (
    <input 
      value={value} 
      onChange={onChange} 
      type={type}
      {...props}
    />
  )
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, id }: any) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
    />
  )
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value}>
      {React.Children.map(children, (child) => 
        React.cloneElement(child, { onValueChange })
      )}
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value, onValueChange }: any) => (
    <button onClick={() => onValueChange?.(value)} data-value={value}>
      {children}
    </button>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <span>Select value</span>
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

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader-icon" />,
  Save: () => <div data-testid="save-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Settings: () => <div data-testid="settings-icon" />
}));

describe('AvailabilityManager', () => {
  const mockOnRulesUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const mockAvailabilityRules = [
    {
      id: 'rule-1',
      dayOfWeek: 1,
      isAvailable: true,
      startTime: '09:00',
      endTime: '17:00',
      serviceType: null,
      bufferMinutes: 30,
      maxBookingsPerDay: 8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'rule-2',
      dayOfWeek: 2,
      isAvailable: false,
      startTime: '09:00',
      endTime: '17:00',
      serviceType: null,
      bufferMinutes: 30,
      maxBookingsPerDay: 8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  it('renders loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<AvailabilityManager onRulesUpdate={mockOnRulesUpdate} />);
    
    expect(screen.getByText('Loading availability settings...')).toBeInTheDocument();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  it('loads and displays availability rules', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        rules: mockAvailabilityRules
      })
    });

    render(<AvailabilityManager onRulesUpdate={mockOnRulesUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('Availability Configuration')).toBeInTheDocument();
    });

    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('Tuesday')).toBeInTheDocument();
    
    // Check that Monday is available (switch should be checked)
    const mondaySwitch = screen.getByLabelText('Available');
    expect(mondaySwitch).toBeChecked();
  });

  it('initializes with default rules when no rules exist', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        rules: []
      })
    });

    render(<AvailabilityManager onRulesUpdate={mockOnRulesUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('Availability Configuration')).toBeInTheDocument();
    });

    // Should show all days of the week
    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('Tuesday')).toBeInTheDocument();
    expect(screen.getByText('Wednesday')).toBeInTheDocument();
    expect(screen.getByText('Thursday')).toBeInTheDocument();
    expect(screen.getByText('Friday')).toBeInTheDocument();
    expect(screen.getByText('Saturday')).toBeInTheDocument();
    expect(screen.getByText('Sunday')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'));

    render(<AvailabilityManager onRulesUpdate={mockOnRulesUpdate} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('updates availability rules when switch is toggled', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        rules: mockAvailabilityRules
      })
    });

    render(<AvailabilityManager onRulesUpdate={mockOnRulesUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('Monday')).toBeInTheDocument();
    });

    // Find and toggle the availability switch for Monday
    const switches = screen.getAllByRole('checkbox');
    const mondaySwitch = switches[0]; // First switch should be Monday
    
    fireEvent.click(mondaySwitch);

    // The switch should now be unchecked
    expect(mondaySwitch).not.toBeChecked();
  });

  it('validates time format correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        rules: mockAvailabilityRules
      })
    });

    render(<AvailabilityManager onRulesUpdate={mockOnRulesUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('Monday')).toBeInTheDocument();
    });

    // Find start time input and enter invalid time
    const timeInputs = screen.getAllByDisplayValue('09:00');
    const startTimeInput = timeInputs[0];
    
    fireEvent.change(startTimeInput, { target: { value: '25:00' } });

    // Should show validation error when saving
    const saveButton = screen.getByText('Save Changes');
    expect(saveButton).toBeDisabled();
  });

  it('saves availability rules successfully', async () => {
    // Mock initial load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        rules: mockAvailabilityRules
      })
    });

    // Mock save request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        rules: mockAvailabilityRules,
        message: 'Availability rules updated successfully'
      })
    });

    render(<AvailabilityManager onRulesUpdate={mockOnRulesUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('Monday')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: expect.stringContaining('rules')
      });
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Availability rules updated successfully'
    });

    expect(mockOnRulesUpdate).toHaveBeenCalledWith(mockAvailabilityRules);
  });

  it('handles save errors appropriately', async () => {
    // Mock initial load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        rules: mockAvailabilityRules
      })
    });

    // Mock save error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Validation failed',
        details: 'Invalid time format'
      })
    });

    render(<AvailabilityManager onRulesUpdate={mockOnRulesUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('Monday')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Invalid time format',
        variant: 'destructive'
      });
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Invalid time format')).toBeInTheDocument();
  });

  it('refreshes rules when refresh button is clicked', async () => {
    // Mock initial load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        rules: mockAvailabilityRules
      })
    });

    render(<AvailabilityManager onRulesUpdate={mockOnRulesUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('Monday')).toBeInTheDocument();
    });

    // Mock refresh request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        rules: mockAvailabilityRules
      })
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('validates buffer minutes range', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        rules: mockAvailabilityRules
      })
    });

    render(<AvailabilityManager onRulesUpdate={mockOnRulesUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('Monday')).toBeInTheDocument();
    });

    // Find buffer minutes input and enter invalid value
    const bufferInput = screen.getByDisplayValue('30');
    fireEvent.change(bufferInput, { target: { value: '150' } });

    // Should disable save button due to validation error
    const saveButton = screen.getByText('Save Changes');
    expect(saveButton).toBeDisabled();
  });

  it('validates max bookings per day range', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        rules: mockAvailabilityRules
      })
    });

    render(<AvailabilityManager onRulesUpdate={mockOnRulesUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('Monday')).toBeInTheDocument();
    });

    // Find max bookings input and enter invalid value
    const maxBookingsInput = screen.getByDisplayValue('8');
    fireEvent.change(maxBookingsInput, { target: { value: '100' } });

    // Should disable save button due to validation error
    const saveButton = screen.getByText('Save Changes');
    expect(saveButton).toBeDisabled();
  });
});