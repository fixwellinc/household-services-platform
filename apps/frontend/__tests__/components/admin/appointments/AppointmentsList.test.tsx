import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AppointmentsList from '@/components/admin/appointments/AppointmentsList';

// Mock the toast hook
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => '2024-01-15 10:00 AM'),
  parseISO: jest.fn((dateStr) => new Date(dateStr))
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
  Button: ({ children, onClick, disabled, variant, size, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      data-variant={variant} 
      data-size={size}
      {...props}
    >
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, className, ...props }: any) => (
    <input 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder}
      className={className}
      {...props}
    />
  )
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>
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
  Badge: ({ children, className }: any) => (
    <span className={className}>{children}</span>
  )
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => (
    <div data-variant={variant} role="alert">{children}</div>
  ),
  AlertDescription: ({ children }: any) => <div>{children}</div>
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => 
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogTrigger: ({ children }: any) => <div>{children}</div>
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, ...props }: any) => (
    <textarea value={value} onChange={onChange} {...props} />
  )
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  User: () => <div data-testid="user-icon" />,
  MapPin: () => <div data-testid="mappin-icon" />,
  Phone: () => <div data-testid="phone-icon" />,
  Mail: () => <div data-testid="mail-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  XCircle: () => <div data-testid="x-circle-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  MoreHorizontal: () => <div data-testid="more-horizontal-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />
}));

describe('AppointmentsList', () => {
  const mockOnAppointmentUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const mockAppointments = [
    {
      id: 'apt-1',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '+1234567890',
      scheduledDate: '2024-01-15T10:00:00Z',
      duration: 60,
      serviceType: 'consultation',
      propertyAddress: '123 Main St, City, State',
      status: 'PENDING' as const,
      notes: 'Initial consultation',
      calendarEventId: null,
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z'
    },
    {
      id: 'apt-2',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      customerPhone: null,
      scheduledDate: '2024-01-16T14:00:00Z',
      duration: 90,
      serviceType: 'repair',
      propertyAddress: '456 Oak Ave, City, State',
      status: 'CONFIRMED' as const,
      notes: null,
      calendarEventId: 'cal-123',
      createdAt: '2024-01-11T10:00:00Z',
      updatedAt: '2024-01-11T10:00:00Z'
    }
  ];

  const mockApiResponse = {
    success: true,
    appointments: mockAppointments,
    summary: {
      total: 2,
      pending: 1,
      confirmed: 1,
      completed: 0,
      cancelled: 0
    },
    pagination: {
      page: 1,
      limit: 10,
      totalPages: 1,
      totalCount: 2
    }
  };

  it('renders loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<AppointmentsList onAppointmentUpdate={mockOnAppointmentUpdate} />);
    
    expect(screen.getByText('Loading appointments...')).toBeInTheDocument();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  it('loads and displays appointments', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    render(<AppointmentsList onAppointmentUpdate={mockOnAppointmentUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('Appointments Management')).toBeInTheDocument();
    });

    // Check stats cards
    expect(screen.getByText('2')).toBeInTheDocument(); // Total
    expect(screen.getByText('1')).toBeInTheDocument(); // Pending and Confirmed

    // Check appointments are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'));

    render(<AppointmentsList onAppointmentUpdate={mockOnAppointmentUpdate} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('filters appointments by search term', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    render(<AppointmentsList onAppointmentUpdate={mockOnAppointmentUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Mock filtered response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockApiResponse,
        appointments: [mockAppointments[0]], // Only John Doe
        summary: { total: 1, pending: 1, confirmed: 0, completed: 0, cancelled: 0 }
      })
    });

    const searchInput = screen.getByPlaceholderText('Search by name, email, or address...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=John'),
        expect.any(Object)
      );
    });
  });

  it('filters appointments by status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    render(<AppointmentsList onAppointmentUpdate={mockOnAppointmentUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Mock filtered response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockApiResponse,
        appointments: [mockAppointments[0]], // Only pending
        summary: { total: 1, pending: 1, confirmed: 0, completed: 0, cancelled: 0 }
      })
    });

    // Find and click the status filter
    const statusSelects = screen.getAllByTestId('select');
    const statusSelect = statusSelects.find(select => 
      select.querySelector('[data-value="PENDING"]')
    );
    
    if (statusSelect) {
      const pendingOption = statusSelect.querySelector('[data-value="PENDING"]');
      fireEvent.click(pendingOption!);
    }

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=PENDING'),
        expect.any(Object)
      );
    });
  });

  it('confirms appointment successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    render(<AppointmentsList onAppointmentUpdate={mockOnAppointmentUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Mock confirm response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Appointment confirmed successfully',
        appointment: { ...mockAppointments[0], status: 'CONFIRMED' }
      })
    });

    // Mock refresh response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/availability/appointments/apt-1/confirm',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include'
        })
      );
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Appointment confirmed successfully'
    });

    expect(mockOnAppointmentUpdate).toHaveBeenCalled();
  });

  it('cancels appointment successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    render(<AppointmentsList onAppointmentUpdate={mockOnAppointmentUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Mock cancel response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Appointment cancelled successfully',
        appointment: { ...mockAppointments[0], status: 'CANCELLED' }
      })
    });

    // Mock refresh response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/availability/appointments/apt-1/cancel',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ reason: 'Cancelled by admin' })
        })
      );
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Appointment cancelled successfully'
    });
  });

  it('completes appointment successfully', async () => {
    const confirmedAppointments = {
      ...mockApiResponse,
      appointments: [{ ...mockAppointments[1], status: 'CONFIRMED' }]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => confirmedAppointments
    });

    render(<AppointmentsList onAppointmentUpdate={mockOnAppointmentUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Mock complete response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Appointment completed successfully',
        appointment: { ...mockAppointments[1], status: 'COMPLETED' }
      })
    });

    // Mock refresh response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => confirmedAppointments
    });

    const completeButton = screen.getByText('Complete');
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/availability/appointments/apt-2/complete',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include'
        })
      );
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Appointment completed successfully'
    });
  });

  it('opens appointment details dialog', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    render(<AppointmentsList onAppointmentUpdate={mockOnAppointmentUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const viewButton = screen.getAllByTestId('eye-icon')[0].closest('button');
    fireEvent.click(viewButton!);

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByText('Appointment Details')).toBeInTheDocument();
    });
  });

  it('handles appointment action errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    render(<AppointmentsList onAppointmentUpdate={mockOnAppointmentUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Mock error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Appointment not found',
        message: 'The appointment could not be found'
      })
    });

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'The appointment could not be found',
        variant: 'destructive'
      });
    });
  });

  it('displays no appointments message when list is empty', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockApiResponse,
        appointments: [],
        summary: { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 }
      })
    });

    render(<AppointmentsList onAppointmentUpdate={mockOnAppointmentUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('No appointments found')).toBeInTheDocument();
    });
  });

  it('handles pagination correctly', async () => {
    const paginatedResponse = {
      ...mockApiResponse,
      pagination: {
        page: 1,
        limit: 10,
        totalPages: 3,
        totalCount: 25
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => paginatedResponse
    });

    render(<AppointmentsList onAppointmentUpdate={mockOnAppointmentUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      expect(screen.getByText('Showing 1 to 2 of 25 appointments')).toBeInTheDocument();
    });

    // Mock next page response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...paginatedResponse,
        pagination: { ...paginatedResponse.pagination, page: 2 }
      })
    });

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
    });
  });
});