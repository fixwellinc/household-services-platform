'use client';

import { useState, useCallback } from 'react';
import { useUpdateProfile, useChangePassword, useDeleteAccount } from '@/hooks/use-api';
import { toast } from 'sonner';

interface UserManagementError {
  message: string;
  field?: string;
}

interface UserProfileData {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

/**
 * Shared user management hook for profile updates, password changes, and account operations
 * Provides consistent error handling and success feedback
 */
export function useUserManagement() {
  const [error, setError] = useState<UserManagementError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const deleteAccountMutation = useDeleteAccount();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: any, operation: string) => {
    const userError: UserManagementError = {
      message: error?.message || `${operation} failed`,
    };
    
    setError(userError);
    toast.error(userError.message);
  }, []);

  const handleSuccess = useCallback((message: string) => {
    setError(null);
    toast.success(message);
  }, []);

  const updateProfile = useCallback(async (data: UserProfileData) => {
    clearError();
    setIsLoading(true);
    
    try {
      await updateProfileMutation.mutateAsync(data);
      handleSuccess('Profile updated successfully');
    } catch (error) {
      handleError(error, 'Profile update');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [updateProfileMutation, clearError, handleError, handleSuccess]);

  const changePassword = useCallback(async (data: PasswordChangeData) => {
    clearError();
    setIsLoading(true);
    
    try {
      await changePasswordMutation.mutateAsync(data);
      handleSuccess('Password changed successfully');
    } catch (error) {
      handleError(error, 'Password change');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [changePasswordMutation, clearError, handleError, handleSuccess]);

  const deleteAccount = useCallback(async () => {
    clearError();
    setIsLoading(true);
    
    try {
      await deleteAccountMutation.mutateAsync();
      handleSuccess('Account deleted successfully');
      // Redirect to home page after account deletion
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      handleError(error, 'Account deletion');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [deleteAccountMutation, clearError, handleError, handleSuccess]);

  return {
    error,
    isLoading: isLoading || updateProfileMutation.isPending || changePasswordMutation.isPending || deleteAccountMutation.isPending,
    updateProfile,
    changePassword,
    deleteAccount,
    clearError,
  };
}