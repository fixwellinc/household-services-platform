"use client";

import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { SocketProvider } from '@/contexts/SocketContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createQueryClient } from '@/lib/performance/react-query-config';
import { useState } from 'react';

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

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