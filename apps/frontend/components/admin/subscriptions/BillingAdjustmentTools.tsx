"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLoadingState } from '../AdminLoadingState';

export function BillingAdjustmentTools() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Adjustment Tools</CardTitle>
      </CardHeader>
      <CardContent>
        <AdminLoadingState message="Billing tools coming soon..." />
      </CardContent>
    </Card>
  );
}