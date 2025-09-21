'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { Button } from '@/components/ui/shared';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { 
  Shield, 
  Star, 
  Clock, 
  MapPin, 
  Heart,
  Eye,
  BookOpen,
  Sparkles,
  Zap,
  Home,
  Wrench,
  Sparkle,
  ChevronDown,
  ChevronUp,
  Award,
  TrendingUp,
  Users,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { 
  AnimatedCleaningIcon,
  AnimatedMaintenanceIcon,
  AnimatedRepairIcon,
  AnimatedOrganizationIcon
} from '../icons/AnimatedServiceIcons';
import PricingComparisonChart from './PricingComparisonChart';

interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    description: string;
    category: string;
    basePrice: number;
    complexity: string;
    features?: string[];
    rating?: number;
    reviewCount?: number;
    estimatedTime?: string;
    popularity?: 'high' | 'medium' | 'low';
    contractorPrice?: number;
    savingsPercentage?: number;
  };
  variant?: 'standard' | 'featured' | 'compact';
  onBook?: (serviceId: string) => void;
  onView?: (serviceId: string) => void;
  showPricingComparison?: boolean;
  className?: string;
}

export default function ModernServiceCard({ 
  service, 
  variant = 'standard',
  onBook, 
  onView,
  showPricingComparison = false,
  className 
}: ServiceCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComparison, setShowComparison] = useState(showPricingComparison);
  const cardRef = useRef<HTMLDivElement>(null);

  const getCategoryIcon = (category: string) => {
    const iconSize = isCompact ? 'sm' : 'lg';
    switch (category) {
      case 'CLEANING':
        return <AnimatedCleaningIcon size={iconSize} animated={isHovered} />;
      case 'MAINTENANCE':
        return <AnimatedMaintenanceIcon size={iconSize} animated={isHovered} />;
      case 'REPAIR':
        return <AnimatedRepairIcon size={iconSize} animated={isHovered} />;
      case 'ORGANIZATION':
        return <AnimatedOrganizationIcon size={iconSize} animated={isHovered} />;
      default:
        return <Star className="h-8 w-8" />;
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'EASY':
        return 'bg-emerald-100/80 dark:bg-emerald-800/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-600/50';
      case 'MEDIUM':
        return 'bg-amber-100/80 dark:bg-amber-800/30 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-600/50';
      case 'HARD':
        return 'bg-rose-100/80 dark:bg-rose-800/30 text-rose-700 dark:text-rose-300 border-rose-200/50 dark:border-rose-600/50';
      default:
        return 'bg-slate-100/80 dark:bg-slate-700/30 text-slate-700 dark:text-slate-300 border-slate-200/50 dark:border-slate-600/50';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'featured':
        return {
          card: 'ring-2 ring-gradient-to-r from-blue-500 to-purple-500 ring-offset-2 scale-105 z-10',
          background: 'bg-gradient-to-br from-blue-50/90 via-white/95 to-purple-50/90 dark:from-blue-900/30 dark:via-gray-800/95 dark:to-purple-900/30',
          header: 'bg-gradient-to-br from-blue-100/80 to-purple-100/80 dark:from-blue-800/30 dark:to-purple-800/30',
          badge: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0'
        };
      case 'compact':
        return {
          card: '',
          background: 'bg-white/80 dark:bg-gray-800/80',
          header: 'bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-700/30 dark:to-slate-600/30',
          badge: 'bg-slate-100/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 border-slate-200/50 dark:border-slate-600/50'
        };
      default:
        return {
          card: '',
          background: 'bg-white/80 dark:bg-gray-800/80',
          header: 'bg-gradient-to-br from-blue-50/80 to-purple-50/80 dark:from-blue-800/30 dark:to-purple-800/30',
          badge: 'bg-blue-50/80 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-600/50'
        };
    }
  };

  const variantStyles = getVariantStyles();
  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured';

  return (
    <Card 
      ref={cardRef}
      className={cn(
        'group relative overflow-hidden transition-all duration-500 transform border-0 shadow-lg',
        // Glassmorphism base with dark mode support
        'backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border border-white/20 dark:border-gray-700/30',
        // Enhanced hover effects with 3D transforms
        'hover:-translate-y-3 hover:rotate-x-2 hover:shadow-2xl hover:shadow-blue-500/20 dark:hover:shadow-blue-400/20',
        'hover:scale-[1.02]',
        // Variant-specific styles
        variantStyles.card,
        isHovered && 'ring-2 ring-blue-500/30 dark:ring-blue-400/30 ring-offset-4',
        // Perspective for 3D effects
        'perspective-1000',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered 
          ? 'translateY(-12px) rotateX(2deg) scale(1.02)' 
          : 'translateY(0) rotateX(0) scale(1)',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Glassmorphism Background Overlay */}
      <div className={cn(
        'absolute inset-0 transition-all duration-500',
        variantStyles.background
      )} />
      
      {/* Featured Badge */}
      {isFeatured && (
        <div className="absolute -top-2 -right-2 z-20">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
            <Award className="h-3 w-3" />
            POPULAR
          </div>
        </div>
      )}

      {/* Header with Icon */}
      <div className={cn(
        'relative flex items-center justify-center overflow-hidden transition-all duration-500',
        isCompact ? 'h-32' : 'h-48',
        variantStyles.header
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        
        {/* Animated Icon */}
        <div className={cn(
          'transition-all duration-500 opacity-60',
          isHovered && 'scale-110 opacity-80'
        )}>
          {getCategoryIcon(service.category)}
        </div>
        
        {/* Enhanced Floating Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={cn(
              'p-2 rounded-full shadow-lg transition-all duration-300 backdrop-blur-sm transform hover:scale-110 active:scale-95',
              'hover:shadow-xl hover:-translate-y-1',
              isLiked 
                ? 'bg-red-500/90 text-white hover:bg-red-600/90 shadow-red-500/30' 
                : 'bg-white/80 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 hover:bg-white/90 dark:hover:bg-gray-600/90 hover:text-red-500 hover:shadow-red-500/20'
            )}
            style={{
              transitionDelay: isHovered ? '100ms' : '0ms'
            }}
          >
            <Heart className={cn(
              'h-4 w-4 transition-all duration-300',
              isLiked && 'fill-current scale-110'
            )} />
          </button>
          {onView && (
            <button
              onClick={() => onView(service.id)}
              className={cn(
                'p-2 rounded-full bg-white/80 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 hover:bg-white/90 dark:hover:bg-gray-600/90 hover:text-blue-600 dark:hover:text-blue-400 shadow-lg transition-all duration-300 backdrop-blur-sm',
                'transform hover:scale-110 active:scale-95 hover:shadow-xl hover:-translate-y-1 hover:shadow-blue-500/20'
              )}
              style={{
                transitionDelay: isHovered ? '200ms' : '0ms'
              }}
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Rating Badge */}
        {service.rating && (
          <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1 shadow-lg">
            <Star className="h-3 w-3 text-yellow-500 fill-current" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{service.rating}</span>
            {service.reviewCount && (
              <span className="text-xs text-gray-600 dark:text-gray-300">({service.reviewCount})</span>
            )}
          </div>
        )}
      </div>

      <CardHeader className={cn('pb-4 relative', isCompact && 'pb-2')}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className={cn(
              'text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 flex items-center gap-2',
              isCompact ? 'text-lg' : 'text-xl'
            )}>
              {service.name}
              {isHovered && <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />}
              {isFeatured && <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
            </CardTitle>
            <CardDescription className={cn(
              'mt-2 text-gray-600 dark:text-gray-300',
              isCompact ? 'text-sm line-clamp-1' : 'line-clamp-2'
            )}>
              {service.description}
            </CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={cn('ml-2', variantStyles.badge)}
          >
            {service.category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className={cn('pt-0 relative z-10', isCompact && 'space-y-3')}>
        <div className="flex items-center justify-between mb-4">
          <span className={cn(
            'font-bold text-blue-600 dark:text-blue-400',
            isCompact ? 'text-2xl' : 'text-3xl'
          )}>
            {formatPrice(service.basePrice)}
          </span>
          <div className="flex items-center gap-2">
            {service.estimatedTime && (
              <Badge variant="secondary" className="bg-slate-100/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 text-xs">
                {service.estimatedTime}
              </Badge>
            )}
            <Badge variant="secondary" className={getComplexityColor(service.complexity)}>
              {service.complexity}
            </Badge>
          </div>
        </div>
        
        {/* Service Features - Progressive Disclosure */}
        {!isCompact && (
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Shield className="h-4 w-4 text-emerald-500" />
              <span className="font-medium">Professional Service</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>Quick Response Time</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <MapPin className="h-4 w-4 text-purple-500" />
              <span>Local Professionals</span>
            </div>

            {/* Expandable Features */}
            {service.features && service.features.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                >
                  <span className="font-medium">
                    {isExpanded ? 'Hide Details' : 'Show Details'}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                
                <div className={cn(
                  'overflow-hidden transition-all duration-300 ease-in-out',
                  isExpanded ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'
                )}>
                  <div className="space-y-2 p-3 bg-slate-50/80 dark:bg-slate-700/30 rounded-lg">
                    {service.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pricing Comparison Toggle */}
        {!isCompact && (service.contractorPrice || service.savingsPercentage) && (
          <div className="mb-4">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 mb-3"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="font-medium">
                {showComparison ? 'Hide' : 'Show'} Price Comparison
              </span>
            </button>
            
            {showComparison && (
              <PricingComparisonChart
                servicePrice={service.basePrice}
                contractorPrice={service.contractorPrice}
                savingsPercentage={service.savingsPercentage}
                animated={isHovered}
              />
            )}
          </div>
        )}

        {/* Popularity Indicator */}
        {service.popularity === 'high' && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-orange-50/90 dark:bg-orange-900/30 rounded-lg">
            <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm text-orange-700 dark:text-orange-300 font-medium">High Demand Service</span>
          </div>
        )}

        {/* Enhanced Action Buttons */}
        <div className={cn('flex gap-2', isCompact && 'flex-col')}>
          {onBook && (
            <Button 
              className={cn(
                'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg',
                'hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 active:scale-95 active:translate-y-0',
                'relative overflow-hidden group/button',
                isCompact ? 'w-full text-sm py-2' : 'flex-1'
              )}
              onClick={() => onBook(service.id)}
            >
              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/button:translate-x-full transition-transform duration-700" />
              <BookOpen className="h-4 w-4 mr-2 relative z-10" />
              <span className="relative z-10">Book Now</span>
            </Button>
          )}
          {onView && !isCompact && (
            <Button 
              variant="outline" 
              className={cn(
                'flex-1 border-2 border-white/30 dark:border-gray-600/30 bg-white/30 dark:bg-gray-700/30 hover:bg-white/50 dark:hover:bg-gray-600/50 transition-all duration-300',
                'hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20 dark:hover:shadow-blue-400/20 hover:-translate-y-1 transform active:scale-95 active:translate-y-0',
                'relative overflow-hidden group/button text-gray-900 dark:text-gray-100'
              )}
              onClick={() => onView(service.id)}
            >
              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent -translate-x-full group-hover/button:translate-x-full transition-transform duration-700" />
              <Eye className="h-4 w-4 mr-2 relative z-10" />
              <span className="relative z-10">View Details</span>
            </Button>
          )}
        </div>
      </CardContent>

      {/* Enhanced Glassmorphism Hover Overlay with Glow */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none'
      )} />
      
      {/* Animated Border Glow */}
      <div className={cn(
        'absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-700',
        'bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20',
        'animate-pulse blur-sm -z-10'
      )} />
      
      {/* Dynamic Shadow Enhancement */}
      <div className={cn(
        'absolute -inset-2 rounded-lg opacity-0 group-hover:opacity-30 transition-all duration-500',
        'bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-xl -z-20',
        isHovered && 'animate-pulse'
      )} />
    </Card>
  );
}