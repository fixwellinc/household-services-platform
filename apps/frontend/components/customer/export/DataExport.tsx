/**
 * Data Export Component
 * 
 * Provides UI for exporting dashboard data in various formats
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Button } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileJson, 
  FileImage,
  Calendar,
  Filter,
  Settings,
  Loader2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import DataExportService from '@/lib/data-export-service';

interface ExportData {
  subscription?: any;
  usageAnalytics?: any[];
  serviceRequests?: any[];
  notifications?: any[];
}

interface DataExportProps {
  data: ExportData;
  className?: string;
  onExport?: (format: string, data: ExportData) => void;
}

const EXPORT_FORMATS = [
  { 
    value: 'csv', 
    label: 'CSV', 
    icon: FileSpreadsheet, 
    description: 'Comma-separated values for Excel',
    color: 'bg-green-100 text-green-800'
  },
  { 
    value: 'json', 
    label: 'JSON', 
    icon: FileJson, 
    description: 'Structured data format',
    color: 'bg-blue-100 text-blue-800'
  },
  { 
    value: 'pdf', 
    label: 'PDF', 
    icon: FileText, 
    description: 'Printable document format',
    color: 'bg-red-100 text-red-800'
  },
  { 
    value: 'excel', 
    label: 'Excel', 
    icon: FileSpreadsheet, 
    description: 'Microsoft Excel format',
    color: 'bg-green-100 text-green-800'
  },
];

const DATA_SECTIONS = [
  { 
    key: 'subscription', 
    label: 'Subscription Data', 
    icon: Settings,
    description: 'Current plan and billing information'
  },
  { 
    key: 'usageAnalytics', 
    label: 'Usage Analytics', 
    icon: FileText,
    description: 'Service usage and trends'
  },
  { 
    key: 'serviceRequests', 
    label: 'Service Requests', 
    icon: Calendar,
    description: 'Requested and completed services'
  },
  { 
    key: 'notifications', 
    label: 'Notifications', 
    icon: AlertTriangle,
    description: 'Account notifications and alerts'
  },
];

export function DataExport({ data, className = '', onExport }: DataExportProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>('json');
  const [selectedSections, setSelectedSections] = useState<string[]>(['subscription']);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0], // today
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus({ type: null, message: '' });

    try {
      // Filter data based on selected sections
      const filteredData: ExportData = {};
      selectedSections.forEach(section => {
        if (data[section as keyof ExportData]) {
          filteredData[section as keyof ExportData] = data[section as keyof ExportData];
        }
      });

      // Apply date range filter if applicable
      if (dateRange.start && dateRange.end) {
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        
        // Filter arrays by date
        Object.keys(filteredData).forEach(key => {
          const sectionData = filteredData[key as keyof ExportData];
          if (Array.isArray(sectionData)) {
            filteredData[key as keyof ExportData] = sectionData.filter((item: any) => {
              const itemDate = new Date(item.createdAt || item.date || item.requestedDate);
              return itemDate >= startDate && itemDate <= endDate;
            });
          }
        });
      }

      // Call export service
      DataExportService.exportDashboardData(filteredData, {
        format: selectedFormat as any,
        includeMetadata,
        dateRange: dateRange.start && dateRange.end ? {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end),
        } : undefined,
      });

      setExportStatus({ 
        type: 'success', 
        message: `Data exported successfully as ${selectedFormat.toUpperCase()}` 
      });

      // Call parent callback if provided
      if (onExport) {
        onExport(selectedFormat, filteredData);
      }

    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Export failed' 
      });
    } finally {
      setIsExporting(false);
    }
  };

  const toggleSection = (section: string) => {
    setSelectedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const selectAllSections = () => {
    const availableSections = DATA_SECTIONS
      .filter(section => data[section.key as keyof ExportData])
      .map(section => section.key);
    setSelectedSections(availableSections);
  };

  const clearAllSections = () => {
    setSelectedSections([]);
  };

  const getDataCount = (section: string) => {
    const sectionData = data[section as keyof ExportData];
    if (Array.isArray(sectionData)) {
      return sectionData.length;
    }
    return sectionData ? 1 : 0;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Data
        </CardTitle>
        <CardDescription>
          Export your dashboard data in various formats for analysis or backup
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Export Format Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Export Format</label>
          <div className="grid grid-cols-2 gap-3">
            {EXPORT_FORMATS.map((format) => {
              const IconComponent = format.icon;
              return (
                <button
                  key={format.value}
                  onClick={() => setSelectedFormat(format.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedFormat === format.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <IconComponent className="h-4 w-4" />
                    <span className="font-medium">{format.label}</span>
                  </div>
                  <p className="text-xs text-gray-600 text-left">{format.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Data Sections Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Data Sections</label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllSections}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllSections}
              >
                Clear All
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            {DATA_SECTIONS.map((section) => {
              const IconComponent = section.icon;
              const isSelected = selectedSections.includes(section.key);
              const hasData = !!data[section.key as keyof ExportData];
              const dataCount = getDataCount(section.key);

              return (
                <button
                  key={section.key}
                  onClick={() => hasData && toggleSection(section.key)}
                  disabled={!hasData}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : hasData
                      ? 'border-gray-200 hover:border-gray-300'
                      : 'border-gray-100 bg-gray-50 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      <span className="font-medium">{section.label}</span>
                      {hasData && (
                        <Badge variant="outline" className="text-xs">
                          {dataCount} {Array.isArray(data[section.key as keyof ExportData]) ? 'items' : 'item'}
                        </Badge>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{section.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Date Range (Optional)</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Export Options</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeMetadata}
                onChange={(e) => setIncludeMetadata(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Include metadata (export date, filters, etc.)</span>
            </label>
          </div>
        </div>

        {/* Export Status */}
        {exportStatus.type && (
          <div className={`p-3 rounded-lg border ${
            exportStatus.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {exportStatus.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{exportStatus.message}</span>
            </div>
          </div>
        )}

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={isExporting || selectedSections.length === 0}
          className="w-full"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export Data ({selectedFormat.toUpperCase()})
            </>
          )}
        </Button>

        {/* Export Summary */}
        {selectedSections.length > 0 && (
          <div className="text-sm text-gray-600 text-center">
            Exporting {selectedSections.length} section{selectedSections.length !== 1 ? 's' : ''} 
            {dateRange.start && dateRange.end && (
              <> from {new Date(dateRange.start).toLocaleDateString()} to {new Date(dateRange.end).toLocaleDateString()}</>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DataExport;
