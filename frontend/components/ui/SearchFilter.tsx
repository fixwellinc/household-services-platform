'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/shared';
import { Button } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { 
  Search, 
  Filter, 
  X, 
  SlidersHorizontal,
  Star,
  Clock,
  DollarSign
} from 'lucide-react';

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: FilterOptions) => void;
  categories?: string[];
  className?: string;
}

interface FilterOptions {
  category?: string;
  priceRange?: 'low' | 'medium' | 'high';
  complexity?: string;
  sortBy?: 'name' | 'price' | 'popularity';
}

export default function SearchFilter({ 
  onSearch, 
  onFilterChange, 
  categories = [],
  className = '' 
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({});

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...activeFilters, ...newFilters };
    setActiveFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const clearFilters = () => {
    setActiveFilters({});
    onFilterChange({});
  };

  const getActiveFilterCount = () => {
    return Object.keys(activeFilters).filter(key => activeFilters[key as keyof FilterOptions]).length;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search services..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearch('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {getActiveFilterCount() > 0 && (
            <Badge className="ml-2 bg-blue-600 text-white">
              {getActiveFilterCount()}
            </Badge>
          )}
        </Button>

        {getActiveFilterCount() > 0 && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="text-gray-500 hover:text-red-600 transition-colors"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {isFilterOpen && (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={activeFilters.category === category ? 'default' : 'outline'}
                  className={`cursor-pointer transition-all duration-200 ${
                    activeFilters.category === category
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'hover:bg-blue-50 hover:border-blue-300'
                  }`}
                  onClick={() => handleFilterChange({ 
                    category: activeFilters.category === category ? undefined : category 
                  })}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Price Range</h3>
            <div className="flex gap-2">
              {[
                { value: 'low', label: 'Under $50', icon: DollarSign },
                { value: 'medium', label: '$50 - $150', icon: DollarSign },
                { value: 'high', label: 'Over $150', icon: DollarSign }
              ].map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={activeFilters.priceRange === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange({ 
                    priceRange: activeFilters.priceRange === value ? undefined : value as any 
                  })}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Complexity */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Complexity</h3>
            <div className="flex gap-2">
              {[
                { value: 'EASY', label: 'Easy', color: 'bg-green-100 text-green-700' },
                { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
                { value: 'HARD', label: 'Hard', color: 'bg-red-100 text-red-700' }
              ].map(({ value, label, color }) => (
                <Badge
                  key={value}
                  variant="outline"
                  className={`cursor-pointer transition-all duration-200 ${
                    activeFilters.complexity === value ? color : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleFilterChange({ 
                    complexity: activeFilters.complexity === value ? undefined : value 
                  })}
                >
                  {label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Sort By</h3>
            <div className="flex gap-2">
              {[
                { value: 'name', label: 'Name', icon: Star },
                { value: 'price', label: 'Price', icon: DollarSign },
                { value: 'popularity', label: 'Popularity', icon: Clock }
              ].map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={activeFilters.sortBy === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange({ 
                    sortBy: activeFilters.sortBy === value ? undefined : value as any 
                  })}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 