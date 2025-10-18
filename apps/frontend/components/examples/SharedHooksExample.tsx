'use client';

import React from 'react';
import { 
  useAuthState, 
  useFormState, 
  useFormValidation, 
  useFormSubmission,
  useApiRequest,
  useCachedData 
} from '@/hooks/shared';

/**
 * Example component demonstrating the usage of shared hooks
 * This shows how the extracted hooks provide consistent patterns across components
 */
export default function SharedHooksExample() {
  const { validationSchemas } = useFormValidation();
  
  // Example: Authentication state management
  const { isAuthenticated, user, handleLogin, handleLogout, error: authError } = useAuthState({
    redirectOnSuccess: '/dashboard',
    showSuccessToast: true,
  });

  // Example: Form state management with validation
  const loginForm = useFormState({
    initialValues: { email: '', password: '' },
    validationRules: [
      { field: 'email', validator: validationSchemas.auth.email },
      { field: 'password', validator: validationSchemas.auth.password },
    ],
    validateOnBlur: true,
  });

  // Example: Form submission
  const { submit: submitLogin, isSubmitting } = useFormSubmission({
    endpoint: '/api/auth/login',
    method: 'POST',
    successMessage: 'Login successful!',
    onSuccess: (data) => {
      console.log('Login successful:', data);
      loginForm.reset();
    },
  });

  // Example: API request with caching
  const { data: services, isLoading, refresh } = useCachedData({
    cacheKey: 'services-list',
    endpoint: '/api/services',
    cacheDuration: 5 * 60 * 1000, // 5 minutes
    staleWhileRevalidate: true,
  });

  // Example: Direct API request
  const { execute: fetchUserProfile, isLoading: profileLoading } = useApiRequest({
    showErrorToast: true,
    successMessage: 'Profile loaded successfully',
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginForm.validate()) {
      return;
    }

    try {
      await handleLogin(loginForm.values.email, loginForm.values.password);
    } catch (error) {
      // Error is handled by useAuthState
    }
  };

  const loadUserProfile = async () => {
    try {
      const profile = await fetchUserProfile('/api/user/profile');
      console.log('User profile:', profile);
    } catch (error) {
      // Error is handled by useApiRequest
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Shared Hooks Example</h1>
      
      {/* Authentication Status */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
        {isAuthenticated ? (
          <div className="space-y-2">
            <p className="text-green-600">✓ Authenticated as {user?.name}</p>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        ) : (
          <p className="text-red-600">✗ Not authenticated</p>
        )}
        {authError && (
          <p className="text-red-600 text-sm mt-2">Error: {authError.message}</p>
        )}
      </div>

      {/* Login Form Example */}
      {!isAuthenticated && (
        <div className="bg-white border border-gray-200 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Login Form (Shared Hooks)</h2>
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                {...loginForm.getFieldProps('email')}
                className={`w-full px-3 py-2 border rounded-md ${
                  loginForm.errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
              />
              {loginForm.errors.email && (
                <p className="text-red-600 text-sm mt-1">{loginForm.errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                {...loginForm.getFieldProps('password')}
                className={`w-full px-3 py-2 border rounded-md ${
                  loginForm.errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your password"
              />
              {loginForm.errors.password && (
                <p className="text-red-600 text-sm mt-1">{loginForm.errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !loginForm.isValid}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      )}

      {/* Cached Data Example */}
      <div className="bg-white border border-gray-200 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Cached Services Data</h2>
        <div className="space-y-2">
          <button
            onClick={refresh}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Refresh Services'}
          </button>
          
          {services && (
            <div className="text-sm text-gray-600">
              <p>Loaded {services.length || 0} services</p>
              <p className="text-xs">Data is cached and will auto-refresh when stale</p>
            </div>
          )}
        </div>
      </div>

      {/* API Request Example */}
      {isAuthenticated && (
        <div className="bg-white border border-gray-200 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Direct API Request</h2>
          <button
            onClick={loadUserProfile}
            disabled={profileLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {profileLoading ? 'Loading Profile...' : 'Load User Profile'}
          </button>
        </div>
      )}

      {/* Form State Info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Form State Debug</h2>
        <div className="text-sm space-y-1">
          <p>Valid: {loginForm.isValid ? '✓' : '✗'}</p>
          <p>Dirty: {loginForm.isDirty ? '✓' : '✗'}</p>
          <p>Submitting: {loginForm.isSubmitting ? '✓' : '✗'}</p>
          <p>Errors: {Object.keys(loginForm.errors).length}</p>
        </div>
      </div>
    </div>
  );
}