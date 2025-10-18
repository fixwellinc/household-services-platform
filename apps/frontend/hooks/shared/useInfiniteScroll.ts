'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useApiRequest } from './useApiRequest';

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
  };
}

interface UseInfiniteScrollOptions {
  endpoint: string;
  limit?: number;
  initialParams?: Record<string, any>;
  threshold?: number; // Distance from bottom to trigger load (in pixels)
  showErrorToast?: boolean;
}

/**
 * Shared infinite scroll hook for paginated data
 * Provides consistent pagination patterns across components
 */
export function useInfiniteScroll<T = any>(options: UseInfiniteScrollOptions) {
  const {
    endpoint,
    limit = 20,
    initialParams = {},
    threshold = 100,
    showErrorToast = true,
  } = options;

  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const isLoadingMoreRef = useRef(false);

  const { isLoading, error, execute, clearError } = useApiRequest<PaginatedResponse<T>>({
    showErrorToast,
  });

  // Load more items
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || isLoadingMoreRef.current) return;

    isLoadingMoreRef.current = true;

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...initialParams,
      });

      const response = await execute(`${endpoint}?${params}`);
      
      if (response) {
        setItems(prev => page === 1 ? response.data : [...prev, ...response.data]);
        setHasMore(response.pagination.hasNext);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      // Error is handled by useApiRequest
    } finally {
      isLoadingMoreRef.current = false;
      setIsInitialLoading(false);
    }
  }, [endpoint, page, limit, initialParams, hasMore, isLoading, execute]);

  // Reset and reload from beginning
  const reset = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setIsInitialLoading(true);
    clearError();
  }, [clearError]);

  // Refresh data (reset and load first page)
  const refresh = useCallback(() => {
    reset();
    // loadMore will be called by useEffect when page resets to 1
  }, [reset]);

  // Set up intersection observer for automatic loading
  const setupObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current);
    }
  }, [hasMore, isLoading, loadMore, threshold]);

  // Load initial data
  useEffect(() => {
    if (page === 1) {
      loadMore();
    }
  }, [page]); // Only depend on page to avoid infinite loops

  // Set up observer when component mounts or dependencies change
  useEffect(() => {
    setupObserver();
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [setupObserver]);

  // Ref callback for the loading trigger element
  const setLoadingRef = useCallback((node: HTMLDivElement | null) => {
    loadingRef.current = node;
    setupObserver();
  }, [setupObserver]);

  return {
    items,
    isLoading: isInitialLoading || isLoading,
    isLoadingMore: isLoading && !isInitialLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    reset,
    clearError,
    loadingRef: setLoadingRef,
  };
}