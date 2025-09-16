"use client";

import React from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Subscription {
  id: string;
  userId: string;
  tier: string;
  status: string;
  user: {
    email: string;
    name?: string;
  };
}

interface SubscriptionDetailsPanelProps {
  subscription: Subscription;
  onClose: () => void;
  onRefresh: () => void;
  onPause: (subscriptionId: string, reason: string, endDate: Date) => Promise<void>;
  onResume: (subscriptionId: string) => Promise<void>;
  onCancel: (subscriptionId: string, reason: string) => Promise<void>;
}

export function SubscriptionDetailsPanel({ 
  subscription, 
  onClose, 
  onRefresh,
  onPause,
  onResume,
  onCancel 
}: SubscriptionDetailsPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Subscription Details</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Customer</label>
              <p className="text-sm text-gray-900">{subscription.user.name || subscription.user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Tier</label>
              <p className="text-sm text-gray-900">{subscription.tier}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <p className="text-sm text-gray-900">{subscription.status}</p>
            </div>
          </div>
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">Detailed subscription management coming soon...</p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}