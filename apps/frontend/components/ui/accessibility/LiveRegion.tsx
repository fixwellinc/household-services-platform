'use client';

import React, { useEffect, useRef } from 'react';

interface LiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number;
  className?: string;
}

export function LiveRegion({ 
  message, 
  priority = 'polite', 
  clearAfter = 5000,
  className = '' 
}: LiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && clearAfter > 0) {
      const timer = setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = '';
        }
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <div
      ref={regionRef}
      aria-live={priority}
      aria-atomic="true"
      className={`sr-only ${className}`}
    >
      {message}
    </div>
  );
}

// Status announcer for dynamic content changes
export function StatusAnnouncer({ 
  status, 
  loading = false 
}: { 
  status: string; 
  loading?: boolean; 
}) {
  return (
    <>
      <LiveRegion 
        message={loading ? 'Loading...' : status} 
        priority={loading ? 'polite' : 'assertive'}
      />
      {loading && (
        <span className="sr-only">
          Content is loading, please wait
        </span>
      )}
    </>
  );
}