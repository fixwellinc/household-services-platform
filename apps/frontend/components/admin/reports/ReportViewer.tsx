"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Download,
  FileText,
  BarChart3,
  Table,
  PieChart,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  Share2,
  Bookmark,
  Calendar,
  Users,
  DollarSign,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ReportData {
  columns: ReportColumn[];
  rows: any[][];
  totalRows: number;
  generatedAt: Date;
  metadata: ReportMetadata;
}

interface ReportColumn {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  aggregation?: 'sum' | 'count' | 'avg' | 'min' | 'max';
}

interface ReportMetadata {
  reportId: string;
  reportName: string;
  description: string;
  dataSource: string;
  filters: any[];
  executionTime: number;
  cacheExpiry?: Date;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
  }[];
}

interface ReportViewerProps {
  reportData: ReportData;
  onExport?: (format: 'pdf' | 'csv' | 'excel') => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onRefresh?: () => void;
  onBack?: () => void;
  isLoading?: boolean;
}

export default function ReportViewer({
  reportData,
  onExport,
  onShare,
  onBookmark,
  onRefresh,
  onBack,
  isLoading = false
}: ReportViewerProps) {
  const [viewMode, setViewMode] = useState<'table' | 'chart' | 'summary'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = reportData.rows;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row =>
        row.some(cell => 
          cell?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortColumn) {
      const columnIndex = reportData.columns.findIndex(col => col.id === sortColumn);
      if (columnIndex !== -1) {
        filtered = [...filtered].sort((a, b) => {
          const aVal = a[columnIndex];
          const bVal = b[columnIndex];
          
          if (aVal === null || aVal === undefined) return 1;
          if (bVal === null || bVal === undefined) return -1;
          
          let comparison = 0;
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            comparison = aVal - bVal;
          } else {
            comparison = aVal.toString().localeCompare(bVal.toString());
          }
          
          return sortDirection === 'desc' ? -comparison : comparison;
        });
      }
    }

    return filtered;
  }, [reportData.rows, reportData.columns, searchTerm, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Generate chart data
  const chartData = useMemo((): ChartData | null => {
    if (reportData.columns.length < 2) return null;

    const labelColumn = reportData.columns[0];
    const valueColumns = reportData.columns.slice(1).filter(col => col.type === 'number');
    
    if (valueColumns.length === 0) return null;

    const labels = filteredData.map(row => row[0]?.toString() || 'Unknown').slice(0, 10);
    const datasets = valueColumns.map((col, index) => {
      const columnIndex = reportData.columns.findIndex(c => c.id === col.id);
      const data = filteredData.slice(0, 10).map(row => {
        const value = row[columnIndex];
        return typeof value === 'number' ? value : 0;
      });

      return {
        label: col.name,
        data,
        backgroundColor: [`hsl(${index * 60}, 70%, 50%)`],
        borderColor: `hsl(${index * 60}, 70%, 40%)`
      };
    });

    return { labels, datasets };
  }, [reportData.columns, filteredData]);

  // Generate summary statistics
  const summaryStats = useMemo(() => {
    const stats: { [key: string]: any } = {};
    
    reportData.columns.forEach((column, index) => {
      if (column.type === 'number') {
        const values = filteredData
          .map(row => row[index])
          .filter(val => typeof val === 'number' && !isNaN(val));
        
        if (values.length > 0) {
          stats[column.name] = {
            count: values.length,
            sum: values.reduce((a, b) => a + b, 0),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values)
          };
        }
      }
    });

    return stats;
  }, [reportData.columns, filteredData]);

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const formatCellValue = (value: any, column: ReportColumn) => {
    if (value === null || value === undefined) return '-';
    
    switch (column.type) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'date':
        return value instanceof Date ? value.toLocaleDateString() : 
               typeof value === 'string' ? new Date(value).toLocaleDateString() : value;
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return value.toString();
    }
  };

  const getSortIcon = (columnId: string) => {
    if (sortColumn !== columnId) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Generating report...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{reportData.metadata.reportName}</h2>
            <p className="text-gray-600 mt-1">{reportData.metadata.description}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>Generated: {reportData.generatedAt.toLocaleString()}</span>
              <span>•</span>
              <span>Rows: {reportData.totalRows.toLocaleString()}</span>
              <span>•</span>
              <span>Execution: {reportData.metadata.executionTime}ms</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
          {onBookmark && (
            <Button variant="outline" size="sm" onClick={onBookmark}>
              <Bookmark className="h-4 w-4 mr-2" />
              Bookmark
            </Button>
          )}
          {onShare && (
            <Button variant="outline" size="sm" onClick={onShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport?.('pdf')}>
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.('csv')}>
                <FileText className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.('excel')}>
                <FileText className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <TabsList>
            <TabsTrigger value="table" className="flex items-center space-x-2">
              <Table className="h-4 w-4" />
              <span>Table</span>
            </TabsTrigger>
            <TabsTrigger value="chart" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Chart</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Summary</span>
            </TabsTrigger>
          </TabsList>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select 
              value={pageSize.toString()} 
              onChange={(e) => setPageSize(parseInt(e.target.value))}
              className="w-32"
            >
              <option value="10">10 rows</option>
              <option value="25">25 rows</option>
              <option value="50">50 rows</option>
              <option value="100">100 rows</option>
            </Select>
          </div>
        </div>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {reportData.columns.map((column) => (
                        <th
                          key={column.id}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort(column.id)}
                        >
                          <div className="flex items-center space-x-1">
                            <span>{column.name}</span>
                            <span className="text-gray-400">{getSortIcon(column.id)}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-3 text-sm text-gray-900">
                            {formatCellValue(cell, reportData.columns[cellIndex])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="chart" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Chart View</span>
              </CardTitle>
              <CardDescription>
                Visual representation of your report data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData ? (
                <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Chart visualization would be rendered here</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Integration with charting library (Chart.js, Recharts, etc.) required
                    </p>
                    <div className="mt-4 text-xs text-gray-400">
                      <p>Data available: {chartData.labels.length} labels</p>
                      <p>Datasets: {chartData.datasets.length}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <PieChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No chartable data available</p>
                    <p className="text-sm text-gray-500">
                      Charts require at least one numeric column
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Data Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Data Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Rows:</span>
                  <span className="font-medium">{reportData.totalRows.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Filtered Rows:</span>
                  <span className="font-medium">{filteredData.length.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Columns:</span>
                  <span className="font-medium">{reportData.columns.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data Source:</span>
                  <Badge variant="outline">{reportData.metadata.dataSource}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Numeric Statistics */}
            {Object.keys(summaryStats).length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Numeric Statistics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Column</th>
                          <th className="text-right py-2">Count</th>
                          <th className="text-right py-2">Sum</th>
                          <th className="text-right py-2">Average</th>
                          <th className="text-right py-2">Min</th>
                          <th className="text-right py-2">Max</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(summaryStats).map(([column, stats]) => (
                          <tr key={column} className="border-b">
                            <td className="py-2 font-medium">{column}</td>
                            <td className="text-right py-2">{stats.count.toLocaleString()}</td>
                            <td className="text-right py-2">{stats.sum.toLocaleString()}</td>
                            <td className="text-right py-2">{stats.avg.toFixed(2)}</td>
                            <td className="text-right py-2">{stats.min.toLocaleString()}</td>
                            <td className="text-right py-2">{stats.max.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Applied Filters */}
            {reportData.metadata.filters.length > 0 && (
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Filter className="h-5 w-5" />
                    <span>Applied Filters</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {reportData.metadata.filters.map((filter, index) => (
                      <Badge key={index} variant="secondary">
                        {filter.field} {filter.operator} {filter.value}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}