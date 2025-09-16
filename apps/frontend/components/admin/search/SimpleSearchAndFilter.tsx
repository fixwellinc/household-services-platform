"use client";

import React, { useState, useCallback } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

interface SimpleSearchAndFilterProps {
  entity: string;
  onFiltersChange?: (filters: Record<string, any>) => void;
  className?: string;
}

export function SimpleSearchAndFilter({
  entity,
  onFiltersChange,
  className = ""
}: SimpleSearchAndFilterProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    const newFilters = { ...filters };
    if (value.trim()) {
      newFilters.search = value.trim();
    } else {
      delete newFilters.search;
    }
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [filters, onFiltersChange]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    const newFilters = { ...filters };
    if (value && value !== 'all') {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [filters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    setQuery('');
    setFilters({});
    onFiltersChange?.({});
  }, [onFiltersChange]);

  const activeFilterCount = Object.keys(filters).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="flex items-center space-x-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={`Search ${entity}...`}
            className="pl-10 pr-10"
          />
          {query && (
            <button
              onClick={() => handleQueryChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>

        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={activeFilterCount > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {entity === 'users' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <Select
                    value={filters.role || 'all'}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="ADMIN">Admin</option>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="CUSTOMER">Customer</option>
                    <option value="SUSPENDED">Suspended</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <Select
                    value={filters.dateRange || 'all'}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                  </Select>
                </div>
              </>
            )}

            {entity === 'subscriptions' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tier
                  </label>
                  <Select
                    value={filters.tier || 'all'}
                    onChange={(e) => handleFilterChange('tier', e.target.value)}
                  >
                    <option value="all">All Tiers</option>
                    <option value="PRIORITY">Priority</option>
                    <option value="HOMECARE">Home Care</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <Select
                    value={filters.status || 'all'}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="CANCELLED">Cancelled</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Frequency
                  </label>
                  <Select
                    value={filters.paymentFrequency || 'all'}
                    onChange={(e) => handleFilterChange('paymentFrequency', e.target.value)}
                  >
                    <option value="all">All Frequencies</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </Select>
                </div>
              </>
            )}
          </div>

          {activeFilterCount > 0 && (
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}