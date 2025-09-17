'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { Button } from '@/components/ui/shared';
import { 
  Home, 
  Wrench, 
  Zap, 
  Sparkle,
  Star,
  Shield,
  Clock,
  CheckCircle,
  Lock,
  ArrowUp,
  Filter,
  Search,
  Grid,
  List,
  DollarSign,
  Info
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  category: 'CLEANING' | 'MAINTENANCE' | 'REPAIR' | 'ORGANIZATION' | 'OTHER';
  complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
  basePrice: number;
  isActive: boolean;
}

interface ServiceAvailability {
  serviceId: string;
  service: Service;
  isIncluded: boolean;
  discountPercentage: number;
  requiresUpgrade: boolean;
  upgradeToTier?: 'STARTER' | 'HOMECARE' | 'PRIORITY';
  usageLimit?: number;
  currentUsage: number;
}

interface AvailableServicesProps {
  userTier: 'STARTER' | 'HOMECARE' | 'PRIORITY';
  services: ServiceAvailability[];
  onServiceRequest: (serviceId: string) => void;
  onUpgradePrompt: (requiredTier: string) => void;
  isLoading?: boolean;
}

const CATEGORY_ICONS = {
  CLEANING: Home,
  MAINTENANCE: Wrench,
  REPAIR: Zap,
  ORGANIZATION: Sparkle,
  OTHER: Star
};

const CATEGORY_COLORS = {
  CLEANING: 'from-blue-500 to-blue-600',
  MAINTENANCE: 'from-green-500 to-green-600',
  REPAIR: 'from-red-500 to-red-600',
  ORGANIZATION: 'from-purple-500 to-purple-600',
  OTHER: 'from-gray-500 to-gray-600'
};

const COMPLEXITY_COLORS = {
  SIMPLE: 'bg-green-100 text-green-800 border-green-200',
  MODERATE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  COMPLEX: 'bg-red-100 text-red-800 border-red-200'
};

const TIER_NAMES = {
  STARTER: 'Starter',
  HOMECARE: 'HomeCare',
  PRIORITY: 'Priority'
};

export default function AvailableServices({ 
  userTier, 
  services, 
  onServiceRequest, 
  onUpgradePrompt,
  isLoading = false 
}: AvailableServicesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showOnlyIncluded, setShowOnlyIncluded] = useState(false);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(services.map(s => s.service.category)));
    return ['ALL', ...cats];
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter(serviceAvailability => {
      const service = serviceAvailability.service;
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           service.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || service.category === selectedCategory;
      const matchesIncluded = !showOnlyIncluded || serviceAvailability.isIncluded;
      
      return matchesSearch && matchesCategory && matchesIncluded && service.isActive;
    });
  }, [services, searchTerm, selectedCategory, showOnlyIncluded]);

  const formatPrice = (price: number, discountPercentage: number = 0) => {
    const discountedPrice = price * (1 - discountPercentage / 100);
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(discountedPrice);
  };

  const renderServiceCard = (serviceAvailability: ServiceAvailability) => {
    const { service, isIncluded, discountPercentage, requiresUpgrade, upgradeToTier, usageLimit, currentUsage } = serviceAvailability;
    const IconComponent = CATEGORY_ICONS[service.category];
    const hasUsageLimit = usageLimit && usageLimit > 0;
    const usagePercentage = hasUsageLimit ? Math.min((currentUsage / usageLimit) * 100, 100) : 0;
    const canUseService = isIncluded && (!hasUsageLimit || currentUsage < usageLimit);

    return (
      <Card 
        key={service.id} 
        className={`transition-all duration-200 hover:shadow-lg ${
          canUseService ? 'border-green-200 bg-green-50/30' : 
          requiresUpgrade ? 'border-gray-200 bg-gray-50' : 'border-blue-200'
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className={`p-3 rounded-lg bg-gradient-to-r ${CATEGORY_COLORS[service.category]}`}>
              <IconComponent className="h-5 w-5 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                  {service.name}
                </CardTitle>
                
                {isIncluded && (
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                )}
                
                {requiresUpgrade && (
                  <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`text-xs px-2 py-1 ${COMPLEXITY_COLORS[service.complexity]}`}>
                  {service.complexity}
                </Badge>
                <Badge variant="outline" className="text-xs px-2 py-1">
                  {service.category}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <CardDescription className="text-sm text-gray-600 mb-4 line-clamp-2">
            {service.description}
          </CardDescription>

          {/* Pricing Information */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <div className="flex items-center gap-2">
                {discountPercentage > 0 ? (
                  <>
                    <span className="text-lg font-bold text-green-600">
                      {formatPrice(service.basePrice, discountPercentage)}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(service.basePrice)}
                    </span>
                    <Badge className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5">
                      {discountPercentage}% OFF
                    </Badge>
                  </>
                ) : (
                  <span className="text-lg font-bold text-gray-900">
                    {isIncluded ? 'Included' : formatPrice(service.basePrice)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Usage Tracking */}
          {hasUsageLimit && isIncluded && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-blue-900">Usage This Month</span>
                <span className="text-sm text-blue-700">
                  {currentUsage} of {usageLimit} used
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    usagePercentage >= 90 ? 'bg-red-500' :
                    usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Service Features */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-3 w-3 text-green-500" />
              <span>Professional Service</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-3 w-3 text-blue-500" />
              <span>Quick Response</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {canUseService ? (
              <Button 
                onClick={() => onServiceRequest(service.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Request Service
              </Button>
            ) : requiresUpgrade && upgradeToTier ? (
              <Button 
                onClick={() => onUpgradePrompt(upgradeToTier)}
                variant="outline"
                className="flex-1 border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <ArrowUp className="h-4 w-4 mr-2" />
                Upgrade to {TIER_NAMES[upgradeToTier]}
              </Button>
            ) : hasUsageLimit && currentUsage >= usageLimit ? (
              <Button 
                disabled
                variant="outline"
                className="flex-1"
              >
                Usage Limit Reached
              </Button>
            ) : (
              <Button 
                onClick={() => onServiceRequest(service.id)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Request Service
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-64"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Available Services</h3>
          <p className="text-sm text-gray-600 mt-1">
            Services available with your {TIER_NAMES[userTier]} plan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'ALL' ? 'All Categories' : category}
              </option>
            ))}
          </select>
          
          <Button
            variant={showOnlyIncluded ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowOnlyIncluded(!showOnlyIncluded)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Included Only
          </Button>
        </div>
      </div>

      {/* Services Grid/List */}
      {filteredServices.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Info className="h-12 w-12 text-gray-400" />
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Services Found</h4>
              <p className="text-gray-600">
                Try adjusting your search criteria or browse all available services.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('ALL');
                setShowOnlyIncluded(false);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredServices.map(renderServiceCard)}
        </div>
      )}

      {/* Summary Stats */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 text-sm">Service Summary</h4>
              <p className="text-xs text-gray-600 mt-1">
                {filteredServices.filter(s => s.isIncluded).length} included • {' '}
                {filteredServices.filter(s => s.discountPercentage > 0).length} discounted • {' '}
                {filteredServices.filter(s => s.requiresUpgrade).length} require upgrade
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {filteredServices.length}
              </div>
              <div className="text-xs text-gray-500">Available Services</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}