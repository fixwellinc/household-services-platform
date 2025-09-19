'use client';

import { useState, useEffect } from 'react';
import { TrendingDown, DollarSign, Percent } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PricingComparisonChartProps {
  servicePrice: number;
  contractorPrice?: number;
  savingsPercentage?: number;
  className?: string;
  animated?: boolean;
}

export function PricingComparisonChart({
  servicePrice,
  contractorPrice,
  savingsPercentage,
  className,
  animated = true
}: PricingComparisonChartProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Calculate values if not provided
  const calculatedContractorPrice = contractorPrice || servicePrice * 1.4; // 40% more expensive
  const calculatedSavings = savingsPercentage || Math.round(((calculatedContractorPrice - servicePrice) / calculatedContractorPrice) * 100);
  
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [animated]);

  const maxPrice = Math.max(servicePrice, calculatedContractorPrice);
  const serviceBarWidth = (servicePrice / maxPrice) * 100;
  const contractorBarWidth = (calculatedContractorPrice / maxPrice) * 100;
  
  // Animation delays for staggered effect
  const getAnimationDelay = (index: number) => animated ? `${index * 150}ms` : '0ms';

  return (
    <div className={cn('space-y-4 p-4 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 rounded-lg backdrop-blur-sm border border-emerald-200/30', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <TrendingDown className="h-4 w-4 text-emerald-600" />
        <span className="text-sm font-semibold text-emerald-800">Price Comparison</span>
        <div className="ml-auto bg-emerald-100/80 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">
          Save {calculatedSavings}%
        </div>
      </div>

      {/* Enhanced Comparison Bars */}
      <div className="space-y-4">
        {/* Fixwell Price */}
        <div className="space-y-2">
          <div className={cn(
            'flex items-center justify-between text-sm transition-all duration-500',
            animated && isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
          )}
          style={{ transitionDelay: getAnimationDelay(0) }}>
            <span className="font-medium text-gray-700">Fixwell Price</span>
            <span className="font-bold text-blue-600">{formatPrice(servicePrice)}</span>
          </div>
          <div className="relative h-4 bg-gray-200/50 rounded-full overflow-hidden shadow-inner">
            {/* Animated background shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-pulse" />
            <div 
              className={cn(
                'h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 rounded-full transition-all duration-1200 ease-out relative overflow-hidden',
                animated && isVisible ? 'opacity-100' : 'opacity-0'
              )}
              style={{ 
                width: animated && isVisible ? `${serviceBarWidth}%` : '0%',
                transitionDelay: getAnimationDelay(1)
              }}
            >
              {/* Bar shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-pulse" 
                   style={{ animationDelay: '1s', animationDuration: '2s' }} />
            </div>
          </div>
        </div>

        {/* Contractor Price */}
        <div className="space-y-2">
          <div className={cn(
            'flex items-center justify-between text-sm transition-all duration-500',
            animated && isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
          )}
          style={{ transitionDelay: getAnimationDelay(2) }}>
            <span className="font-medium text-gray-700">Typical Contractor</span>
            <span className="font-bold text-gray-600">{formatPrice(calculatedContractorPrice)}</span>
          </div>
          <div className="relative h-4 bg-gray-200/50 rounded-full overflow-hidden shadow-inner">
            <div 
              className={cn(
                'h-full bg-gradient-to-r from-gray-400 via-gray-500 to-gray-400 rounded-full transition-all duration-1200 ease-out relative overflow-hidden',
                animated && isVisible ? 'opacity-100' : 'opacity-0'
              )}
              style={{ 
                width: animated && isVisible ? `${contractorBarWidth}%` : '0%',
                transitionDelay: getAnimationDelay(3)
              }}
            >
              {/* Bar shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-pulse" 
                   style={{ animationDelay: '1.5s', animationDuration: '2s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Savings Summary */}
      <div className={cn(
        'flex items-center justify-between pt-3 border-t border-emerald-200/30 transition-all duration-500',
        animated && isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
      style={{ transitionDelay: getAnimationDelay(4) }}>
        <div className="flex items-center gap-2">
          <div className="p-1 bg-emerald-100/80 rounded-full">
            <DollarSign className="h-3 w-3 text-emerald-600" />
          </div>
          <span className="text-sm font-medium text-emerald-800">You Save</span>
        </div>
        <div className="text-right">
          <div className={cn(
            'font-bold text-emerald-600 transition-all duration-700',
            animated && isVisible && 'animate-pulse'
          )}
          style={{ animationDelay: '2s', animationDuration: '1s', animationIterationCount: '2' }}>
            {formatPrice(calculatedContractorPrice - servicePrice)}
          </div>
          <div className="text-xs text-emerald-700 flex items-center gap-1">
            <Percent className="h-3 w-3" />
            <span className={cn(
              'transition-all duration-700',
              animated && isVisible && 'animate-bounce'
            )}
            style={{ animationDelay: '2.5s', animationDuration: '0.5s', animationIterationCount: '2' }}>
              {calculatedSavings}% less
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PricingComparisonChart;