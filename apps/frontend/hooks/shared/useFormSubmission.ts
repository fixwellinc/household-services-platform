'use client';

import { useState, useCallback } from 'react';
import { useApiRequest } from './useApiRequest';
import { toast } from 'sonner';

interface SubmissionOptions {
  endpoint: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  transformData?: (data: any) => any;
}

interface SubmissionState {
  isSubmitting: boolean;
  isSuccess: boolean;
  error: any;
  data: any;
}

/**
 * Shared form submission hook with consistent error handling and success feedback
 * Provides standardized form submission patterns across components
 */
export function useFormSubmission<T = any>(options: SubmissionOptions) {
  const {
    endpoint,
    method = 'POST',
    showSuccessToast = true,
    showErrorToast = true,
    successMessage = 'Form submitted successfully',
    onSuccess,
    onError,
    transformData,
  } = options;

  const [state, setState] = useState<SubmissionState>({
    isSubmitting: false,
    isSuccess: false,
    error: null,
    data: null,
  });

  const { execute } = useApiRequest<T>({
    showErrorToast: false, // We'll handle toasts manually
  });

  const submit = useCallback(async (formData: any) => {
    setState(prev => ({
      ...prev,
      isSubmitting: true,
      isSuccess: false,
      error: null,
    }));

    try {
      // Transform data if transformer is provided
      const dataToSubmit = transformData ? transformData(formData) : formData;

      const response = await execute(endpoint, {
        method,
        body: JSON.stringify(dataToSubmit),
      });

      setState(prev => ({
        ...prev,
        isSubmitting: false,
        isSuccess: true,
        data: response,
      }));

      // Show success toast
      if (showSuccessToast) {
        toast.success(successMessage);
      }

      // Call success callback
      if (onSuccess) {
        onSuccess(response);
      }

      return response;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        isSuccess: false,
        error,
      }));

      // Show error toast
      if (showErrorToast) {
        toast.error(error?.message || 'Form submission failed');
      }

      // Call error callback
      if (onError) {
        onError(error);
      }

      throw error;
    }
  }, [
    endpoint,
    method,
    showSuccessToast,
    showErrorToast,
    successMessage,
    onSuccess,
    onError,
    transformData,
    execute,
  ]);

  const reset = useCallback(() => {
    setState({
      isSubmitting: false,
      isSuccess: false,
      error: null,
      data: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    ...state,
    submit,
    reset,
    clearError,
  };
}