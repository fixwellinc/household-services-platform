/**
 * Optimized data fetching hooks for admin panel using React Query
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys, invalidateQueries, prefetchQueries } from '@/lib/performance/react-query-config';
import { useCallback } from 'react';

// Generic API fetch function with error handling
const fetchApi = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// Users data hooks
export const useUsers = (filters?: any) => {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => fetchApi(`/api/admin/users?${new URLSearchParams(filters || {})}`),
    staleTime: 2 * 60 * 1000, // 2 minutes for user data
  });
};

export const useUser = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => fetchApi(`/api/admin/users/${userId}`),
    enabled: !!userId,
  });
};

export const useUserPermissions = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.users.permissions(userId),
    queryFn: () => fetchApi(`/api/admin/users/${userId}/permissions`),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Permissions change less frequently
  });
};

export const useUserActivity = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.users.activity(userId),
    queryFn: () => fetchApi(`/api/admin/users/${userId}/activity`),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // Activity data is more dynamic
  });
};

// Infinite scroll for large user lists
export const useInfiniteUsers = (filters?: any) => {
  return useInfiniteQuery({
    queryKey: [...queryKeys.users.list(filters), 'infinite'],
    queryFn: ({ pageParam = 0 }) => 
      fetchApi(`/api/admin/users?${new URLSearchParams({ 
        ...filters, 
        page: pageParam.toString(),
        limit: '50' 
      })}`),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length : undefined;
    },
  });
};

// Subscriptions data hooks
export const useSubscriptions = (filters?: any) => {
  return useQuery({
    queryKey: queryKeys.subscriptions.list(filters),
    queryFn: () => fetchApi(`/api/admin/subscriptions?${new URLSearchParams(filters || {})}`),
    staleTime: 3 * 60 * 1000, // 3 minutes for subscription data
  });
};

export const useSubscription = (subscriptionId: string) => {
  return useQuery({
    queryKey: queryKeys.subscriptions.detail(subscriptionId),
    queryFn: () => fetchApi(`/api/admin/subscriptions/${subscriptionId}`),
    enabled: !!subscriptionId,
  });
};

export const useSubscriptionAnalytics = () => {
  return useQuery({
    queryKey: queryKeys.subscriptions.analytics(),
    queryFn: () => fetchApi('/api/admin/subscriptions/analytics'),
    staleTime: 10 * 60 * 1000, // Analytics can be cached longer
  });
};

export const useChurnPrediction = () => {
  return useQuery({
    queryKey: queryKeys.subscriptions.churn(),
    queryFn: () => fetchApi('/api/admin/subscriptions/churn-prediction'),
    staleTime: 30 * 60 * 1000, // Churn prediction updates less frequently
  });
};

// Dashboard data hooks
export const useDashboardWidgets = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.widgets(),
    queryFn: () => fetchApi('/api/admin/dashboard/widgets'),
    staleTime: 2 * 60 * 1000,
  });
};

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.metrics(),
    queryFn: () => fetchApi('/api/admin/dashboard/metrics'),
    staleTime: 1 * 60 * 1000, // Metrics need frequent updates
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
};

export const useRealtimeDashboard = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.realtime(),
    queryFn: () => fetchApi('/api/admin/dashboard/realtime'),
    staleTime: 10 * 1000, // Very fresh data for real-time
    refetchInterval: 10 * 1000, // Refresh every 10 seconds
  });
};

// Audit logs hooks
export const useAuditLogs = (filters?: any) => {
  return useQuery({
    queryKey: queryKeys.audit.log(filters),
    queryFn: () => fetchApi(`/api/admin/audit/logs?${new URLSearchParams(filters || {})}`),
    staleTime: 5 * 60 * 1000, // Audit logs don't change once created
  });
};

// System monitoring hooks
export const useSystemHealth = () => {
  return useQuery({
    queryKey: queryKeys.monitoring.health(),
    queryFn: () => fetchApi('/api/admin/monitoring/health'),
    staleTime: 30 * 1000, // Health data should be very fresh
    refetchInterval: 30 * 1000,
  });
};

export const usePerformanceMetrics = () => {
  return useQuery({
    queryKey: queryKeys.monitoring.performance(),
    queryFn: () => fetchApi('/api/admin/monitoring/performance'),
    staleTime: 1 * 60 * 1000,
    refetchInterval: 1 * 60 * 1000, // Refresh every minute
  });
};

export const useSystemAlerts = () => {
  return useQuery({
    queryKey: queryKeys.monitoring.alerts(),
    queryFn: () => fetchApi('/api/admin/monitoring/alerts'),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
};

// Communication hooks
export const useMessages = (filters?: any) => {
  return useQuery({
    queryKey: [...queryKeys.communications.messages(), filters],
    queryFn: () => fetchApi(`/api/admin/communications/messages?${new URLSearchParams(filters || {})}`),
    staleTime: 1 * 60 * 1000,
  });
};

export const useMessageTemplates = () => {
  return useQuery({
    queryKey: queryKeys.communications.templates(),
    queryFn: () => fetchApi('/api/admin/communications/templates'),
    staleTime: 10 * 60 * 1000, // Templates change infrequently
  });
};

export const useCampaigns = () => {
  return useQuery({
    queryKey: queryKeys.communications.campaigns(),
    queryFn: () => fetchApi('/api/admin/communications/campaigns'),
    staleTime: 5 * 60 * 1000,
  });
};

// Mutation hooks for data updates
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) =>
      fetchApi(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (data, variables) => {
      // Update the user detail cache
      queryClient.setQueryData(queryKeys.users.detail(variables.userId), data);
      // Invalidate user lists to refresh
      invalidateQueries.users(queryClient);
    },
  });
};

export const useUpdateSubscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ subscriptionId, data }: { subscriptionId: string; data: any }) =>
      fetchApi(`/api/admin/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(queryKeys.subscriptions.detail(variables.subscriptionId), data);
      invalidateQueries.subscriptions(queryClient);
    },
  });
};

export const useBulkOperation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ operation, entityType, entityIds, data }: {
      operation: string;
      entityType: string;
      entityIds: string[];
      data?: any;
    }) =>
      fetchApi('/api/admin/bulk-operations', {
        method: 'POST',
        body: JSON.stringify({ operation, entityType, entityIds, data }),
      }),
    onSuccess: (data, variables) => {
      // Invalidate relevant caches based on entity type
      switch (variables.entityType) {
        case 'users':
          invalidateQueries.users(queryClient);
          break;
        case 'subscriptions':
          invalidateQueries.subscriptions(queryClient);
          break;
        default:
          invalidateQueries.all(queryClient);
      }
    },
  });
};

// Prefetch helpers for better UX
export const useAdminDataPrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchUserDetails = useCallback(async (userId: string) => {
    await prefetchQueries.userDetails(queryClient, userId);
  }, [queryClient]);

  const prefetchSubscriptionDetails = useCallback(async (subscriptionId: string) => {
    await prefetchQueries.subscriptionDetails(queryClient, subscriptionId);
  }, [queryClient]);

  const prefetchDashboardData = useCallback(async () => {
    await prefetchQueries.dashboardWidgets(queryClient);
  }, [queryClient]);

  return {
    prefetchUserDetails,
    prefetchSubscriptionDetails,
    prefetchDashboardData,
  };
};

// Background data refresh for real-time features
export const useBackgroundRefresh = () => {
  const queryClient = useQueryClient();

  const startRealtimeUpdates = useCallback(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.realtime() });
      queryClient.invalidateQueries({ queryKey: queryKeys.monitoring.health() });
      queryClient.invalidateQueries({ queryKey: queryKeys.monitoring.alerts() });
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [queryClient]);

  const startPerformanceMonitoring = useCallback(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.monitoring.performance() });
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [queryClient]);

  return {
    startRealtimeUpdates,
    startPerformanceMonitoring,
  };
};