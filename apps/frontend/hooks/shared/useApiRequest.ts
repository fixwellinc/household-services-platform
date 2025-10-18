'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useApi } from '@/hooks/use-api';
import { toast } from 'sonner';

interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

interface ApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
  isSuccess: boolean;
}

interface UseApiRequestOptions {
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  successMessage?: string;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * Shared API request hook with consistent error handling and loading states
 * Provides standardized data fetching patterns across components
 */
export function useApiRequest<T = any>(options: UseApiRequestOptions = {}) {
  const {
    showErrorToast = true,
    showSuccessToast = false,
    successMessage,
    retryCount = 0,
    retryDelay = 1000,
  } = options;

  const { request } = useApi();
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
    isSuccess: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const handleError = useCallback((error: any) => {
    const apiError: ApiError = {
      message: error?.message || 'Request failed',
      status: error?.status,
      code: error?.code,
    };

    setState(prev => ({
      ...prev,
      error: apiError,
      isLoading: false,
      isSuccess: false,
    }));

    if (showErrorToast) {
      toast.error(apiError.message);
    }
  }, [showErrorToast]);

  const handleSuccess = useCallback((data: T) => {
    setState(prev => ({
      ...prev,
      data,
      error: null,
      isLoading: false,
      isSuccess: true,
    }));

    if (showSuccessToast && successMessage) {
      toast.success(successMessage);
    }
  }, [showSuccessToast, successMessage]);

  const executeRequest = useCallback(async (
    endpoint: string,
    options: RequestInit = {},
    currentRetry = 0
  ): Promise<T> => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      isSuccess: false,
    }));

    try {
      const data = await request<T>(endpoint, {
        ...options,
        signal: abortControllerRef.current.signal,
      });

      handleSuccess(data);
      return data;
    } catch (error: any) {
      // Don't handle aborted requests as errors
      if (error.name === 'AbortError') {
        return Promise.reject(error);
      }

      // Retry logic
      if (currentRetry < retryCount) {
        retryTimeoutRef.current = setTimeout(() => {
          executeRequest(endpoint, options, currentRetry + 1);
        }, retryDelay);
        return Promise.reject(error);
      }

      handleError(error);
      throw error;
    }
  }, [request, retryCount, retryDelay, handleError, handleSuccess]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    execute: executeRequest,
    clearError,
    cancel: () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      setState(prev => ({ ...prev, isLoading: false }));
    },
  };
}