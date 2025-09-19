'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface LoadingState {
  isLoading: boolean;
  progress?: number;
  message?: string;
  error?: Error | null;
}

interface UseLoadingStateOptions {
  initialLoading?: boolean;
  minLoadingTime?: number;
  timeout?: number;
  onTimeout?: () => void;
  onError?: (error: Error) => void;
}

interface UseLoadingStateReturn {
  isLoading: boolean;
  progress?: number;
  message?: string;
  error?: Error | null;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  setProgress: (progress: number) => void;
  setMessage: (message: string) => void;
  setError: (error: Error | null) => void;
  executeWithLoading: <T>(
    operation: () => Promise<T>,
    message?: string
  ) => Promise<T>;
  reset: () => void;
}

export function useLoadingState(options: UseLoadingStateOptions = {}): UseLoadingStateReturn {
  const {
    initialLoading = false,
    minLoadingTime = 0,
    timeout,
    onTimeout,
    onError
  } = options;

  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    progress: undefined,
    message: undefined,
    error: null
  });

  const loadingStartTime = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const minTimeoutRef = useRef<NodeJS.Timeout>();

  const startLoading = useCallback((message?: string) => {
    loadingStartTime.current = Date.now();
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      message,
      error: null,
      progress: undefined
    }));

    // Set timeout if specified
    if (timeout && onTimeout) {
      timeoutRef.current = setTimeout(() => {
        onTimeout();
        setState(prev => ({
          ...prev,
          error: new Error('Operation timed out')
        }));
      }, timeout);
    }
  }, [timeout, onTimeout]);

  const stopLoading = useCallback(() => {
    const stopLoadingInternal = () => {
      setState(prev => ({
        ...prev,
        isLoading: false
      }));
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    // Ensure minimum loading time if specified
    if (minLoadingTime > 0 && loadingStartTime.current) {
      const elapsed = Date.now() - loadingStartTime.current;
      const remaining = minLoadingTime - elapsed;
      
      if (remaining > 0) {
        minTimeoutRef.current = setTimeout(stopLoadingInternal, remaining);
      } else {
        stopLoadingInternal();
      }
    } else {
      stopLoadingInternal();
    }
  }, [minLoadingTime]);

  const setProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress))
    }));
  }, []);

  const setMessage = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      message
    }));
  }, []);

  const setError = useCallback((error: Error | null) => {
    setState(prev => ({
      ...prev,
      error,
      isLoading: error ? false : prev.isLoading
    }));

    if (error && onError) {
      onError(error);
    }
  }, [onError]);

  const executeWithLoading = useCallback(async <T>(
    operation: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    startLoading(message);
    
    try {
      const result = await operation();
      stopLoading();
      return result;
    } catch (error) {
      setError(error as Error);
      throw error;
    }
  }, [startLoading, stopLoading, setError]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (minTimeoutRef.current) {
      clearTimeout(minTimeoutRef.current);
    }
    
    setState({
      isLoading: false,
      progress: undefined,
      message: undefined,
      error: null
    });
    
    loadingStartTime.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (minTimeoutRef.current) {
        clearTimeout(minTimeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading: state.isLoading,
    progress: state.progress,
    message: state.message,
    error: state.error,
    startLoading,
    stopLoading,
    setProgress,
    setMessage,
    setError,
    executeWithLoading,
    reset
  };
}

// Hook for managing multiple loading states
export function useMultipleLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Record<string, LoadingState>>({});

  const setLoadingState = useCallback((key: string, state: Partial<LoadingState>) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        ...{
          isLoading: false,
          progress: undefined,
          message: undefined,
          error: null
        },
        ...prev[key],
        ...state
      }
    }));
  }, []);

  const startLoading = useCallback((key: string, message?: string) => {
    setLoadingState(key, { isLoading: true, message, error: null });
  }, [setLoadingState]);

  const stopLoading = useCallback((key: string) => {
    setLoadingState(key, { isLoading: false });
  }, [setLoadingState]);

  const setProgress = useCallback((key: string, progress: number) => {
    setLoadingState(key, { progress: Math.min(100, Math.max(0, progress)) });
  }, [setLoadingState]);

  const setMessage = useCallback((key: string, message: string) => {
    setLoadingState(key, { message });
  }, [setLoadingState]);

  const setError = useCallback((key: string, error: Error | null) => {
    setLoadingState(key, { error, isLoading: error ? false : loadingStates[key]?.isLoading });
  }, [setLoadingState, loadingStates]);

  const getLoadingState = useCallback((key: string): LoadingState => {
    return loadingStates[key] || {
      isLoading: false,
      progress: undefined,
      message: undefined,
      error: null
    };
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(state => state.isLoading);
  }, [loadingStates]);

  const reset = useCallback((key?: string) => {
    if (key) {
      setLoadingStates(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    } else {
      setLoadingStates({});
    }
  }, []);

  return {
    loadingStates,
    startLoading,
    stopLoading,
    setProgress,
    setMessage,
    setError,
    getLoadingState,
    isAnyLoading,
    reset
  };
}

// Hook for sequential loading steps
export function useSequentialLoading(steps: string[]) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const startSequence = useCallback(() => {
    setIsLoading(true);
    setCurrentStep(0);
    setCompletedSteps(new Set());
  }, []);

  const nextStep = useCallback(() => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      newSet.add(currentStep);
      return newSet;
    });
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsLoading(false);
    }
  }, [currentStep, steps.length]);

  const skipToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  }, [steps.length]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setCurrentStep(0);
    setCompletedSteps(new Set());
  }, []);

  const progress = ((completedSteps.size + (isLoading ? 0.5 : 0)) / steps.length) * 100;

  return {
    isLoading,
    currentStep,
    currentStepName: steps[currentStep],
    completedSteps: Array.from(completedSteps),
    progress,
    startSequence,
    nextStep,
    skipToStep,
    reset,
    isComplete: !isLoading && completedSteps.size === steps.length
  };
}

// Hook for debounced loading state
export function useDebouncedLoading(delay: number = 300) {
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedLoading, setDebouncedLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isLoading) {
      timeoutRef.current = setTimeout(() => {
        setDebouncedLoading(true);
      }, delay);
    } else {
      setDebouncedLoading(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, delay]);

  return {
    isLoading,
    debouncedLoading,
    setLoading: setIsLoading
  };
}