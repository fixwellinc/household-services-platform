'use client';

import { useMemo } from 'react';
import { useLocation } from '@/contexts/LocationContext';

interface LocationContent {
  badge: string;
  headline: string;
  subheadline: string;
  description: string;
  ctaText: string;
  trustMessage: string;
  serviceArea: string;
}

export function useLocationContent(): LocationContent {
  const { userLocation, userCity, isInBC, isLoading } = useLocation();

  const content = useMemo(() => {
    // Default content for when location is not available or outside BC
    const defaultContent: LocationContent = {
      badge: 'Trusted by Lower Mainland homeowners',
      headline: 'Your Home,',
      subheadline: 'Our Expertise',
      description: 'Connect with verified professionals for all your household needs. Choose from Starter Plan, HomeCare Plan, or Priority Plan.',
      ctaText: 'Get Started Today',
      trustMessage: 'Professional services across the Lower Mainland',
      serviceArea: 'Lower Mainland',
    };

    // If we're still loading location data, return default
    if (isLoading) {
      return defaultContent;
    }

    // If user is in BC and we have their city
    if (isInBC && userCity) {
      return {
        badge: `Trusted by ${userCity} homeowners`,
        headline: `Your ${userCity} Home,`,
        subheadline: 'Our Expertise',
        description: `Connect with verified professionals for all your household needs across ${userCity} and the Lower Mainland. Choose from Starter Plan, HomeCare Plan, or Priority Plan.`,
        ctaText: `Start Your ${userCity} Service`,
        trustMessage: `Professional services in ${userCity} and surrounding areas`,
        serviceArea: `${userCity} & Lower Mainland`,
      };
    }

    // If user is in BC but we don't have specific city
    if (isInBC) {
      return {
        badge: 'Trusted by BC homeowners',
        headline: 'Your BC Home,',
        subheadline: 'Our Expertise',
        description: 'Connect with verified professionals for all your household needs across British Columbia. Choose from Starter Plan, HomeCare Plan, or Priority Plan.',
        ctaText: 'Start Your BC Service',
        trustMessage: 'Professional services across British Columbia',
        serviceArea: 'British Columbia',
      };
    }

    // Return default for users outside BC or unknown location
    return defaultContent;
  }, [userCity, isInBC, isLoading]);

  return content;
}

// Hook for getting location-specific service benefits
export function useLocationBenefits() {
  const { userCity, isInBC } = useLocation();

  const benefits = useMemo(() => {
    const baseBenefits = [
      'Fully Insured & Bonded',
      'Professional Quality Guaranteed',
      '10,000+ Satisfied Customers',
      'Same-Day Booking Available',
    ];

    if (isInBC && userCity) {
      return [
        `Local ${userCity} Professionals`,
        ...baseBenefits,
      ];
    }

    if (isInBC) {
      return [
        'Local BC Professionals',
        ...baseBenefits,
      ];
    }

    return baseBenefits;
  }, [userCity, isInBC]);

  return benefits;
}

// Hook for getting location-specific pricing messages
export function useLocationPricing() {
  const { userCity, isInBC } = useLocation();

  const pricingMessage = useMemo(() => {
    if (isInBC && userCity) {
      return `Save up to 40% compared to ${userCity} contractor rates`;
    }

    if (isInBC) {
      return 'Save up to 40% compared to BC contractor rates';
    }

    return 'Save up to 40% compared to traditional contractor rates';
  }, [userCity, isInBC]);

  return { pricingMessage };
}

// Hook for getting location-specific stats
export function useLocationStats() {
  const { userCity, isInBC } = useLocation();

  const stats = useMemo(() => {
    const baseStats = [
      {
        value: '50+',
        label: 'Services Available',
        color: 'text-blue-600 dark:text-blue-400',
      },
      {
        value: '10k+',
        label: 'Happy Members',
        color: 'text-purple-600 dark:text-purple-400',
      },
      {
        value: 'Up to $1k+',
        label: 'Possible Annual Savings',
        color: 'text-emerald-600 dark:text-emerald-400',
      },
    ];

    // Add location-specific stats if available
    if (isInBC && userCity) {
      return [
        {
          value: '500+',
          label: `${userCity} Customers`,
          color: 'text-orange-600 dark:text-orange-400',
        },
        ...baseStats,
      ];
    }

    return baseStats;
  }, [userCity, isInBC]);

  return stats;
}