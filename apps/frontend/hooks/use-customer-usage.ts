'use client';

import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

/**
 * Hook for fetching customer usage data
 */
export function useCustomerUsage() {
  return useQuery({
    queryKey: ['customer', 'usage'],
    queryFn: async () => {
      const response = await api.getCustomerUsage();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch usage data');
      }
      return response;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for fetching usage metrics
 */
export function useUsageMetrics(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['customer', 'usage', 'metrics', startDate, endDate],
    queryFn: async () => {
      const response = await api.getUsageMetrics({ startDate, endDate });
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch usage metrics');
      }
      return response;
    },
    enabled: !!startDate && !!endDate,
    staleTime: 60000, // 1 minute
  });
}

