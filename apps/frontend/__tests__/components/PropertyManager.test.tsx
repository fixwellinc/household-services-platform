import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import PropertyManager from '@/components/features/subscription/PropertyManager';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => 'mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock fetch
global.fetch = jest.fn();

describe('PropertyManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockPropertiesResponse = {
    success: true,
    properties: [
      {
        id: 'prop_1',
        address: '123 Main Street, City, State 12345',
        nickname: 'Main House',
        monthlyFee: 27.50,
        ownershipVerified: true,
        addedAt: '2024-01-01T00:00:00.000Z',
        displayName: 'Main House'
      },
      {
        id: 'prop_2',
        address: '456 Oak Avenue, City, State 12345',
        nickname: null,
        monthlyFee: 27.50,
        ownershipVerified: false,
        addedAt: '2024-01-02T00:00:00.000Z',
        displayName: '456 Oak Avenue, City, State 12345'
      }
    ],
    costBreakdown: {
      propertyCount: 2,
      totalMonthlyFee: 55.00,
      properties: [
        { id: 'prop_1', address: '123 Main Street', nickname: 'Main House', monthlyFee: 27.50 },
        { id: 'prop_2', address: '456 Oak Avenue', nickname: null, monthlyFee: 27.50 }
      ]
    }
  };

  const mockEmptyResponse = {
    success: true,
    properties: [],
    costBreakdown: {
      propertyCount: 0,
      totalMonthlyFee: 0,
      properties: []
    }
  };

  it('renders loading state initially', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<PropertyManager />);

    expect(screen.getByText('Loading properties...')).toBeInTheDocument();
  });

  it('renders empty state when no properties exist', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEmptyResponse,
    });

    render(<PropertyManager />);

    await waitFor(() => {
      expect(screen.getByText('No Additional Properties')).toBeInTheDocument();
    });

    expect(screen.getByText('Add additional properties to extend your subscription services to multiple locations.')).toBeInTheDocument();
    expect(screen.getByText('Add Your First Property')).toBeInTheDocument();
  });

  it('renders properties list when properties exist', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPropertiesResponse,
    });

    render(<PropertyManager />);

    await waitFor(() => {
      expect(screen.getByText('Main House')).toBeInTheDocument();
    });

    expect(screen.getByText('123 Main Street, City, State 12345')).toBeInTheDocument();
    expect(screen.getByText('456 Oak Avenue, City, State 12345')).toBeInTheDocument();
    expect(screen.getByText('$27.50/month')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('displays cost breakdown correctly', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPropertiesResponse,
    });

    render(<PropertyManager />);

    await waitFor(() => {
      expect(screen.getByText('2 Additional Properties')).toBeInTheDocument();
    });

    expect(screen.getByText('$55.00/month')).toBeInTheDocument();
    expect(screen.getByText('50% of base plan price per property')).toBeInTheDocument();
  });

  it('opens add property modal when add button is clicked', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEmptyResponse,
    });

    render(<PropertyManager />);

    await waitFor(() => {
      expect(screen.getByText('Add Property')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add Property'));

    expect(screen.getByText('Add Additional Property')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('123 Main Street, City, State 12345')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., Vacation Home, Rental Property')).toBeInTheDocument();
  });

  it('validates required fields in add property modal', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEmptyResponse,
    });

    render(<PropertyManager />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Add Property'));
    });

    const addButton = screen.getByRole('button', { name: 'Add Property' });
    expect(addButton).toBeDisabled();

    const addressInput = screen.getByPlaceholderText('123 Main Street, City, State 12345');
    fireEvent.change(addressInput, { target: { value: '123 Test St' } });

    expect(addButton).not.toBeDisabled();
  });

  it('successfully adds a new property', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmptyResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Property added successfully',
          property: {
            id: 'prop_new',
            address: '789 New Street',
            nickname: 'New House',
            monthlyFee: 27.50,
            ownershipVerified: false,
            addedAt: new Date().toISOString()
          }
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockEmptyResponse,
          properties: [{
            id: 'prop_new',
            address: '789 New Street',
            nickname: 'New House',
            monthlyFee: 27.50,
            ownershipVerified: false,
            addedAt: new Date().toISOString(),
            displayName: 'New House'
          }]
        }),
      });

    render(<PropertyManager />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Add Property'));
    });

    const addressInput = screen.getByPlaceholderText('123 Main Street, City, State 12345');
    const nicknameInput = screen.getByPlaceholderText('e.g., Vacation Home, Rental Property');

    fireEvent.change(addressInput, { target: { value: '789 New Street' } });
    fireEvent.change(nicknameInput, { target: { value: 'New House' } });

    fireEvent.click(screen.getByRole('button', { name: 'Add Property' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Property added successfully');
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/subscriptions/add-property', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: '789 New Street',
        nickname: 'New House',
        ownershipVerification: null
      }),
    });
  });

  it('opens edit modal when edit button is clicked', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPropertiesResponse,
    });

    render(<PropertyManager />);

    await waitFor(() => {
      expect(screen.getByText('Main House')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    expect(screen.getByText('Edit Property')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123 Main Street, City, State 12345')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Main House')).toBeInTheDocument();
  });

  it('successfully updates a property', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPropertiesResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Property updated successfully',
          property: {
            id: 'prop_1',
            address: '123 Main Street, City, State 12345',
            nickname: 'Updated House',
            monthlyFee: 27.50,
            ownershipVerified: true
          }
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPropertiesResponse,
      });

    render(<PropertyManager />);

    await waitFor(() => {
      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);
    });

    const nicknameInput = screen.getByDisplayValue('Main House');
    fireEvent.change(nicknameInput, { target: { value: 'Updated House' } });

    fireEvent.click(screen.getByRole('button', { name: 'Update Property' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Property updated successfully');
    });
  });

  it('successfully removes a property', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPropertiesResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Property removed successfully',
          removedProperty: {
            propertyId: 'prop_1',
            address: '123 Main Street',
            monthlyFee: 27.50
          }
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmptyResponse,
      });

    render(<PropertyManager />);

    await waitFor(() => {
      expect(screen.getByText('Main House')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Property removed successfully');
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/subscriptions/properties/prop_1', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer mock-token',
      },
    });
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<PropertyManager />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load properties');
    });
  });

  it('handles add property API errors', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmptyResponse,
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Maximum properties limit reached'
        }),
      });

    render(<PropertyManager />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Add Property'));
    });

    const addressInput = screen.getByPlaceholderText('123 Main Street, City, State 12345');
    fireEvent.change(addressInput, { target: { value: '123 Test St' } });

    fireEvent.click(screen.getByRole('button', { name: 'Add Property' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Maximum properties limit reached');
    });
  });

  it('closes modals when cancel is clicked', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEmptyResponse,
    });

    render(<PropertyManager />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Add Property'));
    });

    expect(screen.getByText('Add Additional Property')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByText('Add Additional Property')).not.toBeInTheDocument();
  });

  it('displays information about additional property benefits', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEmptyResponse,
    });

    render(<PropertyManager />);

    await waitFor(() => {
      expect(screen.getByText('Additional Property Benefits')).toBeInTheDocument();
    });

    expect(screen.getByText('Same visit allowances and perks as your main subscription')).toBeInTheDocument();
    expect(screen.getByText('50% discount on base plan price per additional property')).toBeInTheDocument();
    expect(screen.getByText('Maximum of 5 additional properties per subscription')).toBeInTheDocument();
  });
});