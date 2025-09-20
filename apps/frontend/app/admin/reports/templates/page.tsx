"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Download,
  Calendar,
  Clock,
  Settings,
  Play,
  Eye,
  Filter,
  BarChart3,
  Users,
  DollarSign,
  Shield,
  Loader2
} from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters: Record<string, any>;
  format: string;
  schedule: string | null;
}

interface ReportParameter {
  type: string;
  required?: boolean;
  default?: any;
  options?: string[];
}

export default function ReportTemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/reports/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast({
        title: "Error",
        description: "Failed to load report templates",
        variant: "destructive"
      });
    }
  };

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    
    // Initialize parameters with defaults
    const defaultParams: Record<string, any> = {};
    Object.entries(template.parameters).forEach(([key, config]: [string, any]) => {
      defaultParams[key] = config.default || '';
    });
    setParameters(defaultParams);
    setPreviewData(null);
  };

  const handleParameterChange = (paramName: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const handlePreview = async () => {
    if (!selectedTemplate) return;

    setIsPreviewLoading(true);
    try {
      const response = await fetch('/api/admin/reports/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          parameters
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

  const handleGenerateReport = async (format?: string) => {
    if (!selectedTemplate) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          parameters,
          format: format || selectedTemplate.format
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Report Generated",
          description: `Report generated successfully. ${data.report.recordCount} records exported.`
        });

        // Trigger download
        if (data.report.fileName) {
          handleDownload(data.report.fileName);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Report generation failed');
      }
    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: "Generation Error",
        description: error instanceof Error ? error.message : "Report generation failed",
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
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Error",
        description: "Failed to download report file",
        variant: "destructive"
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'users':
        return <Users className="h-4 w-4" />;
      case 'subscriptions':
        return <BarChart3 className="h-4 w-4" />;
      case 'finance':
        return <DollarSign className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const renderParameterInput = (paramName: string, paramConfig: ReportParameter) => {
    const value = parameters[paramName] || '';

    switch (paramConfig.type) {
      case 'select':
        return (
          <Select value={value} onValueChange={(val) => handleParameterChange(paramName, val)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${paramName}`} />
            </SelectTrigger>
            <SelectContent>
              {paramConfig.options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'dateRange':
        return (
          <Select value={value} onValueChange={(val) => handleParameterChange(paramName, val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last7days">Last 7 days</SelectItem>
              <SelectItem value="last30days">Last 30 days</SelectItem>
              <SelectItem value="thisMonth">This month</SelectItem>
              <SelectItem value="lastMonth">Last month</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={paramName}
              checked={value}
              onCheckedChange={(checked) => handleParameterChange(paramName, checked)}
            />
            <Label htmlFor={paramName}>Enable</Label>
          </div>
        );

      case 'text':
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleParameterChange(paramName, e.target.value)}
            placeholder={`Enter ${paramName}`}
          />
        );
    }
  };

  const filteredTemplates = templates.filter(template => 
    selectedCategory === 'all' || template.category === selectedCategory
  );

  const categories = [...new Set(templates.map(t => t.category))];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Report Templates</h1>
          <p className="text-gray-600 mt-1">
            Generate reports using pre-built templates with customizable parameters
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Selection */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Templates</CardTitle>
              <CardDescription>
                Select a report template to configure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Template List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="flex items-start space-x-3">
                      {getCategoryIcon(template.category)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {template.format.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Template Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTemplate ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {getCategoryIcon(selectedTemplate.category)}
                    <span>{selectedTemplate.name}</span>
                  </CardTitle>
                  <CardDescription>
                    {selectedTemplate.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Parameters */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Report Parameters</h4>
                    {Object.entries(selectedTemplate.parameters).map(([paramName, paramConfig]: [string, any]) => (
                      <div key={paramName} className="space-y-2">
                        <Label htmlFor={paramName}>
                          {paramName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          {paramConfig.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {renderParameterInput(paramName, paramConfig)}
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <Button
                      onClick={handlePreview}
                      variant="outline"
                      disabled={isPreviewLoading}
                    >
                      {isPreviewLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4 mr-2" />
                      )}
                      Preview
                    </Button>
                    <Button
                      onClick={() => handleGenerateReport()}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Generate Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Preview */}
              {previewData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Report Preview</CardTitle>
                    <CardDescription>
                      Preview of {previewData.recordCount} records from {previewData.templateName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            {previewData.fields.map((field: string) => (
                              <th key={field} className="text-left p-2 font-medium">
                                {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
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
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a Report Template
                  </h3>
                  <p className="text-gray-600">
                    Choose a template from the list to configure and generate reports
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}