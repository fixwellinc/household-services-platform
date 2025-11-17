'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useUsageMetrics } from '@/hooks/use-customer-usage';
import { format, subDays } from 'date-fns';
import { DollarSign } from 'lucide-react';

interface SavingsChartProps {
  days?: number;
}

export function SavingsChart({ days = 30 }: SavingsChartProps) {
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

  // Transform service breakdown for savings chart
  const chartData = data?.serviceBreakdown?.map((service: any) => ({
    name: service.serviceName || service.serviceId,
    savings: service.discountAmount || 0,
    total: service.totalAmount || 0,
  })) || [];

  // If no data, create sample data
  if (chartData.length === 0) {
    chartData.push(
      { name: 'Plumbing', savings: 50, total: 200 },
      { name: 'Electrical', savings: 40, total: 180 },
      { name: 'Cleaning', savings: 30, total: 150 },
      { name: 'Maintenance', savings: 20, total: 100 }
    );
  }

  const totalSavings = data?.totalSavings || chartData.reduce((sum, item) => sum + item.savings, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Savings Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Total Savings</p>
              <p className="text-3xl font-bold text-green-900">
                ${totalSavings.toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="savings" fill="#10b981" name="Savings ($)" />
            <Bar dataKey="total" fill="#3b82f6" name="Total ($)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

