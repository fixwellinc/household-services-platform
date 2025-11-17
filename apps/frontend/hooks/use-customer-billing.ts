'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

/**
 * Hook for fetching billing overview
 */
export function useBillingOverview() {
  return useQuery({
    queryKey: ['customer', 'billing', 'overview'],
    queryFn: async () => {
      const response = await api.getBillingOverview();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch billing overview');
      }
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for fetching payment methods
 */
export function usePaymentMethods() {
  return useQuery({
    queryKey: ['customer', 'payment-methods'],
    queryFn: async () => {
      const response = await api.getPaymentMethods();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch payment methods');
      }
      return response.data;
    },
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for adding a payment method
 */
export function useAddPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await api.addPaymentMethod(paymentMethodId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to add payment method');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'payment-methods'] });
      queryClient.invalidateQueries({ queryKey: ['customer', 'billing'] });
    },
  });
}

/**
 * Hook for removing a payment method
 */
export function useRemovePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.removePaymentMethod(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to remove payment method');
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'payment-methods'] });
      queryClient.invalidateQueries({ queryKey: ['customer', 'billing'] });
    },
  });
}

/**
 * Hook for fetching billing history
 */
export function useBillingHistory(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['customer', 'billing', 'history', params],
    queryFn: async () => {
      const response = await api.getBillingHistory(params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch billing history');
      }
      return response.data;
    },
    staleTime: 60000, // 1 minute
  });
}

