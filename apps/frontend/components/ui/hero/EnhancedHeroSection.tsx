'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationContent, useLocationStats, useLocationPricing } from '@/hooks/use-location-content';
import { ResponsiveBackground } from '../backgrounds/ResponsiveBackground';
import { TrustIndicators, SavingsBadge } from './TrustIndicators';
import { Button } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import Link from 'next/link';
import {
  ArrowRight,
  User,
  Sparkles,
  CheckCircle,
  MapPin,
} from 'lucide-react';

interface EnhancedHeroSectionProps {
  variant?: 'gradient-mesh' | 'particle-field' | 'geometric-pattern';
  showStats?: boolean;
  showTrustIndicators?: boolean;
  className?: string;
}

export function EnhancedHeroSection({
  variant = 'gradient-mesh',
  showStats = true,
  showTrustIndicators = true,
  className = '',
}: EnhancedHeroSectionProps) {
  const { isAuthenticated, user } = useAuth();
  const content = useLocationContent();
  const stats = useLocationStats();
  const { pricingMessage } = useLocationPricing();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <ResponsiveBackground variant={variant} className={className}>
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-fluid-3xl">
          <div className="text-center max-w-5xl mx-auto">
            {/* Trust Badge */}
            <div 
              className={`inline-flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 text-blue-700 dark:text-blue-300 px-6 py-3 rounded-full text-sm font-medium mb-8 shadow-lg transition-all duration-700 ${
                isVisible ? 'animate-reveal-up' : 'opacity-0'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              {content.badge}
            </div>

            {/* Main Headline */}
            <h1 
              className={`heading-display mb-6 transition-all duration-700 delay-200 ${
                isVisible ? 'animate-reveal-up-delay-1' : 'opacity-0'
              }`}
            >
              <span className="block text-gray-900 dark:text-gray-100">
                {content.headline}
              </span>
              <span className="block text-gradient-primary mt-2">
                {content.subheadline}
              </span>
            </h1>

            {/* Description */}
            <p 
              className={`text-lead text-gray-600 dark:text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed transition-all duration-700 delay-300 ${
                isVisible ? 'animate-reveal-up-delay-2' : 'opacity-0'
              }`}
            >
              {content.description}
            </p>

            {/* Trust Indicators */}
            {showTrustIndicators && (
              <div 
                className={`mb-12 transition-all duration-700 delay-400 ${
                  isVisible ? 'animate-reveal-up-delay-3' : 'opacity-0'
                }`}
              >
                <TrustIndicators variant="grid" showLocationBenefits={true} />
              </div>
            )}

            {/* User-specific content */}
            {isAuthenticated && user ? (
              <div 
                className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 transition-all duration-700 delay-500 ${
                  isVisible ? 'animate-reveal-up-delay-3' : 'opacity-0'
                }`}
              >
                <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-6 py-4 rounded-full shadow-lg border border-white/20 dark:border-gray-700/50">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    Welcome back, {user.name}!
                  </span>
                </div>
                <Badge variant="secondary" className="text-sm px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/50">
                  {user.role}
                </Badge>
              </div>
            ) : (
              <div 
                className={`flex flex-col items-center mb-12 transition-all duration-700 delay-500 ${
                  isVisible ? 'animate-reveal-up-delay-3' : 'opacity-0'
                }`}
              >
                <Link href="/register">
                  <Button 
                    size="lg" 
                    className="btn-primary-enhanced px-8 py-4 text-lg font-semibold mb-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" 
                  >
                    <span className="flex items-center gap-3">
                      Let's Get You Started
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  </Button>
                </Link>
                
                <Link href="/pricing">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="btn-secondary-enhanced border-2 transition-all duration-300 transform hover:scale-105"
                  >
                    <span className="flex items-center gap-2">
                      View Plans
                      <MapPin className="h-4 w-4" />
                    </span>
                  </Button>
                </Link>
              </div>
            )}

            {/* Decorative Elements */}
            <div 
              className={`flex justify-center items-center gap-8 mb-12 opacity-60 transition-all duration-700 delay-600 ${
                isVisible ? 'animate-reveal-up-delay-3' : 'opacity-0'
              }`}
            >
              <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-purple-400 dark:from-blue-300 dark:to-purple-300 rounded-full animate-pulse"></div>
              <div className="w-4 h-4 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-16 h-1 bg-gradient-to-r from-purple-400 to-blue-400 dark:from-purple-300 dark:to-blue-300 rounded-full animate-pulse"></div>
            </div>

            {/* Stats Section */}
            {showStats && (
              <div 
                className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-700 delay-700 ${
                  isVisible ? 'animate-reveal-up-delay-3' : 'opacity-0'
                }`}
              >
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="text-center card-enhanced p-6 hover:scale-105 transition-all duration-300"
                  >
                    <div className={`text-4xl md:text-5xl font-bold mb-2 ${stat.color}`}>
                      {stat.value}
                    </div>
                    <div className="text-gray-600 dark:text-gray-300 font-medium">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quality Assurance Banner */}
        <div 
          className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-700 delay-800 ${
            isVisible ? 'animate-reveal-up-delay-3' : 'opacity-0'
          }`}
        >
          <SavingsBadge amount="40%" className="backdrop-blur-sm shadow-lg" />
        </div>
      </section>
    </ResponsiveBackground>
  );
}