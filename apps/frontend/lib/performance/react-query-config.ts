/**
 * React Query configuration for efficient data fetching and caching
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query';

// Default query options for optimal caching
const queryConfig: DefaultOptions = {
  queries: {
    // Cache data for 5 minutes by default
    staleTime: 5 * 60 * 1000,
    // Keep data in cache for 10 minutes
    gcTime: 10 * 60 * 1000,
    // Retry failed requests 3 times with exponential backoff
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Refetch on window focus for critical data
    refetchOnWindowFocus: false,
    // Don't refetch on reconnect by default
    refetchOnReconnect: 'always',
  },
  mutations: {
    // Retry mutations once
    retry: 1,
    retryDelay: 1000,
  },
};

// Create query client with optimized settings
export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: queryConfig,
  });
};

// Query keys for consistent caching
export const queryKeys = {
  // User-related queries
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    permissions: (id: string) => [...queryKeys.users.detail(id), 'permissions'] as const,
    activity: (id: string) => [...queryKeys.users.detail(id), 'activity'] as const,
  },
  
  // Subscription-related queries
  subscriptions: {
    all: ['subscriptions'] as const,
    lists: () => [...queryKeys.subscriptions.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.subscriptions.lists(), { filters }] as const,
    details: () => [...queryKeys.subscriptions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.subscriptions.details(), id] as const,
    analytics: () => [...queryKeys.subscriptions.all, 'analytics'] as const,
    churn: () => [...queryKeys.subscriptions.analytics(), 'churn'] as const,
  },
  
  // Dashboard and analytics queries
  dashboard: {
    all: ['dashboard'] as const,
    widgets: () => [...queryKeys.dashboard.all, 'widgets'] as const,
    widget: (id: string) => [...queryKeys.dashboard.widgets(), id] as const,
    metrics: () => [...queryKeys.dashboard.all, 'metrics'] as const,
    realtime: () => [...queryKeys.dashboard.all, 'realtime'] as const,
  },
  
  // Audit and monitoring queries
  audit: {
    all: ['audit'] as const,
    logs: () => [...queryKeys.audit.all, 'logs'] as const,
    log: (filters: any) => [...queryKeys.audit.logs(), { filters }] as const,
  },
  
  // System monitoring queries
  monitoring: {
    all: ['monitoring'] as const,
    health: () => [...queryKeys.monitoring.all, 'health'] as const,
    performance: () => [...queryKeys.monitoring.all, 'performance'] as const,
    alerts: () => [...queryKeys.monitoring.all, 'alerts'] as const,
  },
  
  // Communication queries
  communications: {
    all: ['communications'] as const,
    messages: () => [...queryKeys.communications.all, 'messages'] as const,
    templates: () => [...queryKeys.communications.all, 'templates'] as const,
    campaigns: () => [...queryKeys.communications.all, 'campaigns'] as const,
  },
  
  // Reports and exports
  reports: {
    all: ['reports'] as const,
    templates: () => [...queryKeys.reports.all, 'templates'] as const,
    exports: () => [...queryKeys.reports.all, 'exports'] as const,
    scheduled: () => [...queryKeys.reports.all, 'scheduled'] as const,
  },
};

// Cache invalidation helpers
export const invalidateQueries = {
  users: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
  },
  subscriptions: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
  },
  dashboard: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  },
  audit: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.audit.all });
  },
  monitoring: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.monitoring.all });
  },
  all: (queryClient: QueryClient) => {
    queryClient.invalidateQueries();
  },
};

// Prefetch helpers for better UX
export const prefetchQueries = {
  userDetails: async (queryClient: QueryClient, userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.users.detail(userId),
      queryFn: () => fetch(`/api/admin/users/${userId}`).then(res => res.json()),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  },
  
  subscriptionDetails: async (queryClient: QueryClient, subscriptionId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.subscriptions.detail(subscriptionId),
      queryFn: () => fetch(`/api/admin/subscriptions/${subscriptionId}`).then(res => res.json()),
      staleTime: 2 * 60 * 1000,
    });
  },
  
  dashboardWidgets: async (queryClient: QueryClient) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard.widgets(),
      queryFn: () => fetch('/api/admin/dashboard/widgets').then(res => res.json()),
      staleTime: 1 * 60 * 1000, // 1 minute for dashboard data
    });
  },
};

// Background refetch for real-time data
export const backgroundRefetch = {
  startRealtimeUpdates: (queryClient: QueryClient) => {
    const interval = setInterval(() => {
      // Refetch critical real-time data
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.realtime() });
      queryClient.invalidateQueries({ queryKey: queryKeys.monitoring.health() });
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  },
  
  startPerformanceMonitoring: (queryClient: QueryClient) => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.monitoring.performance() });
    }, 60000); // Every minute
    
    return () => clearInterval(interval);
  },
};