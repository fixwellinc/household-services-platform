"use client";

import React from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Subscription {
  id: string;
  tier: string;
  user: {
    email: string;
    name?: string;
  };
}

interface BillingAdjustmentModalProps {
  subscription: Subscription;
  onClose: () => void;
  onSuccess: () => void;
}

export function BillingAdjustmentModal({ subscription, onClose, onSuccess }: BillingAdjustmentModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Billing Adjustment</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">
              Customer: {subscription.user.name || subscription.user.email}
            </p>
            <p className="text-sm text-gray-600">
              Plan: {subscription.tier}
            </p>
          </div>
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">Billing adjustment tools coming soon...</p>
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