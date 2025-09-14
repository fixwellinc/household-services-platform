'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useCurrentUser, useLogin, useLogout, useRegister } from '../hooks/use-api';
import { User } from '../lib/api';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  
  const { data: userData, isLoading, refetch } = useCurrentUser(isHydrated);
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (userData?.user) {
      setUser(userData.user);
    } else {
      setUser(null);
    }
  }, [userData]);

  const login = async (email: string, password: string) => {
    try {
      if (process.env.NODE_ENV === 'development') {
      console.log('AuthContext: Attempting login with:', { email });
    }
      await loginMutation.mutateAsync({ email, password });
              if (process.env.NODE_ENV === 'development') {
          console.log('AuthContext: Login successful');
        }
      toast.success('Welcome back!', {
        description: 'You have been successfully logged in.',
      });
      refetch();
      
      // Redirect to home page after successful login
      if (typeof window !== 'undefined') {
        // Small delay to ensure state is updated
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      }
    } catch (error) {
      console.error('AuthContext: Login failed:', error);
      toast.error('Login failed', {
        description: 'Please check your credentials and try again.',
      });
      throw error;
    }
  };

  const register = async (data: { email: string; password: string; name: string }) => {
    try {
      await registerMutation.mutateAsync(data);
      toast.success('Account created!', {
        description: 'Welcome to Fixwell Services.',
      });
      refetch();
      
      // Redirect to home page after successful registration
      if (typeof window !== 'undefined') {
        // Small delay to ensure state is updated
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      }
    } catch (error) {
      toast.error('Registration failed', {
        description: 'Please try again with different credentials.',
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setUser(null);
      // Clear localStorage token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed', {
        description: 'Please try again.',
      });
      throw error;
    }
  };

  const refetchUser = () => {
    refetch();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isHydrated,
    login,
    register,
    logout,
    refetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 