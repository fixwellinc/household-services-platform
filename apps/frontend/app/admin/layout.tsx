"use client";

import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { SocketProvider } from '@/contexts/SocketContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors or rate limiting
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          // Only retry once for server errors
          return failureCount < 1;
        },
      },
      mutations: {
        retry: 0, // Don't retry mutations to prevent duplicate operations
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <AdminLayout>
          {children}
        </AdminLayout>
      </SocketProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
} 