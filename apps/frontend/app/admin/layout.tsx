"use client";

import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { SocketProvider } from '@/contexts/SocketContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createQueryClient } from '@/lib/performance/react-query-config';
import { PWAInstallPrompt } from '@/components/admin/PWAInstallPrompt';
import { useState, useEffect } from 'react';

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  const [showPWAInstall, setShowPWAInstall] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }

    // Check if PWA install prompt should be shown
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) { // Don't show again for 7 days
        setShowPWAInstall(false);
        return;
      }
    }
    setShowPWAInstall(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <AdminLayout>
          {children}
          {showPWAInstall && (
            <div className="fixed bottom-4 right-4 z-50 max-w-sm">
              <PWAInstallPrompt />
            </div>
          )}
        </AdminLayout>
      </SocketProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
} 