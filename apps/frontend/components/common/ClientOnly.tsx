'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function ClientOnlyComponent({ children, fallback = null }: ClientOnlyProps) {
  return <>{children}</>;
}

const ClientOnly = dynamic(() => Promise.resolve(ClientOnlyComponent), {
  ssr: false,
  loading: () => null,
});

export default ClientOnly;
