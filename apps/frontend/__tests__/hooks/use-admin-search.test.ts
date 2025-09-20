import { renderHook, waitFor } from '@testing-library/react';
import { useAdminSearch } from '@/hooks/use-admin-search';
import { mockSearchResults } from '../utils/mock-data';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the API
const mockSearchApi = jest.fn();
jest.mock('@/lib/api', () => ({
  searchApi: {
    globalSearch: mockSearchApi,
    getSuggestions: jest.fn()
  }
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useAdminSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchApi.mockResolvedValue(mockSearchResults);
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAdminSearch(), {
      wrapper: createWrapper()
    });

    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual({});
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should perform search when query changes', async () => {
    const { result } = renderHook(() => useAdminSearch(), {
      wrapper: createWrapper()
    });

    result.current.setQuery('john');

    await waitFor(() => {
      expect(mockSearchApi).toHaveBeenCalledWith('john', undefined);
    });

    await waitFor(() => {
      expect(result.current.results).toEqual(mockSearchResults);
    });
  });

  it('should debounce search queries', async () => {
    const { result } = renderHook(() => useAdminSearch({ debounceMs: 300 }), {
      wrapper: createWrapper()
    });

    // Rapid query changes
    result.current.setQuery('j');
    result.current.setQuery('jo');
    result.current.setQuery('joh');
    result.current.setQuery('john');

    // Should only call API once after debounce
    await waitFor(() => {
      expect(mockSearchApi).toHaveBeenCalledTimes(1);
      expect(mockSearchApi).toHaveBeenCalledWith('john', undefined);
    });
  });

  it('should handle search with filters', async () => {
    const { result } = renderHook(() => useAdminSearch(), {
      wrapper: createWrapper()
    });

    const filters = { entityTypes: ['users'], status: 'ACTIVE' };
    result.current.search('john', filters);

    await waitFor(() => {
      expect(mockSearchApi).toHaveBeenCalledWith('john', filters);
    });
  });

  it('should handle search errors', async () => {
    mockSearchApi.mockRejectedValue(new Error('Search failed'));

    const { result } = renderHook(() => useAdminSearch(), {
      wrapper: createWrapper()
    });

    result.current.setQuery('john');

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Search failed');
    });
  });

  it('should clear results when query is empty', async () => {
    const { result } = renderHook(() => useAdminSearch(), {
      wrapper: createWrapper()
    });

    // First search
    result.current.setQuery('john');
    await waitFor(() => {
      expect(result.current.results).toEqual(mockSearchResults);
    });

    // Clear query
    result.current.setQuery('');
    await waitFor(() => {
      expect(result.current.results).toEqual({});
    });
  });

  it('should track recent searches', async () => {
    const { result } = renderHook(() => useAdminSearch({ trackRecent: true }), {
      wrapper: createWrapper()
    });

    result.current.setQuery('john');
    await waitFor(() => {
      expect(result.current.results).toEqual(mockSearchResults);
    });

    result.current.setQuery('premium');
    await waitFor(() => {
      expect(result.current.recentSearches).toContain('john');
    });
  });

  it('should support minimum query length', () => {
    const { result } = renderHook(() => useAdminSearch({ minQueryLength: 3 }), {
      wrapper: createWrapper()
    });

    result.current.setQuery('jo'); // Less than minimum

    expect(mockSearchApi).not.toHaveBeenCalled();
    expect(result.current.results).toEqual({});
  });

  it('should handle search suggestions', async () => {
    const mockSuggestions = ['john doe', 'john smith'];
    const mockGetSuggestions = jest.fn().mockResolvedValue(mockSuggestions);
    
    jest.doMock('@/lib/api', () => ({
      searchApi: {
        globalSearch: mockSearchApi,
        getSuggestions: mockGetSuggestions
      }
    }));

    const { result } = renderHook(() => useAdminSearch({ enableSuggestions: true }), {
      wrapper: createWrapper()
    });

    result.current.getSuggestions('joh');

    await waitFor(() => {
      expect(mockGetSuggestions).toHaveBeenCalledWith('joh');
    });

    await waitFor(() => {
      expect(result.current.suggestions).toEqual(mockSuggestions);
    });
  });

  it('should clear search results', () => {
    const { result } = renderHook(() => useAdminSearch(), {
      wrapper: createWrapper()
    });

    // Set some state
    result.current.setQuery('john');
    result.current.clearSearch();

    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual({});
    expect(result.current.error).toBeNull();
  });

  it('should handle concurrent searches correctly', async () => {
    let resolveFirst: (value: any) => void;
    let resolveSecond: (value: any) => void;

    const firstPromise = new Promise(resolve => { resolveFirst = resolve; });
    const secondPromise = new Promise(resolve => { resolveSecond = resolve; });

    mockSearchApi
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise);

    const { result } = renderHook(() => useAdminSearch(), {
      wrapper: createWrapper()
    });

    // Start first search
    result.current.setQuery('john');
    
    // Start second search before first completes
    result.current.setQuery('jane');

    // Resolve second search first
    resolveSecond!({ users: [{ id: 'user-2', name: 'Jane' }] });
    
    // Then resolve first search
    resolveFirst!({ users: [{ id: 'user-1', name: 'John' }] });

    await waitFor(() => {
      // Should show results from the latest query (jane)
      expect(result.current.results.users[0].name).toBe('Jane');
    });
  });

  it('should support search result selection', () => {
    const onResultSelect = jest.fn();
    const { result } = renderHook(() => useAdminSearch({ onResultSelect }), {
      wrapper: createWrapper()
    });

    const selectedResult = {
      id: 'user-1',
      type: 'user',
      title: 'John Doe'
    };

    result.current.selectResult(selectedResult);

    expect(onResultSelect).toHaveBeenCalledWith(selectedResult);
  });

  it('should handle search analytics', async () => {
    const { result } = renderHook(() => useAdminSearch({ trackAnalytics: true }), {
      wrapper: createWrapper()
    });

    result.current.setQuery('john');

    await waitFor(() => {
      expect(result.current.searchStats.totalSearches).toBe(1);
      expect(result.current.searchStats.lastSearchTime).toBeDefined();
    });
  });
});