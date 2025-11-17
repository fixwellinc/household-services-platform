'use client';

import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

interface ServiceRequestFilters {
  status?: string;
  limit?: number;
  offset?: number;
}

/**
 * Hook for fetching service requests
 */
export function useServiceRequests(filters?: ServiceRequestFilters) {
  return useQuery({
    queryKey: ['customer', 'service-requests', filters],
    queryFn: async () => {
      const response = await api.getServiceRequests(filters);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch service requests');
      }
      return response;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for fetching service history
 */
export function useServiceHistory(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['customer', 'service-history', params],
    queryFn: async () => {
      const response = await api.getServiceHistory(params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch service history');
      }
      return response;
    },
    staleTime: 60000, // 1 minute
  });
}

