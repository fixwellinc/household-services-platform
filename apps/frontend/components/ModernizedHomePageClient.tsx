'use client';

import { useCurrentUser } from '@/hooks/use-api';
import { useAuth } from '@/contexts/AuthContext';
import HeroSection from '@/components/pages/home/HeroSection';
import ServicesSection from '@/components/pages/home/ServicesSection';
import FeaturesSection from '@/components/pages/home/FeaturesSection';
import CTASection from '@/components/pages/home/CTASection';
import { Loader2 } from 'lucide-react';

export default function ModernizedHomePageClient() {
  const { isHydrated } = useAuth();
  const { data: userData, isLoading: userLoading } = useCurrentUser(isHydrated);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Loading your experience...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <HeroSection />
      <ServicesSection />
      <FeaturesSection />
      <CTASection />
    </div>
  );
}