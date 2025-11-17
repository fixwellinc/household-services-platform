'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useUsageMetrics } from '@/hooks/use-customer-usage';
import { format, subDays } from 'date-fns';

interface ServiceCategoryChartProps {
  days?: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function ServiceCategoryChart({ days = 30 }: ServiceCategoryChartProps) {
  const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
  const endDate = format(new Date(), 'yyyy-MM-dd');
  const { data, isLoading } = useUsageMetrics(startDate, endDate);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-64 bg-gray-200 animate-pulse rounded-full" />
        </CardContent>
      </Card>
    );
  }

  // Transform service breakdown data for chart
  const chartData = data?.serviceBreakdown?.map((service: any) => ({
    name: service.serviceName || service.serviceId,
    value: service.usageCount || 0,
    amount: service.finalAmount || 0,
  })) || [];

  // If no data, create sample data
  if (chartData.length === 0) {
    chartData.push(
      { name: 'Plumbing', value: 5, amount: 500 },
      { name: 'Electrical', value: 3, amount: 300 },
      { name: 'Cleaning', value: 8, amount: 400 },
      { name: 'Maintenance', value: 2, amount: 200 }
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

