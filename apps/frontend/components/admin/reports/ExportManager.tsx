"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Download,
  FileText,
  File,
  Table,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye,
  Share2,
  Settings
} from 'lucide-react';

interface ExportJob {
  id: string;
  reportName: string;
  format: 'pdf' | 'csv' | 'excel';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  fileSize?: number;
  downloadUrl?: string;
  error?: string;
}

interface ExportOptions {
  format: 'pdf' | 'csv' | 'excel';
  includeHeaders: boolean;
  includeFilters: boolean;
  includeCharts: boolean;
  pageOrientation?: 'portrait' | 'landscape';
  dateFormat?: 'iso' | 'us' | 'eu';
  numberFormat?: 'default' | 'accounting';
  fileName?: string;
}

interface ExportManagerProps {
  reportId?: string;
  reportName?: string;
  onExport?: (options: ExportOptions) => void;
}

export default function ExportManager({ 
  reportId, 
  reportName = 'Report', 
  onExport 
}: ExportManagerProps) {
  const [activeTab, setActiveTab] = useState('export');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeHeaders: true,
    includeFilters: true,
    includeCharts: true,
    pageOrientation: 'portrait',
    dateFormat: 'iso',
    numberFormat: 'default',
    fileName: reportName
  });

  // Mock export history - in real implementation, this would come from API
  const exportHistory: ExportJob[] = [
    {
      id: '1',
      reportName: 'Monthly Revenue Report',
      format: 'pdf',
      status: 'completed',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000),
      fileSize: 2048576,
      downloadUrl: '/exports/monthly-revenue-2024-01.pdf'
    },
    {
      id: '2',
      reportName: 'Customer Analysis',
      format: 'excel',
      status: 'completed',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 45000),
      fileSize: 1536000,
      downloadUrl: '/exports/customer-analysis-2024-01.xlsx'
    },
    {
      id: '3',
      reportName: 'Service Operations',
      format: 'csv',
      status: 'processing',
      createdAt: new Date(Date.now() - 5 * 60 * 1000)
    },
    {
      id: '4',
      reportName: 'Marketing Campaign',
      format: 'pdf',
      status: 'failed',
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
      error: 'Data source temporarily unavailable'
    }
  ];

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-600" />;
      case 'excel':
        return <Table className="h-4 w-4 text-green-600" />;
      case 'csv':
        return <File className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleExport = () => {
    if (onExport) {
      onExport(exportOptions);
    }
  };

  const handleDownload = (job: ExportJob) => {
    if (job.downloadUrl) {
      // In real implementation, this would trigger file download
      console.log('Downloading:', job.downloadUrl);
    }
  };

  const handleDeleteExport = (jobId: string) => {
    // In real implementation, this would delete the export
    console.log('Deleting export:', jobId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Export Manager</h2>
          <p className="text-gray-600 mt-1">
            Export reports in various formats and manage export history
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="export">Export Report</TabsTrigger>
          <TabsTrigger value="history">Export History</TabsTrigger>
          <TabsTrigger value="settings">Export Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Export Options */}
            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>
                  Configure your export settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Export Format</Label>
                  <Select
                    value={exportOptions.format}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      format: e.target.value as 'pdf' | 'csv' | 'excel' 
                    }))}
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="excel">Excel Spreadsheet</option>
                    <option value="csv">CSV File</option>
                  </Select>
                </div>

                <div>
                  <Label>File Name</Label>
                  <Input
                    value={exportOptions.fileName}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      fileName: e.target.value 
                    }))}
                    placeholder="Enter file name"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Include Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-headers"
                        checked={exportOptions.includeHeaders}
                        onCheckedChange={(checked) => setExportOptions(prev => ({ 
                          ...prev, 
                          includeHeaders: checked as boolean 
                        }))}
                      />
                      <Label htmlFor="include-headers">Include column headers</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-filters"
                        checked={exportOptions.includeFilters}
                        onCheckedChange={(checked) => setExportOptions(prev => ({ 
                          ...prev, 
                          includeFilters: checked as boolean 
                        }))}
                      />
                      <Label htmlFor="include-filters">Include applied filters</Label>
                    </div>
                    {exportOptions.format === 'pdf' && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="include-charts"
                          checked={exportOptions.includeCharts}
                          onCheckedChange={(checked) => setExportOptions(prev => ({ 
                            ...prev, 
                            includeCharts: checked as boolean 
                          }))}
                        />
                        <Label htmlFor="include-charts">Include charts and visualizations</Label>
                      </div>
                    )}
                  </div>
                </div>

                {exportOptions.format === 'pdf' && (
                  <div>
                    <Label>Page Orientation</Label>
                    <Select
                      value={exportOptions.pageOrientation}
                      onChange={(e) => setExportOptions(prev => ({ 
                        ...prev, 
                        pageOrientation: e.target.value as 'portrait' | 'landscape' 
                      }))}
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>Date Format</Label>
                  <Select
                    value={exportOptions.dateFormat}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      dateFormat: e.target.value as 'iso' | 'us' | 'eu' 
                    }))}
                  >
                    <option value="iso">ISO (YYYY-MM-DD)</option>
                    <option value="us">US (MM/DD/YYYY)</option>
                    <option value="eu">EU (DD/MM/YYYY)</option>
                  </Select>
                </div>

                <div>
                  <Label>Number Format</Label>
                  <Select
                    value={exportOptions.numberFormat}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      numberFormat: e.target.value as 'default' | 'accounting' 
                    }))}
                  >
                    <option value="default">Default (1,234.56)</option>
                    <option value="accounting">Accounting ($1,234.56)</option>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Export Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Export Preview</CardTitle>
                <CardDescription>
                  Preview of your export configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    {getFormatIcon(exportOptions.format)}
                    <div>
                      <h3 className="font-medium">{exportOptions.fileName || 'Untitled Report'}</h3>
                      <p className="text-sm text-gray-600">
                        {exportOptions.format.toUpperCase()} format
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Headers:</span>
                      <span>{exportOptions.includeHeaders ? 'Included' : 'Excluded'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Filters:</span>
                      <span>{exportOptions.includeFilters ? 'Included' : 'Excluded'}</span>
                    </div>
                    {exportOptions.format === 'pdf' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Charts:</span>
                          <span>{exportOptions.includeCharts ? 'Included' : 'Excluded'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Orientation:</span>
                          <span className="capitalize">{exportOptions.pageOrientation}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date Format:</span>
                      <span className="uppercase">{exportOptions.dateFormat}</span>
                    </div>
                  </div>
                </div>

                <Button onClick={handleExport} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Start Export
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export History</CardTitle>
              <CardDescription>
                View and manage your recent exports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exportHistory.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getFormatIcon(job.format)}
                      <div>
                        <h3 className="font-medium">{job.reportName}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getStatusColor(job.status)}>
                            {job.status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {job.createdAt.toLocaleString()}
                          </span>
                          {job.fileSize && (
                            <span className="text-sm text-gray-500">
                              • {formatFileSize(job.fileSize)}
                            </span>
                          )}
                        </div>
                        {job.error && (
                          <p className="text-sm text-red-600 mt-1">{job.error}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {job.status === 'completed' && job.downloadUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(job)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExport(job.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Export Settings</span>
              </CardTitle>
              <CardDescription>
                Configure default export preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Export settings configuration</p>
                <p className="text-sm">Default preferences, retention policies, etc.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}