"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLoadingState } from '../AdminLoadingState';

export function ChurnPredictionPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Churn Prediction</CardTitle>
      </CardHeader>
      <CardContent>
        <AdminLoadingState message="Churn prediction analytics coming soon..." />
      </CardContent>
    </Card>
  );
}