'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

/**
 * Hook for fetching customer profile
 */
export function useCustomerProfile() {
  return useQuery({
    queryKey: ['customer', 'profile'],
    queryFn: async () => {
      const response = await api.getCustomerProfile();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch profile');
      }
      return response;
    },
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for updating customer profile
 */
export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name?: string;
      phone?: string;
      address?: string;
      postalCode?: string;
      avatar?: string;
    }) => {
      const response = await api.updateCustomerProfile(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update profile');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'profile'] });
    },
  });
}

