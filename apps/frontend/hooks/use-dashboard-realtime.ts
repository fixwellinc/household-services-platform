"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { DashboardWidget, WidgetData, MetricWidgetData, ChartWidgetData, TableWidgetData, AlertWidgetData } from '@/types/dashboard';

interface DashboardRealtimeState {
  widgetData: Record<string, WidgetData>;
  isLoading: Record<string, boolean>;
  errors: Record<string, string>;
  lastUpdated: Record<string, Date>;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

interface WidgetSubscription {
  widgetId: string;
  dataSource: string;
  parameters: Record<string, any>;
  refreshInterval?: number;
}

export function useDashboardRealtime(widgets: DashboardWidget[]) {
  const { socket, isConnected } = useSocket();
  const [state, setState] = useState<DashboardRealtimeState>({
    widgetData: {},
    isLoading: {},
    errors: {},
    lastUpdated: {},
    connectionStatus: 'disconnected'
  });

  const subscriptionsRef = useRef<Map<string, WidgetSubscription>>(new Map());
  const intervalRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Update connection status
  useEffect(() => {
    setState(prev => ({
      ...prev,
      connectionStatus: isConnected ? 'connected' : 'disconnected'
    }));
  }, [isConnected]);

  // Subscribe to widget data updates
  const subscribeToWidget = useCallback((widget: DashboardWidget) => {
    // Skip WebSocket features if not connected
    if (!socket || !isConnected) {
      console.warn('WebSocket not available, skipping real-time subscription for widget:', widget.id);
      return;
    }

    const subscription: WidgetSubscription = {
      widgetId: widget.id,
      dataSource: widget.config.dataSource,
      parameters: widget.config.parameters,
      refreshInterval: widget.refreshInterval
    };

    subscriptionsRef.current.set(widget.id, subscription);

    // Subscribe to real-time updates
    socket.emit('dashboard:subscribe', {
      widgetId: widget.id,
      dataSource: widget.config.dataSource,
      parameters: widget.config.parameters
    });

    // Set up periodic refresh if specified
    if (widget.refreshInterval && widget.refreshInterval > 0) {
      const intervalId = setInterval(() => {
        refreshWidgetData(widget.id);
      }, widget.refreshInterval * 1000);
      
      intervalRefs.current.set(widget.id, intervalId);
    }

    // Set loading state
    setState(prev => ({
      ...prev,
      isLoading: { ...prev.isLoading, [widget.id]: true },
      errors: { ...prev.errors, [widget.id]: '' }
    }));
  }, [socket, isConnected]);

  // Unsubscribe from widget data updates
  const unsubscribeFromWidget = useCallback((widgetId: string) => {
    if (!socket) return;

    socket.emit('dashboard:unsubscribe', { widgetId });
    subscriptionsRef.current.delete(widgetId);

    // Clear interval if exists
    const intervalId = intervalRefs.current.get(widgetId);
    if (intervalId) {
      clearInterval(intervalId);
      intervalRefs.current.delete(widgetId);
    }

    // Remove from state
    setState(prev => {
      const newState = { ...prev };
      delete newState.widgetData[widgetId];
      delete newState.isLoading[widgetId];
      delete newState.errors[widgetId];
      delete newState.lastUpdated[widgetId];
      return newState;
    });
  }, [socket]);

  // Refresh specific widget data
  const refreshWidgetData = useCallback((widgetId: string) => {
    if (!socket || !isConnected) return;

    const subscription = subscriptionsRef.current.get(widgetId);
    if (!subscription) return;

    setState(prev => ({
      ...prev,
      isLoading: { ...prev.isLoading, [widgetId]: true },
      errors: { ...prev.errors, [widgetId]: '' }
    }));

    socket.emit('dashboard:refresh', {
      widgetId,
      dataSource: subscription.dataSource,
      parameters: subscription.parameters
    });
  }, [socket, isConnected]);

  // Refresh all widget data
  const refreshAllWidgets = useCallback(() => {
    subscriptionsRef.current.forEach((_, widgetId) => {
      refreshWidgetData(widgetId);
    });
  }, [refreshWidgetData]);

  // Handle optimistic updates
  const updateWidgetDataOptimistically = useCallback((widgetId: string, data: Partial<WidgetData>) => {
    setState(prev => ({
      ...prev,
      widgetData: {
        ...prev.widgetData,
        [widgetId]: {
          ...prev.widgetData[widgetId],
          ...data,
          timestamp: new Date()
        }
      },
      lastUpdated: {
        ...prev.lastUpdated,
        [widgetId]: new Date()
      }
    }));
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Handle widget data updates
    const handleWidgetData = (data: { widgetId: string; data: WidgetData; error?: string }) => {
      setState(prev => ({
        ...prev,
        widgetData: {
          ...prev.widgetData,
          [data.widgetId]: data.data
        },
        isLoading: {
          ...prev.isLoading,
          [data.widgetId]: false
        },
        errors: {
          ...prev.errors,
          [data.widgetId]: data.error || ''
        },
        lastUpdated: {
          ...prev.lastUpdated,
          [data.widgetId]: new Date()
        }
      }));
    };

    // Handle widget data errors
    const handleWidgetError = (data: { widgetId: string; error: string }) => {
      setState(prev => ({
        ...prev,
        isLoading: {
          ...prev.isLoading,
          [data.widgetId]: false
        },
        errors: {
          ...prev.errors,
          [data.widgetId]: data.error
        }
      }));
    };

    // Handle real-time data streams
    const handleDataStream = (data: { widgetId: string; update: any; type: 'append' | 'update' | 'replace' }) => {
      setState(prev => {
        const currentData = prev.widgetData[data.widgetId];
        if (!currentData) return prev;

        let updatedData: WidgetData;

        switch (data.type) {
          case 'append':
            // For chart data, append new points
            if ('value' in currentData && Array.isArray(currentData.value)) {
              updatedData = {
                ...currentData,
                value: [...currentData.value, ...data.update],
                timestamp: new Date()
              };
            } else {
              updatedData = currentData;
            }
            break;

          case 'update':
            // Merge update with existing data
            updatedData = {
              ...currentData,
              ...data.update,
              timestamp: new Date()
            };
            break;

          case 'replace':
            // Replace entire data
            updatedData = {
              ...data.update,
              timestamp: new Date()
            };
            break;

          default:
            updatedData = currentData;
        }

        return {
          ...prev,
          widgetData: {
            ...prev.widgetData,
            [data.widgetId]: updatedData
          },
          lastUpdated: {
            ...prev.lastUpdated,
            [data.widgetId]: new Date()
          }
        };
      });
    };

    // Register event listeners
    socket.on('dashboard:data', handleWidgetData);
    socket.on('dashboard:error', handleWidgetError);
    socket.on('dashboard:stream', handleDataStream);

    // Cleanup
    return () => {
      socket.off('dashboard:data', handleWidgetData);
      socket.off('dashboard:error', handleWidgetError);
      socket.off('dashboard:stream', handleDataStream);
    };
  }, [socket]);

  // Subscribe to all widgets when they change
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Unsubscribe from widgets that are no longer present
    const currentWidgetIds = new Set(widgets.map(w => w.id));
    subscriptionsRef.current.forEach((_, widgetId) => {
      if (!currentWidgetIds.has(widgetId)) {
        unsubscribeFromWidget(widgetId);
      }
    });

    // Subscribe to new widgets
    widgets.forEach(widget => {
      if (!subscriptionsRef.current.has(widget.id)) {
        subscribeToWidget(widget);
      }
    });
  }, [widgets, socket, isConnected, subscribeToWidget, unsubscribeFromWidget]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all intervals
      intervalRefs.current.forEach(intervalId => clearInterval(intervalId));
      intervalRefs.current.clear();

      // Unsubscribe from all widgets
      if (socket) {
        subscriptionsRef.current.forEach((_, widgetId) => {
          socket.emit('dashboard:unsubscribe', { widgetId });
        });
      }
      subscriptionsRef.current.clear();
    };
  }, [socket]);

  return {
    // Data
    widgetData: state.widgetData,
    isLoading: state.isLoading,
    errors: state.errors,
    lastUpdated: state.lastUpdated,
    connectionStatus: state.connectionStatus,

    // Actions
    refreshWidgetData,
    refreshAllWidgets,
    updateWidgetDataOptimistically,
    subscribeToWidget,
    unsubscribeFromWidget
  };
}