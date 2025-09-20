import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import { GlobalSearch } from '@/components/admin/search/GlobalSearch';
import { mockSearchResults } from '../../../utils/mock-data';

// Mock the search API
const mockSearchApi = jest.fn();
jest.mock('@/lib/api', () => ({
  searchApi: {
    globalSearch: mockSearchApi
  }
}));

const defaultProps = {
  onResultSelect: jest.fn(),
  placeholder: 'Search users, subscriptions...'
};

describe('GlobalSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchApi.mockResolvedValue(mockSearchResults);
  });

  it('renders search input', () => {
    render(<GlobalSearch {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Search users, subscriptions...')).toBeInTheDocument();
  });

  it('performs search on input change', async () => {
    render(<GlobalSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search users, subscriptions...');
    fireEvent.change(searchInput, { target: { value: 'john' } });
    
    await waitFor(() => {
      expect(mockSearchApi).toHaveBeenCalledWith('john');
    }, { timeout: 1000 }); // Account for debounce
  });

  it('displays search results', async () => {
    render(<GlobalSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search users, subscriptions...');
    fireEvent.change(searchInput, { target: { value: 'john' } });
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Premium Plan')).toBeInTheDocument();
    });
  });

  it('groups results by category', async () => {
    render(<GlobalSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search users, subscriptions...');
    fireEvent.change(searchInput, { target: { value: 'john' } });
    
    await waitFor(() => {
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Subscriptions')).toBeInTheDocument();
    });
  });

  it('handles result selection', async () => {
    const onResultSelect = jest.fn();
    render(<GlobalSearch {...defaultProps} onResultSelect={onResultSelect} />);
    
    const searchInput = screen.getByPlaceholderText('Search users, subscriptions...');
    fireEvent.change(searchInput, { target: { value: 'john' } });
    
    await waitFor(() => {
      const result = screen.getByText('John Doe');
      fireEvent.click(result);
      
      expect(onResultSelect).toHaveBeenCalledWith({
        id: 'user-1',
        type: 'user',
        title: 'John Doe',
        subtitle: 'john@example.com',
        metadata: { role: 'CUSTOMER', status: 'ACTIVE' }
      });
    });
  });

  it('shows loading state during search', async () => {
    mockSearchApi.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<GlobalSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search users, subscriptions...');
    fireEvent.change(searchInput, { target: { value: 'john' } });
    
    expect(screen.getByTestId('search-loading')).toBeInTheDocument();
  });

  it('shows no results message', async () => {
    mockSearchApi.mockResolvedValue({ users: [], subscriptions: [] });
    
    render(<GlobalSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search users, subscriptions...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
  });

  it('handles search errors gracefully', async () => {
    mockSearchApi.mockRejectedValue(new Error('Search failed'));
    
    render(<GlobalSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search users, subscriptions...');
    fireEvent.change(searchInput, { target: { value: 'john' } });
    
    await waitFor(() => {
      expect(screen.getByText('Search error occurred')).toBeInTheDocument();
    });
  });

  it('supports keyboard navigation', async () => {
    render(<GlobalSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search users, subscriptions...');
    fireEvent.change(searchInput, { target: { value: 'john' } });
    
    await waitFor(() => {
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      expect(document.activeElement).toHaveTextContent('John Doe');
    });
  });

  it('clears results when input is cleared', async () => {
    render(<GlobalSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search users, subscriptions...');
    fireEvent.change(searchInput, { target: { value: 'john' } });
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    fireEvent.change(searchInput, { target: { value: '' } });
    
    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('shows recent searches when focused', () => {
    const recentSearches = ['john doe', 'premium plan'];
    
    render(<GlobalSearch {...defaultProps} recentSearches={recentSearches} />);
    
    const searchInput = screen.getByPlaceholderText('Search users, subscriptions...');
    fireEvent.focus(searchInput);
    
    expect(screen.getByText('Recent Searches')).toBeInTheDocument();
    expect(screen.getByText('john doe')).toBeInTheDocument();
    expect(screen.getByText('premium plan')).toBeInTheDocument();
  });

  it('supports search suggestions', async () => {
    const suggestions = ['john doe', 'john smith'];
    mockSearchApi.mockResolvedValue({ ...mockSearchResults, suggestions });
    
    render(<GlobalSearch {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search users, subscriptions...');
    fireEvent.change(searchInput, { target: { value: 'joh' } });
    
    await waitFor(() => {
      expect(screen.getByText('john doe')).toBeInTheDocument();
      expect(screen.getByText('john smith')).toBeInTheDocument();
    });
  });
});