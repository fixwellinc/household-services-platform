'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

interface AppointmentFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Hook for fetching customer appointments
 */
export function useCustomerAppointments(filters?: AppointmentFilters) {
  return useQuery({
    queryKey: ['customer', 'appointments', filters],
    queryFn: async () => {
      const response = await api.getCustomerAppointments(filters);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch appointments');
      }
      return response;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for fetching a single appointment
 */
export function useCustomerAppointment(id: string | null) {
  return useQuery({
    queryKey: ['customer', 'appointments', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.getCustomerAppointment(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch appointment');
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 30000,
  });
}

/**
 * Hook for creating an appointment
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      serviceTypeId: string;
      scheduledDate: string;
      duration?: number;
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      propertyAddress: string;
      notes?: string;
    }) => {
      const response = await api.createAppointment(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create appointment');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'appointments'] });
    },
  });
}

/**
 * Hook for updating an appointment
 */
export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: {
      scheduledDate?: string;
      duration?: number;
      notes?: string;
      status?: string;
    }}) => {
      const response = await api.updateAppointment(id, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update appointment');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'appointments'] });
      queryClient.invalidateQueries({ queryKey: ['customer', 'appointments', variables.id] });
    },
  });
}

/**
 * Hook for cancelling an appointment
 */
export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.cancelAppointment(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to cancel appointment');
      }
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'appointments'] });
      queryClient.invalidateQueries({ queryKey: ['customer', 'appointments', id] });
    },
  });
}

