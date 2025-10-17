"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Search,
  Plus,
  MoreHorizontal,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Edit,
  Trash2,
  Copy,
  Share2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Report {
  id: string;
  name: string;
  description: string;
  type: 'pre-built' | 'custom';
  category: 'financial' | 'operational' | 'customer' | 'marketing';
  lastGenerated?: Date;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    enabled: boolean;
  };
  format: 'pdf' | 'csv' | 'excel';
  status: 'ready' | 'generating' | 'scheduled' | 'failed';
  createdBy: string;
  createdAt: Date;
  isPublic: boolean;
}

interface ReportsOverviewProps {
  onCreateReport?: () => void;
  onEditReport?: (reportId: string) => void;
  onViewReport?: (reportId: string) => void;
}

export default function ReportsOverview({ 
  onCreateReport, 
  onEditReport, 
  onViewReport 
}: ReportsOverviewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('lastGenerated');

  // Mock data - in real implementation, this would come from API
  const reports: Report[] = [
    {
      id: '1',
      name: 'Monthly Revenue Report',
      description: 'Comprehensive revenue analysis with trends and forecasts',
      type: 'pre-built',
      category: 'financial',
      lastGenerated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      schedule: {
        frequency: 'monthly',
        time: '09:00',
        enabled: true
      },
      format: 'pdf',
      status: 'ready',
      createdBy: 'System',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      isPublic: true
    },
    {
      id: '2',
      name: 'Customer Satisfaction Analysis',
      description: 'Customer feedback analysis and satisfaction metrics',
      type: 'custom',
      category: 'customer',
      lastGenerated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      schedule: {
        frequency: 'weekly',
        time: '08:00',
        enabled: true
      },
      format: 'excel',
      status: 'ready',
      createdBy: 'John Doe',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      isPublic: false
    },
    {
      id: '3',
      name: 'Service Operations Dashboard',
      description: 'Operational metrics including service requests and completion rates',
      type: 'pre-built',
      category: 'operational',
      lastGenerated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      schedule: {
        frequency: 'daily',
        time: '07:00',
        enabled: true
      },
      format: 'csv',
      status: 'generating',
      createdBy: 'System',
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      isPublic: true
    },
    {
      id: '4',
      name: 'Marketing Campaign Performance',
      description: 'Email campaign metrics and conversion analysis',
      type: 'custom',
      category: 'marketing',
      lastGenerated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      format: 'pdf',
      status: 'scheduled',
      createdBy: 'Jane Smith',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      isPublic: false
    },
    {
      id: '5',
      name: 'Failed Payment Analysis',
      description: 'Analysis of failed payments and recovery strategies',
      type: 'custom',
      category: 'financial',
      format: 'excel',
      status: 'failed',
      createdBy: 'Admin User',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      isPublic: false
    }
  ];

  const getStatusIcon = (status: Report['status']) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'generating':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'generating':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    const matchesType = selectedType === 'all' || report.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesType && matchesStatus;
  });

  const sortedReports = [...filteredReports].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'lastGenerated':
        if (!a.lastGenerated && !b.lastGenerated) return 0;
        if (!a.lastGenerated) return 1;
        if (!b.lastGenerated) return -1;
        return b.lastGenerated.getTime() - a.lastGenerated.getTime();
      case 'createdAt':
        return b.createdAt.getTime() - a.createdAt.getTime();
      default:
        return 0;
    }
  });

  const handleToggleSchedule = (reportId: string) => {
    // Implementation for toggling report schedule
    console.log('Toggle schedule for report:', reportId);
  };

  const handleDuplicateReport = (reportId: string) => {
    // Implementation for duplicating report
    console.log('Duplicate report:', reportId);
  };

  const handleDeleteReport = (reportId: string) => {
    // Implementation for deleting report
    console.log('Delete report:', reportId);
  };

  const handleShareReport = (reportId: string) => {
    // Implementation for sharing report
    console.log('Share report:', reportId);
  };

  const handleGenerateReport = (reportId: string) => {
    // Implementation for generating report
    console.log('Generate report:', reportId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports Overview</h2>
          <p className="text-gray-600 mt-1">
            Manage and generate business reports and analytics
          </p>
        </div>
        <Button onClick={onCreateReport} className="w-fit">
          <Plus className="h-4 w-4 mr-2" />
          Create Report
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Filter row - responsive */}
        <div className="grid grid-cols-2 gap-2 lg:flex lg:gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 w-full lg:w-48"
            >
              <option value="all">All Categories</option>
              <option value="financial">Financial</option>
              <option value="operational">Operational</option>
              <option value="customer">Customer</option>
              <option value="marketing">Marketing</option>
            </Select>
          </div>

          <Select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full lg:w-48"
          >
            <option value="all">All Types</option>
            <option value="pre-built">Pre-built</option>
            <option value="custom">Custom</option>
          </Select>

          <Select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full lg:w-48"
          >
            <option value="all">All Status</option>
            <option value="ready">Ready</option>
            <option value="generating">Generating</option>
            <option value="scheduled">Scheduled</option>
            <option value="failed">Failed</option>
          </Select>

          <Select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full lg:w-48"
          >
            <option value="lastGenerated">Last Generated</option>
            <option value="name">Name</option>
            <option value="createdAt">Created Date</option>
          </Select>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {sortedReports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(report.status)}
                  <div>
                    <CardTitle className="text-lg">{report.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {report.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(report.status)}>
                    {report.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewReport?.(report.id)}>
                        <FileText className="h-4 w-4 mr-2" />
                        View Report
                      </DropdownMenuItem>
                      {report.type === 'custom' && (
                        <DropdownMenuItem onClick={() => onEditReport?.(report.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Report
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDuplicateReport(report.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShareReport(report.id)}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {report.schedule && (
                        <DropdownMenuItem onClick={() => handleToggleSchedule(report.id)}>
                          {report.schedule.enabled ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Disable Schedule
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Enable Schedule
                            </>
                          )}
                        </DropdownMenuItem>
                      )}
                      {report.type === 'custom' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteReport(report.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Mobile-first responsive layout */}
              <div className="space-y-4">
                {/* Report details grid - responsive */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Type</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {report.type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Category</p>
                    <p className="font-medium mt-1 capitalize text-sm">{report.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Format</p>
                    <p className="font-medium mt-1 uppercase text-sm">{report.format}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-xs text-gray-600">Schedule</p>
                    <p className="font-medium mt-1 text-sm">
                      {report.schedule ? (
                        <span className={report.schedule.enabled ? 'text-green-600' : 'text-gray-500'}>
                          {report.schedule.frequency} at {report.schedule.time}
                        </span>
                      ) : (
                        'Manual'
                      )}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-3 lg:col-span-1">
                    <p className="text-xs text-gray-600">Last Generated</p>
                    <p className="font-medium mt-1 text-sm">
                      {report.lastGenerated ? 
                        report.lastGenerated.toLocaleDateString() : 
                        'Never'
                      }
                    </p>
                  </div>
                </div>

                {/* Actions - responsive */}
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-2 border-t border-gray-100">
                  {report.status === 'ready' && (
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <Download className="h-4 w-4 mr-1" />
                      <span className="sm:hidden">Download</span>
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleGenerateReport(report.id)}
                    disabled={report.status === 'generating'}
                    className="w-full sm:w-auto"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    <span className="sm:hidden">Generate</span>
                    <span className="hidden sm:inline">Generate</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedReports.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== 'all' || selectedType !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first report'
              }
            </p>
            {(!searchTerm && selectedCategory === 'all' && selectedType === 'all' && selectedStatus === 'all') && (
              <Button onClick={onCreateReport}>
                <Plus className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}