/**
 * Advanced Service Filtering Component
 * 
 * Provides sophisticated filtering options for the services catalog
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { Button } from '@/components/ui/shared';
import { 
  Filter, 
  Search, 
  X, 
  SlidersHorizontal,
  Star,
  Clock,
  DollarSign,
  Zap,
  Shield,
  Calendar,
  MapPin,
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  category: 'CLEANING' | 'MAINTENANCE' | 'REPAIR' | 'ORGANIZATION' | 'OTHER';
  complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
  basePrice: number;
  isActive: boolean;
  rating?: number;
  estimatedDuration?: number;
  location?: string;
  maxParticipants?: number;
  features?: string[];
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

interface FilterOptions {
  searchTerm: string;
  categories: string[];
  complexity: string[];
  priceRange: [number, number];
  rating: number;
  duration: [number, number];
  location: string;
  features: string[];
  availability: 'all' | 'included' | 'discounted' | 'upgrade-required';
  sortBy: 'name' | 'price' | 'rating' | 'duration' | 'popularity';
  sortOrder: 'asc' | 'desc';
}

interface AdvancedServiceFilterProps {
  services: ServiceAvailability[];
  onFilteredServices: (services: ServiceAvailability[]) => void;
  className?: string;
}

const CATEGORY_OPTIONS = [
  { value: 'CLEANING', label: 'Cleaning', icon: '🧹' },
  { value: 'MAINTENANCE', label: 'Maintenance', icon: '🔧' },
  { value: 'REPAIR', label: 'Repair', icon: '⚡' },
  { value: 'ORGANIZATION', label: 'Organization', icon: '📦' },
  { value: 'OTHER', label: 'Other', icon: '⭐' },
];

const COMPLEXITY_OPTIONS = [
  { value: 'SIMPLE', label: 'Simple', color: 'bg-green-100 text-green-800' },
  { value: 'MODERATE', label: 'Moderate', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'COMPLEX', label: 'Complex', color: 'bg-red-100 text-red-800' },
];

const FEATURE_OPTIONS = [
  { value: 'eco-friendly', label: 'Eco-Friendly', icon: '🌱' },
  { value: 'same-day', label: 'Same Day', icon: '⚡' },
  { value: 'insured', label: 'Insured', icon: '🛡️' },
  { value: 'guaranteed', label: 'Guaranteed', icon: '✅' },
  { value: 'recurring', label: 'Recurring', icon: '🔄' },
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'price', label: 'Price' },
  { value: 'rating', label: 'Rating' },
  { value: 'duration', label: 'Duration' },
  { value: 'popularity', label: 'Popularity' },
];

export function AdvancedServiceFilter({ 
  services, 
  onFilteredServices, 
  className = '' 
}: AdvancedServiceFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    categories: [],
    complexity: [],
    priceRange: [0, 1000],
    rating: 0,
    duration: [0, 480], // 0 to 8 hours in minutes
    location: '',
    features: [],
    availability: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
  });

  // Get unique values for dynamic options
  const availableLocations = useMemo(() => {
    const locations = services
      .map(s => s.service.location)
      .filter(Boolean)
      .filter((location, index, self) => self.indexOf(location) === index);
    return locations;
  }, [services]);

  const availableFeatures = useMemo(() => {
    const features = services
      .flatMap(s => s.service.features || [])
      .filter((feature, index, self) => self.indexOf(feature) === index);
    return features;
  }, [services]);

  // Apply filters and sorting
  const filteredServices = useMemo(() => {
    let filtered = services.filter(serviceAvailability => {
      const service = serviceAvailability.service;
      
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          service.name.toLowerCase().includes(searchLower) ||
          service.description.toLowerCase().includes(searchLower) ||
          service.category.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(service.category)) {
        return false;
      }

      // Complexity filter
      if (filters.complexity.length > 0 && !filters.complexity.includes(service.complexity)) {
        return false;
      }

      // Price range filter
      const discountedPrice = service.basePrice * (1 - serviceAvailability.discountPercentage / 100);
      if (discountedPrice < filters.priceRange[0] || discountedPrice > filters.priceRange[1]) {
        return false;
      }

      // Rating filter
      if (service.rating && service.rating < filters.rating) {
        return false;
      }

      // Duration filter
      if (service.estimatedDuration && 
          (service.estimatedDuration < filters.duration[0] || 
           service.estimatedDuration > filters.duration[1])) {
        return false;
      }

      // Location filter
      if (filters.location && service.location !== filters.location) {
        return false;
      }

      // Features filter
      if (filters.features.length > 0) {
        const hasAllFeatures = filters.features.every(feature => 
          service.features?.includes(feature)
        );
        if (!hasAllFeatures) return false;
      }

      // Availability filter
      switch (filters.availability) {
        case 'included':
          if (!serviceAvailability.isIncluded) return false;
          break;
        case 'discounted':
          if (serviceAvailability.discountPercentage === 0) return false;
          break;
        case 'upgrade-required':
          if (!serviceAvailability.requiresUpgrade) return false;
          break;
      }

      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = a.service.name.localeCompare(b.service.name);
          break;
        case 'price':
          const priceA = a.service.basePrice * (1 - a.discountPercentage / 100);
          const priceB = b.service.basePrice * (1 - b.discountPercentage / 100);
          comparison = priceA - priceB;
          break;
        case 'rating':
          comparison = (a.service.rating || 0) - (b.service.rating || 0);
          break;
        case 'duration':
          comparison = (a.service.estimatedDuration || 0) - (b.service.estimatedDuration || 0);
          break;
        case 'popularity':
          // Mock popularity based on usage
          comparison = a.currentUsage - b.currentUsage;
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [services, filters]);

  // Update parent component when filtered services change
  React.useEffect(() => {
    onFilteredServices(filteredServices);
  }, [filteredServices, onFilteredServices]);

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      categories: [],
      complexity: [],
      priceRange: [0, 1000],
      rating: 0,
      duration: [0, 480],
      location: '',
      features: [],
      availability: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
    });
  };

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchTerm ||
      filters.categories.length > 0 ||
      filters.complexity.length > 0 ||
      filters.priceRange[0] > 0 ||
      filters.priceRange[1] < 1000 ||
      filters.rating > 0 ||
      filters.duration[0] > 0 ||
      filters.duration[1] < 480 ||
      filters.location ||
      filters.features.length > 0 ||
      filters.availability !== 'all'
    );
  }, [filters]);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" />
              Advanced Filters
            </CardTitle>
            <CardDescription>
              Refine your search with advanced filtering options
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Badge variant="outline" className="text-xs">
                {filteredServices.length} of {services.length} services
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Quick Filters */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Quick Filters</label>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'availability', value: 'included', label: 'Included Only', icon: '✅' },
              { key: 'availability', value: 'discounted', label: 'Discounted', icon: '💰' },
              { key: 'availability', value: 'upgrade-required', label: 'Upgrade Required', icon: '⬆️' },
            ].map((filter) => (
              <Button
                key={filter.value}
                variant={filters.availability === filter.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateFilter('availability', filter.value)}
              >
                <span className="mr-1">{filter.icon}</span>
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-6 border-t pt-6">
            {/* Categories */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Categories</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((category) => (
                  <Button
                    key={category.value}
                    variant={filters.categories.includes(category.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const newCategories = filters.categories.includes(category.value)
                        ? filters.categories.filter(c => c !== category.value)
                        : [...filters.categories, category.value];
                      updateFilter('categories', newCategories);
                    }}
                  >
                    <span className="mr-1">{category.icon}</span>
                    {category.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Complexity */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Complexity</label>
              <div className="flex flex-wrap gap-2">
                {COMPLEXITY_OPTIONS.map((complexity) => (
                  <Button
                    key={complexity.value}
                    variant={filters.complexity.includes(complexity.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const newComplexity = filters.complexity.includes(complexity.value)
                        ? filters.complexity.filter(c => c !== complexity.value)
                        : [...filters.complexity, complexity.value];
                      updateFilter('complexity', newComplexity);
                    }}
                  >
                    {complexity.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="10"
                  value={filters.priceRange[0]}
                  onChange={(e) => updateFilter('priceRange', [parseInt(e.target.value), filters.priceRange[1]])}
                  className="w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="10"
                  value={filters.priceRange[1]}
                  onChange={(e) => updateFilter('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
                  className="w-full"
                />
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Minimum Rating: {filters.rating} ⭐
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={filters.rating}
                onChange={(e) => updateFilter('rating', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Duration */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Duration: {Math.round(filters.duration[0] / 60)}h - {Math.round(filters.duration[1] / 60)}h
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="480"
                  step="30"
                  value={filters.duration[0]}
                  onChange={(e) => updateFilter('duration', [parseInt(e.target.value), filters.duration[1]])}
                  className="w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="480"
                  step="30"
                  value={filters.duration[1]}
                  onChange={(e) => updateFilter('duration', [filters.duration[0], parseInt(e.target.value)])}
                  className="w-full"
                />
              </div>
            </div>

            {/* Location */}
            {availableLocations.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Location</label>
                <select
                  value={filters.location}
                  onChange={(e) => updateFilter('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Locations</option>
                  {availableLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Features */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Features</label>
              <div className="flex flex-wrap gap-2">
                {FEATURE_OPTIONS.map((feature) => (
                  <Button
                    key={feature.value}
                    variant={filters.features.includes(feature.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const newFeatures = filters.features.includes(feature.value)
                        ? filters.features.filter(f => f !== feature.value)
                        : [...filters.features, feature.value];
                      updateFilter('features', newFeatures);
                    }}
                  >
                    <span className="mr-1">{feature.icon}</span>
                    {feature.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Sort By</label>
              <div className="flex gap-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilter('sortBy', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                <Button
                  variant="outline"
                  onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            {hasActiveFilters ? (
              <>
                Showing {filteredServices.length} of {services.length} services
              </>
            ) : (
              <>
                {services.length} services available
              </>
            )}
          </div>
          
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AdvancedServiceFilter;
