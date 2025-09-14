import React, { useState, useCallback } from 'react';
import { Search, Filter, X, Settings, Download, RefreshCw } from 'lucide-react';
import { useAdminSearch } from '../../../hooks/use-admin-search';
import { FilterBuilder } from './FilterBuilder';
import { MultiSelectFilter } from './MultiSelectFilter';
import { SavedSearchesDropdown } from './SavedSearches';
import { SearchSuggestions } from './SearchSuggestions';
import { ShareableUrl, CompactShareableUrl } from './ShareableUrl';
import type { SearchConfig, FilterState, SearchResult } from '../../../types/admin';

interface SearchAndFilterProps {
  entity: string;
  onResultsChange?: (results: SearchResult[], totalCount: number) => void;
  onFiltersChange?: (filters: Record<string, any>) => void;
  showAdvancedFilters?: boolean;
  showSavedSearches?: boolean;
  showExport?: boolean;
  showUrlSharing?: boolean;
  useUrlState?: boolean;
  className?: string;
}

export function SearchAndFilter({
  entity,
  onResultsChange,
  onFiltersChange,
  showAdvancedFilters = true,
  showSavedSearches = true,
  showExport = true,
  showUrlSharing = true,
  useUrlState = true,
  className = ""
}: SearchAndFilterProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showQuickFilters, setShowQuickFilters] = useState(true);

  const {
    query,
    setQuery,
    filters,
    setFilters,
    filterState,
    setFilterState,
    results,
    isLoading,
    error,
    suggestions,
    searchConfig,
    isLoadingConfig,
    savedSearches,
    saveSearch,
    loadSavedSearch,
    deleteSavedSearch,
    search,
    clearSearch,
    refetch,
    shareableUrl,
    copyShareableUrl,
    resetToDefaults
  } = useAdminSearch({
    entity,
    autoSearch: true,
    debounceMs: 300,
    useUrlState
  });

  // Notify parent of results changes
  React.useEffect(() => {
    if (results && onResultsChange) {
      onResultsChange(results.results, results.totalCount);
    }
  }, [results, onResultsChange]);

  // Notify parent of filter changes
  React.useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  const handleQuickFilterChange = useCallback((field: string, values: string[]) => {
    const newFilters = { ...filters };

    if (values.length === 0) {
      delete newFilters[field];
    } else {
      newFilters[field] = {
        operator: values.length === 1 ? 'equals' : 'in',
        value: values.length === 1 ? values[0] : undefined,
        values: values.length > 1 ? values : undefined
      };
    }

    setFilters(newFilters);
  }, [filters, setFilters]);

  const handleExport = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        entity,
        format: 'csv',
        ...filterState.filters && { filters: JSON.stringify(filterState.filters) },
        ...filterState.query && { q: filterState.query }
      });

      const response = await fetch(`/api/admin/search/export?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entity}-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      // In a real app, show a toast notification
    }
  }, [entity, filterState]);

  const getQuickFilterFields = () => {
    if (!searchConfig) return [];

    return searchConfig.fields.filter(field =>
      field.filterable &&
      (field.type === 'select' || field.type === 'multiselect') &&
      field.options
    );
  };

  const activeFilterCount = Object.keys(filters).length;
  const hasQuery = query.trim().length > 0;
  const hasActiveFilters = activeFilterCount > 0 || hasQuery;

  if (isLoadingConfig) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  if (!searchConfig) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-sm text-gray-500">Search configuration not available for {entity}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="flex items-center space-x-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${entity}...`}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Filter Toggle */}
          {showAdvancedFilters && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                flex items-center px-3 py-2 text-sm border rounded-lg transition-colors
                ${showFilters || activeFilterCount > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}

          {/* Saved Searches */}
          {showSavedSearches && (
            <SavedSearchesDropdown
              savedSearches={savedSearches}
              onLoadSearch={loadSavedSearch}
            />
          )}

          {/* Export */}
          {showExport && (
            <button
              onClick={handleExport}
              disabled={!results || results.totalCount === 0}
              className="flex items-center px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          )}

          {/* URL Sharing */}
          {showUrlSharing && useUrlState && (
            <ShareableUrl
              url={shareableUrl}
              title={`${entity} Search Results`}
              description={`Search results for ${entity} with applied filters`}
            />
          )}

          {/* Refresh */}
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Suggestions */}
      {query.length >= 2 && suggestions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <SearchSuggestions
            suggestions={suggestions}
            onSuggestionClick={setQuery}
          />
        </div>
      )}

      {/* Quick Filters */}
      {showQuickFilters && getQuickFilterFields().length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Quick Filters:</span>
          {getQuickFilterFields().slice(0, 3).map(field => (
            <div key={field.key} className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">{field.label}:</label>
              <MultiSelectFilter
                options={field.options || []}
                selectedValues={
                  filters[field.key]?.values ||
                  (filters[field.key]?.value ? [filters[field.key].value] : [])
                }
                onSelectionChange={(values) => handleQuickFilterChange(field.key, values)}
                placeholder="Any"
                className="w-48"
                maxDisplayed={2}
              />
            </div>
          ))}
          {getQuickFilterFields().length > 3 && (
            <button
              onClick={() => setShowFilters(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              +{getQuickFilterFields().length - 3} more filters
            </button>
          )}
        </div>
      )}

      {/* Advanced Filters */}
      {showFilters && (
        <FilterBuilder
          fields={searchConfig.fields.filter(f => f.filterable)}
          initialFilters={filters}
          onFiltersChange={setFilters}
          savedSearches={savedSearches}
          onSaveSearch={saveSearch}
          onLoadSearch={loadSavedSearch}
          onDeleteSearch={deleteSavedSearch}
        />
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-blue-900">
              Active Filters:
            </span>
            <div className="flex flex-wrap gap-2">
              {hasQuery && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Query: "{query}"
                  <button
                    onClick={() => setQuery('')}
                    className="ml-1 hover:text-blue-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {Object.entries(filters).map(([field, filter]) => {
                const fieldConfig = searchConfig.fields.find(f => f.key === field);
                const displayValue = filter.values
                  ? filter.values.join(', ')
                  : filter.value;

                return (
                  <span
                    key={field}
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {fieldConfig?.label || field}: {displayValue}
                    <button
                      onClick={() => {
                        const newFilters = { ...filters };
                        delete newFilters[field];
                        setFilters(newFilters);
                      }}
                      className="ml-1 hover:text-blue-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Compact URL sharing */}
            {showUrlSharing && useUrlState && (
              <CompactShareableUrl url={shareableUrl} />
            )}

            <button
              onClick={clearSearch}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Results Summary */}
      {results && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            {isLoading ? (
              <span className="flex items-center">
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </span>
            ) : (
              <span>
                {results.totalCount.toLocaleString()} result{results.totalCount !== 1 ? 's' : ''} found
                {results.optimization?.executionTime && (
                  <span className="ml-2 text-gray-400">
                    ({results.optimization.executionTime}ms)
                  </span>
                )}
              </span>
            )}
          </div>
          {results.totalCount > 0 && (
            <div className="flex items-center space-x-4">
              <span>
                Page {results.pagination.page} of {results.pagination.totalPages}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <X className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-sm text-red-800">
              Search error: {error.message}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}