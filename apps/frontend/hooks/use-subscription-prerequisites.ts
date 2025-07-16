'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useRouter } from 'next/navigation';

export interface SubscriptionPrerequisites {
  isAuthenticated: boolean;
  hasValidLocation: boolean;
  userLocation: string | null;
  userCity: string | null;
  isInBC: boolean;
  user: any;
  canProceedToSubscription: boolean;
}

export interface UseSubscriptionPrerequisitesResult extends SubscriptionPrerequisites {
  checkAndRedirect: (planId: string) => Promise<boolean>;
  redirectToLogin: (planId: string) => void;
  promptForLocation: () => void;
}

export function useSubscriptionPrerequisites(): UseSubscriptionPrerequisitesResult {
  const { user, isLoading: authLoading } = useAuth();
  const { userLocation, userCity, isInBC, isLoading: locationLoading } = useLocation();
  const router = useRouter();

  const isAuthenticated = !!user && !authLoading;
  const hasValidLocation = !!userLocation && isInBC;
  const canProceedToSubscription = isAuthenticated && hasValidLocation;

  const redirectToLogin = (planId: string) => {
    const currentUrl = window.location.pathname + window.location.search;
    const redirectUrl = `/dashboard/customer/book-service?plan=${planId}`;
    router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
  };

  const promptForLocation = () => {
    // This will be handled by the component using this hook
    // They should show the LocationPromptModal
    const banner = document.querySelector('[data-location-banner]');
    if (banner) {
      banner.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const checkAndRedirect = async (planId: string): Promise<boolean> => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      redirectToLogin(planId);
      return false;
    }

    // If authenticated but no valid location, don't redirect - let component handle
    if (!hasValidLocation) {
      return false;
    }

    // All prerequisites met, can proceed
    return true;
  };

  return {
    isAuthenticated,
    hasValidLocation,
    userLocation,
    userCity,
    isInBC,
    user,
    canProceedToSubscription,
    checkAndRedirect,
    redirectToLogin,
    promptForLocation,
  };
} 