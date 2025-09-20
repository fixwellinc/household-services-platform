/**
 * Performance-optimized data table with virtualization and memoization
 */

'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { BulkOperationsToolbar } from './BulkOperationsToolbar';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter
} from 'lucide-react';
import { useMemoizedTableData, useMemoizedSearchResults } from '@/lib/performance/memoization';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
  render?: (value: any, row: any) => React.ReactNode;
}

interface OptimizedDataTableProps {
  title: string;
  data: any[];
  columns: Column[];
  entityType: string;
  loading?: boolean;
  onRefresh?: () => void;
  pageSize?: number;
  enableBulkOperations?: boolean;
  enableVirtualization?: boolean;
  enableSearch?: boolean;
  searchFields?: string[];
  height?: number;
}

// Memoized table row component for better performance
const TableRow = memo(({ 
  index, 
  style, 
  data: { items, columns, selectedItems, onToggleSelect, onRowClick } 
}: any) => {
  const item = items[index];
  const isSelected = selectedItems.includes(item.id);

  return (
    <div 
      style={style} 
      className={`flex items-center border-b hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
      onClick={() => onRowClick?.(item)}
    >
      <div className="w-12 flex justify-center">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(item.id)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      {columns.map((column: Column) => (
        <div 
          key={column.key} 
          className="flex-1 px-4 py-3 text-sm"
          style={{ width: column.width || 'auto' }}
        >
          {column.render 
            ? column.render(item[column.key], item)
            : item[column.key]
          }
        </div>
      ))}
    </div>
  );
});

TableRow.displayName = 'TableRow';

// Memoized table header component
const TableHeader = memo(({ 
  columns, 
  sortConfig, 
  onSort, 
  selectedItems, 
  totalItems, 
  onToggleSelectAll 
}: any) => {
  const allSelected = selectedItems.length === totalItems && totalItems > 0;
  const someSelected = selectedItems.length > 0 && selectedItems.length < totalItems;

  return (
    <div className="flex items-center border-b bg-gray-50 font-medium">
      <div className="w-12 flex justify-center">
        <Checkbox
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected;
          }}
          onCheckedChange={onToggleSelectAll}
        />
      </div>
      {columns.map((column: Column) => (
        <div 
          key={column.key} 
          className="flex-1 px-4 py-3 text-sm font-medium"
          style={{ width: column.width || 'auto' }}
        >
          <div className="flex items-center gap-2">
            {column.label}
            {column.sortable && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onSort(column.key)}
              >
                {sortConfig?.key === column.key ? (
                  sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                ) : (
                  <ArrowUpDown className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

TableHeader.displayName = 'TableHeader';

export function OptimizedDataTable({
  title,
  data,
  columns,
  entityType,
  loading = false,
  onRefresh,
  pageSize = 50,
  enableBulkOperations = true,
  enableVirtualization = true,
  enableSearch = true,
  searchFields = [],
  height = 600
}: OptimizedDataTableProps) {
  const { trackInteraction } = usePerformanceMonitoring('OptimizedDataTable');
  
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Memoized search results
  const searchResults = useMemoizedSearchResults(data, searchQuery, searchFields);
  
  // Memoized filtered and sorted data
  const processedData = useMemoizedTableData(searchResults, filters, sortConfig);

  // Pagination calculations
  const totalPages = Math.ceil(processedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPageData = useMemo(() => 
    processedData.slice(startIndex, endIndex), 
    [processedData, startIndex, endIndex]
  );

  // Event handlers with performance tracking
  const handleSort = useCallback((key: string) => {
    const startTime = performance.now();
    
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    
    trackInteraction('sort', startTime);
  }, [trackInteraction]);

  const handleSearch = useCallback((query: string) => {
    const startTime = performance.now();
    
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on search
    
    trackInteraction('search', startTime);
  }, [trackInteraction]);

  const handleToggleSelect = useCallback((itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
    trackInteraction('select_item');
  }, [trackInteraction]);

  const handleToggleSelectAll = useCallback(() => {
    const startTime = performance.now();
    
    setSelectedItems(prev => 
      prev.length === currentPageData.length 
        ? [] 
        : currentPageData.map(item => item.id)
    );
    
    trackInteraction('select_all', startTime);
  }, [currentPageData, trackInteraction]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setSelectedItems([]); // Clear selection on page change
    trackInteraction('page_change');
  }, [trackInteraction]);

  const handleRowClick = useCallback((item: any) => {
    trackInteraction('row_click');
    // Add row click handler logic here
  }, [trackInteraction]);

  // Virtualized list item data
  const listItemData = useMemo(() => ({
    items: enableVirtualization ? processedData : currentPageData,
    columns,
    selectedItems,
    onToggleSelect: handleToggleSelect,
    onRowClick: handleRowClick
  }), [
    enableVirtualization, 
    processedData, 
    currentPageData, 
    columns, 
    selectedItems, 
    handleToggleSelect, 
    handleRowClick
  ]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {processedData.length} items
            </Badge>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                Refresh
              </Button>
            )}
          </div>
        </div>
        
        {/* Search and Filter Controls */}
        {enableSearch && (
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Bulk Operations Toolbar */}
        {enableBulkOperations && selectedItems.length > 0 && (
          <div className="p-4 border-b">
            <BulkOperationsToolbar
              selectedItems={selectedItems}
              entityType={entityType}
              onClearSelection={() => setSelectedItems([])}
            />
          </div>
        )}

        {/* Table Header */}
        <TableHeader
          columns={columns}
          sortConfig={sortConfig}
          onSort={handleSort}
          selectedItems={selectedItems}
          totalItems={currentPageData.length}
          onToggleSelectAll={handleToggleSelectAll}
        />

        {/* Table Body */}
        <div className="relative">
          {enableVirtualization ? (
            <List
              height={height}
              itemCount={processedData.length}
              itemSize={60}
              itemData={listItemData}
            >
              {TableRow}
            </List>
          ) : (
            <div style={{ height: Math.min(height, currentPageData.length * 60) }}>
              {currentPageData.map((item, index) => (
                <TableRow
                  key={item.id}
                  index={index}
                  style={{ height: 60 }}
                  data={listItemData}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!enableVirtualization && totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-gray-500">
              Showing {startIndex + 1} to {Math.min(endIndex, processedData.length)} of {processedData.length} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}