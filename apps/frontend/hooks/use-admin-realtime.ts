"use client";

import { useEffect, useCallback, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useQueryClient } from '@tanstack/react-query';

interface AdminRealtimeEvents {
  'admin:user-activity': (data: { userId: string; action: string; timestamp: string }) => void;
  'admin:system-alert': (data: { type: string; message: string; severity: 'low' | 'medium' | 'high' | 'critical' }) => void;
  'admin:new-message': (data: { chatId: string; message: any }) => void;
  'admin:subscription-update': (data: { subscriptionId: string; status: string; userId: string }) => void;
  'admin:audit-log': (data: { action: string; entityType: string; entityId: string; adminId: string }) => void;
  'admin:dashboard-update': (data: { metrics: Record<string, any> }) => void;
}

export function useAdminRealtime() {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<any[]>([]);

  // Join admin room on connection
  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('admin:join');
      
      return () => {
        socket.emit('admin:leave');
      };
    }
  }, [socket, isConnected]);

  // Subscribe to admin events
  const subscribe = useCallback((
    event: string,
    handler: (...args: any[]) => void
  ) => {
    if (!socket) return () => {};

    socket.on(event, handler);
    
    return () => {
      socket.off(event, handler);
    };
  }, [socket]);

  // Emit admin events
  const emit = useCallback((event: string, data?: any) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  }, [socket, isConnected]);

  // Handle user activity updates
  useEffect(() => {
    return subscribe('admin:user-activity', (data) => {
      // Invalidate user-related queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics', 'users'] });
    });
  }, [subscribe, queryClient]);

  // Handle system alerts
  useEffect(() => {
    return subscribe('admin:system-alert', (data) => {
      setNotifications(prev => [
        {
          id: Date.now().toString(),
          type: data.type,
          message: data.message,
          severity: data.severity,
          timestamp: new Date(),
          read: false
        },
        ...prev
      ]);
    });
  }, [subscribe]);

  // Handle new chat messages
  useEffect(() => {
    return subscribe('admin:new-message', (data) => {
      // Invalidate chat queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat', data.chatId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat', 'sessions'] });
      
      // Add notification for new message
      setNotifications(prev => [
        {
          id: Date.now().toString(),
          type: 'new-message',
          message: `New message in chat ${data.chatId}`,
          severity: 'medium' as const,
          timestamp: new Date(),
          read: false,
          actionUrl: `/admin/chat/${data.chatId}`
        },
        ...prev
      ]);
    });
  }, [subscribe, queryClient]);

  // Handle subscription updates
  useEffect(() => {
    return subscribe('admin:subscription-update', (data) => {
      // Invalidate subscription queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics', 'subscriptions'] });
    });
  }, [subscribe, queryClient]);

  // Handle audit logs
  useEffect(() => {
    return subscribe('admin:audit-log', (data) => {
      // Invalidate audit log queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    });
  }, [subscribe, queryClient]);

  // Handle dashboard updates
  useEffect(() => {
    return subscribe('admin:dashboard-update', (data) => {
      // Update dashboard metrics in cache
      queryClient.setQueryData(['admin', 'dashboard', 'metrics'], (oldData: any) => ({
        ...oldData,
        ...data.metrics
      }));
    });
  }, [subscribe, queryClient]);

  // Mark notification as read
  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Get unread notification count
  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    isConnected,
    subscribe,
    emit,
    notifications,
    unreadCount,
    markNotificationRead,
    clearNotifications
  };
}