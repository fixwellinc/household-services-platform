'use client';

import { useState, useCallback, useRef } from 'react';

interface ErrorState {
  error: Error | null;
  isRetrying: boolean;
  retryCount: number;
  lastRetryAt: Date | null;
}

interface UseErrorHandlerOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
  onRetry?: (retryCount: number) => void;
  onMaxRetriesReached?: (error: Error) => void;
}

interface UseErrorHandlerReturn {
  error: Error | null;
  isRetrying: boolean;
  retryCount: number;
  canRetry: boolean;
  handleError: (error: Error) => void;
  retry: () => Promise<void>;
  reset: () => void;
  executeWithRetry: <T>(fn: () => Promise<T>) => Promise<T>;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onRetry,
    onMaxRetriesReached
  } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    lastRetryAt: null
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const lastOperationRef = useRef<(() => Promise<any>) | null>(null);

  const handleError = useCallback((error: Error) => {
    console.error('Error handled:', error);
    
    setErrorState(prev => ({
      ...prev,
      error,
      isRetrying: false
    }));

    if (onError) {
      onError(error);
    }
  }, [onError]);

  const reset = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    setErrorState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      lastRetryAt: null
    });
    
    lastOperationRef.current = null;
  }, []);

  const retry = useCallback(async () => {
    if (errorState.retryCount >= maxRetries) {
      if (onMaxRetriesReached && errorState.error) {
        onMaxRetriesReached(errorState.error);
      }
      return;
    }

    if (!lastOperationRef.current) {
      console.warn('No operation to retry');
      return;
    }

    const newRetryCount = errorState.retryCount + 1;
    
    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: newRetryCount,
      lastRetryAt: new Date()
    }));

    if (onRetry) {
      onRetry(newRetryCount);
    }

    try {
      // Add delay before retry
      if (retryDelay > 0) {
        await new Promise(resolve => {
          retryTimeoutRef.current = setTimeout(resolve, retryDelay * newRetryCount);
        });
      }

      await lastOperationRef.current();
      
      // Success - reset error state
      setErrorState({
        error: null,
        isRetrying: false,
        retryCount: 0,
        lastRetryAt: null
      });
      
    } catch (error) {
      console.error(`Retry ${newRetryCount} failed:`, error);
      
      setErrorState(prev => ({
        ...prev,
        error: error as Error,
        isRetrying: false
      }));

      if (newRetryCount >= maxRetries && onMaxRetriesReached) {
        onMaxRetriesReached(error as Error);
      }
    }
  }, [errorState.retryCount, maxRetries, retryDelay, onRetry, onMaxRetriesReached]);

  const executeWithRetry = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    lastOperationRef.current = fn;
    
    try {
      const result = await fn();
      
      // Success - reset any previous error state
      if (errorState.error) {
        setErrorState({
          error: null,
          isRetrying: false,
          retryCount: 0,
          lastRetryAt: null
        });
      }
      
      return result;
    } catch (error) {
      handleError(error as Error);
      throw error;
    }
  }, [errorState.error, handleError]);

  const canRetry = errorState.retryCount < maxRetries && !errorState.isRetrying && lastOperationRef.current !== null;

  return {
    error: errorState.error,
    isRetrying: errorState.isRetrying,
    retryCount: errorState.retryCount,
    canRetry,
    handleError,
    retry,
    reset,
    executeWithRetry
  };
}

// Hook for API-specific error handling
export function useApiErrorHandler(options: UseErrorHandlerOptions = {}) {
  const errorHandler = useErrorHandler(options);

  const handleApiError = useCallback((error: any) => {
    let processedError: Error;

    if (error.response) {
      // HTTP error response
      const status = error.response.status;
      const message = error.response.data?.message || error.response.statusText || 'API request failed';
      
      processedError = new Error(`${status}: ${message}`);
      (processedError as any).status = status;
      (processedError as any).response = error.response;
    } else if (error.request) {
      // Network error
      processedError = new Error('Network error: Unable to connect to server');
      (processedError as any).isNetworkError = true;
    } else {
      // Other error
      processedError = error instanceof Error ? error : new Error(String(error));
    }

    errorHandler.handleError(processedError);
  }, [errorHandler]);

  const executeApiCall = useCallback(async <T>(apiCall: () => Promise<T>): Promise<T> => {
    try {
      return await errorHandler.executeWithRetry(apiCall);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }, [errorHandler, handleApiError]);

  return {
    ...errorHandler,
    handleApiError,
    executeApiCall
  };
}

// Utility function to determine if an error is retryable
export function isRetryableError(error: Error): boolean {
  const errorMessage = error.message.toLowerCase();
  const status = (error as any).status;

  // Network errors are retryable
  if ((error as any).isNetworkError) {
    return true;
  }

  // Specific HTTP status codes that are retryable
  if (status) {
    return [408, 429, 500, 502, 503, 504].includes(status);
  }

  // Specific error messages that indicate retryable errors
  const retryableMessages = [
    'network error',
    'timeout',
    'connection',
    'fetch',
    'cors'
  ];

  return retryableMessages.some(msg => errorMessage.includes(msg));
}

// Error classification utility
export function classifyError(error: Error): {
  type: 'network' | 'server' | 'client' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRetryable: boolean;
  userMessage: string;
} {
  const status = (error as any).status;
  const isNetworkError = (error as any).isNetworkError;
  
  if (isNetworkError) {
    return {
      type: 'network',
      severity: 'high',
      isRetryable: true,
      userMessage: 'Connection problem. Please check your internet connection and try again.'
    };
  }

  if (status) {
    if (status >= 500) {
      return {
        type: 'server',
        severity: 'high',
        isRetryable: true,
        userMessage: 'Server error. We\'re working to fix this. Please try again in a moment.'
      };
    }
    
    if (status === 429) {
      return {
        type: 'client',
        severity: 'medium',
        isRetryable: true,
        userMessage: 'Too many requests. Please wait a moment and try again.'
      };
    }
    
    if (status >= 400 && status < 500) {
      return {
        type: 'client',
        severity: status === 401 || status === 403 ? 'high' : 'medium',
        isRetryable: false,
        userMessage: status === 401 ? 'Please sign in again.' : 
                    status === 403 ? 'You don\'t have permission to access this.' :
                    'Invalid request. Please check your input and try again.'
      };
    }
  }

  return {
    type: 'unknown',
    severity: 'medium',
    isRetryable: false,
    userMessage: 'Something went wrong. Please try again or contact support if the problem persists.'
  };
}