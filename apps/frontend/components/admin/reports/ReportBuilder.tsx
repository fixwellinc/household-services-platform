"use client";

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Database,
  Plus,
  Trash2,
  GripVertical,
  Filter,
  BarChart3,
  Table,
  Calendar,
  Users,
  DollarSign,
  FileText,
  Settings,
  Eye,
  Save,
  Play
} from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  table: string;
  description: string;
  fields: DataField[];
}

interface DataField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  displayName: string;
  description?: string;
}

interface ReportFilter {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: string | string[];
  dataType: 'string' | 'number' | 'date' | 'boolean';
}

interface ReportColumn {
  id: string;
  field: string;
  displayName: string;
  aggregation?: 'sum' | 'count' | 'avg' | 'min' | 'max';
  sortOrder?: 'asc' | 'desc';
  width?: number;
}

interface ReportConfig {
  name: string;
  description: string;
  dataSource: string;
  columns: ReportColumn[];
  filters: ReportFilter[];
  groupBy: string[];
  sortBy: { field: string; direction: 'asc' | 'desc' }[];
  limit?: number;
}

interface ReportBuilderProps {
  initialConfig?: Partial<ReportConfig>;
  onSave?: (config: ReportConfig) => void;
  onPreview?: (config: ReportConfig) => void;
  onCancel?: () => void;
}

export default function ReportBuilder({ 
  initialConfig, 
  onSave, 
  onPreview, 
  onCancel 
}: ReportBuilderProps) {
  const [config, setConfig] = useState<ReportConfig>({
    name: initialConfig?.name || '',
    description: initialConfig?.description || '',
    dataSource: initialConfig?.dataSource || '',
    columns: initialConfig?.columns || [],
    filters: initialConfig?.filters || [],
    groupBy: initialConfig?.groupBy || [],
    sortBy: initialConfig?.sortBy || [],
    limit: initialConfig?.limit
  });

  const [activeTab, setActiveTab] = useState('datasource');

  // Mock data sources - in real implementation, this would come from API
  const dataSources: DataSource[] = [
    {
      id: 'users',
      name: 'Users',
      table: 'users',
      description: 'User account information and profiles',
      fields: [
        { id: 'id', name: 'id', type: 'string', displayName: 'User ID' },
        { id: 'email', name: 'email', type: 'string', displayName: 'Email Address' },
        { id: 'name', name: 'name', type: 'string', displayName: 'Full Name' },
        { id: 'created_at', name: 'created_at', type: 'date', displayName: 'Registration Date' },
        { id: 'status', name: 'status', type: 'string', displayName: 'Account Status' },
        { id: 'subscription_tier', name: 'subscription_tier', type: 'string', displayName: 'Subscription Tier' }
      ]
    },
    {
      id: 'subscriptions',
      name: 'Subscriptions',
      table: 'subscriptions',
      description: 'Subscription plans and billing information',
      fields: [
        { id: 'id', name: 'id', type: 'string', displayName: 'Subscription ID' },
        { id: 'user_id', name: 'user_id', type: 'string', displayName: 'User ID' },
        { id: 'plan_name', name: 'plan_name', type: 'string', displayName: 'Plan Name' },
        { id: 'amount', name: 'amount', type: 'number', displayName: 'Amount' },
        { id: 'status', name: 'status', type: 'string', displayName: 'Status' },
        { id: 'created_at', name: 'created_at', type: 'date', displayName: 'Start Date' },
        { id: 'expires_at', name: 'expires_at', type: 'date', displayName: 'Expiry Date' }
      ]
    },
    {
      id: 'payments',
      name: 'Payments',
      table: 'payments',
      description: 'Payment transactions and billing history',
      fields: [
        { id: 'id', name: 'id', type: 'string', displayName: 'Payment ID' },
        { id: 'user_id', name: 'user_id', type: 'string', displayName: 'User ID' },
        { id: 'amount', name: 'amount', type: 'number', displayName: 'Amount' },
        { id: 'currency', name: 'currency', type: 'string', displayName: 'Currency' },
        { id: 'status', name: 'status', type: 'string', displayName: 'Payment Status' },
        { id: 'created_at', name: 'created_at', type: 'date', displayName: 'Payment Date' },
        { id: 'method', name: 'method', type: 'string', displayName: 'Payment Method' }
      ]
    },
    {
      id: 'appointments',
      name: 'Appointments',
      table: 'appointments',
      description: 'Service appointments and scheduling data',
      fields: [
        { id: 'id', name: 'id', type: 'string', displayName: 'Appointment ID' },
        { id: 'user_id', name: 'user_id', type: 'string', displayName: 'Customer ID' },
        { id: 'service_type', name: 'service_type', type: 'string', displayName: 'Service Type' },
        { id: 'status', name: 'status', type: 'string', displayName: 'Status' },
        { id: 'scheduled_at', name: 'scheduled_at', type: 'date', displayName: 'Scheduled Date' },
        { id: 'completed_at', name: 'completed_at', type: 'date', displayName: 'Completion Date' },
        { id: 'rating', name: 'rating', type: 'number', displayName: 'Customer Rating' }
      ]
    }
  ];

  const selectedDataSource = dataSources.find(ds => ds.id === config.dataSource);

  const addColumn = useCallback(() => {
    if (!selectedDataSource || selectedDataSource.fields.length === 0) return;
    
    const newColumn: ReportColumn = {
      id: `col_${Date.now()}`,
      field: selectedDataSource.fields[0].id,
      displayName: selectedDataSource.fields[0].displayName
    };
    
    setConfig(prev => ({
      ...prev,
      columns: [...prev.columns, newColumn]
    }));
  }, [selectedDataSource]);

  const updateColumn = useCallback((columnId: string, updates: Partial<ReportColumn>) => {
    setConfig(prev => ({
      ...prev,
      columns: prev.columns.map(col => 
        col.id === columnId ? { ...col, ...updates } : col
      )
    }));
  }, []);

  const removeColumn = useCallback((columnId: string) => {
    setConfig(prev => ({
      ...prev,
      columns: prev.columns.filter(col => col.id !== columnId)
    }));
  }, []);

  const addFilter = useCallback(() => {
    if (!selectedDataSource || selectedDataSource.fields.length === 0) return;
    
    const field = selectedDataSource.fields[0];
    const newFilter: ReportFilter = {
      id: `filter_${Date.now()}`,
      field: field.id,
      operator: 'equals',
      value: '',
      dataType: field.type
    };
    
    setConfig(prev => ({
      ...prev,
      filters: [...prev.filters, newFilter]
    }));
  }, [selectedDataSource]);

  const updateFilter = useCallback((filterId: string, updates: Partial<ReportFilter>) => {
    setConfig(prev => ({
      ...prev,
      filters: prev.filters.map(filter => 
        filter.id === filterId ? { ...filter, ...updates } : filter
      )
    }));
  }, []);

  const removeFilter = useCallback((filterId: string) => {
    setConfig(prev => ({
      ...prev,
      filters: prev.filters.filter(filter => filter.id !== filterId)
    }));
  }, []);

  const getFieldDisplayName = (fieldId: string) => {
    const field = selectedDataSource?.fields.find(f => f.id === fieldId);
    return field?.displayName || fieldId;
  };

  const getOperatorOptions = (dataType: string) => {
    const baseOptions = [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not Equals' }
    ];

    if (dataType === 'string') {
      return [...baseOptions, { value: 'contains', label: 'Contains' }];
    }

    if (dataType === 'number' || dataType === 'date') {
      return [
        ...baseOptions,
        { value: 'greater_than', label: 'Greater Than' },
        { value: 'less_than', label: 'Less Than' },
        { value: 'between', label: 'Between' }
      ];
    }

    return baseOptions;
  };

  const handleSave = () => {
    if (onSave) {
      onSave(config);
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(config);
    }
  };

  const isConfigValid = config.name && config.dataSource && config.columns.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Report Builder</h2>
          <p className="text-gray-600 mt-1">
            Create custom reports with drag-and-drop interface
          </p>
        </div>
        <div className="flex space-x-3">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button variant="outline" onClick={handlePreview} disabled={!isConfigValid}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={!isConfigValid}>
            <Save className="h-4 w-4 mr-2" />
            Save Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="datasource">Data Source</TabsTrigger>
          <TabsTrigger value="columns">Columns</TabsTrigger>
          <TabsTrigger value="filters">Filters</TabsTrigger>
          <TabsTrigger value="grouping">Grouping</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Report Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="report-name">Report Name</Label>
                <Input
                  id="report-name"
                  value={config.name}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter report name"
                />
              </div>
              <div>
                <Label htmlFor="report-description">Description</Label>
                <Textarea
                  id="report-description"
                  value={config.description}
                  onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter report description"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="datasource" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Select Data Source</span>
              </CardTitle>
              <CardDescription>
                Choose the primary data source for your report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dataSources.map((source) => (
                  <Card 
                    key={source.id} 
                    className={`cursor-pointer transition-colors ${
                      config.dataSource === source.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setConfig(prev => ({ 
                      ...prev, 
                      dataSource: source.id,
                      columns: [], // Reset columns when changing data source
                      filters: []  // Reset filters when changing data source
                    }))}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {source.id === 'users' && <Users className="h-5 w-5 text-blue-600" />}
                          {source.id === 'subscriptions' && <FileText className="h-5 w-5 text-blue-600" />}
                          {source.id === 'payments' && <DollarSign className="h-5 w-5 text-blue-600" />}
                          {source.id === 'appointments' && <Calendar className="h-5 w-5 text-blue-600" />}
                        </div>
                        <div>
                          <h3 className="font-medium">{source.name}</h3>
                          <p className="text-sm text-gray-600">{source.description}</p>
                          <Badge variant="outline" className="mt-1">
                            {source.fields.length} fields
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="columns" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Table className="h-5 w-5" />
                    <span>Report Columns</span>
                  </CardTitle>
                  <CardDescription>
                    Select and configure the columns for your report
                  </CardDescription>
                </div>
                <Button onClick={addColumn} disabled={!selectedDataSource}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Column
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {config.columns.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Table className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No columns added yet</p>
                  <p className="text-sm">Click "Add Column" to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {config.columns.map((column, index) => (
                    <Card key={column.id} className="p-4">
                      <div className="flex items-center space-x-4">
                        <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label>Field</Label>
                            <Select
                              value={column.field}
                              onChange={(e) => {
                                const field = selectedDataSource?.fields.find(f => f.id === e.target.value);
                                updateColumn(column.id, { 
                                  field: e.target.value, 
                                  displayName: field?.displayName || e.target.value 
                                });
                              }}
                            >
                              {selectedDataSource?.fields.map((field) => (
                                <option key={field.id} value={field.id}>
                                  {field.displayName}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div>
                            <Label>Display Name</Label>
                            <Input
                              value={column.displayName}
                              onChange={(e) => updateColumn(column.id, { displayName: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Aggregation</Label>
                            <Select
                              value={column.aggregation || 'none'}
                              onChange={(e) => updateColumn(column.id, { 
                                aggregation: e.target.value === 'none' ? undefined : e.target.value as any 
                              })}
                            >
                              <option value="none">None</option>
                              <option value="count">Count</option>
                              <option value="sum">Sum</option>
                              <option value="avg">Average</option>
                              <option value="min">Minimum</option>
                              <option value="max">Maximum</option>
                            </Select>
                          </div>
                          <div>
                            <Label>Sort</Label>
                            <Select
                              value={column.sortOrder || 'none'}
                              onChange={(e) => updateColumn(column.id, { 
                                sortOrder: e.target.value === 'none' ? undefined : e.target.value as any 
                              })}
                            >
                              <option value="none">None</option>
                              <option value="asc">Ascending</option>
                              <option value="desc">Descending</option>
                            </Select>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeColumn(column.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filters" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Filter className="h-5 w-5" />
                    <span>Report Filters</span>
                  </CardTitle>
                  <CardDescription>
                    Add filters to narrow down your report data
                  </CardDescription>
                </div>
                <Button onClick={addFilter} disabled={!selectedDataSource}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {config.filters.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Filter className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No filters added yet</p>
                  <p className="text-sm">Click "Add Filter" to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {config.filters.map((filter) => (
                    <Card key={filter.id} className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label>Field</Label>
                            <Select
                              value={filter.field}
                              onChange={(e) => {
                                const field = selectedDataSource?.fields.find(f => f.id === e.target.value);
                                updateFilter(filter.id, { 
                                  field: e.target.value, 
                                  dataType: field?.type || 'string' 
                                });
                              }}
                            >
                              {selectedDataSource?.fields.map((field) => (
                                <option key={field.id} value={field.id}>
                                  {field.displayName}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div>
                            <Label>Operator</Label>
                            <Select
                              value={filter.operator}
                              onChange={(e) => updateFilter(filter.id, { operator: e.target.value as any })}
                            >
                              {getOperatorOptions(filter.dataType).map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div className="md:col-span-2">
                            <Label>Value</Label>
                            <Input
                              value={Array.isArray(filter.value) ? filter.value.join(', ') : filter.value}
                              onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                              placeholder={filter.dataType === 'date' ? 'YYYY-MM-DD' : 'Enter value'}
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFilter(filter.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grouping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Grouping & Sorting</span>
              </CardTitle>
              <CardDescription>
                Configure how your data should be grouped and sorted
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Group By Fields</Label>
                <div className="mt-2 space-y-2">
                  {selectedDataSource?.fields.map((field) => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`group-${field.id}`}
                        checked={config.groupBy.includes(field.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setConfig(prev => ({
                              ...prev,
                              groupBy: [...prev.groupBy, field.id]
                            }));
                          } else {
                            setConfig(prev => ({
                              ...prev,
                              groupBy: prev.groupBy.filter(id => id !== field.id)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={`group-${field.id}`}>{field.displayName}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Result Limit</Label>
                <Input
                  type="number"
                  value={config.limit || ''}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    limit: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  placeholder="Leave empty for no limit"
                  min="1"
                  max="10000"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Report Settings</span>
              </CardTitle>
              <CardDescription>
                Configure additional report settings and options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8 text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Additional settings will be available here</p>
                <p className="text-sm">Export format, scheduling, permissions, etc.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}