'use client';

import { useEffect, useState, ReactNode } from 'react';

interface HydrationSafeProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

export default function HydrationSafe({ children, fallback = null, className }: HydrationSafeProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <div className={className}>{fallback}</div>;
  }

  return <div className={className}>{children}</div>;
}

// Hook for checking if component has mounted (client-side)
export function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}

// Component for client-side only rendering
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const hasMounted = useHasMounted();
  
  if (!hasMounted) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
