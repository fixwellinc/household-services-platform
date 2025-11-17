'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

/**
 * Hook for fetching and managing customer subscription
 */
export function useCustomerSubscription() {
  return useQuery({
    queryKey: ['customer', 'subscription'],
    queryFn: async () => {
      const response = await api.getCustomerSubscription();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch subscription');
      }
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for updating customer subscription
 */
export function useUpdateCustomerSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { tier?: string; paymentFrequency?: string }) => {
      const response = await api.updateCustomerSubscription(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update subscription');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'subscription'] });
    },
  });
}

/**
 * Hook for pausing subscription
 */
export function usePauseSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { startDate: string; endDate: string; reason?: string }) => {
      const response = await api.pauseSubscription(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to pause subscription');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'subscription'] });
    },
  });
}

/**
 * Hook for resuming subscription
 */
export function useResumeSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.resumeSubscription();
      if (!response.success) {
        throw new Error(response.error || 'Failed to resume subscription');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'subscription'] });
    },
  });
}

/**
 * Hook for fetching subscription history
 */
export function useSubscriptionHistory() {
  return useQuery({
    queryKey: ['customer', 'subscription', 'history'],
    queryFn: async () => {
      const response = await api.getSubscriptionHistory();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch subscription history');
      }
      return response.data;
    },
    staleTime: 60000, // 1 minute
  });
}

