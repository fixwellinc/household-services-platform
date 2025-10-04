"use client";

/**
 * Offline Manager Hook
 * 
 * Provides offline functionality and state management for the dashboard
 */

import { useState, useEffect, useCallback } from 'react';

interface OfflineAction {
  id: string;
  type: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
  retries: number;
}

interface OfflineManagerReturn {
  isOnline: boolean;
  isOfflineMode: boolean;
  pendingActions: OfflineAction[];
  queueAction: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retries'>) => void;
  retryPendingActions: () => Promise<void>;
  clearPendingActions: () => void;
  syncWhenOnline: () => Promise<void>;
}

export function useOfflineManager(): OfflineManagerReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsOfflineMode(false);
      console.log('App: Back online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsOfflineMode(true);
      console.log('App: Gone offline');
    };

    // Set initial state
    setIsOnline(navigator.onLine);
    setIsOfflineMode(!navigator.onLine);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending actions from storage
    loadPendingActions();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending actions from localStorage
  const loadPendingActions = useCallback(() => {
    try {
      const stored = localStorage.getItem('offline-actions');
      if (stored) {
        const actions = JSON.parse(stored);
        setPendingActions(actions);
      }
    } catch (error) {
      console.error('Failed to load pending actions:', error);
    }
  }, []);

  // Save pending actions to localStorage
  const savePendingActions = useCallback((actions: OfflineAction[]) => {
    try {
      localStorage.setItem('offline-actions', JSON.stringify(actions));
    } catch (error) {
      console.error('Failed to save pending actions:', error);
    }
  }, []);

  // Queue an action for later execution
  const queueAction = useCallback((action: Omit<OfflineAction, 'id' | 'timestamp' | 'retries'>) => {
    const newAction: OfflineAction = {
      ...action,
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    };

    setPendingActions(prev => {
      const updated = [...prev, newAction];
      savePendingActions(updated);
      return updated;
    });

    console.log('Action queued for offline execution:', newAction);
  }, [savePendingActions]);

  // Retry pending actions
  const retryPendingActions = useCallback(async () => {
    if (!isOnline || pendingActions.length === 0) {
      return;
    }

    console.log(`Retrying ${pendingActions.length} pending actions`);

    const results = await Promise.allSettled(
      pendingActions.map(async (action) => {
        try {
          const response = await fetch(action.url, {
            method: action.method,
            headers: action.headers,
            body: action.body,
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          console.log('Successfully synced action:', action.id);
          return { success: true, action };
        } catch (error) {
          console.error('Failed to sync action:', action.id, error);
          return { success: false, action, error };
        }
      })
    );

    // Update pending actions based on results
    const successfulActions = results
      .filter((result): result is PromiseFulfilledResult<{ success: true; action: OfflineAction }> => 
        result.status === 'fulfilled' && result.value.success
      )
      .map(result => result.value.action.id);

    const failedActions = results
      .filter((result): result is PromiseFulfilledResult<{ success: false; action: OfflineAction; error: any }> => 
        result.status === 'fulfilled' && !result.value.success
      )
      .map(result => ({
        ...result.value.action,
        retries: result.value.action.retries + 1,
      }))
      .filter(action => action.retries < 3); // Max 3 retries

    setPendingActions(prev => {
      const updated = prev.filter(action => 
        !successfulActions.includes(action.id)
      ).concat(failedActions);
      
      savePendingActions(updated);
      return updated;
    });

    if (successfulActions.length > 0) {
      console.log(`Successfully synced ${successfulActions.length} actions`);
    }
  }, [isOnline, pendingActions, savePendingActions]);

  // Clear all pending actions
  const clearPendingActions = useCallback(() => {
    setPendingActions([]);
    savePendingActions([]);
    console.log('Cleared all pending actions');
  }, [savePendingActions]);

  // Sync when online
  const syncWhenOnline = useCallback(async () => {
    if (isOnline && pendingActions.length > 0) {
      await retryPendingActions();
    }
  }, [isOnline, pendingActions.length, retryPendingActions]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      const timer = setTimeout(() => {
        retryPendingActions();
      }, 1000); // Wait 1 second after coming online

      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingActions.length, retryPendingActions]);

  return {
    isOnline,
    isOfflineMode,
    pendingActions,
    queueAction,
    retryPendingActions,
    clearPendingActions,
    syncWhenOnline,
  };
}

/**
 * Hook for offline-aware API calls
 */
export function useOfflineApi() {
  const { isOnline, queueAction } = useOfflineManager();

  const makeRequest = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    if (isOnline) {
      try {
        const response = await fetch(url, options);
        return response;
      } catch (error) {
        // If request fails and we're online, queue it for retry
        if (navigator.onLine) {
          queueAction({
            type: 'api-request',
            url,
            method: options.method || 'GET',
            headers: options.headers as Record<string, string> || {},
            body: options.body as string,
          });
        }
        throw error;
      }
    } else {
      // Queue for offline execution
      queueAction({
        type: 'api-request',
        url,
        method: options.method || 'GET',
        headers: options.headers as Record<string, string> || {},
        body: options.body as string,
      });

      // Return a mock response for offline mode
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'Request queued for when online',
          offline: true 
        }),
        { 
          status: 202, // Accepted
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }, [isOnline, queueAction]);

  return {
    makeRequest,
    isOnline,
  };
}

/**
 * Hook for offline status indicator
 */
export function useOfflineStatus() {
  const { isOnline, isOfflineMode, pendingActions } = useOfflineManager();

  return {
    isOnline,
    isOfflineMode,
    hasPendingActions: pendingActions.length > 0,
    pendingCount: pendingActions.length,
  };
}
