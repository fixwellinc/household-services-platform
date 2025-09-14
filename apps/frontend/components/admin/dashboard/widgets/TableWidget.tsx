"use client";

import React, { useState, useMemo } from 'react';
import { BaseWidget } from '../BaseWidget';
import { DashboardWidget, TableWidgetData } from '@/types/dashboard';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TableWidgetProps {
  widget: DashboardWidget;
  data?: TableWidgetData;
  isLoading?: boolean;
  error?: string;
  isEditing?: boolean;
  isSelected?: boolean;
  onUpdate?: (widget: DashboardWidget) => void;
  onDelete?: (widgetId: string) => void;
  onRefresh?: (widgetId: string) => void;
  onResize?: (widgetId: string, size: { width: number; height: number }) => void;
  onMove?: (widgetId: string, position: { x: number; y: number }) => void;
  onSelect?: (widgetId: string) => void;
}

type SortDirection = 'asc' | 'desc' | null;

export function TableWidget(props: TableWidgetProps) {
  const { widget, data, isLoading } = props;
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 10;

  const filteredAndSortedData = useMemo(() => {
    if (!data?.value.rows) return [];

    let filtered = data.value.rows;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        if (aValue === bValue) return 0;

        let comparison = 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else if (aValue instanceof Date && bValue instanceof Date) {
          comparison = aValue.getTime() - bValue.getTime();
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data?.value.rows, searchTerm, sortColumn, sortDirection]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedData, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const formatCellValue = (value: any, header: string) => {
    if (value === null || value === undefined) return '--';
    
    if (typeof value === 'number') {
      if (header.toLowerCase().includes('price') || header.toLowerCase().includes('amount')) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      }
      if (header.toLowerCase().includes('percent')) {
        return `${value.toFixed(1)}%`;
      }
      return value.toLocaleString();
    }
    
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    return String(value);
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return null;
    
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  };

  return (
    <BaseWidget {...props}>
      <div className="flex flex-col h-full">
        {/* Search Bar */}
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-7 pr-3 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-100 rounded mb-1"></div>
              ))}
            </div>
          ) : !data?.value.rows.length ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No data available
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  {data.value.headers.map((header) => (
                    <th
                      key={header}
                      className="text-left py-2 px-1 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort(header)}
                    >
                      <div className="flex items-center space-x-1">
                        <span className="truncate">{header}</span>
                        {getSortIcon(header)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, index) => (
                  <tr
                    key={index}
                    className={cn(
                      "border-b border-gray-100 hover:bg-gray-50",
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    )}
                  >
                    {data.value.headers.map((header) => (
                      <td key={header} className="py-2 px-1 text-gray-900">
                        <div className="truncate">
                          {formatCellValue(row[header], header)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} of{' '}
              {filteredAndSortedData.length} entries
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="h-6 px-2 text-xs"
              >
                Previous
              </Button>
              <span className="text-xs text-gray-500">
                {currentPage} of {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="h-6 px-2 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Total Count (if available) */}
        {data?.value.totalCount && data.value.totalCount > filteredAndSortedData.length && (
          <div className="text-xs text-gray-400 mt-1">
            Total records: {data.value.totalCount.toLocaleString()}
          </div>
        )}
      </div>
    </BaseWidget>
  );
}