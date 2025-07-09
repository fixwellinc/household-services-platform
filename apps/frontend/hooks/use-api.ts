import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { type User, type Service, type Booking } from '@/lib/api';

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
export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => api.getCurrentUser(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('auth_token'),
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