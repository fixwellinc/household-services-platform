'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

interface InvoiceFilters {
  status?: string;
  limit?: number;
  offset?: number;
}

/**
 * Hook for fetching customer invoices
 */
export function useInvoices(filters?: InvoiceFilters) {
  return useQuery({
    queryKey: ['customer', 'invoices', filters],
    queryFn: async () => {
      const response = await api.getInvoices(filters);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch invoices');
      }
      return response;
    },
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for fetching a single invoice
 */
export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: ['customer', 'invoices', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.getInvoice(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch invoice');
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 60000,
  });
}

/**
 * Hook for downloading invoice PDF
 */
export function useInvoicePDF() {
  return useMutation({
    mutationFn: async (id: string) => {
      const blob = await api.getInvoicePDF(id);
      return blob;
    },
  });
}

