import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface DashboardData {
  subscription: {
    id: string;
    status: string;
    tier: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    plan: {
      id: string;
      name: string;
      monthlyPrice: number;
      yearlyPrice: number;
      features: string[];
      maxServicesPerMonth: number;
    };
  } | null;
  statistics: {
    totalBookings: number;
    upcomingBookings: number;
    completedBookings: number;
    totalSpent: number;
  };
  usageStats: {
    perksUsed: number;
    totalPerks: number;
    remainingPerks: number;
    savings: number;
  } | null;
  recentActivity: Array<{
    id: string;
    service: string;
    date: string;
    status: string;
    amount: number;
    provider: string;
  }>;
  availableServices: Array<{
    id: string;
    name: string;
    description: string;
    basePrice: number;
    category: string;
  }>;
}

export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard-data'],
    queryFn: async () => {
      const response = await api.get('/dashboard/customer');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
} 