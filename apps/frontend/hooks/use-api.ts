import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { type User, type Service, type Booking } from '../lib/api';
import { useCallback } from 'react';

// Query keys
export const queryKeys = {
  user: ['user'] as const,
  services: ['services'] as const,
  service: (id: string) => ['service', id] as const,
  bookings: ['bookings'] as const,
  booking: (id: string) => ['booking', id] as const,
  health: ['health'] as const,
};

// Authentication hooks
export const useCurrentUser = (isHydrated: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => api.getCurrentUser(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isHydrated && typeof window !== 'undefined' && !!localStorage.getItem('auth_token'),
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

// Services hooks
export const useServices = (params?: {
  category?: string;
  complexity?: string;
  minPrice?: number;
  maxPrice?: number;
  
  isActive?: boolean;
}) => {
  return useQuery({
    queryKey: [...queryKeys.services, params],
    queryFn: () => api.getServices(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useService = (id: string) => {
  return useQuery({
    queryKey: queryKeys.service(id),
    queryFn: () => api.getService(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services });
    },
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateService>[1] }) =>
      api.updateService(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services });
      queryClient.invalidateQueries({ queryKey: queryKeys.service(id) });
    },
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services });
    },
  });
};

// Bookings hooks
export const useBookings = (params?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: [...queryKeys.bookings, params],
    queryFn: () => api.getBookings(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useBooking = (id: string) => {
  return useQuery({
    queryKey: queryKeys.booking(id),
    queryFn: () => api.getBooking(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
    },
  });
};

export const useUpdateBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateBooking>[1] }) =>
      api.updateBooking(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
      queryClient.invalidateQueries({ queryKey: queryKeys.booking(id) });
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
    },
  });
};

// Health check hook
export const useHealthCheck = () => {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => api.healthCheck(),
    refetchInterval: 30 * 1000, // Check every 30 seconds
    retry: 3,
  });
};

export const useUpdateProfile = () => useMutation<{ user: User }, Error, { name?: string; email?: string; phone?: string; avatar?: string }>({ mutationFn: api.updateProfile });
export const useChangePassword = () => useMutation<{ message: string }, Error, { currentPassword: string; newPassword: string }>({ mutationFn: api.changePassword });
export const useUpdateNotifications = () => useMutation<{ user: User }, Error, { notifications: Record<string, boolean> }>({ mutationFn: api.updateNotifications });
export const useDeleteAccount = () => useMutation<{ message: string }, Error, void>({ mutationFn: api.deleteAccount });

// Generic API hook for making custom requests
export const useApi = () => {
  const request = useCallback(async <T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || '/api';
    // Remove duplicate /api if the baseURL already ends with /api and endpoint starts with /api
    const cleanEndpoint = baseURL.endsWith('/api') && endpoint.startsWith('/api')
      ? endpoint.slice(4)
      : endpoint;
    const url = `${baseURL}${cleanEndpoint}`;
    
    // Get token from localStorage
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('auth_token');
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const fetchOptions: RequestInit = {
        method: options.method || 'GET',
        headers,
        credentials: 'include',
        ...options,
      };
      
      // Ensure method is not overridden by spread
      if (options.method) {
        fetchOptions.method = options.method;
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Provide more specific error messages
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in to continue.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to perform this action.');
        } else if (response.status === 404) {
          throw new Error('Resource not found.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }, []);

  return { request };
}; 