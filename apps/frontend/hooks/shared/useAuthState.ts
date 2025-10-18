'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AuthError {
  message: string;
  field?: string;
  code?: string;
}

interface AuthState {
  isLoading: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;
  user: any;
}

interface UseAuthStateOptions {
  redirectOnSuccess?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

/**
 * Shared authentication state management hook
 * Provides consistent auth state handling across components
 */
export function useAuthState(options: UseAuthStateOptions = {}) {
  const { 
    redirectOnSuccess, 
    showSuccessToast = true, 
    showErrorToast = true 
  } = options;
  
  const { user, isLoading, isAuthenticated, login, register, logout } = useAuth();
  const [error, setError] = useState<AuthError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: any, operation: string) => {
    const authError: AuthError = {
      message: error?.message || `${operation} failed`,
      code: error?.code,
    };
    
    setError(authError);
    
    if (showErrorToast) {
      toast.error(authError.message);
    }
  }, [showErrorToast]);

  const handleSuccess = useCallback((message: string) => {
    setError(null);
    
    if (showSuccessToast) {
      toast.success(message);
    }
    
    if (redirectOnSuccess) {
      setTimeout(() => {
        window.location.href = redirectOnSuccess;
      }, 100);
    }
  }, [showSuccessToast, redirectOnSuccess]);

  const handleLogin = useCallback(async (email: string, password: string) => {
    clearError();
    try {
      await login(email, password);
      handleSuccess('Welcome back!');
    } catch (error) {
      handleError(error, 'Login');
      throw error;
    }
  }, [login, clearError, handleError, handleSuccess]);

  const handleRegister = useCallback(async (data: { 
    email: string; 
    password: string; 
    name: string;
    [key: string]: any;
  }) => {
    clearError();
    try {
      await register(data);
      handleSuccess('Account created successfully!');
    } catch (error) {
      handleError(error, 'Registration');
      throw error;
    }
  }, [register, clearError, handleError, handleSuccess]);

  const handleLogout = useCallback(async () => {
    clearError();
    try {
      await logout();
      handleSuccess('Logged out successfully');
    } catch (error) {
      handleError(error, 'Logout');
      throw error;
    }
  }, [logout, clearError, handleError, handleSuccess]);

  const authState: AuthState = {
    isLoading,
    error,
    isAuthenticated,
    user,
  };

  return {
    ...authState,
    handleLogin,
    handleRegister,
    handleLogout,
    clearError,
  };
}