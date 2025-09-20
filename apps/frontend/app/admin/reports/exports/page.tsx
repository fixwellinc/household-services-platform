"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Database,
  Filter,
  Eye,
  Settings,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface ExportEntity {
  name: string;
  description: string;
  fields: Record<string, {
    label: string;
    type: string;
    sensitive: boolean;
  }>;
}

interface ExportJob {
  id: string;
  entity: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileName?: string;
  recordCount?: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export default function ExportsPage() {
  const { toast } = useToast();
  const [entities, setEntities] = useState<Record<string, ExportEntity>>({});
  const [selectedEntity, setSelectedEntity] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [anonymize, setAnonymize] = useState(false);
  const [limit, setLimit] = useState('10000');
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);

  // Load available entities on component mount
  useEffect(() => {
    loadEntities();
    loadExportHistory();
  }, []);

  const loadEntities = async () => {
    try {
      const response = await fetch('/api/admin/exports/entities', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEntities(data.entities);
        
        // Set default entity
        const entityKeys = Object.keys(data.entities);
        if (entityKeys.length > 0) {
          setSelectedEntity(entityKeys[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load entities:', error);
      toast({
        title: "Error",
        description: "Failed to load export entities",
        variant: "destructive"
      });
    }
  };

  const loadExportHistory = () => {
    // Mock export history - in real implementation, load from API
    const mockJobs: ExportJob[] = [
      {
        id: '1',
        entity: 'users',
        format: 'csv',
        status: 'completed',
        fileName: 'users_export_2024-01-15.csv',
        recordCount: 1250,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000)
      },
      {
        id: '2',
        entity: 'subscriptions',
        format: 'excel',
        status: 'processing',
        createdAt: new Date(Date.now() - 5 * 60 * 1000)
      }
    ];
    setExportJobs(mockJobs);
  };

  const handleFieldToggle = (fieldName: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldName)
        ? prev.filter(f => f !== fieldName)
        : [...prev, fieldName]
    );
  };

  const handleSelectAllFields = () => {
    if (!entities[selectedEntity]) return;
    
    const allFields = Object.keys(entities[selectedEntity].fields);
    setSelectedFields(
      selectedFields.length === allFields.length ? [] : allFields
    );
  };

  const handlePreview = async () => {
    if (!selectedEntity) return;

    setIsPreviewLoading(true);
    try {
      const response = await fetch('/api/admin/exports/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          entity: selectedEntity,
          fields: selectedFields,
          filters,
          limit: 5
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewData(data.preview);
      } else {
        throw new Error('Preview failed');
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: "Preview Error",
        description: "Failed to generate preview",
        variant: "destructive"
      });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedEntity || !selectedFormat) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/exports/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          entity: selectedEntity,
          format: selectedFormat,
          fields: selectedFields,
          filters,
          limit: parseInt(limit),
          anonymize
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Export Started",
          description: `Export created successfully. ${data.export.recordCount} records exported.`
        });

        // Add to export history
        const newJob: ExportJob = {
          id: Date.now().toString(),
          entity: selectedEntity,
          format: selectedFormat,
          status: 'completed',
          fileName: data.export.fileName,
          recordCount: data.export.recordCount,
          createdAt: new Date(),
          completedAt: new Date()
        };
        setExportJobs(prev => [newJob, ...prev]);

        // Trigger download
        if (data.export.fileName) {
          handleDownload(data.export.fileName);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Error",
        description: error instanceof Error ? error.message : "Export failed",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (fileName: string) => {
    try {
      const response = await fetch(`/api/admin/exports/download/${fileName}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Error",
        description: "Failed to download export file",
        variant: "destructive"
      });
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'csv':
        return <FileText className="h-4 w-4" />;
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'json':
        return <Database className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const currentEntity = entities[selectedEntity];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Export</h1>
          <p className="text-gray-600 mt-1">
            Export system data in various formats with customizable field selection
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Configuration</CardTitle>
              <CardDescription>
                Configure your data export settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Entity Selection */}
              <div className="space-y-2">
                <Label htmlFor="entity">Data Entity</Label>
                <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(entities).map(([key, entity]) => (
                      <SelectItem key={key} value={key}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentEntity && (
                  <p className="text-sm text-gray-600">{currentEntity.description}</p>
                )}
              </div>

              {/* Format Selection */}
              <div className="space-y-2">
                <Label htmlFor="format">Export Format</Label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>CSV</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="excel">
                      <div className="flex items-center space-x-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        <span>Excel</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="json">
                      <div className="flex items-center space-x-2">
                        <Database className="h-4 w-4" />
                        <span>JSON</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Field Selection */}
              {currentEntity && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Fields to Export</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllFields}
                    >
                      {selectedFields.length === Object.keys(currentEntity.fields).length
                        ? 'Deselect All'
                        : 'Select All'}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded-md p-3">
                    {Object.entries(currentEntity.fields).map(([fieldName, field]) => (
                      <div key={fieldName} className="flex items-center space-x-2">
                        <Checkbox
                          id={fieldName}
                          checked={selectedFields.includes(fieldName)}
                          onCheckedChange={() => handleFieldToggle(fieldName)}
                        />
                        <Label
                          htmlFor={fieldName}
                          className="text-sm flex items-center space-x-1"
                        >
                          <span>{field.label}</span>
                          {field.sensitive && (
                            <Shield className="h-3 w-3 text-orange-500" />
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">
                    {selectedFields.length} of {Object.keys(currentEntity.fields).length} fields selected
                  </p>
                </div>
              )}

              {/* Export Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anonymize"
                    checked={anonymize}
                    onCheckedChange={setAnonymize}
                  />
                  <Label htmlFor="anonymize" className="flex items-center space-x-1">
                    <Shield className="h-4 w-4 text-orange-500" />
                    <span>Anonymize sensitive data</span>
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="limit">Record Limit</Label>
                  <Input
                    id="limit"
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    max="50000"
                    min="1"
                  />
                  <p className="text-xs text-gray-600">Maximum 50,000 records</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  onClick={handlePreview}
                  variant="outline"
                  disabled={!selectedEntity || isPreviewLoading}
                >
                  {isPreviewLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  Preview
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={!selectedEntity || !selectedFormat || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {previewData && (
            <Card>
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
                <CardDescription>
                  Preview of {previewData.recordCount} records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {previewData.fields.map((field: string) => (
                          <th key={field} className="text-left p-2 font-medium">
                            {currentEntity?.fields[field]?.label || field}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.data.map((row: any, index: number) => (
                        <tr key={index} className="border-b">
                          {previewData.fields.map((field: string) => (
                            <td key={field} className="p-2">
                              {typeof row[field] === 'object'
                                ? JSON.stringify(row[field])
                                : String(row[field] || '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Export History */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Exports</CardTitle>
              <CardDescription>
                Your recent export history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {exportJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <div className="flex items-center space-x-2">
                          {getFormatIcon(job.format)}
                          <span className="font-medium text-sm">
                            {entities[job.entity]?.name || job.entity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {job.recordCount && `${job.recordCount} records • `}
                          {job.createdAt.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {job.status === 'completed' && job.fileName && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(job.fileName!)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {exportJobs.length === 0 && (
                  <p className="text-sm text-gray-600 text-center py-4">
                    No exports yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Export Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <Shield className="h-4 w-4 text-orange-500 mt-0.5" />
                <div>
                  <p className="font-medium">Sensitive Data</p>
                  <p className="text-gray-600">
                    Fields marked with shield icon contain sensitive information
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Settings className="h-4 w-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium">Anonymization</p>
                  <p className="text-gray-600">
                    Enable to mask sensitive data in exports
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Clock className="h-4 w-4 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">File Retention</p>
                  <p className="text-gray-600">
                    Export files are kept for 24 hours
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}