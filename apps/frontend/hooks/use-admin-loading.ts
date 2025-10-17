"use client";

import { useState, useCallback, useRef, useEffect } from 'react';

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  progress?: number;
  stage?: string;
}

export interface LoadingOptions {
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  onTimeout?: () => void;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

export function useAdminLoading(initialState: boolean = false, options: LoadingOptions = {}) {
  const [state, setState] = useState<LoadingState>({
    isLoading: initialState,
    error: null,
    progress: undefined,
    stage: undefined
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const { timeout = 30000, retryCount = 3, retryDelay = 1000, onTimeout, onError, onSuccess } = options;

  const startLoading = useCallback((stage?: string) => {
    setState({
      isLoading: true,
      error: null,
      progress: 0,
      stage
    });

    // Set timeout if specified
    if (timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Operation timed out'
        }));
        if (onTimeout) onTimeout();
      }, timeout);
    }
  }, [timeout, onTimeout]);

  const stopLoading = useCallback((success: boolean = true) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setState({
      isLoading: false,
      error: null,
      progress: 100,
      stage: undefined
    });

    if (success && onSuccess) {
      onSuccess();
    }

    retryCountRef.current = 0;
  }, [onSuccess]);

  const setError = useCallback((error: string | Error) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const errorMessage = error instanceof Error ? error.message : error;
    
    setState({
      isLoading: false,
      error: errorMessage,
      progress: undefined,
      stage: undefined
    });

    if (onError && error instanceof Error) {
      onError(error);
    }
  }, [onError]);

  const updateProgress = useCallback((progress: number, stage?: string) => {
    setState(prev => ({
      ...prev,
      progress: Math.max(0, Math.min(100, progress)),
      stage: stage || prev.stage
    }));
  }, []);

  const retry = useCallback(async (operation: () => Promise<void>) => {
    if (retryCountRef.current >= retryCount) {
      setError('Maximum retry attempts reached');
      return;
    }

    retryCountRef.current++;
    
    try {
      await new Promise(resolve => setTimeout(resolve, retryDelay * retryCountRef.current));
      await operation();
      stopLoading(true);
    } catch (error) {
      if (retryCountRef.current < retryCount) {
        retry(operation);
      } else {
        setError(error as Error);
      }
    }
  }, [retryCount, retryDelay, setError, stopLoading]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setState({
      isLoading: false,
      error: null,
      progress: undefined,
      stage: undefined
    });

    retryCountRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startLoading,
    stopLoading,
    setError,
    updateProgress,
    retry,
    reset,
    canRetry: retryCountRef.current < retryCount
  };
}

// Hook for managing multiple loading states
export function useMultipleLoadingStates<T extends string>(keys: T[]) {
  const [states, setStates] = useState<Record<T, LoadingState>>(
    keys.reduce((acc, key) => ({
      ...acc,
      [key]: { isLoading: false, error: null }
    }), {} as Record<T, LoadingState>)
  );

  const updateState = useCallback((key: T, updates: Partial<LoadingState>) => {
    setStates(prev => ({
      ...prev,
      [key]: { ...prev[key], ...updates }
    }));
  }, []);

  const startLoading = useCallback((key: T, stage?: string) => {
    updateState(key, { isLoading: true, error: null, progress: 0, stage });
  }, [updateState]);

  const stopLoading = useCallback((key: T) => {
    updateState(key, { isLoading: false, progress: 100, stage: undefined });
  }, [updateState]);

  const setError = useCallback((key: T, error: string) => {
    updateState(key, { isLoading: false, error, progress: undefined, stage: undefined });
  }, [updateState]);

  const updateProgress = useCallback((key: T, progress: number, stage?: string) => {
    updateState(key, { progress, stage });
  }, [updateState]);

  const reset = useCallback((key?: T) => {
    if (key) {
      updateState(key, { isLoading: false, error: null, progress: undefined, stage: undefined });
    } else {
      setStates(prev => 
        Object.keys(prev).reduce((acc, k) => ({
          ...acc,
          [k]: { isLoading: false, error: null, progress: undefined, stage: undefined }
        }), {} as Record<T, LoadingState>)
      );
    }
  }, [updateState]);

  const isAnyLoading = (Object.values(states) as LoadingState[]).some(state => state.isLoading);
  const hasAnyError = (Object.values(states) as LoadingState[]).some(state => state.error);

  return {
    states,
    startLoading,
    stopLoading,
    setError,
    updateProgress,
    reset,
    isAnyLoading,
    hasAnyError
  };
}

// Hook for data fetching with loading states
export function useAdminDataFetching<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  options: LoadingOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const loading = useAdminLoading(false, options);

  const fetchData = useCallback(async () => {
    loading.startLoading('Fetching data...');
    
    try {
      const result = await fetchFn();
      setData(result);
      loading.stopLoading(true);
      return result;
    } catch (error) {
      loading.setError(error as Error);
      throw error;
    }
  }, [fetchFn, loading]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  // Auto-fetch on mount and dependency changes
  useEffect(() => {
    fetchData();
  }, dependencies);

  return {
    data,
    ...loading,
    refetch,
    fetchData
  };
}