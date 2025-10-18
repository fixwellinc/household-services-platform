'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApiRequest } from './useApiRequest';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface UseCachedDataOptions {
  cacheKey: string;
  endpoint: string;
  requestOptions?: RequestInit;
  cacheDuration?: number; // in milliseconds
  staleWhileRevalidate?: boolean;
  showErrorToast?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

/**
 * Shared caching hook for API data with stale-while-revalidate strategy
 * Provides consistent caching patterns across components
 */
export function useCachedData<T = any>(options: UseCachedDataOptions) {
  const {
    cacheKey,
    endpoint,
    requestOptions = {},
    cacheDuration = 5 * 60 * 1000, // 5 minutes default
    staleWhileRevalidate = true,
    showErrorToast = true,
    autoRefresh = false,
    refreshInterval = 30 * 1000, // 30 seconds default
  } = options;

  const [cachedData, setCachedData] = useState<T | null>(null);
  const [isStale, setIsStale] = useState(false);
  const cacheRef = useRef<Map<string, CacheEntry<any>>>(new Map());
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data, isLoading, error, execute, clearError } = useApiRequest<T>({
    showErrorToast,
  });

  // Get data from cache
  const getCachedData = useCallback((key: string): CacheEntry<T> | null => {
    const entry = cacheRef.current.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      cacheRef.current.delete(key);
      return null;
    }

    return entry as CacheEntry<T>;
  }, []);

  // Set data in cache
  const setCacheData = useCallback((key: string, data: T) => {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + cacheDuration,
    };
    cacheRef.current.set(key, entry);
  }, [cacheDuration]);

  // Check if data is stale
  const isDataStale = useCallback((entry: CacheEntry<T>): boolean => {
    const now = Date.now();
    const staleThreshold = entry.timestamp + (cacheDuration * 0.8); // 80% of cache duration
    return now > staleThreshold;
  }, [cacheDuration]);

  // Fetch fresh data
  const fetchData = useCallback(async (forceRefresh = false) => {
    const cached = getCachedData(cacheKey);
    
    // Return cached data if available and not forcing refresh
    if (cached && !forceRefresh) {
      setCachedData(cached.data);
      setIsStale(isDataStale(cached));
      
      // If stale-while-revalidate is enabled and data is stale, fetch in background
      if (staleWhileRevalidate && isDataStale(cached)) {
        execute(endpoint, requestOptions).catch(() => {
          // Silently handle background refresh errors
        });
      }
      
      return cached.data;
    }

    // Fetch fresh data
    try {
      const freshData = await execute(endpoint, requestOptions);
      setCacheData(cacheKey, freshData);
      setCachedData(freshData);
      setIsStale(false);
      return freshData;
    } catch (error) {
      // If we have cached data and fetch fails, return cached data
      if (cached) {
        setCachedData(cached.data);
        setIsStale(true);
        return cached.data;
      }
      throw error;
    }
  }, [
    cacheKey,
    endpoint,
    requestOptions,
    getCachedData,
    setCacheData,
    isDataStale,
    staleWhileRevalidate,
    execute,
  ]);

  // Invalidate cache
  const invalidateCache = useCallback(() => {
    cacheRef.current.delete(cacheKey);
    setCachedData(null);
    setIsStale(false);
  }, [cacheKey]);

  // Refresh data
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshTimeoutRef.current = setInterval(() => {
        fetchData(true);
      }, refreshInterval);

      return () => {
        if (refreshTimeoutRef.current) {
          clearInterval(refreshTimeoutRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, fetchData]);

  // Update cached data when new data is received
  useEffect(() => {
    if (data) {
      setCacheData(cacheKey, data);
      setCachedData(data);
      setIsStale(false);
    }
  }, [data, cacheKey, setCacheData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    data: cachedData,
    isLoading,
    error,
    isStale,
    refresh,
    invalidateCache,
    clearError,
  };
}