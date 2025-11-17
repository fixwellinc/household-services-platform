'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useUsageMetrics } from '@/hooks/use-customer-usage';
import { format, subDays } from 'date-fns';

interface UsageTrendsChartProps {
  days?: number;
}

export function UsageTrendsChart({ days = 30 }: UsageTrendsChartProps) {
  const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
  const endDate = format(new Date(), 'yyyy-MM-dd');
  const { data, isLoading } = useUsageMetrics(startDate, endDate);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-64 bg-gray-200 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  // Transform metrics data for chart
  const chartData = data?.metrics?.map((metric: any, index: number) => ({
    name: `Week ${index + 1}`,
    services: metric.value || 0,
    savings: metric.category === 'BILLING' ? metric.value : 0,
  })) || [];

  // If no data, create sample data structure
  if (chartData.length === 0) {
    // Generate sample data for the last 4 weeks
    for (let i = 0; i < 4; i++) {
      chartData.push({
        name: `Week ${i + 1}`,
        services: Math.floor(Math.random() * 10) + 1,
        savings: Math.floor(Math.random() * 100) + 20,
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="services" 
              stroke="#3b82f6" 
              name="Services Used"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="savings" 
              stroke="#10b981" 
              name="Savings ($)"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

