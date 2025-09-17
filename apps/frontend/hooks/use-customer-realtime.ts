"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';

// Types for subscription updates
interface SubscriptionUpdate {
  id: string;
  userId: string;
  tier: 'STARTER' | 'HOMECARE' | 'PRIORITY';
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'INCOMPLETE';
  paymentFrequency: 'MONTHLY' | 'YEARLY';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextPaymentAmount: number;
  plan?: {
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
    features: string[];
  };
}

// Types for usage updates
interface UsageUpdate {
  userId: string;
  subscriptionId: string;
  period: string;
  servicesUsed: number;
  discountsSaved: number;
  priorityBookings: number;
  emergencyServices: number;
  limits: {
    maxPriorityBookings: number;
    maxDiscountAmount: number;
    maxEmergencyServices: number;
  };
  warnings?: {
    type: 'APPROACHING_LIMIT' | 'LIMIT_REACHED' | 'UPGRADE_SUGGESTED';
    message: string;
    actionRequired?: boolean;
    suggestedTier?: string;
  }[];
}

// Types for billing events
interface BillingEvent {
  userId: string;
  subscriptionId: string;
  type: 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'PAYMENT_RETRY' | 'INVOICE_CREATED' | 'PAYMENT_METHOD_UPDATED';
  amount?: number;
  currency?: string;
  invoiceId?: string;
  paymentMethodId?: string;
  nextRetryDate?: string;
  message: string;
  timestamp: string;
}

// Types for perk availability updates
interface PerkUpdate {
  userId: string;
  subscriptionId: string;
  perkType: string;
  available: boolean;
  usageCount: number;
  limit?: number;
  resetDate?: string;
  message?: string;
}

interface CustomerRealtimeState {
  subscription: SubscriptionUpdate | null;
  usage: UsageUpdate | null;
  billingEvents: BillingEvent[];
  perkUpdates: PerkUpdate[];
  notifications: any[];
  isConnected: boolean;
  lastUpdated: {
    subscription?: Date;
    usage?: Date;
    billing?: Date;
    perks?: Date;
  };
}

export function useCustomerRealtime(userId?: string) {
  const { socket, isConnected } = useSocket();
  const [state, setState] = useState<CustomerRealtimeState>({
    subscription: null,
    usage: null,
    billingEvents: [],
    perkUpdates: [],
    notifications: [],
    isConnected: false,
    lastUpdated: {}
  });

  const subscribedRef = useRef(false);

  // Update connection status
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isConnected
    }));
  }, [isConnected]);

  // Subscribe to customer-specific updates
  const subscribeToUpdates = useCallback(() => {
    if (!socket || !isConnected || !userId || subscribedRef.current) {
      return;
    }

    console.log('Subscribing to customer real-time updates for user:', userId);

    // Subscribe to customer updates
    socket.emit('customer:subscribe', { userId });
    subscribedRef.current = true;

    // Set up event listeners
    const handleSubscriptionUpdate = (data: SubscriptionUpdate) => {
      console.log('Received subscription update:', data);
      setState(prev => ({
        ...prev,
        subscription: data,
        lastUpdated: {
          ...prev.lastUpdated,
          subscription: new Date()
        }
      }));
    };

    const handleUsageUpdate = (data: UsageUpdate) => {
      console.log('Received usage update:', data);
      setState(prev => ({
        ...prev,
        usage: data,
        lastUpdated: {
          ...prev.lastUpdated,
          usage: new Date()
        }
      }));
    };

    const handleBillingEvent = (data: BillingEvent) => {
      console.log('Received billing event:', data);
      setState(prev => ({
        ...prev,
        billingEvents: [data, ...prev.billingEvents.slice(0, 9)], // Keep last 10 events
        lastUpdated: {
          ...prev.lastUpdated,
          billing: new Date()
        }
      }));
    };

    const handlePerkUpdate = (data: PerkUpdate) => {
      console.log('Received perk update:', data);
      setState(prev => {
        const existingIndex = prev.perkUpdates.findIndex(p => p.perkType === data.perkType);
        const updatedPerks = existingIndex >= 0 
          ? prev.perkUpdates.map((p, i) => i === existingIndex ? data : p)
          : [data, ...prev.perkUpdates];

        return {
          ...prev,
          perkUpdates: updatedPerks,
          lastUpdated: {
            ...prev.lastUpdated,
            perks: new Date()
          }
        };
      });
    };

    const handleNotification = (data: any) => {
      console.log('Received customer notification:', data);
      setState(prev => ({
        ...prev,
        notifications: [data, ...prev.notifications.slice(0, 19)] // Keep last 20 notifications
      }));
    };

    // Register event listeners
    socket.on('customer:subscription-update', handleSubscriptionUpdate);
    socket.on('customer:usage-update', handleUsageUpdate);
    socket.on('customer:billing-event', handleBillingEvent);
    socket.on('customer:perk-update', handlePerkUpdate);
    socket.on('customer:notification', handleNotification);

    // Cleanup function
    return () => {
      socket.off('customer:subscription-update', handleSubscriptionUpdate);
      socket.off('customer:usage-update', handleUsageUpdate);
      socket.off('customer:billing-event', handleBillingEvent);
      socket.off('customer:perk-update', handlePerkUpdate);
      socket.off('customer:notification', handleNotification);
    };
  }, [socket, isConnected, userId]);

  // Unsubscribe from updates
  const unsubscribeFromUpdates = useCallback(() => {
    if (!socket || !userId || !subscribedRef.current) {
      return;
    }

    console.log('Unsubscribing from customer real-time updates for user:', userId);
    socket.emit('customer:unsubscribe', { userId });
    subscribedRef.current = false;
  }, [socket, userId]);

  // Request immediate data refresh
  const refreshData = useCallback(() => {
    if (!socket || !isConnected || !userId) {
      return;
    }

    console.log('Requesting data refresh for user:', userId);
    socket.emit('customer:refresh', { userId });
  }, [socket, isConnected, userId]);

  // Handle optimistic updates for better UX
  const updateSubscriptionOptimistically = useCallback((update: Partial<SubscriptionUpdate>) => {
    setState(prev => ({
      ...prev,
      subscription: prev.subscription ? { ...prev.subscription, ...update } : null,
      lastUpdated: {
        ...prev.lastUpdated,
        subscription: new Date()
      }
    }));
  }, []);

  const updateUsageOptimistically = useCallback((update: Partial<UsageUpdate>) => {
    setState(prev => ({
      ...prev,
      usage: prev.usage ? { ...prev.usage, ...update } : null,
      lastUpdated: {
        ...prev.lastUpdated,
        usage: new Date()
      }
    }));
  }, []);

  // Subscribe when socket connects and user is available
  useEffect(() => {
    if (socket && isConnected && userId && !subscribedRef.current) {
      const cleanup = subscribeToUpdates();
      return cleanup;
    }
  }, [socket, isConnected, userId, subscribeToUpdates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeFromUpdates();
    };
  }, [unsubscribeFromUpdates]);

  return {
    // Data
    subscription: state.subscription,
    usage: state.usage,
    billingEvents: state.billingEvents,
    perkUpdates: state.perkUpdates,
    notifications: state.notifications,
    isConnected: state.isConnected,
    lastUpdated: state.lastUpdated,

    // Actions
    refreshData,
    updateSubscriptionOptimistically,
    updateUsageOptimistically,
    subscribeToUpdates,
    unsubscribeFromUpdates
  };
}