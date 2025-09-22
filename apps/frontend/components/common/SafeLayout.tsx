'use client';

import { useEffect, useState } from 'react';
import ErrorBoundary from '@/components/common/ErrorBoundary';

interface SafeLayoutProps {
  children: React.ReactNode;
}

export default function SafeLayout({ children }: SafeLayoutProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
