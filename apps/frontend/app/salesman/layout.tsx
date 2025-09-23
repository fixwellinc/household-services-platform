"use client";

import { SalesmanLayout } from '@/components/salesman/layout/SalesmanLayout';
import { SocketProvider } from '@/contexts/SocketContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createQueryClient } from '@/lib/performance/react-query-config';
import { useState } from 'react';

export default function SalesmanLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <SalesmanLayout>
          {children}
        </SalesmanLayout>
      </SocketProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}