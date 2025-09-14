import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
// import { useDebounce } from './use-debounce'; // Removed due to conflict - using inline implementation
import { useUrlState, useFilterStateValidation } from './use-url-state';
import type { 
  SearchResponse, 
  SearchConfig, 
  FilterState, 
  SearchSuggestion,
  SavedSearch 
} from '../types/admin';

interface UseAdminSearchOptions {
  entity?: string;
  initialQuery?: string;
  initialFilters?: Record<string, any>;
  autoSearch?: boolean;
  debounceMs?: number;
  useUrlState?: boolean;
  urlStateOptions?: {
    debounceMs?: number;
    replaceHistory?: boolean;
  };
}

interface UseAdminSearchReturn {
  // Search state
  query: string;
  setQuery: (query: string) => void;
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  filterState: FilterState;
  setFilterState: (state: FilterState) => void;
  
  // Search results
  results: SearchResponse | null;
  isLoading: boolean;
  error: Error | null;
  
  // Search actions
  search: (searchQuery?: string) => void;
  clearSearch: () => void;
  refetch: () => void;
  
  // Suggestions
  suggestions: SearchSuggestion[];
  isLoadingSuggestions: boolean;
  
  // Configuration
  searchConfig: SearchConfig | null;
  isLoadingConfig: boolean;
  
  // Saved searches
  savedSearches: SavedSearch[];
  saveSearch: (name: string, description?: string) => Promise<void>;
  loadSavedSearch: (savedSearch: SavedSearch) => void;
  deleteSavedSearch: (id: string) => Promise<void>;
  
  // URL state management
  shareableUrl: string;
  copyShareableUrl: () => Promise<boolean>;
  resetToDefaults: () => void;
}

export function useAdminSearch(options: UseAdminSearchOptions = {}): UseAdminSearchReturn {
  const {
    entity,
    initialQuery = '',
    initialFilters = {},
    autoSearch = true,
    debounceMs = 300,
    useUrlState: enableUrlState = true,
    urlStateOptions = {}
  } = options;

  const queryClient = useQueryClient();
  const { validateFilterState, sanitizeFilterState } = useFilterStateValidation();
  
  // URL state management (optional)
  const urlState = useUrlState({
    defaultState: {
      query: initialQuery,
      filters: Object.entries(initialFilters).reduce((acc, [key, value]) => {
        acc[key] = typeof value === 'object' ? value : { operator: 'equals', value };
        return acc;
      }, {} as Record<string, any>),
      sorting: { field: 'createdAt', direction: 'desc' },
      pagination: { page: 1, limit: 50 }
    },
    debounceMs: urlStateOptions.debounceMs || 500,
    replaceHistory: urlStateOptions.replaceHistory ?? true
  });
  
  // Local state (when URL state is disabled)
  const [localQuery, setLocalQuery] = useState(initialQuery);
  const [localFilters, setLocalFilters] = useState(initialFilters);
  const [localFilterState, setLocalFilterState] = useState<FilterState>({
    query: initialQuery,
    filters: Object.entries(initialFilters).reduce((acc, [key, value]) => {
      acc[key] = typeof value === 'object' ? value : { operator: 'equals', value };
      return acc;
    }, {} as Record<string, any>),
    sorting: { field: 'createdAt', direction: 'desc' },
    pagination: { page: 1, limit: 50 }
  });

  // Use URL state or local state based on configuration
  const query = enableUrlState ? urlState.state.query : localQuery;
  const filterState = enableUrlState ? urlState.state : localFilterState;
  const filters = useMemo(() => {
    return Object.entries(filterState.filters).reduce((acc, [key, filterValue]) => {
      acc[key] = filterValue.values || filterValue.value;
      return acc;
    }, {} as Record<string, any>);
  }, [filterState.filters]);

  const setQuery = useCallback((newQuery: string) => {
    if (enableUrlState) {
      urlState.updateState({ 
        query: newQuery,
        pagination: { ...urlState.state.pagination, page: 1 }
      });
    } else {
      setLocalQuery(newQuery);
      setLocalFilterState(prev => ({
        ...prev,
        query: newQuery,
        pagination: { ...prev.pagination, page: 1 }
      }));
    }
  }, [enableUrlState, urlState]);

  const setFilters = useCallback((newFilters: Record<string, any>) => {
    const filterStateFilters = Object.entries(newFilters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = typeof value === 'object' ? value : { operator: 'equals', value };
      }
      return acc;
    }, {} as Record<string, any>);

    if (enableUrlState) {
      urlState.updateState({ 
        filters: filterStateFilters,
        pagination: { ...urlState.state.pagination, page: 1 }
      });
    } else {
      setLocalFilters(newFilters);
      setLocalFilterState(prev => ({
        ...prev,
        filters: filterStateFilters,
        pagination: { ...prev.pagination, page: 1 }
      }));
    }
  }, [enableUrlState, urlState]);

  const setFilterState = useCallback((newState: FilterState) => {
    // Validate and sanitize the state
    const validatedState = validateFilterState(newState);
    const sanitizedState = sanitizeFilterState(validatedState);

    if (enableUrlState) {
      urlState.setState(sanitizedState);
    } else {
      setLocalFilterState(sanitizedState);
      // Update individual state pieces for consistency
      setLocalQuery(sanitizedState.query);
      const simpleFilters = Object.entries(sanitizedState.filters).reduce((acc, [key, filterValue]) => {
        acc[key] = filterValue.values || filterValue.value;
        return acc;
      }, {} as Record<string, any>);
      setLocalFilters(simpleFilters);
    }
  }, [enableUrlState, urlState, validateFilterState, sanitizeFilterState]);

  // Debounced query for auto-search
  const debouncedQuery = useDebounce(query, debounceMs);

  // Search configuration query
  const {
    data: searchConfig,
    isLoading: isLoadingConfig
  } = useQuery({
    queryKey: ['admin', 'search', 'config', entity],
    queryFn: async () => {
      if (!entity) return null;
      
      const response = await fetch(`/api/admin/search/config/${entity}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch search configuration');
      }
      
      const data = await response.json();
      return data.success ? data.config : null;
    },
    enabled: !!entity,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Search results query
  const searchQueryKey = useMemo(() => {
    if (entity) {
      return ['admin', 'search', 'entity', entity, filterState];
    } else {
      return ['admin', 'search', 'global', filterState.query, filterState.filters];
    }
  }, [entity, filterState]);

  const {
    data: results,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: searchQueryKey,
    queryFn: async () => {
      const searchQuery = filterState.query.trim();
      
      if (!autoSearch && !searchQuery) {
        return null;
      }

      if (entity) {
        // Entity-specific search
        const params = new URLSearchParams({
          q: searchQuery,
          page: filterState.pagination.page.toString(),
          limit: filterState.pagination.limit.toString(),
          sort: filterState.sorting.field,
          sortDir: filterState.sorting.direction,
          includeMetadata: 'true'
        });

        if (Object.keys(filterState.filters).length > 0) {
          params.append('filters', JSON.stringify(filterState.filters));
        }

        const response = await fetch(`/api/admin/search/${entity}?${params}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to perform entity search');
        }

        const data = await response.json();
        return data.success ? data : null;
      } else {
        // Global search
        if (!searchQuery || searchQuery.length < 2) {
          return null;
        }

        const params = new URLSearchParams({
          q: searchQuery,
          limit: filterState.pagination.limit.toString(),
          includeMetadata: 'true'
        });

        const response = await fetch(`/api/admin/search/global?${params}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to perform global search');
        }

        const data = await response.json();
        return data.success ? data : null;
      }
    },
    enabled: autoSearch ? (entity ? true : debouncedQuery.length >= 2) : false,
    staleTime: 30 * 1000 // 30 seconds
  });

  // Search suggestions query
  const {
    data: suggestions = [],
    isLoading: isLoadingSuggestions
  } = useQuery({
    queryKey: ['admin', 'search', 'suggestions', entity, debouncedQuery],
    queryFn: async () => {
      if (!entity || !debouncedQuery || debouncedQuery.length < 2) {
        return [];
      }

      const params = new URLSearchParams({
        q: debouncedQuery
      });

      const response = await fetch(`/api/admin/search/suggestions/${entity}?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.success ? data.suggestions : [];
    },
    enabled: !!entity && debouncedQuery.length >= 2,
    staleTime: 60 * 1000 // 1 minute
  });

  // Saved searches (mock implementation - would be stored in backend)
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // Update local filter state when query or filters change (only for local state mode)
  useEffect(() => {
    if (!enableUrlState) {
      setLocalFilterState(prev => ({
        ...prev,
        query: localQuery,
        filters: Object.entries(localFilters).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            acc[key] = typeof value === 'object' ? value : { operator: 'equals', value };
          }
          return acc;
        }, {} as Record<string, any>)
      }));
    }
  }, [enableUrlState, localQuery, localFilters]);

  // Search function
  const search = useCallback((searchQuery?: string) => {
    const queryToUse = searchQuery !== undefined ? searchQuery : query;
    
    const newState = {
      ...filterState,
      query: queryToUse,
      pagination: { ...filterState.pagination, page: 1 } // Reset to first page
    };
    
    setFilterState(newState);

    // Manually trigger refetch if auto-search is disabled
    if (!autoSearch) {
      refetch();
    }
  }, [query, filterState, setFilterState, refetch, autoSearch]);

  // Clear search function
  const clearSearch = useCallback(() => {
    const defaultState = {
      query: '',
      filters: {},
      sorting: { field: 'createdAt', direction: 'desc' as const },
      pagination: { page: 1, limit: 50 }
    };

    if (enableUrlState) {
      urlState.setState(defaultState);
    } else {
      setLocalQuery('');
      setLocalFilters({});
      setLocalFilterState(defaultState);
    }
  }, [enableUrlState, urlState]);

  // Reset to defaults function
  const resetToDefaults = useCallback(() => {
    if (enableUrlState) {
      urlState.resetState();
    } else {
      clearSearch();
    }
  }, [enableUrlState, urlState, clearSearch]);

  // Save search function
  const saveSearch = useCallback(async (name: string, description?: string) => {
    const savedSearch: SavedSearch = {
      id: Date.now().toString(), // In real implementation, this would be generated by backend
      name,
      description,
      entity: entity || 'global',
      filterState,
      isPublic: false,
      createdBy: 'current-user', // Would be actual user ID
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setSavedSearches(prev => [...prev, savedSearch]);
    
    // In real implementation, this would make an API call to save to backend
    // await fetch('/api/admin/saved-searches', { method: 'POST', body: JSON.stringify(savedSearch) });
  }, [entity, filterState]);

  // Load saved search function
  const loadSavedSearch = useCallback((savedSearch: SavedSearch) => {
    const validatedState = validateFilterState(savedSearch.filterState);
    const sanitizedState = sanitizeFilterState(validatedState);
    
    if (enableUrlState) {
      urlState.setState(sanitizedState);
    } else {
      setLocalQuery(sanitizedState.query);
      const simpleFilters = Object.entries(sanitizedState.filters).reduce((acc, [key, filterValue]) => {
        acc[key] = filterValue.values || filterValue.value;
        return acc;
      }, {} as Record<string, any>);
      setLocalFilters(simpleFilters);
      setLocalFilterState(sanitizedState);
    }
  }, [enableUrlState, urlState, validateFilterState, sanitizeFilterState]);

  // Delete saved search function
  const deleteSavedSearch = useCallback(async (id: string) => {
    setSavedSearches(prev => prev.filter(search => search.id !== id));
    
    // In real implementation, this would make an API call to delete from backend
    // await fetch(`/api/admin/saved-searches/${id}`, { method: 'DELETE' });
  }, []);

  // Copy shareable URL function
  const copyShareableUrl = useCallback(async (): Promise<boolean> => {
    if (!enableUrlState) return false;
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(urlState.shareableUrl);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = urlState.shareableUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        textArea.remove();
        return success;
      }
    } catch (error) {
      console.error('Failed to copy shareable URL:', error);
      return false;
    }
  }, [enableUrlState, urlState.shareableUrl]);

  return {
    // Search state
    query,
    setQuery,
    filters,
    setFilters,
    filterState,
    setFilterState,
    
    // Search results
    results,
    isLoading,
    error,
    
    // Search actions
    search,
    clearSearch,
    refetch,
    
    // Suggestions
    suggestions,
    isLoadingSuggestions,
    
    // Configuration
    searchConfig,
    isLoadingConfig,
    
    // Saved searches
    savedSearches,
    saveSearch,
    loadSavedSearch,
    deleteSavedSearch,
    
    // URL state management
    shareableUrl: enableUrlState ? urlState.shareableUrl : '',
    copyShareableUrl,
    resetToDefaults
  };
}

// Custom hook for debouncing values
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}