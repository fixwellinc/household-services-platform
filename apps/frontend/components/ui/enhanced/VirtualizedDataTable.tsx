'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VirtualizedColumn {
  key: string;
  label: string;
  width: number;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: any, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface VirtualizedDataTableProps {
  title: string;
  data: any[];
  columns: VirtualizedColumn[];
  entityType: string;
  loading?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
  pageSize?: number;
  enableBulkOperations?: boolean;
  enableSearch?: boolean;
  enableFilters?: boolean;
  rowHeight?: number;
  maxHeight?: number;
  onRowClick?: (row: any, index: number) => void;
  selectedItems?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  className?: string;
}

interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    items: any[];
    columns: VirtualizedColumn[];
    selectedItems: string[];
    onSelectItem: (itemId: string, checked: boolean) => void;
    onRowClick?: (row: any, index: number) => void;
    enableBulkOperations: boolean;
  };
}

const VirtualizedRow: React.FC<RowProps> = ({ index, style, data }) => {
  const { items, columns, selectedItems, onSelectItem, onRowClick, enableBulkOperations } = data;
  const row = items[index];
  const isSelected = selectedItems.includes(row.id);

  const handleRowClick = useCallback(() => {
    if (onRowClick) {
      onRowClick(row, index);
    }
  }, [onRowClick, row, index]);

  const handleCheckboxChange = useCallback((checked: boolean) => {
    onSelectItem(row.id, checked);
  }, [onSelectItem, row.id]);

  return (
    <div
      style={style}
      className={cn(
        'flex items-center border-b border-gray-200 hover:bg-gray-50 transition-colors',
        isSelected && 'bg-blue-50',
        onRowClick && 'cursor-pointer'
      )}
      onClick={handleRowClick}
    >
      {enableBulkOperations && (
        <div className="flex items-center justify-center w-12 px-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleCheckboxChange}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      {columns.map((column) => (
        <div
          key={column.key}
          className={cn(
            'flex items-center px-4 py-2 text-sm truncate',
            column.align === 'center' && 'justify-center',
            column.align === 'right' && 'justify-end'
          )}
          style={{ width: column.width }}
          title={column.render ? undefined : String(row[column.key] || '')}
        >
          {column.render 
            ? column.render(row[column.key], row, index)
            : row[column.key]
          }
        </div>
      ))}
    </div>
  );
};

export function VirtualizedDataTable({
  title,
  data,
  columns,
  entityType,
  loading = false,
  onRefresh,
  onExport,
  pageSize = 50,
  enableBulkOperations = true,
  enableSearch = true,
  enableFilters = true,
  rowHeight = 60,
  maxHeight = 600,
  onRowClick,
  selectedItems: controlledSelectedItems,
  onSelectionChange,
  className
}: VirtualizedDataTableProps) {
  const [internalSelectedItems, setInternalSelectedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const listRef = useRef<List>(null);

  const selectedItems = controlledSelectedItems ?? internalSelectedItems;
  const setSelectedItems = onSelectionChange ?? setInternalSelectedItems;

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = data;

    if (searchQuery && enableSearch) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        columns.some(column => {
          const value = item[column.key];
          return value && String(value).toLowerCase().includes(query);
        })
      );
    }

    return filtered;
  }, [data, searchQuery, columns, enableSearch]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data for virtual scrolling
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0) + (enableBulkOperations ? 48 : 0);

  const handleSort = useCallback((key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') {
          return { key, direction: 'desc' };
        } else {
          return null;
        }
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedItems(paginatedData.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  }, [paginatedData, setSelectedItems]);

  const handleSelectItem = useCallback((itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  }, [setSelectedItems]);

  const isAllSelected = paginatedData.length > 0 && 
    paginatedData.every(item => selectedItems.includes(item.id));
  
  const isPartiallySelected = selectedItems.length > 0 && !isAllSelected;

  const getSortIcon = useCallback((columnKey: string) => {
    if (sortConfig?.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-blue-600" />
      : <ArrowDown className="h-4 w-4 text-blue-600" />;
  }, [sortConfig]);

  // Reset to first page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortConfig]);

  // Scroll to top when page changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(0);
    }
  }, [currentPage]);

  const rowData = useMemo(() => ({
    items: paginatedData,
    columns,
    selectedItems,
    onSelectItem: handleSelectItem,
    onRowClick,
    enableBulkOperations
  }), [paginatedData, columns, selectedItems, handleSelectItem, onRowClick, enableBulkOperations]);

  return (
    <div className={cn('space-y-4', className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {sortedData.length} items
              </Badge>
              {onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExport}
                  disabled={loading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                </Button>
              )}
            </div>
          </div>

          {enableSearch && (
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {enableFilters && (
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            {/* Header */}
            <div 
              className="bg-gray-50 border-b flex items-center"
              style={{ width: totalWidth }}
            >
              {enableBulkOperations && (
                <div className="flex items-center justify-center w-12 px-2 py-3">
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isPartiallySelected}
                    onCheckedChange={handleSelectAll}
                  />
                </div>
              )}
              {columns.map((column) => (
                <div
                  key={column.key}
                  className={cn(
                    'flex items-center px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200 last:border-r-0',
                    column.align === 'center' && 'justify-center',
                    column.align === 'right' && 'justify-end'
                  )}
                  style={{ width: column.width }}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                    >
                      {column.label}
                      {getSortIcon(column.key)}
                    </button>
                  ) : (
                    column.label
                  )}
                </div>
              ))}
            </div>

            {/* Virtual List */}
            <div style={{ width: totalWidth }}>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                  <span className="text-gray-500">Loading...</span>
                </div>
              ) : paginatedData.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <span className="text-gray-500">
                    {searchQuery ? 'No results found' : 'No data available'}
                  </span>
                </div>
              ) : (
                <List
                  ref={listRef}
                  height={Math.min(maxHeight, paginatedData.length * rowHeight)}
                  itemCount={paginatedData.length}
                  itemSize={rowHeight}
                  itemData={rowData}
                  width={totalWidth}
                >
                  {VirtualizedRow}
                </List>
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * pageSize) + 1} to{' '}
                {Math.min(currentPage * pageSize, sortedData.length)} of{' '}
                {sortedData.length} results
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className="text-sm px-2">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}