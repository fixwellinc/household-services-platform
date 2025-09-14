'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BulkOperationsToolbar } from './BulkOperationsToolbar';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface EnhancedDataTableProps {
  title: string;
  data: any[];
  columns: Column[];
  entityType: string;
  loading?: boolean;
  onRefresh?: () => void;
  pageSize?: number;
  enableBulkOperations?: boolean;
}

export function EnhancedDataTable({
  title,
  data,
  columns,
  entityType,
  loading = false,
  onRefresh,
  pageSize = 10,
  enableBulkOperations = true
}: EnhancedDataTableProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
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
  }, [data, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') {
          return { key, direction: 'desc' };
        } else {
          return null; // Remove sorting
        }
      }
      return { key, direction: 'asc' };
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(paginatedData.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const isAllSelected = paginatedData.length > 0 && 
    paginatedData.every(item => selectedItems.includes(item.id));
  
  const isPartiallySelected = selectedItems.length > 0 && !isAllSelected;

  const getSortIcon = (columnKey: string) => {
    if (sortConfig?.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-blue-600" />
      : <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  const handleOperationComplete = () => {
    setSelectedItems([]);
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {sortedData.length} items
              </Badge>
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading}
                >
                  Refresh
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {enableBulkOperations && (
            <div className="mb-4">
              <BulkOperationsToolbar
                selectedItems={selectedItems}
                entityType={entityType}
                onSelectionChange={setSelectedItems}
                onOperationComplete={handleOperationComplete}
              />
            </div>
          )}

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {enableBulkOperations && (
                      <th className="w-12 px-4 py-3">
                        <Checkbox
                          checked={isAllSelected}
                          indeterminate={isPartiallySelected}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                    )}
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className="px-4 py-3 text-left text-sm font-medium text-gray-900"
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
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td 
                        colSpan={columns.length + (enableBulkOperations ? 1 : 0)}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : paginatedData.length === 0 ? (
                    <tr>
                      <td 
                        colSpan={columns.length + (enableBulkOperations ? 1 : 0)}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No data available
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((row) => (
                      <tr 
                        key={row.id}
                        className={`hover:bg-gray-50 ${
                          selectedItems.includes(row.id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        {enableBulkOperations && (
                          <td className="px-4 py-3">
                            <Checkbox
                              checked={selectedItems.includes(row.id)}
                              onCheckedChange={(checked) => 
                                handleSelectItem(row.id, checked as boolean)
                              }
                            />
                          </td>
                        )}
                        {columns.map((column) => (
                          <td key={column.key} className="px-4 py-3 text-sm">
                            {column.render 
                              ? column.render(row[column.key], row)
                              : row[column.key]
                            }
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
                
                <span className="text-sm">
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