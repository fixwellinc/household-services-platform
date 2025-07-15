import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  originalPrice: number;
  stripePriceIds: {
    monthly: string;
    yearly: string;
  };
  features: string[];
  savings: string;
  color: string;
  icon: string;
  popular?: boolean;
}

export interface UserPlan {
  tier: string;
  status: string;
  currentPeriodEnd: string;
}

export interface PlansResponse {
  success: boolean;
  plans: Plan[];
  userPlan?: UserPlan;
  message: string;
}

export interface DiscountCalculation {
  success: boolean;
  discount: number;
  finalPrice: number;
  planTier?: string;
  message: string;
}

// Fetch all plans
export const usePlans = () => {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async (): Promise<PlansResponse> => {
      return api.getPlans();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (React Query v5)
  });
};

// Fetch specific plan
export const usePlan = (planId: string) => {
  return useQuery({
    queryKey: ['plans', planId],
    queryFn: async (): Promise<{ success: boolean; plan: Plan; message: string }> => {
      return api.getPlan(planId);
    },
    enabled: !!planId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000, // React Query v5
  });
};

// Get user's current plan
export const useUserPlan = () => {
  return useQuery({
    queryKey: ['user-plan'],
    queryFn: async (): Promise<{
      success: boolean;
      hasPlan: boolean;
      subscription?: {
        tier: string;
        status: string;
        currentPeriodStart: string;
        currentPeriodEnd: string;
        createdAt: string;
      };
      plan?: Plan;
      message: string;
    }> => {
      return api.getUserPlan();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // React Query v5
  });
};

// Calculate service discount
export const useCalculateDiscount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (servicePrice: number): Promise<DiscountCalculation> => {
      return api.calculateDiscount(servicePrice);
    },
    onSuccess: () => {
      // Invalidate user plan cache when discount is calculated
      queryClient.invalidateQueries({ queryKey: ['user-plan'] });
    },
  });
};

// Get plan comparison data
export const usePlanComparison = () => {
  return useQuery({
    queryKey: ['plan-comparison'],
    queryFn: async (): Promise<{
      success: boolean;
      comparison: {
        features: Array<{
          name: string;
          basic: string | boolean;
          plus: string | boolean;
          premier: string | boolean;
        }>;
      };
      message: string;
    }> => {
      return api.getPlanComparison();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // React Query v5
  });
};

// Admin: Get plan statistics
export const usePlanStats = () => {
  return useQuery({
    queryKey: ['plan-stats'],
    queryFn: async (): Promise<{
      success: boolean;
      stats: Array<{
        tier: string;
        status: string;
        _count: { id: number };
      }>;
      totalRevenue: {
        monthly: number;
        yearly: number;
      };
      message: string;
    }> => {
      return api.getPlanStats();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // React Query v5
  });
};

// Helper function to get plan by ID
export const getPlanById = (plans: Plan[], planId: string): Plan | undefined => {
  return plans.find(plan => plan.id === planId);
};

// Helper function to get plan by tier
export const getPlanByTier = (plans: Plan[], tier: string): Plan | undefined => {
  return plans.find(plan => plan.id === tier.toLowerCase());
};

// Helper function to format price
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(price);
};

// Helper function to calculate yearly savings
export const calculateYearlySavings = (monthlyPrice: number, yearlyPrice: number): number => {
  const monthlyTotal = monthlyPrice * 12;
  return monthlyTotal - yearlyPrice;
};

// Helper function to get discount percentage
export const getDiscountPercentage = (originalPrice: number, currentPrice: number): number => {
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}; 