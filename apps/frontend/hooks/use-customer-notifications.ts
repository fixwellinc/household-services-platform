'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

interface NotificationFilters {
  type?: string;
  status?: string;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Hook for fetching notifications
 */
export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: ['customer', 'notifications', filters],
    queryFn: async () => {
      const response = await api.getNotifications(filters);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch notifications');
      }
      return response;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for updating a notification
 */
export function useUpdateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { status?: string } }) => {
      const response = await api.updateNotification(id, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update notification');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'notifications'] });
    },
  });
}

/**
 * Hook for marking all notifications as read
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.markAllNotificationsRead();
      if (!response.success) {
        throw new Error(response.error || 'Failed to mark notifications as read');
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'notifications'] });
    },
  });
}

/**
 * Hook for fetching notification preferences
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['customer', 'notifications', 'preferences'],
    queryFn: async () => {
      const response = await api.getNotificationPreferences();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch notification preferences');
      }
      return response;
    },
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for updating notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.updateNotificationPreferences(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update notification preferences');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'notifications', 'preferences'] });
    },
  });
}

