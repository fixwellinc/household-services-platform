/**
 * Memoization utilities for expensive computations
 */

import { useMemo, useCallback } from 'react';

// Memoized data processing functions
export const useMemoizedTableData = (data: any[], filters: any, sorting: any) => {
  return useMemo(() => {
    if (!data || data.length === 0) return [];

    let processedData = [...data];

    // Apply filters
    if (filters && Object.keys(filters).length > 0) {
      processedData = processedData.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
          if (!value || value === '') return true;
          
          if (Array.isArray(value)) {
            return value.length === 0 || value.includes(item[key]);
          }
          
          if (typeof value === 'string') {
            return item[key]?.toString().toLowerCase().includes(value.toLowerCase());
          }
          
          return item[key] === value;
        });
      });
    }

    // Apply sorting
    if (sorting?.field) {
      processedData.sort((a, b) => {
        const aValue = a[sorting.field];
        const bValue = b[sorting.field];
        
        if (aValue === bValue) return 0;
        
        const comparison = aValue < bValue ? -1 : 1;
        return sorting.direction === 'desc' ? -comparison : comparison;
      });
    }

    return processedData;
  }, [data, filters, sorting]);
};

// Memoized search results
export const useMemoizedSearchResults = (data: any[], searchQuery: string, searchFields: string[]) => {
  return useMemo(() => {
    if (!searchQuery || searchQuery.trim() === '') return data;
    
    const query = searchQuery.toLowerCase().trim();
    
    return data.filter(item => {
      return searchFields.some(field => {
        const value = item[field];
        if (value == null) return false;
        return value.toString().toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, searchFields]);
};

// Memoized analytics calculations
export const useMemoizedAnalytics = (data: any[]) => {
  return useMemo(() => {
    if (!data || data.length === 0) {
      return {
        total: 0,
        average: 0,
        growth: 0,
        trends: []
      };
    }

    const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
    const average = total / data.length;
    
    // Calculate growth rate
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, item) => sum + (item.value || 0), 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, item) => sum + (item.value || 0), 0) / secondHalf.length;
    
    const growth = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

    // Generate trend data
    const trends = data.map((item, index) => ({
      ...item,
      trend: index > 0 ? item.value - data[index - 1].value : 0
    }));

    return {
      total,
      average,
      growth,
      trends
    };
  }, [data]);
};

// Memoized permission checks
export const useMemoizedPermissions = (userPermissions: string[], requiredPermissions: string[]) => {
  return useMemo(() => {
    if (!userPermissions || !requiredPermissions) return false;
    
    return requiredPermissions.every(permission => 
      userPermissions.includes(permission) || userPermissions.includes('admin:all')
    );
  }, [userPermissions, requiredPermissions]);
};

// Debounced callback for search and filters
export const useDebouncedCallback = (callback: (...args: any[]) => void, delay: number) => {
  return useCallback(
    (...args: any[]) => {
      const timeoutId = setTimeout(() => callback(...args), delay);
      return () => clearTimeout(timeoutId);
    },
    [callback, delay]
  );
};

// Memoized chart data processing
export const useMemoizedChartData = (rawData: any[], chartType: string) => {
  return useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    switch (chartType) {
      case 'line':
      case 'area':
        return rawData.map((item, index) => ({
          ...item,
          x: item.date || item.timestamp || index,
          y: item.value || item.count || 0
        }));
      
      case 'bar':
      case 'column':
        return rawData.map(item => ({
          ...item,
          category: item.category || item.name || 'Unknown',
          value: item.value || item.count || 0
        }));
      
      case 'pie':
      case 'donut':
        const total = rawData.reduce((sum, item) => sum + (item.value || 0), 0);
        return rawData.map(item => ({
          ...item,
          name: item.name || item.category || 'Unknown',
          value: item.value || 0,
          percentage: total > 0 ? ((item.value || 0) / total) * 100 : 0
        }));
      
      default:
        return rawData;
    }
  }, [rawData, chartType]);
};

// Memoized bulk operation validation
export const useMemoizedBulkValidation = (selectedItems: any[], operation: string) => {
  return useMemo(() => {
    if (!selectedItems || selectedItems.length === 0) {
      return {
        isValid: false,
        errors: ['No items selected'],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for operation-specific validations
    switch (operation) {
      case 'delete':
        const protectedItems = selectedItems.filter(item => item.isProtected || item.isSystem);
        if (protectedItems.length > 0) {
          errors.push(`Cannot delete ${protectedItems.length} protected items`);
        }
        if (selectedItems.length > 100) {
          warnings.push('Deleting more than 100 items may take some time');
        }
        break;
      
      case 'export':
        if (selectedItems.length > 10000) {
          warnings.push('Large exports may take several minutes to complete');
        }
        break;
      
      case 'update':
        const readOnlyItems = selectedItems.filter(item => item.isReadOnly);
        if (readOnlyItems.length > 0) {
          errors.push(`Cannot update ${readOnlyItems.length} read-only items`);
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [selectedItems, operation]);
};