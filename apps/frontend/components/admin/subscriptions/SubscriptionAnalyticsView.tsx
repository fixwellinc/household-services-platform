"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLoadingState } from '../AdminLoadingState';

export function SubscriptionAnalyticsView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <AdminLoadingState message="Analytics dashboard coming soon..." />
      </CardContent>
    </Card>
  );
}