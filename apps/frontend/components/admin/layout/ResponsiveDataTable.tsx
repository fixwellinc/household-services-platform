"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  className?: string;
  render?: (value: any, row: any) => React.ReactNode;
  mobileHidden?: boolean; // Hide on mobile
  tabletHidden?: boolean; // Hide on tablet
}

export interface TableAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (row: any) => void;
  variant?: 'default' | 'destructive';
  disabled?: (row: any) => boolean;
}

export interface ResponsiveDataTableProps {
  columns: TableColumn[];
  data: any[];
  actions?: TableAction[];
  loading?: boolean;
  emptyMessage?: string;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  className?: string;
  mobileCardView?: boolean; // Enable card view on mobile
}

export function ResponsiveDataTable({
  columns,
  data,
  actions = [],
  loading = false,
  emptyMessage = 'No data available',
  onSort,
  sortColumn,
  sortDirection,
  className = '',
  mobileCardView = true
}: ResponsiveDataTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleSort = (column: TableColumn) => {
    if (!column.sortable || !onSort) return;
    
    const newDirection = 
      sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(column.key, newDirection);
  };

  const toggleRowExpansion = (rowId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  const getVisibleColumns = (breakpoint: 'mobile' | 'tablet' | 'desktop') => {
    return columns.filter(col => {
      if (breakpoint === 'mobile' && col.mobileHidden) return false;
      if (breakpoint === 'tablet' && col.tabletHidden) return false;
      return true;
    });
  };

  const getPrimaryColumns = () => {
    // Show first 2-3 most important columns on mobile
    return columns.filter(col => !col.mobileHidden).slice(0, 3);
  };

  const getSecondaryColumns = () => {
    // Remaining columns for expanded view
    return columns.filter(col => !col.mobileHidden).slice(3);
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Desktop skeleton */}
        <div className="hidden md:block">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex space-x-4">
                {columns.map((_, index) => (
                  <div key={index} className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
                ))}
              </div>
            </div>
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="px-6 py-4 border-b border-gray-200">
                <div className="flex space-x-4">
                  {columns.map((_, colIndex) => (
                    <div key={colIndex} className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile skeleton */}
        <div className="md:hidden space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table 
              className="min-w-full divide-y divide-gray-200" 
              role="table"
              aria-label="Data table"
            >
              <caption className="sr-only">
                Table with {data.length} rows and {columns.length} columns
              </caption>
              <thead className="bg-gray-50">
                <tr role="row">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        column.sortable ? 'cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset' : ''
                      } ${column.className || ''}`}
                      style={{ width: column.width }}
                      onClick={() => handleSort(column)}
                      onKeyDown={(e) => {
                        if (column.sortable && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          handleSort(column);
                        }
                      }}
                      tabIndex={column.sortable ? 0 : -1}
                      role="columnheader"
                      aria-sort={
                        column.sortable && sortColumn === column.key
                          ? sortDirection === 'asc' ? 'ascending' : 'descending'
                          : column.sortable ? 'none' : undefined
                      }
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.label}</span>
                        {column.sortable && (
                          <span className="text-gray-400" aria-hidden="true">
                            {sortColumn === column.key ? (
                              <span className="text-blue-600">
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            ) : (
                              '↕'
                            )}
                          </span>
                        )}
                      </div>
                      {column.sortable && (
                        <span className="sr-only">
                          {sortColumn === column.key
                            ? `Sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}`
                            : 'Not sorted'
                          }
                        </span>
                      )}
                    </th>
                  ))}
                  {actions.length > 0 && (
                    <th 
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      role="columnheader"
                    >
                      <span className="sr-only">Actions</span>
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row, rowIndex) => (
                  <tr 
                    key={row.id || rowIndex} 
                    className="hover:bg-gray-50 focus-within:bg-gray-50"
                    role="row"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${column.className || ''}`}
                        role="cell"
                      >
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </td>
                    ))}
                    {actions.length > 0 && (
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                        role="cell"
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              aria-label={`Actions for row ${rowIndex + 1}`}
                              className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open actions menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" role="menu">
                            {actions.map((action, actionIndex) => (
                              <DropdownMenuItem
                                key={actionIndex}
                                onClick={() => action.onClick(row)}
                                disabled={action.disabled?.(row)}
                                className={action.variant === 'destructive' ? 'text-red-600' : ''}
                                role="menuitem"
                              >
                                {action.icon && <action.icon className="h-4 w-4 mr-2" aria-hidden="true" />}
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      {mobileCardView && (
        <div className="md:hidden space-y-3" role="list" aria-label="Data items">
          {data.map((row, rowIndex) => {
            const rowId = row.id || rowIndex.toString();
            const isExpanded = expandedRows.has(rowId);
            const primaryColumns = getPrimaryColumns();
            const secondaryColumns = getSecondaryColumns();

            return (
              <Card 
                key={rowId} 
                className="overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                role="listitem"
                aria-label={`Item ${rowIndex + 1} of ${data.length}`}
              >
                <CardContent className="p-4">
                  {/* Primary content - always visible */}
                  <div className="space-y-2" role="group" aria-label="Primary information">
                    {primaryColumns.map((column) => (
                      <div key={column.key} className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600 min-w-0 flex-1" id={`${rowId}-${column.key}-label`}>
                          {column.label}:
                        </span>
                        <span 
                          className="text-sm text-gray-900 ml-2 text-right"
                          aria-labelledby={`${rowId}-${column.key}-label`}
                        >
                          {column.render ? column.render(row[column.key], row) : row[column.key]}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Secondary content - expandable */}
                  {secondaryColumns.length > 0 && (
                    <>
                      {isExpanded && (
                        <div 
                          className="mt-4 pt-4 border-t border-gray-200 space-y-2" 
                          role="group" 
                          aria-label="Additional information"
                          id={`${rowId}-expanded-content`}
                        >
                          {secondaryColumns.map((column) => (
                            <div key={column.key} className="flex justify-between items-start">
                              <span className="text-sm font-medium text-gray-600 min-w-0 flex-1" id={`${rowId}-${column.key}-label`}>
                                {column.label}:
                              </span>
                              <span 
                                className="text-sm text-gray-900 ml-2 text-right"
                                aria-labelledby={`${rowId}-${column.key}-label`}
                              >
                                {column.render ? column.render(row[column.key], row) : row[column.key]}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(rowId)}
                          className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          aria-expanded={isExpanded}
                          aria-controls={`${rowId}-expanded-content`}
                          aria-label={isExpanded ? 'Show less information' : 'Show more information'}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" aria-hidden="true" />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronRight className="h-4 w-4 mr-1" aria-hidden="true" />
                              Show More
                            </>
                          )}
                        </Button>

                        {/* Actions */}
                        {actions.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                aria-label={`Actions for item ${rowIndex + 1}`}
                                className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open actions menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" role="menu">
                              {actions.map((action, actionIndex) => (
                                <DropdownMenuItem
                                  key={actionIndex}
                                  onClick={() => action.onClick(row)}
                                  disabled={action.disabled?.(row)}
                                  className={action.variant === 'destructive' ? 'text-red-600' : ''}
                                  role="menuitem"
                                >
                                  {action.icon && <action.icon className="h-4 w-4 mr-2" aria-hidden="true" />}
                                  {action.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </>
                  )}

                  {/* Actions only (when no secondary columns) */}
                  {secondaryColumns.length === 0 && actions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            aria-label={`Actions for item ${rowIndex + 1}`}
                            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open actions menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" role="menu">
                          {actions.map((action, actionIndex) => (
                            <DropdownMenuItem
                              key={actionIndex}
                              onClick={() => action.onClick(row)}
                              disabled={action.disabled?.(row)}
                              className={action.variant === 'destructive' ? 'text-red-600' : ''}
                              role="menuitem"
                            >
                              {action.icon && <action.icon className="h-4 w-4 mr-2" aria-hidden="true" />}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}