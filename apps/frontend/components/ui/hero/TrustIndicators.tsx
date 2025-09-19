'use client';

import { useLocationBenefits } from '@/hooks/use-location-content';
import {
  Shield,
  Award,
  Users,
  Clock,
  MapPin,
  CheckCircle,
  Star,
  Zap,
} from 'lucide-react';

interface TrustIndicatorsProps {
  variant?: 'horizontal' | 'grid' | 'compact';
  showLocationBenefits?: boolean;
  className?: string;
}

export function TrustIndicators({
  variant = 'grid',
  showLocationBenefits = true,
  className = '',
}: TrustIndicatorsProps) {
  const locationBenefits = useLocationBenefits();

  const getIcon = (text: string) => {
    if (text.includes('Insured') || text.includes('Bonded')) return Shield;
    if (text.includes('Quality') || text.includes('Guaranteed')) return Award;
    if (text.includes('Customers') || text.includes('Satisfied')) return Users;
    if (text.includes('Booking') || text.includes('Same-Day')) return Clock;
    if (text.includes('Local') || text.includes('Professionals')) return MapPin;
    if (text.includes('Verified') || text.includes('Certified')) return CheckCircle;
    if (text.includes('Rated') || text.includes('Reviews')) return Star;
    return Zap; // Default icon
  };

  const getColor = (index: number) => {
    const colors = [
      'text-blue-600 dark:text-blue-400',
      'text-emerald-600 dark:text-emerald-400',
      'text-purple-600 dark:text-purple-400',
      'text-orange-600 dark:text-orange-400',
      'text-pink-600 dark:text-pink-400',
    ];
    return colors[index % colors.length];
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'horizontal':
        return 'flex flex-wrap justify-center gap-4';
      case 'compact':
        return 'flex flex-wrap justify-center gap-2';
      case 'grid':
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';
    }
  };

  const getItemClasses = () => {
    switch (variant) {
      case 'horizontal':
        return 'flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300';
      case 'compact':
        return 'flex items-center gap-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20 dark:border-gray-700/50 text-xs';
      case 'grid':
      default:
        return 'flex items-center justify-center gap-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:scale-105';
    }
  };

  const getTextClasses = () => {
    switch (variant) {
      case 'compact':
        return 'text-xs font-medium text-gray-700 dark:text-gray-300';
      default:
        return 'text-sm font-medium text-gray-700 dark:text-gray-300';
    }
  };

  const getIconSize = () => {
    switch (variant) {
      case 'compact':
        return 'h-3 w-3';
      default:
        return 'h-5 w-5';
    }
  };

  const benefits = showLocationBenefits ? locationBenefits : [
    'Fully Insured & Bonded',
    'Professional Quality Guaranteed',
    '10,000+ Satisfied Customers',
    'Same-Day Booking Available',
  ];

  return (
    <div className={`${getVariantClasses()} ${className}`}>
      {benefits.map((benefit, index) => {
        const IconComponent = getIcon(benefit);
        const color = getColor(index);

        return (
          <div
            key={index}
            className={getItemClasses()}
          >
            <IconComponent className={`${getIconSize()} ${color}`} />
            <span className={getTextClasses()}>
              {benefit}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Specialized trust indicator components
export function CompactTrustBadge({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium shadow-lg ${className}`}>
      <Shield className="h-4 w-4" />
      <span>Fully Insured & Professional</span>
    </div>
  );
}

export function QualityBadge({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-full text-sm font-medium ${className}`}>
      <Award className="h-4 w-4" />
      <span>Quality Guaranteed</span>
    </div>
  );
}

export function SavingsBadge({ 
  amount = '40%',
  className = '' 
}: { 
  amount?: string;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-full text-sm font-medium ${className}`}>
      <CheckCircle className="h-4 w-4" />
      <span>Save up to {amount} vs contractors</span>
    </div>
  );
}