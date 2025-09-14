import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { FilterState } from '../types/admin';

interface UseUrlStateOptions {
  defaultState?: FilterState;
  debounceMs?: number;
  replaceHistory?: boolean;
}

interface UseUrlStateReturn {
  state: FilterState;
  setState: (state: FilterState) => void;
  updateState: (updates: Partial<FilterState>) => void;
  resetState: () => void;
  shareableUrl: string;
  isLoading: boolean;
}

/**
 * Hook for managing filter state in URL parameters
 * Provides URL-based persistence, sharing, and bookmarking capabilities
 */
export function useUrlState(options: UseUrlStateOptions = {}): UseUrlStateReturn {
  const {
    defaultState = {
      query: '',
      filters: {},
      sorting: { field: 'createdAt', direction: 'desc' },
      pagination: { page: 1, limit: 50 }
    },
    debounceMs = 500,
    replaceHistory = true
  } = options;

  const router = useRouter();
  const [state, setState] = useState<FilterState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);
  const [updateTimeout, setUpdateTimeout] = useState<NodeJS.Timeout | null>(null);

  // Parse URL parameters to filter state
  const parseUrlToState = useCallback((query: Record<string, string | string[] | undefined>): FilterState => {
    try {
      const parsedState: FilterState = { ...defaultState };

      // Parse query
      if (query.q && typeof query.q === 'string') {
        parsedState.query = query.q;
      }

      // Parse filters
      if (query.filters && typeof query.filters === 'string') {
        try {
          const filters = JSON.parse(decodeURIComponent(query.filters));
          if (typeof filters === 'object' && filters !== null) {
            parsedState.filters = filters;
          }
        } catch (error) {
          console.warn('Failed to parse filters from URL:', error);
        }
      }

      // Parse sorting
      if (query.sort && typeof query.sort === 'string') {
        parsedState.sorting.field = query.sort;
      }
      if (query.sortDir && typeof query.sortDir === 'string') {
        parsedState.sorting.direction = query.sortDir as 'asc' | 'desc';
      }

      // Parse pagination
      if (query.page && typeof query.page === 'string') {
        const page = parseInt(query.page, 10);
        if (!isNaN(page) && page > 0) {
          parsedState.pagination.page = page;
        }
      }
      if (query.limit && typeof query.limit === 'string') {
        const limit = parseInt(query.limit, 10);
        if (!isNaN(limit) && limit > 0 && limit <= 1000) {
          parsedState.pagination.limit = limit;
        }
      }

      return parsedState;
    } catch (error) {
      console.error('Error parsing URL state:', error);
      return defaultState;
    }
  }, [defaultState]);

  // Convert filter state to URL parameters
  const stateToUrlParams = useCallback((filterState: FilterState): Record<string, string> => {
    const params: Record<string, string> = {};

    // Add query
    if (filterState.query.trim()) {
      params.q = filterState.query.trim();
    }

    // Add filters
    if (Object.keys(filterState.filters).length > 0) {
      params.filters = encodeURIComponent(JSON.stringify(filterState.filters));
    }

    // Add sorting (only if different from default)
    if (filterState.sorting.field !== defaultState.sorting.field) {
      params.sort = filterState.sorting.field;
    }
    if (filterState.sorting.direction !== defaultState.sorting.direction) {
      params.sortDir = filterState.sorting.direction;
    }

    // Add pagination (only if different from default)
    if (filterState.pagination.page !== defaultState.pagination.page) {
      params.page = filterState.pagination.page.toString();
    }
    if (filterState.pagination.limit !== defaultState.pagination.limit) {
      params.limit = filterState.pagination.limit.toString();
    }

    return params;
  }, [defaultState]);

  // Update URL with current state
  const updateUrl = useCallback((newState: FilterState) => {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    const timeout = setTimeout(() => {
      const params = stateToUrlParams(newState);
      
      // Build new query object
      const newQuery = { ...router.query };
      
      // Remove old filter-related params
      delete newQuery.q;
      delete newQuery.filters;
      delete newQuery.sort;
      delete newQuery.sortDir;
      delete newQuery.page;
      delete newQuery.limit;
      
      // Add new params
      Object.assign(newQuery, params);

      // Update URL
      router.push(
        {
          pathname: router.pathname,
          query: newQuery
        },
        undefined,
        { 
          shallow: true,
          scroll: false,
          ...(replaceHistory && { replace: true })
        }
      );
    }, debounceMs);

    setUpdateTimeout(timeout);
  }, [router, stateToUrlParams, updateTimeout, debounceMs, replaceHistory]);

  // Initialize state from URL on mount and route changes
  useEffect(() => {
    if (router.isReady) {
      const urlState = parseUrlToState(router.query);
      setState(urlState);
      setIsLoading(false);
    }
  }, [router.isReady, router.query, parseUrlToState]);

  // Update state and URL
  const handleSetState = useCallback((newState: FilterState) => {
    setState(newState);
    updateUrl(newState);
  }, [updateUrl]);

  // Update partial state
  const updateState = useCallback((updates: Partial<FilterState>) => {
    const newState = { ...state, ...updates };
    handleSetState(newState);
  }, [state, handleSetState]);

  // Reset to default state
  const resetState = useCallback(() => {
    handleSetState(defaultState);
  }, [defaultState, handleSetState]);

  // Generate shareable URL
  const shareableUrl = React.useMemo(() => {
    if (typeof window === 'undefined') return '';
    
    const params = stateToUrlParams(state);
    const url = new URL(window.location.href);
    
    // Clear existing filter params
    url.searchParams.delete('q');
    url.searchParams.delete('filters');
    url.searchParams.delete('sort');
    url.searchParams.delete('sortDir');
    url.searchParams.delete('page');
    url.searchParams.delete('limit');
    
    // Add current state params
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    
    return url.toString();
  }, [state, stateToUrlParams]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [updateTimeout]);

  return {
    state,
    setState: handleSetState,
    updateState,
    resetState,
    shareableUrl,
    isLoading
  };
}

/**
 * Hook for validating and sanitizing filter state from URL
 */
export function useFilterStateValidation() {
  const validateFilterState = useCallback((state: FilterState, schema?: any): FilterState => {
    const validatedState: FilterState = {
      query: '',
      filters: {},
      sorting: { field: 'createdAt', direction: 'desc' },
      pagination: { page: 1, limit: 50 }
    };

    // Validate query
    if (typeof state.query === 'string' && state.query.length <= 1000) {
      validatedState.query = state.query;
    }

    // Validate filters
    if (state.filters && typeof state.filters === 'object') {
      const validatedFilters: Record<string, any> = {};
      
      Object.entries(state.filters).forEach(([key, value]) => {
        // Basic validation - in a real app, you'd validate against the schema
        if (typeof key === 'string' && key.length <= 100 && value) {
          if (typeof value === 'object' && value.operator && 
              (value.value !== undefined || value.values !== undefined)) {
            validatedFilters[key] = value;
          }
        }
      });
      
      validatedState.filters = validatedFilters;
    }

    // Validate sorting
    if (state.sorting && typeof state.sorting === 'object') {
      if (typeof state.sorting.field === 'string' && state.sorting.field.length <= 100) {
        validatedState.sorting.field = state.sorting.field;
      }
      if (state.sorting.direction === 'asc' || state.sorting.direction === 'desc') {
        validatedState.sorting.direction = state.sorting.direction;
      }
    }

    // Validate pagination
    if (state.pagination && typeof state.pagination === 'object') {
      if (typeof state.pagination.page === 'number' && 
          state.pagination.page > 0 && state.pagination.page <= 10000) {
        validatedState.pagination.page = state.pagination.page;
      }
      if (typeof state.pagination.limit === 'number' && 
          state.pagination.limit > 0 && state.pagination.limit <= 1000) {
        validatedState.pagination.limit = state.pagination.limit;
      }
    }

    return validatedState;
  }, []);

  const sanitizeFilterState = useCallback((state: FilterState): FilterState => {
    // Remove potentially dangerous content
    const sanitizedState = { ...state };
    
    // Sanitize query
    sanitizedState.query = sanitizedState.query
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .trim();

    // Sanitize filter values
    Object.keys(sanitizedState.filters).forEach(key => {
      const filter = sanitizedState.filters[key];
      if (typeof filter.value === 'string') {
        filter.value = filter.value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '');
      }
      if (Array.isArray(filter.values)) {
        filter.values = filter.values.map(v => 
          typeof v === 'string' 
            ? v.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
               .replace(/javascript:/gi, '')
            : v
        );
      }
    });

    return sanitizedState;
  }, []);

  return {
    validateFilterState,
    sanitizeFilterState
  };
}

/**
 * Hook for sharing and bookmarking filter states
 */
export function useFilterStateSharing() {
  const copyToClipboard = useCallback(async (url: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
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
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }, []);

  const shareViaEmail = useCallback((url: string, subject?: string) => {
    const emailSubject = encodeURIComponent(subject || 'Shared Search Results');
    const emailBody = encodeURIComponent(`Check out these search results: ${url}`);
    window.open(`mailto:?subject=${emailSubject}&body=${emailBody}`);
  }, []);

  const generateQRCode = useCallback(async (url: string): Promise<string | null> => {
    try {
      // In a real implementation, you'd use a QR code library
      // For now, we'll use a simple QR code service
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
      return qrUrl;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      return null;
    }
  }, []);

  return {
    copyToClipboard,
    shareViaEmail,
    generateQRCode
  };
}